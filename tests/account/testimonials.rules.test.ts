import { describe, expect, it } from "vitest";

import {
  canSubmitTestimonial,
  getTestimonialEligibleAt,
  getTestimonialRemainingDays,
  validateTestimonialMessage,
} from "@/lib/testimonials/rules";

describe("testimonial rules", () => {
  it("calculates the eligibility date 7 days after account creation", () => {
    expect(
      getTestimonialEligibleAt("2026-04-01T12:00:00.000Z").toISOString(),
    ).toBe("2026-04-08T12:00:00.000Z");
  });

  it("reports remaining days until the testimonial is unlocked", () => {
    expect(
      getTestimonialRemainingDays(
        "2026-04-01T12:00:00.000Z",
        "2026-04-03T10:00:00.000Z",
      ),
    ).toBe(6);
  });

  it("allows the testimonial after 7 days of use", () => {
    expect(
      canSubmitTestimonial(
        "2026-04-01T12:00:00.000Z",
        "2026-04-08T12:00:00.000Z",
      ),
    ).toBe(true);
  });

  it("validates testimonial length", () => {
    expect(validateTestimonialMessage("curto")).toMatchObject({
      ok: false,
      code: "TOO_SHORT",
    });

    expect(
      validateTestimonialMessage(
        "A calculadora me ajudou a organizar melhor os custos e os orcamentos do meu atelie.",
      ),
    ).toMatchObject({
      ok: true,
    });
  });
});
