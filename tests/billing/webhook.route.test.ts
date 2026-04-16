import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/billing/stripe", () => ({
  createStripeServerClient: vi.fn(),
  getStripeWebhookSecret: vi.fn(),
}));

vi.mock("@/lib/billing/subscription-sync", () => ({
  syncSubscriptionState: vi.fn(),
}));

import { POST } from "@/app/api/stripe/webhook/route";
import {
  createStripeServerClient,
  getStripeWebhookSecret,
} from "@/lib/billing/stripe";
import { syncSubscriptionState } from "@/lib/billing/subscription-sync";

function createWebhookRequest(payload: object, signature = "sig_test") {
  return new Request("https://calculaartesao.com.br/api/stripe/webhook", {
    method: "POST",
    headers: {
      "stripe-signature": signature,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

describe("stripe webhook route", () => {
  let stripeClient: {
    webhooks: {
      constructEvent: ReturnType<typeof vi.fn>;
    };
    subscriptions: {
      retrieve: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    vi.mocked(getStripeWebhookSecret).mockReturnValue("whsec_test");
    vi.mocked(syncSubscriptionState).mockResolvedValue({
      confirmed: true,
      status: "active",
      userId: "user-1",
    });

    stripeClient = {
      webhooks: {
        constructEvent: vi.fn(),
      },
      subscriptions: {
        retrieve: vi.fn(),
      },
    };

    vi.mocked(createStripeServerClient).mockReturnValue(
      stripeClient as unknown as ReturnType<typeof createStripeServerClient>,
    );
  });

  it("rejects requests without a Stripe signature", async () => {
    const response = await POST(
      new Request("https://calculaartesao.com.br/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Missing Stripe signature.",
    });
  });

  it("syncs completed subscription checkout sessions", async () => {
    stripeClient.webhooks.constructEvent.mockReturnValue({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: {
        object: {
          mode: "subscription",
          subscription: "sub_123",
          metadata: {
            appUserId: "user-1",
            founderOfferApplied: "true",
          },
          client_reference_id: "user-1",
        },
      },
    });
    stripeClient.subscriptions.retrieve.mockResolvedValue({
      id: "sub_123",
      status: "active",
      customer: "cus_123",
      metadata: {
        appUserId: "user-1",
        founderOfferApplied: "true",
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
    });

    const response = await POST(createWebhookRequest({ ok: true }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(stripeClient.subscriptions.retrieve).toHaveBeenCalledWith("sub_123");
    expect(syncSubscriptionState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sub_123",
      }),
      {
        fallbackUserId: "user-1",
        founderOfferApplied: true,
      },
    );
  });

  it("syncs direct subscription lifecycle events", async () => {
    stripeClient.webhooks.constructEvent.mockReturnValue({
      id: "evt_subscription",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_456",
          status: "past_due",
          customer: "cus_456",
          metadata: {
            appUserId: "user-2",
          },
          items: {
            data: [
              {
                price: {
                  id: "price_standard",
                },
                current_period_end: 1_700_000_000,
              },
            ],
          },
        },
      },
    });

    const response = await POST(createWebhookRequest({ ok: true }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(syncSubscriptionState).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "sub_456",
      }),
    );
  });
});
