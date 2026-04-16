import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  consumeAuthRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  findUserByEmail: vi.fn(),
  setUserPasswordResetRequest: vi.fn(),
  updateUserPasswordFromReset: vi.fn(),
}));

vi.mock("@/lib/auth/password-reset", () => ({
  buildPasswordResetUrl: vi.fn(),
  createPasswordResetRequest: vi.fn(),
}));

vi.mock("@/lib/auth/password-reset-email", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(),
}));

import { POST as forgotPasswordPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPasswordPost } from "@/app/api/auth/reset-password/route";
import { hashPassword } from "@/lib/auth/password";
import {
  buildPasswordResetUrl,
  createPasswordResetRequest,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/auth/password-reset-email";
import { consumeAuthRateLimit } from "@/lib/auth/rate-limit";
import {
  findUserByEmail,
  setUserPasswordResetRequest,
  updateUserPasswordFromReset,
} from "@/lib/auth/user-store";

function createJsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("password recovery routes", () => {
  beforeEach(() => {
    vi.mocked(consumeAuthRateLimit).mockResolvedValue({
      ok: true,
    } as Awaited<ReturnType<typeof consumeAuthRateLimit>>);
    vi.mocked(createPasswordResetRequest).mockReturnValue({
      token: "token-123",
      tokenHash: "hashed-token-123",
      requestedAt: "2026-04-15T18:00:00.000Z",
      expiresAt: "2026-04-15T19:00:00.000Z",
    });
    vi.mocked(buildPasswordResetUrl).mockReturnValue(
      "https://calculaartesao.com.br/redefinir-senha?token=token-123",
    );
    vi.mocked(hashPassword).mockResolvedValue("new-password-hash");
    vi.mocked(updateUserPasswordFromReset).mockResolvedValue({
      ok: true,
      user: {
        id: "user-1",
      },
    } as Awaited<ReturnType<typeof updateUserPasswordFromReset>>);
  });

  it("returns a generic success message when the user does not exist", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue(null);

    const response = await forgotPasswordPost(
      createJsonRequest(
        "https://calculaartesao.com.br/api/auth/forgot-password",
        {
          email: "missing@example.com",
        },
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message:
        "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
    });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("stores a reset token and sends the reset email for credentials users", async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      name: "Maria",
      email: "maria@example.com",
      passwordHash: "stored-hash",
    } as Awaited<ReturnType<typeof findUserByEmail>>);

    const response = await forgotPasswordPost(
      createJsonRequest(
        "https://calculaartesao.com.br/api/auth/forgot-password",
        {
          email: "maria@example.com",
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(setUserPasswordResetRequest).toHaveBeenCalledWith({
      userId: "user-1",
      tokenHash: "hashed-token-123",
      expiresAt: "2026-04-15T19:00:00.000Z",
      requestedAt: "2026-04-15T18:00:00.000Z",
    });
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({
      to: "maria@example.com",
      name: "Maria",
      resetUrl:
        "https://calculaartesao.com.br/redefinir-senha?token=token-123",
      expiresAt: "2026-04-15T19:00:00.000Z",
    });
    await expect(response.json()).resolves.toEqual({
      message:
        "Se existir uma conta com este e-mail, enviaremos um link de recuperacao em instantes.",
    });
  });

  it("updates the password after a valid reset token", async () => {
    const response = await resetPasswordPost(
      createJsonRequest(
        "https://calculaartesao.com.br/api/auth/reset-password",
        {
          token: "token-123",
          password: "novaSenha123",
          confirmPassword: "novaSenha123",
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(hashPassword).toHaveBeenCalledWith("novaSenha123");
    expect(updateUserPasswordFromReset).toHaveBeenCalledWith({
      token: "token-123",
      passwordHash: "new-password-hash",
    });
    await expect(response.json()).resolves.toEqual({
      message: "Senha redefinida com sucesso. Agora voce ja pode entrar.",
    });
  });
});
