import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/billing/stripe", () => ({
  createStripeServerClient: vi.fn(),
  isStripeBillingConfigured: vi.fn(),
}));

vi.mock("@/lib/auth/user-store", () => ({
  findUserById: vi.fn(),
  updateUserBillingState: vi.fn(),
}));

vi.mock("@/lib/billing/refund-policy", () => ({
  canRequestPremiumRefund: vi.fn(),
  PREMIUM_FULL_REFUND_WINDOW_DAYS: 7,
}));

vi.mock("@/lib/billing/subscription-sync", () => ({
  syncSubscriptionState: vi.fn(),
}));

vi.mock("@/lib/billing/subscription-status", () => ({
  isPremiumActiveSubscriptionStatus: vi.fn(),
}));

import { POST } from "@/app/api/billing/refund/route";
import { getServerSession } from "next-auth";
import {
  createStripeServerClient,
  isStripeBillingConfigured,
} from "@/lib/billing/stripe";
import {
  findUserById,
  updateUserBillingState,
} from "@/lib/auth/user-store";
import { canRequestPremiumRefund } from "@/lib/billing/refund-policy";
import { syncSubscriptionState } from "@/lib/billing/subscription-sync";
import { isPremiumActiveSubscriptionStatus } from "@/lib/billing/subscription-status";

function createRefundRequest(body?: unknown) {
  return new Request("https://calculaartesao.com.br/api/billing/refund", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("refund route", () => {
  let stripeClient: {
    subscriptions: {
      retrieve: ReturnType<typeof vi.fn>;
      cancel: ReturnType<typeof vi.fn>;
    };
    invoicePayments: {
      list: ReturnType<typeof vi.fn>;
    };
    refunds: {
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: "user-1",
      },
    } as Awaited<ReturnType<typeof getServerSession>>);
    vi.mocked(isStripeBillingConfigured).mockReturnValue(true);
    vi.mocked(isPremiumActiveSubscriptionStatus).mockReturnValue(true);
    vi.mocked(canRequestPremiumRefund).mockReturnValue(true);
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      email: "maria@example.com",
      name: "Maria",
      plan: "premium",
      founderOfferApplied: true,
      founderOfferRevokedAt: null,
      premiumActivatedAt: "2026-04-16T12:00:00.000Z",
      stripeSubscriptionId: "sub_123",
      stripeSubscriptionStatus: "active",
    } as Awaited<ReturnType<typeof findUserById>>);
    vi.mocked(syncSubscriptionState).mockResolvedValue({
      userId: "user-1",
      confirmed: false,
      status: "canceled",
    });
    vi.mocked(updateUserBillingState).mockResolvedValue({
      ok: true,
    } as Awaited<ReturnType<typeof updateUserBillingState>>);

    stripeClient = {
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: "sub_123",
          start_date: 1_700_000_000,
          latest_invoice: "in_123",
        }),
        cancel: vi.fn().mockResolvedValue({
          id: "sub_123",
          status: "canceled",
          customer: "cus_123",
          metadata: {
            appUserId: "user-1",
          },
          items: {
            data: [
              {
                price: {
                  id: "price_founder",
                },
                current_period_end: 1_700_000_000,
              },
            ],
          },
        }),
      },
      invoicePayments: {
        list: vi.fn().mockResolvedValue({
          data: [
            {
              created: 1_700_000_000,
              status_transitions: {
                paid_at: 1_700_000_100,
              },
              payment: {
                type: "payment_intent",
                payment_intent: "pi_123",
              },
            },
          ],
        }),
      },
      refunds: {
        create: vi.fn().mockResolvedValue({
          id: "re_123",
        }),
      },
    };

    vi.mocked(createStripeServerClient).mockReturnValue(
      stripeClient as unknown as ReturnType<typeof createStripeServerClient>,
    );
  });

  it("requires founder confirmation before allowing a refund", async () => {
    const response = await POST(createRefundRequest());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: "FOUNDER_REFUND_CONFIRMATION_REQUIRED",
    });
    expect(stripeClient.refunds.create).not.toHaveBeenCalled();
  });

  it("refunds and cancels the subscription when confirmation is present", async () => {
    const response = await POST(
      createRefundRequest({
        confirmFounderForfeit: true,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      refunded: true,
      refundId: "re_123",
    });
    expect(stripeClient.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: "pi_123",
        reason: "requested_by_customer",
      }),
    );
    expect(stripeClient.subscriptions.cancel).toHaveBeenCalledWith("sub_123");
    expect(syncSubscriptionState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sub_123",
        status: "canceled",
      }),
      {
        fallbackUserId: "user-1",
        founderOfferApplied: true,
      },
    );
    expect(updateUserBillingState).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        stripePriceId: null,
        premiumActivatedAt: null,
      }),
    );
  });
});
