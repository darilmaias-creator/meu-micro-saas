import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  findUserById: vi.fn(),
}));

vi.mock("@/lib/testimonials/store", () => ({
  findTestimonialByUserId: vi.fn(),
  upsertUserTestimonial: vi.fn(),
}));

import { GET, POST } from "@/app/api/account/testimonial/route";
import { getServerSession } from "next-auth";
import { findUserById } from "@/lib/auth/user-store";
import {
  findTestimonialByUserId,
  upsertUserTestimonial,
} from "@/lib/testimonials/store";

describe("account testimonial route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      name: "Daril",
      email: "daril@example.com",
      createdAt: "2026-04-01T12:00:00.000Z",
    } as Awaited<ReturnType<typeof findUserById>>);
  });

  it("returns the saved testimonial and eligibility info", async () => {
    vi.mocked(findTestimonialByUserId).mockResolvedValue({
      id: "t-1",
      userId: "user-1",
      authorName: "Daril",
      message: "A calculadora me ajudou a ter mais clareza no preco e no estoque.",
      publishAfter: "2026-04-08T12:00:00.000Z",
      isPublic: true,
      createdAt: "2026-04-09T12:00:00.000Z",
      updatedAt: "2026-04-10T12:00:00.000Z",
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      eligibility: {
        isEligible: true,
        remainingDays: 0,
      },
      testimonial: {
        authorName: "Daril",
      },
    });
  });

  it("blocks testimonial submissions before 7 days of use", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      name: "Daril",
      email: "daril@example.com",
      createdAt: "2026-04-20T12:00:00.000Z",
    } as Awaited<ReturnType<typeof findUserById>>);

    const response = await POST(
      new Request("https://calculaartesao.com.br/api/account/testimonial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "Esse app me ajudou a organizar meus custos, mas minha conta ainda e nova.",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: "TOO_EARLY",
    });
  });

  it("saves the testimonial after the eligibility window", async () => {
    vi.mocked(upsertUserTestimonial).mockResolvedValue({
      id: "t-1",
      userId: "user-1",
      authorName: "Daril",
      message:
        "A calculadora me ajudou a organizar melhor os custos e os orcamentos do meu atelie.",
      publishAfter: "2026-04-08T12:00:00.000Z",
      isPublic: true,
      createdAt: "2026-04-09T12:00:00.000Z",
      updatedAt: "2026-04-10T12:00:00.000Z",
    });

    const response = await POST(
      new Request("https://calculaartesao.com.br/api/account/testimonial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message:
            "A calculadora me ajudou a organizar melhor os custos e os orcamentos do meu atelie.",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      testimonial: {
        authorName: "Daril",
      },
    });
    expect(upsertUserTestimonial).toHaveBeenCalledWith({
      userId: "user-1",
      authorName: "Daril",
      message:
        "A calculadora me ajudou a organizar melhor os custos e os orcamentos do meu atelie.",
      userCreatedAt: "2026-04-01T12:00:00.000Z",
    });
  });
});
