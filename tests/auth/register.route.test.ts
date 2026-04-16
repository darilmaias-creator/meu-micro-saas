import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  createCredentialsUser: vi.fn(),
}));

import { POST } from "@/app/api/auth/register/route";
import { hashPassword } from "@/lib/auth/password";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import { createCredentialsUser } from "@/lib/auth/user-store";

function createRegisterRequest(body: unknown) {
  return new Request("https://calculaartesao.com.br/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("register route", () => {
  beforeEach(() => {
    vi.mocked(consumeAuthRateLimit).mockResolvedValue({
      ok: true,
    } as Awaited<ReturnType<typeof consumeAuthRateLimit>>);
    vi.mocked(hashPassword).mockResolvedValue("hashed-password");
    vi.mocked(createCredentialsUser).mockResolvedValue({
      id: "user-1",
    } as Awaited<ReturnType<typeof createCredentialsUser>>);
  });

  it("returns a validation error for invalid email", async () => {
    const response = await POST(
      createRegisterRequest({
        name: "Maria",
        email: "maria-invalido",
        password: "123456",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Informe um e-mail valido.",
    });
  });

  it("creates a credentials user successfully", async () => {
    const response = await POST(
      createRegisterRequest({
        name: "  Maria  ",
        email: "  MARIA@EXAMPLE.COM  ",
        password: "123456",
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      message: "Conta criada com sucesso.",
    });

    expect(hashPassword).toHaveBeenCalledWith("123456");
    expect(createCredentialsUser).toHaveBeenCalledWith({
      name: "Maria",
      email: "maria@example.com",
      passwordHash: "hashed-password",
    });
  });

  it("returns conflict when the email is already registered", async () => {
    vi.mocked(createCredentialsUser).mockResolvedValue(null);

    const response = await POST(
      createRegisterRequest({
        name: "Maria",
        email: "maria@example.com",
        password: "123456",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Ja existe uma conta cadastrada com este e-mail.",
    });
  });
});
