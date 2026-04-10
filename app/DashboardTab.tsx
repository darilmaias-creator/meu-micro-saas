"use client";
import React, { useState } from 'react';
import { BarChart2, Download, FileText, Trash2 } from 'lucide-react';
import { Card } from './ui';

export default function DashboardTab({ appData }: any) {
    const { sales, setSales } = appData;

    const [filterStart, setFilterStart] = useState(() => { 
        const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; 
    });
    const [filterEnd, setFilterEnd] = useState(() => new Date().toISOString().split('T')[0]);

    const filteredSales = sales.filter((s: any) => {
        if (!s) return false;
        const sDateStr = s.date || '';
        const sDate = new Date(sDateStr + 'T00:00:00'); 
        return sDate >= new Date(filterStart + 'T00:00:00') && sDate <= new Date(filterEnd + 'T23:59:59');
    });

    const dashTotals = filteredSales.reduce((acc: any, curr: any) => {
        if(!curr) return acc;
        acc.revenue += Number(curr.totalSale || 0); 
        acc.cost += Number(curr.totalCost || 0); 
        acc.tithe += Number(curr.totalTithe || 0); 
        acc.profit += Number(curr.totalProfit || 0); 
        return acc;
    }, { revenue: 0, cost: 0, tithe: 0, profit: 0 });

    const exportSalesToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "Data;Produto;Qtd;Custo Total;Desconto Aplicado;Venda Total (Liq);Lucro Liquido;Dizimo\n";
        filteredSales.forEach((s: any) => {
            if(!s) return;
            const dateStr = s.date || '';
            const d = dateStr.includes('-') ? dateStr.split('-').reverse().join('/') : dateStr;
            const row = [
                d, `"${s.productName || ''}"`, s.quantity || 1,
                Number(s.totalCost || 0).toFixed(2).replace('.', ','),
                Number(s.discount || 0).toFixed(2).replace('.', ','),
                Number(s.totalSale || 0).toFixed(2).replace('.', ','),
                Number(s.totalProfit || 0).toFixed(2).replace('.', ','),
                Number(s.totalTithe || 0).toFixed(2).replace('.', ',')
            ];
            csvContent += row.join(";") + "\n";
        });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `Vendas_${filterStart}_${filterEnd}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const generateSalesPDF = async () => { 
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default;
        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);
        const element = document.getElementById('relatorio-vendas');
        if (!element) return;
        setTimeout(() => {
               return html2pdf().set({ margin: 0.2, filename: `vendas_${filterStart}_a_${filterEnd}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' } }).from(element).save().then(() => { window.scrollTo(0, originalScrollY); }); 
        }, 300);
    };

    const deleteSale = (id: any) => { if (window.confirm('Excluir esta venda do histórico de ganhos? Atenção: O estoque não será reposto.')) setSales(sales.filter((s: any) => s && s.id !== id)); };

    return (
        <div className="animate-fadeIn space-y-6 w-full" id="relatorio-vendas">
            <Card className="bg-slate-800 text-white border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div><h2 className="text-xl font-bold flex items-center gap-2"><BarChart2 className="text-amber-400"/> Visão Geral de Vendas (Concluídas)</h2><p className="text-sm text-slate-400 mt-1">Acompanhe seu faturamento e custos das vendas finalizadas</p></div>
                    <div className="flex items-center gap-3 bg-slate-700 p-2 rounded-lg no-print">
                        <div className="flex flex-col"><label className="text-[10px] text-slate-400 font-bold uppercase ml-1">De</label><input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} className="bg-transparent text-sm outline-none px-2" /></div>
                        <span className="text-slate-500">-</span>
                        <div className="flex flex-col"><label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Até</label><input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} className="bg-transparent text-sm outline-none px-2" /></div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Faturamento Bruto</p><p className="text-2xl font-bold text-slate-800">R$ {Number(dashTotals.revenue || 0).toFixed(2)}</p></Card>
                <Card className="border-l-4 border-l-red-500"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Custos Produção</p><p className="text-2xl font-bold text-slate-800">R$ {Number(dashTotals.cost || 0).toFixed(2)}</p></Card>
                <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/30"><p className="text-xs text-indigo-600 uppercase font-bold mb-1">Dízimo a Separar</p><p className="text-2xl font-bold text-indigo-700">R$ {Number(dashTotals.tithe || 0).toFixed(2)}</p></Card>
                <Card className="border-l-4 border-l-amber-500 bg-amber-50/50"><p className="text-xs text-amber-700 uppercase font-bold mb-1">Lucro Líquido</p><p className="text-2xl font-bold text-amber-600">R$ {Number(dashTotals.profit || 0).toFixed(2)}</p></Card>
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4"><h3 className="font-bold text-slate-700 text-lg">Histórico do Período</h3><div className="flex gap-2 no-print"><button onClick={exportSalesToCSV} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><Download size={14}/> Excel</button><button onClick={generateSalesPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1"><FileText size={14}/> PDF</button></div></div>
                {filteredSales.length === 0 ? (<div className="p-8 text-center text-slate-400">Nenhuma venda registrada neste período.</div>) : (<div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600 whitespace-nowrap"><thead className="bg-slate-50 text-slate-500 uppercase text-xs"><tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Produto</th><th className="px-4 py-3 text-center">Qtd</th><th className="px-4 py-3">Venda Total</th><th className="px-4 py-3">Custo Total</th><th className="px-4 py-3 text-indigo-600">Dízimo</th><th className="px-4 py-3 font-bold text-slate-800">L. Líquido</th><th className="px-4 py-3 text-center no-print">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredSales.map((s: any) => { const dateStr = s.date || ''; const d = dateStr.includes('-') ? dateStr.split('-').reverse().join('/') : (dateStr || 'N/A'); return (<tr key={s.id} className="hover:bg-slate-50"><td className="px-4 py-3">{d}</td><td className="px-4 py-3 font-medium text-slate-800">{s.productName || 'Produto'}{(s.discount || 0) > 0 && <span className="block text-[10px] text-red-500 mt-0.5">Desc: -R$ {Number(s.discount || 0).toFixed(2)}</span>}</td><td className="px-4 py-3 text-center bg-slate-50 font-bold">{(s.quantity || 1)}x</td><td className="px-4 py-3 text-green-600">R$ {Number(s.totalSale || 0).toFixed(2)}</td><td className="px-4 py-3 text-red-500">R$ {Number(s.totalCost || 0).toFixed(2)}</td><td className="px-4 py-3 text-indigo-500">R$ {Number(s.totalTithe || 0).toFixed(2)}</td><td className="px-4 py-3 font-bold text-slate-800">R$ {Number(s.totalProfit || 0).toFixed(2)}</td><td className="px-4 py-3 text-center no-print"><button onClick={() => deleteSale(s.id)} className="text-red-400 hover:text-red-600 p-1" title="Apagar venda"><Trash2 size={16}/></button></td></tr>) })}</tbody></table></div>)}
            </Card>
        </div>
    );
}