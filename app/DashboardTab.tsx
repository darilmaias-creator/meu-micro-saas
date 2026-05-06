"use client";

import React, { useState } from "react";
import { BarChart2, Download, FileText, ShoppingBag, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import EmptyState from "@/components/ui/empty-state";
import { type GenericRecord } from "@/lib/app-data/defaults";
import { Card } from "./ui";

type DashboardSale = GenericRecord & {
  id: number;
  productName?: string;
  date?: string;
  quantity?: number;
  discount?: number;
  totalSale?: number;
  totalCost?: number;
  totalTithe?: number;
  totalProfit?: number;
};

type DashboardTotals = {
  revenue: number;
  cost: number;
  tithe: number;
  profit: number;
  margin: number; // Margem de lucro média %
};

type DashboardTabProps = {
  appData: {
    sales: GenericRecord[];
    setSales: (items: GenericRecord[]) => void;
  };
};

type Html2PdfChain = {
  set: (options: Record<string, unknown>) => Html2PdfChain;
  from: (element: HTMLElement) => Html2PdfChain;
  save: () => Promise<void>;
};

export default function DashboardTab({ appData }: DashboardTabProps) {
  const { sales, setSales } = appData;
  const salesItems = sales as DashboardSale[];

  const [filterStart, setFilterStart] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [filterEnd, setFilterEnd] = useState(() => new Date().toISOString().split("T")[0]);

  const filteredSales = salesItems.filter((sale) => {
    if (!sale) {
      return false;
    }
    const saleDateText = sale.date || "";
    const saleDate = new Date(`${saleDateText}T00:00:00`);
    return (
      saleDate >= new Date(`${filterStart}T00:00:00`) &&
      saleDate <= new Date(`${filterEnd}T23:59:59`)
    );
  });

  const dashTotals = filteredSales.reduce<DashboardTotals>(
    (accumulator, sale) => {
      if (!sale) {
        return accumulator;
      }
      accumulator.revenue += Number(sale.totalSale || 0);
      accumulator.cost += Number(sale.totalCost || 0);
      accumulator.tithe += Number(sale.totalTithe || 0);
      accumulator.profit += Number(sale.totalProfit || 0);
      return accumulator;
    },
    { revenue: 0, cost: 0, tithe: 0, profit: 0, margin: 0 },
  );

  // Calcular margem de lucro média
  dashTotals.margin = dashTotals.revenue > 0 ? (dashTotals.profit / dashTotals.revenue) * 100 : 0;

  // Dados para gráfico de vendas por mês
  const salesByMonth = filteredSales.reduce((acc, sale) => {
    if (!sale.date) return acc;
    const month = new Date(sale.date).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' });
    if (!acc[month]) acc[month] = 0;
    acc[month] += Number(sale.totalSale || 0);
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(salesByMonth).map(([month, revenue]) => ({ month, revenue }));

  // Dados para gráfico de distribuição custos vs lucro
  const pieData = [
    { name: 'Custos Produção', value: dashTotals.cost, color: '#ef4444' },
    { name: 'Lucro Líquido', value: dashTotals.profit, color: '#f59e0b' },
  ];

  function exportSalesToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent +=
      "Data;Produto;Qtd;Custo Total;Desconto Aplicado;Venda Total (Liq);Lucro Liquido;Dizimo\n";

    filteredSales.forEach((sale) => {
      if (!sale) {
        return;
      }
      const dateText = sale.date || "";
      const formattedDate = dateText.includes("-")
        ? dateText.split("-").reverse().join("/")
        : dateText;
      const row = [
        formattedDate,
        `"${sale.productName || ""}"`,
        sale.quantity || 1,
        Number(sale.totalCost || 0).toFixed(2).replace(".", ","),
        Number(sale.discount || 0).toFixed(2).replace(".", ","),
        Number(sale.totalSale || 0).toFixed(2).replace(".", ","),
        Number(sale.totalProfit || 0).toFixed(2).replace(".", ","),
        Number(sale.totalTithe || 0).toFixed(2).replace(".", ","),
      ];
      csvContent += row.join(";") + "\n";
    });

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Vendas_${filterStart}_${filterEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function generateSalesPDF() {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = (
      html2pdfModule as {
        default: () => Html2PdfChain;
      }
    ).default;

    const originalScrollY = window.scrollY;
    window.scrollTo(0, 0);
    const element = document.getElementById("relatorio-vendas");
    if (!element) {
      return;
    }

    setTimeout(() => {
      void html2pdf()
        .set({
          margin: 0.2,
          filename: `vendas_${filterStart}_a_${filterEnd}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
        })
        .from(element)
        .save()
        .then(() => {
          window.scrollTo(0, originalScrollY);
        });
    }, 300);
  }

  function deleteSale(id: number) {
    if (
      window.confirm(
        "Excluir esta venda do histórico de ganhos? Atenção: O estoque não será reposto.",
      )
    ) {
      setSales(salesItems.filter((sale) => sale && sale.id !== id));
    }
  }

  return (
    <div className="animate-fadeIn space-y-6 w-full" id="relatorio-vendas">
      <Card className="bg-slate-800 text-white border-slate-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart2 className="text-amber-400" /> Visão Geral de Vendas
              (Concluídas)
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Acompanhe seu faturamento e custos das vendas finalizadas
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-700 p-2 rounded-lg no-print">
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                De
              </label>
              <input
                type="date"
                value={filterStart}
                onChange={(event) => setFilterStart(event.target.value)}
                className="bg-transparent text-sm outline-none px-2"
              />
            </div>
            <span className="text-slate-500">-</span>
            <div className="flex flex-col">
              <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">
                Até
              </label>
              <input
                type="date"
                value={filterEnd}
                onChange={(event) => setFilterEnd(event.target.value)}
                className="bg-transparent text-sm outline-none px-2"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">
            Faturamento Bruto
          </p>
          <p className="text-2xl font-bold text-slate-800">
            R$ {Number(dashTotals.revenue || 0).toFixed(2)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <p className="text-xs text-slate-500 uppercase font-bold mb-1">
            Custos Produção
          </p>
          <p className="text-2xl font-bold text-slate-800">
            R$ {Number(dashTotals.cost || 0).toFixed(2)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30">
          <p className="text-xs text-indigo-600 uppercase font-bold mb-1">
            Dízimo a Separar
          </p>
          <p className="text-2xl font-bold text-indigo-700">
            R$ {Number(dashTotals.tithe || 0).toFixed(2)}
          </p>
        </Card>
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <p className="text-xs text-amber-700 uppercase font-bold mb-1">
            Lucro Líquido
          </p>
          <p className="text-2xl font-bold text-amber-600">
            R$ {Number(dashTotals.profit || 0).toFixed(2)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
          <p className="text-xs text-blue-600 uppercase font-bold mb-1">
            Margem de Lucro
          </p>
          <p className="text-2xl font-bold text-blue-700">
            {Number(dashTotals.margin || 0).toFixed(1)}%
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-slate-700 text-lg mb-4">Gráficos Analíticos</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-bold mb-2">Vendas por Mês</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h4 className="text-sm font-bold mb-2">Distribuição Custos vs Lucro</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
          <h3 className="font-bold text-slate-700 text-lg">Histórico do Período</h3>
          <div className="flex gap-2 no-print">
            <button
              onClick={exportSalesToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"
            >
              <Download size={14} /> Excel
            </button>
            <button
              onClick={generateSalesPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"
            >
              <FileText size={14} /> PDF
            </button>
          </div>
        </div>
        {filteredSales.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nenhuma venda registrada neste período"
            description="Registre sua primeira venda em Orçamentos e Vendas para acompanhar faturamento, lucro e dízimo aqui."
            ctaLabel="Registrar venda"
            ctaHref="/orcamentos-vendas"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3">Venda Total</th>
                  <th className="px-4 py-3">Custo Total</th>
                  <th className="px-4 py-3 text-indigo-600">Dízimo</th>
                  <th className="px-4 py-3 font-bold text-slate-800">L. Líquido</th>
                  <th className="px-4 py-3 text-center no-print">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => {
                  const dateText = sale.date || "";
                  const formattedDate = dateText.includes("-")
                    ? dateText.split("-").reverse().join("/")
                    : dateText || "N/A";

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{formattedDate}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {sale.productName || "Produto"}
                        {(sale.discount || 0) > 0 && (
                          <span className="block text-[10px] text-red-500 mt-0.5">
                            Desc: -R$ {Number(sale.discount || 0).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center bg-slate-50 font-bold">
                        {sale.quantity || 1}x
                      </td>
                      <td className="px-4 py-3 text-green-600">
                        R$ {Number(sale.totalSale || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-red-500">
                        R$ {Number(sale.totalCost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-indigo-500">
                        R$ {Number(sale.totalTithe || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        R$ {Number(sale.totalProfit || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center no-print">
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Apagar venda"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
