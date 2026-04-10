"use client";
import React, { useState } from 'react';
import { ShoppingBag, FileText, Save, Clock, Upload, Trash2 } from 'lucide-react';
import { Card, InputGroup } from './ui';

export default function SalesTab({ appData, isPremium }: any) {
    const { savedProducts, insumos, setInsumos, sales, setSales, quotes, setQuotes, config } = appData;

    const [saleProductId, setSaleProductId] = useState('');
    const [saleQuantity, setSaleQuantity] = useState<number | string>(1);
    const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [saleDiscountFixed, setSaleDiscountFixed] = useState('');
    const [saleDiscountPercent, setSaleDiscountPercent] = useState('');
    
    const [clientName, setClientName] = useState('');
    const [clientPhone, setClientPhone] = useState('');
    
    const [activeQuoteId, setActiveQuoteId] = useState<number | null>(null);
    const [quoteNumber, setQuoteNumber] = useState(() => Math.floor(Math.random() * 90000) + 10000);
    const [docType, setDocType] = useState<'orcamento' | 'recibo'>('orcamento');

    const resetSalesForm = () => {
        setSaleQuantity(1); 
        setSaleDiscountFixed(''); 
        setSaleDiscountPercent(''); 
        setClientName(''); 
        setClientPhone(''); 
        setQuoteNumber(Math.floor(Math.random() * 90000) + 10000);
        setActiveQuoteId(null);
        setDocType('orcamento');
    };

    let currentSaleData: any = null;
    if (saleProductId) {
        const p = savedProducts.find((prod: any) => prod && String(prod.id) === String(saleProductId));
        if (p) {
            const q = Number(saleQuantity) || 1;
            const uCost = Number(p.totalCost || 0);
            const uPrice = Number(p.activePrice || 0);
            const grossSale = uPrice * q;
            const dFixed = Number(saleDiscountFixed) || 0;
            const dPercent = Number(saleDiscountPercent) || 0;
            const discountTotal = dFixed + (grossSale * (dPercent / 100));
            const netSale = Math.max(0, grossSale - discountTotal);
            const totalC = uCost * q;
            
            let baseTithe = 0;
            if (p.titheValue !== undefined) {
                baseTithe = Number(p.titheValue) * q;
            } else {
                const laborFinish = (Number(p.finishTime || 0) / 60) * Number(p.hourlyRate || 0);
                const laborSupervision = p.chargeSupervision ? (Number(p.cutTime || 0) / 60) * Number(p.hourlyRate || 0) : 0;
                const laborPerBatch = laborFinish + laborSupervision;
                const unitLaborCost = laborPerBatch / Number(p.yieldQty || 1);
                const totalLaborForSale = unitLaborCost * q;
                const costWithoutLabor = totalC - totalLaborForSale;
                baseTithe = Math.max(0, grossSale - costWithoutLabor) * 0.10;
            }

            const totalTithe = Math.max(0, baseTithe - (discountTotal * 0.10)); 
            const totalProfit = netSale - totalC - totalTithe;

            currentSaleData = { p, q, uCost, uPrice, grossSale, discountTotal, netSale, totalC, totalTithe, totalProfit };
        }
    }

    const saveQuote = () => {
        if (!currentSaleData) { alert("Selecione um produto e a quantidade."); return; }
        const { p, q, uPrice, netSale } = currentSaleData;
        
        const newQuote = {
            id: activeQuoteId || Date.now(),
            quoteNumber, productId: p.id, productName: p.name || 'Produto',
            clientName, clientPhone, quantity: q, date: saleDate || new Date().toISOString().split('T')[0],
            discountFixed: saleDiscountFixed, discountPercent: saleDiscountPercent,
            unitPrice: uPrice, netSale, status: 'pendente'
        };

        if (activeQuoteId) {
            setQuotes(quotes.map((quote: any) => quote.id === activeQuoteId ? newQuote : quote));
            alert("Orçamento atualizado!");
        } else {
            setQuotes([newQuote, ...quotes]);
            alert("Orçamento salvo nos Pendentes!");
        }
        resetSalesForm();
    };

    const loadQuote = (q: any) => {
        setSaleProductId(q.productId); setClientName(q.clientName || ''); setClientPhone(q.clientPhone || '');
        setSaleQuantity(q.quantity); setSaleDate(q.date); setSaleDiscountFixed(q.discountFixed || '');
        setSaleDiscountPercent(q.discountPercent || ''); setQuoteNumber(q.quoteNumber);
        setActiveQuoteId(q.id); setDocType('orcamento');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteQuote = (id: any) => {
        if (window.confirm('Excluir este orçamento pendente?')) {
            setQuotes(quotes.filter((q: any) => q.id !== id));
            if (activeQuoteId === id) resetSalesForm();
        }
    };

    const registerSale = () => {
        if (!currentSaleData) { alert("Selecione um produto e a quantidade."); return; }
        const { p, q, uCost, uPrice, discountTotal, netSale, totalC, totalTithe, totalProfit } = currentSaleData;
        
        let updatedInsumos = [...insumos];
        let stockWarnings: string[] = [];
        let premiumLowStockWarnings: string[] = [];
        
        if(p.recipeItems && p.recipeItems.length > 0) {
            p.recipeItems.forEach((item: any) => {
                const insumoIndex = updatedInsumos.findIndex(ins => String(ins.id) === String(item.insumoId));
                if(insumoIndex >= 0) {
                    const insumo = updatedInsumos[insumoIndex];
                    const unitSize = insumo.measurePerItem || 1;
                    const gastoPorUnidadeFinal = item.usedMeasure / (p.yieldQty || 1);
                    const totalGastoNestaVenda = gastoPorUnidadeFinal * q;
                    const deductionInUnits = totalGastoNestaVenda / unitSize;
                    insumo.stock -= deductionInUnits;
                    if(insumo.stock < 0 && !stockWarnings.includes(insumo.name)) stockWarnings.push(insumo.name);
                    
                    // Lógica PREMIUM: Alerta quando o insumo chega ou fica abaixo da quantia mínima estipulada
                    if (isPremium && insumo.stock <= (insumo.minStock || 0) && insumo.stock >= 0) {
                        if (!premiumLowStockWarnings.includes(insumo.name)) premiumLowStockWarnings.push(insumo.name);
                    }
                }
            });
        }

        if(stockWarnings.length > 0) {
            if(!window.confirm(`O estoque de ${stockWarnings.join(', ')} ficará negativo. Continuar venda e dar baixa?`)) return;
        }

        const newSale = {
            id: Date.now(), productId: p.id, productName: p.name || 'Produto', date: saleDate || new Date().toISOString().split('T')[0], 
            quantity: q, unitCost: uCost, unitPrice: uPrice, discount: discountTotal, totalCost: totalC, 
            totalSale: netSale, totalTithe: totalTithe, totalProfit: totalProfit
        };

        setSales([newSale, ...sales]);
        setInsumos(updatedInsumos);
        if (activeQuoteId) setQuotes(quotes.filter((quote: any) => quote.id !== activeQuoteId));

        alert("Venda Registrada! Estoque deduzido.");
        
        // Lógica PREMIUM: Exibe o pop-up de alerta de estoque baixo
        if (isPremium && premiumLowStockWarnings.length > 0) {
            alert(`💎 ALERTA PREMIUM DE ESTOQUE:\n\nOs seguintes materiais chegaram no limite mínimo e estão acabando:\n${premiumLowStockWarnings.map(i => `- ${i}`).join('\n')}\n\nConsidere reabastecer o quanto antes!`);
        }
        
        resetSalesForm();
    };

    const generateQuotePDF = async () => {
        if (!currentSaleData) { alert("Selecione um produto e a quantidade para gerar o documento."); return; }
        
        // Importação dinâmica para não quebrar o Next.js no lado do servidor
        // @ts-ignore
        const html2pdf = (await import('html2pdf.js')).default;

        const originalScrollY = window.scrollY;
        window.scrollTo(0, 0);

        const element = document.getElementById('quote-receipt');
        const container = document.getElementById('pdf-container');
        if(!container || !element) return;
        
        const originalStyle = container.getAttribute('style') || '';
        container.style.position = 'absolute'; container.style.top = '0px'; container.style.left = '0px'; container.style.zIndex = '9999';

        setTimeout(() => {
            const docPrefix = docType === 'orcamento' ? 'Orcamento' : 'Recibo';
            const opt = {
                 margin: 0, filename: `${docPrefix}_${(currentSaleData?.p?.name || 'Produto').replace(/\s+/g, '_')}_${saleDate}.pdf`,
                image: { type: 'jpeg' as const, quality: 1 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const } 
            };
            html2pdf().set(opt).from(element).save().then(() => {
                container.setAttribute('style', originalStyle); 
                window.scrollTo(0, originalScrollY);
            });
        }, 800);
    };

    const formattedSaleDate = saleDate && String(saleDate).includes('-') ? String(saleDate).split('-').reverse().join('/') : (saleDate || '');

    return (
        <div className="animate-fadeIn max-w-3xl mx-auto w-full">
            <Card className="border-t-4 border-t-amber-500 mb-8">
                <div className="flex items-center gap-3 mb-6"><div className="bg-amber-100 p-3 rounded-full text-amber-600"><ShoppingBag size={28} /></div><div><h2 className="text-2xl font-bold text-slate-800">Orçamentos & Vendas</h2><p className="text-sm text-slate-500">Gere orçamentos e conclua vendas com baixa no estoque.</p></div></div>

                {savedProducts.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500 border border-slate-200"><p className="mb-2">Você precisa salvar produtos no seu catálogo antes de orçar ou vender.</p><p className="text-amber-600 font-bold">Vá para a aba de Ficha Técnica.</p></div>
                ) : (
                    <div className="space-y-5">
                        <div><label className="block text-sm font-bold text-slate-700 mb-1">Selecione o Produto:</label><select value={saleProductId} onChange={(e) => setSaleProductId(e.target.value)} className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"><option value="">-- Escolher Produto do Catálogo --</option>{savedProducts.map((p: any) => (<option key={p.id} value={p.id}>{p.name || 'Produto'} (Venda Sugerida: R$ {Number(p.activePrice || 0).toFixed(2)})</option>))}</select></div>
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200"><div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Dados do Cliente (Sai no PDF)</label><div className="flex bg-white rounded-lg border border-slate-200 p-1"><button onClick={() => setDocType('orcamento')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${docType === 'orcamento' ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:text-slate-600'}`}>Orçamento</button><button onClick={() => setDocType('recibo')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${docType === 'recibo' ? 'bg-green-100 text-green-700' : 'text-slate-400 hover:text-slate-600'}`}>Recibo (Pago)</button></div></div><div className="grid grid-cols-2 gap-4"><InputGroup label="Nome do Cliente" type="text" value={clientName} onChange={setClientName} placeholder="Ex: João da Silva" /><InputGroup label="Telefone / Contato" type="text" value={clientPhone} onChange={setClientPhone} placeholder="(00) 00000-0000" /></div></div>
                        <div className="grid grid-cols-2 gap-4"><InputGroup label="Quantidade Solicitada" type="number" min="1" step="1" value={saleQuantity} onChange={setSaleQuantity} /><InputGroup label="Data" type="date" value={saleDate} onChange={setSaleDate} /></div>
                        <div className="bg-slate-100 p-4 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Aplicar Desconto ao Cliente</label><div className="grid grid-cols-2 gap-4"><InputGroup label="Desconto Fixo (R$)" type="number" min="0" step="0.01" value={saleDiscountFixed} onChange={setSaleDiscountFixed} prefix="R$" placeholder="0.00" /><InputGroup label="Desconto (%)" type="number" min="0" step="0.1" value={saleDiscountPercent} onChange={setSaleDiscountPercent} suffix="%" placeholder="0" /></div></div>

                        {currentSaleData && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Resumo da Proposta</h3><div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal:</span><span className="font-bold text-slate-800">R$ {Number(currentSaleData.grossSale || 0).toFixed(2)}</span></div>{currentSaleData.discountTotal > 0 && (<div className="flex justify-between text-sm"><span className="text-slate-600">Desconto Aplicado:</span><span className="font-bold text-red-500">- R$ {Number(currentSaleData.discountTotal || 0).toFixed(2)}</span></div>)}<div className="flex justify-between text-sm"><span className="text-slate-600">Valor Final:</span><span className="font-bold text-green-600">R$ {Number(currentSaleData.netSale || 0).toFixed(2)}</span></div><div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-lg"><span className="font-bold text-slate-800">TOTAL A PAGAR:</span><span className="font-black text-amber-600">R$ {Number(currentSaleData.netSale || 0).toFixed(2)}</span></div></div></div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button onClick={generateQuotePDF} disabled={!currentSaleData} className={`py-4 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 ${!currentSaleData ? 'bg-slate-300' : docType === 'orcamento' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}`}><FileText size={20} /> Baixar {docType === 'orcamento' ? 'Orçamento' : 'Recibo'} em PDF</button>
                            <div className="flex gap-2">
                                <button onClick={saveQuote} disabled={!currentSaleData} className="flex-1 py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition-all flex justify-center items-center gap-2 text-sm"><Save size={18} /> {activeQuoteId ? 'Atualizar Orçamento' : 'Salvar Pendente'}</button>
                                <button onClick={registerSale} disabled={!currentSaleData} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition-all flex justify-center items-center gap-2 text-sm"><ShoppingBag size={18} /> Concluir Venda (Baixa Estoque)</button>
                            </div>
                            {activeQuoteId && (<button onClick={resetSalesForm} className="text-xs text-slate-500 hover:text-slate-700 underline text-center mt-2">Cancelar Edição de Orçamento</button>)}
                        </div>
                    </div>
                )}
            </Card>

            {quotes.length > 0 && (
                <Card className="mb-8"><div className="flex items-center gap-2 mb-4"><Clock size={20} className="text-slate-500" /><h3 className="font-bold text-lg text-slate-700">Orçamentos Pendentes</h3></div><div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600 whitespace-nowrap"><thead className="bg-slate-50 uppercase text-xs font-bold text-slate-500 border-b border-slate-200"><tr><th className="p-3">Nº Doc</th><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Produto</th><th className="p-3 text-center">Qtd</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">
                    {quotes.map((q: any) => (
                        <tr key={q.id} className="hover:bg-slate-50"><td className="p-3 font-bold text-amber-700">{q.quoteNumber}</td><td className="p-3">{(q.date || '').includes('-') ? q.date.split('-').reverse().join('/') : q.date}</td><td className="p-3 font-medium text-slate-800">{q.clientName || '-'}</td><td className="p-3">{q.productName}</td><td className="p-3 text-center font-bold">{q.quantity}</td><td className="p-3 text-right font-bold text-green-700">R$ {Number(q.netSale).toFixed(2)}</td><td className="p-3 flex justify-center gap-2"><button onClick={() => loadQuote(q)} className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors"><Upload size={16} /></button><button onClick={() => deleteQuote(q.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button></td></tr>
                    ))}
                </tbody></table></div></Card>
            )}

            {/* PDF HIDDEN TEMPLATE */}
            {currentSaleData && (
                <div id="pdf-container" style={{ position: 'fixed', top: '-10000px', left: '-10000px', zIndex: -9999 }}>
                    <div id="quote-receipt" style={{ width: '794px', height: '1123px', backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', padding: '0', boxSizing: 'border-box', position: 'relative' }}>
                        <div style={{ height: '16px', backgroundColor: docType === 'orcamento' ? '#d97706' : '#15803d', width: '100%' }}></div><div style={{ padding: '40px 50px' }}><table style={{ width: '100%', borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '30px' }}><tbody><tr><td style={{ width: '60%', verticalAlign: 'middle' }}><table style={{ borderCollapse: 'collapse' }}><tbody><tr><td style={{ paddingRight: '20px' }}><img src={(isPremium && config.userLogo) ? config.userLogo : "https://i.postimg.cc/ZqQzNQRW/calculadoradoprodutor.png"} alt="Logo" style={{ maxWidth: '100px', maxHeight: '70px', width: 'auto', height: 'auto' }} crossOrigin={(isPremium && config.userLogo && config.userLogo.startsWith('data:')) ? undefined : "anonymous"} /></td><td style={{ borderLeft: '2px solid #e2e8f0', paddingLeft: '20px' }}><h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 4px 0', letterSpacing: '1px' }}>{config.storeName || 'Calculadora do Produtor'}</h2><p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 2px 0' }}>{config.storeSubtitle || 'Orçamentos claros. Clientes seguros. Negócios fechados.'}</p></td></tr></tbody></table></td><td style={{ width: '40%', verticalAlign: 'middle', textAlign: 'right' }}><h1 style={{ fontSize: '32px', fontWeight: '900', color: docType === 'orcamento' ? '#d97706' : '#15803d', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 10px 0' }}>{docType === 'orcamento' ? 'Orçamento' : 'Recibo'}</h1><table style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', width: '200px', marginLeft: 'auto', borderCollapse: 'separate', borderSpacing: 0 }}><tbody><tr><td style={{ padding: '10px 15px 5px 15px', fontSize: '12px', fontWeight: 'bold', color: '#475569', textAlign: 'left' }}>Data:</td><td style={{ padding: '10px 15px 5px 15px', fontSize: '12px', color: '#334155', fontWeight: 'bold', textAlign: 'right' }}>{formattedSaleDate}</td></tr><tr><td style={{ padding: '5px 15px 10px 15px', fontSize: '12px', fontWeight: 'bold', color: '#475569', textAlign: 'left' }}>Nº Doc:</td><td style={{ padding: '5px 15px 10px 15px', fontSize: '12px', color: '#334155', fontWeight: 'bold', textAlign: 'right' }}>{quoteNumber}</td></tr></tbody></table></td></tr></tbody></table>
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', marginBottom: '40px' }}><h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 15px 0' }}>Preparado Para:</h3><table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody><tr><td style={{ width: '50%', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px', paddingRight: '20px' }}><span style={{ fontSize: '12px', color: '#64748b' }}>Nome:</span><span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{clientName || '__________________________________'}</span></td><td style={{ width: '50%', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}><span style={{ fontSize: '12px', color: '#64748b' }}>Telefone:</span><span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>{clientPhone || '______________________'}</span></td></tr></tbody></table></div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}><thead><tr><th style={{ backgroundColor: docType === 'orcamento' ? '#d97706' : '#15803d', color: 'white', padding: '14px 15px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Descrição do Serviço / Produto</th><th style={{ backgroundColor: docType === 'orcamento' ? '#d97706' : '#15803d', color: 'white', padding: '14px 15px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Qtd.</th><th style={{ backgroundColor: docType === 'orcamento' ? '#d97706' : '#15803d', color: 'white', padding: '14px 15px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Valor Unit.</th><th style={{ backgroundColor: docType === 'orcamento' ? '#d97706' : '#15803d', color: 'white', padding: '14px 15px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>Total</th></tr></thead><tbody><tr><td style={{ padding: '20px 15px', borderBottom: '2px solid #f1f5f9', fontSize: '16px', fontWeight: 'bold', color: '#1e293b' }}>{currentSaleData.p.name || 'Produto Sem Nome'}</td><td style={{ padding: '20px 15px', borderBottom: '2px solid #f1f5f9', fontSize: '16px', textAlign: 'center', color: '#475569' }}>{currentSaleData.q}x</td><td style={{ padding: '20px 15px', borderBottom: '2px solid #f1f5f9', fontSize: '16px', textAlign: 'right', color: '#475569' }}>R$ {Number(currentSaleData.uPrice || 0).toFixed(2)}</td><td style={{ padding: '20px 15px', borderBottom: '2px solid #f1f5f9', fontSize: '16px', textAlign: 'right', fontWeight: 'bold', color: docType === 'orcamento' ? '#d97706' : '#15803d' }}>R$ {Number(currentSaleData.grossSale || 0).toFixed(2)}</td></tr></tbody></table>
                        <table style={{ width: '100%', marginBottom: '50px' }}><tbody><tr><td style={{ width: '50%' }}></td><td style={{ width: '50%' }}><div style={{ padding: '0 15px 15px 15px', borderBottom: '1px solid #e2e8f0', marginBottom: '15px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '8px' }}><span>Subtotal:</span><span style={{ fontWeight: 'bold', color: '#1e293b' }}>R$ {Number(currentSaleData.grossSale || 0).toFixed(2)}</span></div>{Number(currentSaleData.discountTotal || 0) > 0 && (<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#ef4444', fontWeight: '600' }}><span>Desconto Aplicado:</span><span>- R$ {Number(currentSaleData.discountTotal || 0).toFixed(2)}</span></div>)}</div><div style={{ backgroundColor: docType === 'orcamento' ? '#fffbeb' : '#f0fdf4', border: `2px solid ${docType === 'orcamento' ? '#fde68a' : '#bbf7d0'}`, borderRadius: '8px', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '16px', fontWeight: '900', color: docType === 'orcamento' ? '#92400e' : '#166534', textTransform: 'uppercase' }}>{docType === 'orcamento' ? 'Total a Pagar:' : 'Total Pago:'}</span><span style={{ fontSize: '24px', fontWeight: '900', color: docType === 'orcamento' ? '#d97706' : '#15803d' }}>R$ {Number(currentSaleData.netSale || 0).toFixed(2)}</span></div></td></tr></tbody></table></div>
                        <div style={{ position: 'absolute', bottom: '40px', left: '50px', right: '50px' }}><table style={{ width: '100%', borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}><tbody><tr><td style={{ width: '60%', verticalAlign: 'top', paddingTop: '20px' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', margin: '0 0 8px 0', textTransform: 'uppercase' }}>{docType === 'orcamento' ? 'Termos e Condições:' : 'Declaração de Recebimento:'}</p>{docType === 'orcamento' ? (<><p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 5px 0', lineHeight: '1.4' }}>• Orçamento válido por 15 dias a partir da data de emissão.</p><p style={{ fontSize: '11px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>• O início da produção ocorre mediante confirmação e pagamento (50%).</p></>) : (<><p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 5px 0', lineHeight: '1.4' }}>• Confirmamos o recebimento do valor referente aos produtos.</p><p style={{ fontSize: '11px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>• Damos plena e geral quitação referente a este lote.</p></>)}</td><td style={{ width: '40%', verticalAlign: 'bottom', textAlign: 'center', paddingLeft: '40px', paddingTop: '20px' }}><div style={{ borderTop: '1px solid #94a3b8', paddingTop: '10px', marginTop: '20px' }}><p style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 2px 0' }}>{config.storeName || 'Calculadora do Produtor'}</p><p style={{ fontSize: '10px', color: '#64748b', margin: '0' }}>Responsável Comercial</p></div></td></tr></tbody></table><div style={{ textAlign: 'center', marginTop: '30px' }}><p style={{ fontSize: '10px', fontStyle: 'italic', color: '#94a3b8', margin: 0 }}>Obrigado pela preferência! Gerado pela Calculadora do Produtor. Orçamentos claros. Clientes seguros. Negócios fechados.</p></div></div>
                    </div>
                </div>
            )}
        </div>
    );
}
