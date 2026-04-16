import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/rate-limit", () => ({
  clearAuthRateLimit: vi.fn(),
  consumeAuthRateLimit: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  getSessionUserFromStoredUser: vi.fn(),
  upsertOAuthUser: vi.fn(),
}));

import { authorizeCredentials } from "@/lib/auth/options";
import { verifyPassword } from "@/lib/auth/password";
import {
  clearAuthRateLimit,
  consumeAuthRateLimit,
} from "@/lib/auth/rate-limit";
import { findUserByEmail } from "@/lib/auth/user-store";

describe("credentials authorize", () => {
  beforeEach(() => {
    vi.mocked(consumeAuthRateLimit).mockResolvedValue({
      ok: true,
    } as Awaited<ReturnType<typeof consumeAuthRateLimit>>);
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: "user-1",
      email: "maria@example.com",
      passwordHash: "stored-hash",
    } as Awaited<ReturnType<typeof findUserByEmail>>);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(clearAuthRateLimit).mockResolvedValue();
  });

  it("returns a minimal user payload for valid credentials", async () => {
    const result = await authorizeCredentials(
      {
        email: "MARIA@EXAMPLE.COM",
        password: "123456",
      },
      {
        headers: new Headers(),
      },
    );

    expect(result).toEqual({
      id: "user-1",
      email: "maria@example.com",
    });
    expect(findUserByEmail).toHaveBeenCalledWith("maria@example.com");
    expect(clearAuthRateLimit).toHaveBeenCalled();
  });

  it("rejects invalid passwords", async () => {
    vi.mocked(verifyPassword).mockResolvedValue(false);

    const result = await authorizeCredentials(
      {
        email: "maria@example.com",
        password: "senha-errada",
      },
      {
        headers: new Headers(),
      },
    );

    expect(result).toBeNull();
    expect(clearAuthRateLimit).not.toHaveBeenCalled();
  });

  it("rejects blocked attempts from rate limiting", async () => {
    vi.mocked(consumeAuthRateLimit).mockResolvedValue({
      ok: false,
      message: "Muitas tentativas.",
      retryAfterSeconds: 60,
    } as Awaited<ReturnType<typeof consumeAuthRateLimit>>);

    const result = await authorizeCredentials(
      {
        email: "maria@example.com",
        password: "123456",
      },
      {
        headers: new Headers(),
      },
    );

    expect(result).toBeNull();
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
