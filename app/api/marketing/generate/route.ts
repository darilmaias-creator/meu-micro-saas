import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type GenerateMarketingPayload = {
  activePrice?: number;
  materials?: string[];
  productName?: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function sanitizeText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function sanitizeMaterials(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 20);
}

function sanitizePrice(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractGeneratedText(payload: unknown) {
  const responsePayload = payload as GeminiGenerateContentResponse | null;
  const candidate = Array.isArray(responsePayload?.candidates)
    ? responsePayload.candidates[0]
    : null;

  return candidate?.content?.parts?.[0]?.text?.trim() ?? "";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Voce precisa estar logado para usar a IA de marketing." },
      { status: 401 },
    );
  }

  if (!session.user.isPremium) {
    return NextResponse.json(
      {
        message:
          "A IA de marketing e exclusiva do plano Premium. Assine para liberar essa funcao.",
      },
      { status: 403 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        message:
          "A IA de marketing ainda nao esta configurada no servidor. Adicione a chave do Gemini para liberar esse recurso.",
      },
      { status: 503 },
    );
  }

  let body: GenerateMarketingPayload;

  try {
    body = (await request.json()) as GenerateMarketingPayload;
  } catch {
    return NextResponse.json(
      { message: "Nao foi possivel ler os dados enviados para a IA." },
      { status: 400 },
    );
  }

  const productName = sanitizeText(body.productName);
  const materials = sanitizeMaterials(body.materials);
  const activePrice = sanitizePrice(body.activePrice);

  if (!productName) {
    return NextResponse.json(
      { message: "Informe o nome do produto para gerar o texto de marketing." },
      { status: 400 },
    );
  }

  const materialsText =
    materials.length > 0 ? materials.join(", ") : "materiais artesanais variados";
  const formattedPrice =
    activePrice !== null ? activePrice.toFixed(2).replace(".", ",") : "sob consulta";
  const prompt = [
    "Crie um anuncio de venda para artesanato em portugues do Brasil.",
    `Produto: ${productName}.`,
    `Materiais principais: ${materialsText}.`,
    `Preco sugerido: R$ ${formattedPrice}.`,
    "Gere um titulo chamativo, uma descricao acolhedora com emojis e uma lista curta de hashtags.",
  ].join(" ");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const payload =
      (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            payload?.error?.message ??
            "Nao foi possivel gerar o texto de marketing agora.",
        },
        { status: response.status },
      );
    }

    const content = extractGeneratedText(payload);

    if (!content) {
      return NextResponse.json(
        {
          message:
            "A IA respondeu, mas nao retornou um texto valido. Tente novamente em instantes.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("[marketing:generate]", error);

    return NextResponse.json(
      { message: "Nao foi possivel gerar o texto de marketing agora." },
      { status: 500 },
    );
  }
}
