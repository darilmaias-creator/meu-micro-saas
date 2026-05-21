import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const EMAIL_TEMPLATES = {
  day1: {
    subject: "Bem-vindo ao Calcula Artesão! 🎉",
    template: (name: string) => `
      <h2>Olá ${name}!</h2>
      <p>Bem-vindo ao Calcula Artesão. Aqui está seu primeiro passo:</p>
      <p><strong>1. Cadastre seus insumos</strong> - Comece adicionando os materiais que você usa.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/entrar?tab=inventory">Ir para Estoque</a></p>
    `,
  },
  day3: {
    subject: "Você criou insumos! Agora crie seu primeiro produto 🚀",
    template: (name: string) => `
      <h2>Parabéns ${name}!</h2>
      <p>Você já cadastrou seus insumos. Agora é hora de criar seu primeiro produto.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/entrar?tab=calculator">Criar Produto</a></p>
    `,
  },
  day7: {
    subject: "Veja quanto você economizaria com preço correto 💰",
    template: (name: string) => `
      <h2>Ótimas notícias, ${name}!</h2>
      <p>Com a Calcula Artesão, você economizaria muito por mês.</p>
      <p>Isso é porque você calcula o preço certo, sem vender no prejuízo.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/entrar">Ver Economia</a></p>
    `,
  },
  day14: {
    subject: "Teste Premium por 7 dias grátis ⭐",
    template: (name: string) => `
      <h2>Oferta Especial para ${name}</h2>
      <p>Teste todas as funcionalidades Premium por 7 dias, sem cartão de crédito.</p>
      <p>Você vai ganhar acesso a: Insumos ilimitados, Produtos ilimitados, Personalização, Backup automático</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/entrar">Ativar Trial</a></p>
    `,
  },
} as const;

type EmailType = keyof typeof EMAIL_TEMPLATES;

type SendEngagementPayload = {
  userId?: string;
  emailType?: string;
};

function getSafeName(name: string | null | undefined, email: string | null | undefined) {
  if (typeof name === "string" && name.trim().length > 0) {
    return name.trim();
  }

  if (typeof email === "string" && email.trim().length > 0) {
    return email.split("@")[0] ?? "artesão";
  }

  return "artesão";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SendEngagementPayload;
    const userId = body.userId?.trim();
    const emailType = body.emailType?.trim() as EmailType | undefined;

    if (!userId || !emailType) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes: userId e emailType." },
        { status: 400 },
      );
    }

    const { data: user, error: userError } = await supabase
      .from("auth_users")
      .select("id, email, name")
      .eq("id", userId)
      .single<{
        id: string;
        email: string | null;
        name: string | null;
      }>();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("email_engagement")
      .select("id")
      .eq("user_id", userId)
      .eq("email_type", emailType)
      .maybeSingle<{ id: string }>();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      return NextResponse.json(
        { error: "Email already sent" },
        { status: 400 },
      );
    }

    const template = EMAIL_TEMPLATES[emailType];
    if (!template) {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    // Nesta etapa, registramos o envio no banco.
    // O disparo real por Resend/SMTP será conectado na próxima etapa.
    const { error: insertError } = await supabase.from("email_engagement").insert({
      user_id: userId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
    });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        queued: true,
        preview: {
          to: user.email,
          subject: template.subject,
          html: template.template(getSafeName(user.name, user.email)),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[email:send-engagement] error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
