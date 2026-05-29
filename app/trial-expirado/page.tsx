"use client";

import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";

export default function TrialExpiradoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="max-w-md bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
        <div className="text-5xl">⏰</div>

        <h1 className="text-2xl font-bold text-slate-900">
          Seu Trial de 7 Dias Expirou
        </h1>

        <p className="text-slate-600">
          Você experimentou o poder do Premium. Agora é hora de continuar com
          acesso ilimitado.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <p className="font-bold text-amber-900">O que você vai perder:</p>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>✓ Materiais ilimitados (agora limitado a 20)</li>
            <li>✓ Produtos ilimitados (agora limitado a 10)</li>
            <li>✓ Personalização de documentos</li>
            <li>✓ Backup automático</li>
          </ul>
        </div>

        <Link
          href="/assinatura/checkout"
          className="inline-flex items-center justify-center gap-2 w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-lg transition"
        >
          <Crown size={20} />
          Assinar Premium Agora
          <ArrowRight size={20} />
        </Link>

        <Link
          href="/ficha-tecnica"
          className="block text-amber-600 hover:text-amber-700 font-semibold"
        >
          Continuar com Plano Grátis
        </Link>
      </div>
    </div>
  );
}
