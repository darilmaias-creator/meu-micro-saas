import Link from "next/link";

export default function BillingCancelledPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Assinatura cancelada
        </p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">
          Voce interrompeu o checkout
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          Nenhuma cobranca foi concluida. Quando quiser, voce pode voltar e
          assinar o Premium normalmente.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700"
        >
          Voltar para o app
        </Link>
      </div>
    </div>
  );
}

