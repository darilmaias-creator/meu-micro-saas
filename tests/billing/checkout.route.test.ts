import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/billing/stripe", () => ({
  createStripeServerClient: vi.fn(),
  getStripePriceIdForTier: vi.fn(),
  isStripeBillingConfigured: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  countFounderOfferUsers: vi.fn(),
  findUserById: vi.fn(),
  updateUserBillingState: vi.fn(),
}));

import { POST } from "@/app/api/billing/checkout/route";
import { getServerSession } from "next-auth";
import {
  createStripeServerClient,
  getStripePriceIdForTier,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import {
  countFounderOfferUsers,
  findUserById,
  updateUserBillingState,
} from "@/lib/auth/user-store";

function createCheckoutRequest() {
  return new Request("https://calculaartesao.com.br/api/billing/checkout", {
    method: "POST",
    headers: {
      origin: "https://calculaartesao.com.br",
    },
  });
}

describe("checkout route", () => {
  let stripeClient: {
    customers: {
      create: ReturnType<typeof vi.fn>;
      retrieve: ReturnType<typeof vi.fn>;
    };
    checkout: {
      sessions: {
        create: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);
    vi.mocked(isStripeBillingConfigured).mockReturnValue(true);
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      email: "maria@example.com",
      name: "Maria",
      plan: "free",
      founderOfferApplied: false,
      founderOfferRevokedAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: null,
    } as Awaited<ReturnType<typeof findUserById>>);
    vi.mocked(countFounderOfferUsers).mockResolvedValue(10);
    vi.mocked(getStripePriceIdForTier).mockImplementation((tier) =>
      tier === "founder" ? "price_founder" : "price_standard",
    );
    vi.mocked(updateUserBillingState).mockResolvedValue({
      ok: true,
    } as Awaited<ReturnType<typeof updateUserBillingState>>);

    stripeClient = {
      customers: {
        create: vi.fn().mockResolvedValue({ id: "cus_123" }),
        retrieve: vi.fn(),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_123",
            client_secret: "secret_123",
          }),
        },
      },
    };

    vi.mocked(createStripeServerClient).mockReturnValue(
      stripeClient as unknown as ReturnType<typeof createStripeServerClient>,
    );
  });

  it("requires an authenticated user", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const response = await POST(createCheckoutRequest());

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Voce precisa estar logado para assinar o Premium.",
    });
  });

  it("blocks checkout for users with an active premium subscription", async () => {
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      email: "maria@example.com",
      name: "Maria",
      plan: "premium",
      founderOfferApplied: true,
      founderOfferRevokedAt: null,
      stripeCustomerId: "cus_existing",
      stripeSubscriptionId: "sub_existing",
      stripeSubscriptionStatus: "active",
    } as Awaited<ReturnType<typeof findUserById>>);

    const response = await POST(createCheckoutRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message:
        "Sua conta ja esta com o Premium ativo. Use o gerenciamento da assinatura.",
    });
  });

  it("creates a founder checkout session for eligible users", async () => {
    const response = await POST(createCheckoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      clientSecret: "secret_123",
      checkoutSessionId: "cs_123",
      offerTier: "founder",
    });
    expect(updateUserBillingState).toHaveBeenCalledWith({
      userId: "user-1",
      stripeCustomerId: "cus_123",
    });
    expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        allow_promotion_codes: true,
        customer: "cus_123",
        line_items: [{ price: "price_founder", quantity: 1 }],
      }),
    );
  });

  it("falls back to the standard offer after the founder limit is reached", async () => {
    vi.mocked(countFounderOfferUsers).mockResolvedValue(200);

    const response = await POST(createCheckoutRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      offerTier: "standard",
    });
    expect(getStripePriceIdForTier).toHaveBeenCalledWith("standard");
  });
});
