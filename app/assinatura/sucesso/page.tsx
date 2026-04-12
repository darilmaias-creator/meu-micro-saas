import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          Assinatura iniciada
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Pagamento enviado com sucesso
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Estamos confirmando sua assinatura Premium com a Stripe. Em geral,
          isso leva poucos segundos.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Se o selo Premium nao aparecer na hora, volte ao app e atualize a
          pagina.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          Voltar para o app
        </Link>
      </div>
    </div>
  );
}

