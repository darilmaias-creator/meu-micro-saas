import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/app-data/plan-limits", () => ({
  validateAppDataPlanLimits: vi.fn(),
}));

import { GET, PUT } from "@/app/api/app-data/route";
import { getServerSession } from "next-auth";
import { validateAppDataPlanLimits } from "@/lib/app-data/plan-limits";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function createSelectBuilder(result: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue(result),
      }),
    }),
  };
}

function createUpsertBuilder(result: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(result),
    }),
  };
}

describe("app data route", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
        isPremium: true,
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(validateAppDataPlanLimits).mockReturnValue(null);
  });

  it("returns default app data when the account has no saved row yet", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn().mockReturnValue(
        createSelectBuilder({
          data: null,
          error: null,
        }),
      ),
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      source: "default",
      updatedAt: null,
      data: {
        insumos: [],
        savedProducts: [],
        sales: [],
        quotes: [],
      },
    });
  });

  it("saves normalized app data successfully", async () => {
    const fromMock = vi
      .fn()
      .mockReturnValueOnce(
        createSelectBuilder({
          data: null,
          error: null,
        }),
      )
      .mockReturnValueOnce({
        upsert: vi.fn().mockReturnValue(
          createUpsertBuilder({
            data: {
              updated_at: "2026-04-16T18:00:00.000Z",
            },
            error: null,
          }),
        ),
      });

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: fromMock,
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await PUT(
      new Request("https://calculaartesao.com.br/api/app-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          insumos: [{ id: "i1", name: "MDF" }],
          savedProducts: [{ id: "p1", name: "Caixa" }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updatedAt: "2026-04-16T18:00:00.000Z",
    });
    expect(validateAppDataPlanLimits).toHaveBeenCalled();
  });

  it("blocks restoration when the next state exceeds the plan limit", async () => {
    vi.mocked(validateAppDataPlanLimits).mockReturnValue({
      code: "FREE_PRODUCT_LIMIT",
      message: "Voce atingiu o limite de produtos do plano gratis.",
    });

    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
        isPremium: false,
      },
    } as Awaited<ReturnType<typeof getServerSession>>);

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      from: vi.fn().mockReturnValue(
        createSelectBuilder({
          data: null,
          error: null,
        }),
      ),
    } as unknown as ReturnType<typeof createSupabaseServerClient>);

    const response = await PUT(
      new Request("https://calculaartesao.com.br/api/app-data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          savedProducts: Array.from({ length: 11 }, (_, index) => ({
            id: `p${index + 1}`,
            name: `Produto ${index + 1}`,
          })),
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      code: "FREE_PRODUCT_LIMIT",
      message: "Voce atingiu o limite de produtos do plano gratis.",
    });
  });
});
