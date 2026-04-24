import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { findUserById } from "@/lib/auth/user-store";
import {
  canSubmitTestimonial,
  getTestimonialEligibleAt,
  getTestimonialRemainingDays,
  validateTestimonialMessage,
} from "@/lib/testimonials/rules";
import {
  findTestimonialByUserId,
  upsertUserTestimonial,
} from "@/lib/testimonials/store";

type TestimonialPayload = {
  message?: string;
};

function buildEligibilityPayload(createdAt: string) {
  return {
    isEligible: canSubmitTestimonial(createdAt),
    eligibleAt: getTestimonialEligibleAt(createdAt).toISOString(),
    remainingDays: getTestimonialRemainingDays(createdAt),
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Voce precisa estar logado para ver seu depoimento." },
        { status: 401 },
      );
    }

    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar sua conta." },
        { status: 404 },
      );
    }

    const testimonial = await findTestimonialByUserId(user.id);

    return NextResponse.json({
      ok: true,
      eligibility: buildEligibilityPayload(user.createdAt),
      testimonial: testimonial
        ? {
            message: testimonial.message,
            authorName: testimonial.authorName,
            createdAt: testimonial.createdAt,
            updatedAt: testimonial.updatedAt,
            publishAfter: testimonial.publishAfter,
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel carregar o seu depoimento agora." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Voce precisa estar logado para enviar um depoimento." },
        { status: 401 },
      );
    }

    const user = await findUserById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { message: "Nao foi possivel localizar sua conta." },
        { status: 404 },
      );
    }

    if (!canSubmitTestimonial(user.createdAt)) {
      return NextResponse.json(
        {
          code: "TOO_EARLY",
          message:
            "Seu depoimento fica disponivel somente apos 7 dias de uso da conta.",
          eligibility: buildEligibilityPayload(user.createdAt),
        },
        { status: 403 },
      );
    }

    let body: TestimonialPayload;

    try {
      body = (await request.json()) as TestimonialPayload;
    } catch {
      return NextResponse.json(
        { message: "Nao foi possivel ler os dados do depoimento." },
        { status: 400 },
      );
    }

    if (typeof body.message !== "string") {
      return NextResponse.json(
        { message: "O texto do depoimento precisa ser informado." },
        { status: 400 },
      );
    }

    const validation = validateTestimonialMessage(body.message);

    if (!validation.ok) {
      const message =
        validation.code === "TOO_SHORT"
          ? "Escreva um depoimento um pouco mais completo, com pelo menos 40 caracteres."
          : "Seu depoimento ficou longo demais. Tente resumir para no maximo 320 caracteres.";

      return NextResponse.json(
        {
          code: validation.code,
          message,
        },
        { status: 400 },
      );
    }

    const testimonial = await upsertUserTestimonial({
      userId: user.id,
      authorName: user.name,
      message: validation.normalized,
      userCreatedAt: user.createdAt,
    });

    return NextResponse.json({
      ok: true,
      message:
        "Depoimento salvo com sucesso. Quando a area de depoimentos estiver ativa no site, ele podera aparecer automaticamente.",
      eligibility: buildEligibilityPayload(user.createdAt),
      testimonial,
    });
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel salvar o seu depoimento agora." },
      { status: 500 },
    );
  }
}
