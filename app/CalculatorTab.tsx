"use client";
import React, { useState } from 'react';
import { Settings, Package, Plus, Trash2, DollarSign, RefreshCw, Heart, Sparkles, Save, Copy, Download, Upload } from 'lucide-react';
import { Card, InputGroup, TimeInputGroup, Toggle } from './ui';
import { FREE_TIER_PRODUCT_LIMIT } from '@/lib/app-data/plan-limits';

export default function CalculatorTab({ appData, isPremium }: any) {
    const { config, insumos, savedProducts, setSavedProducts } = appData;
    
    const [recipeItems, setRecipeItems] = useState<any[]>([]);
    const [tempInsumoId, setTempInsumoId] = useState('');
    const [tempQty, setTempQty] = useState('1');
    const [tempWidth, setTempWidth] = useState('');
    const [tempHeight, setTempHeight] = useState('');
    const [tempMeasure, setTempMeasure] = useState('');

    const [extraCosts, setExtraCosts] = useState(''); 
    const [yieldQty, setYieldQty] = useState('1'); 
    const [wasteFactor, setWasteFactor] = useState('10');
    
    const [cutTime, setCutTime] = useState(''); 
    const [finishTime, setFinishTime] = useState(''); 
    const [chargeSupervision, setChargeSupervision] = useState(false);
    
    const [manualPrice, setManualPrice] = useState(''); 
    const [productName, setProductName] = useState('');

    const [aiContent, setAiContent] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');

    const toggleUnitGlobal = () => {
        const isToMM = config.unit === 'cm';
        const factor = isToMM ? 10 : 0.1;
        if (tempWidth) setTempWidth(prev => String(parseFloat((Number(prev) * factor).toFixed(2))));
        if (tempHeight) setTempHeight(prev => String(parseFloat((Number(prev) * factor).toFixed(2))));
        config.setUnit(isToMM ? 'mm' : 'cm');
    };

    const handleAddIngredient = () => {
        if(!tempInsumoId) return;
        const ins = insumos.find((i: any) => String(i.id) === String(tempInsumoId));
        if(!ins) return;

        let usedMeasure = 0; let cost = 0; let display = ''; let autoWaste = 0;
        const type = ins.type || ins.mode; 
        const q = Number(tempQty) || 1;

        if (type === 'area') {
            if (!tempWidth || !tempHeight) { alert("Preencha Largura e Altura gasta."); return; }
            let itemArea = Number(ins.measurePerItem) || (Number(ins.width) * Number(ins.height));
            if (ins.unit && ins.unit.includes('cm') && config.unit === 'mm') itemArea = itemArea * 100;
            else if (ins.unit && ins.unit.includes('mm') && config.unit === 'cm') itemArea = itemArea / 100;

            const currentUsedArea = (Number(tempWidth) || 0) * (Number(tempHeight) || 0); 
            const usageRatio = itemArea > 0 ? currentUsedArea / itemArea : 0;
            
            if (itemArea > 0 && itemArea >= currentUsedArea) autoWaste = (((itemArea - currentUsedArea) / itemArea) * 100);
            
            const baseCost = Number(ins.costPerItem) * usageRatio;
            cost = (baseCost * (1 + (autoWaste / 100))) * q; 
            usedMeasure = currentUsedArea * q; 
            display = `${q}x de ${tempWidth}x${tempHeight} ${config.unit}`;
        } else {
            if (!tempMeasure) { alert("Preencha a quantidade gasta."); return; }
            const measure = Number(tempMeasure);
            let measureForCost = measure;

            if (type === 'length') {
                if (ins.unit && ins.unit.includes('cm') && config.unit === 'mm') measureForCost = measure / 10;
                else if (ins.unit && ins.unit.includes('mm') && config.unit === 'cm') measureForCost = measure * 10;
            }

            usedMeasure = measure * q;
            cost = measureForCost * ins.costPerUnit * q; 
            if (type === 'weight') display = `${q}x de ${measure}g`;
            else if (type === 'length') display = `${q}x de ${measure}${config.unit}`;
            else display = `${q}x de ${measure}un`;
        }

        const newItem = { id: Date.now() + Math.random(), insumoId: ins.id, name: ins.name, type: type, usedMeasure, display, cost, autoWaste };
        setRecipeItems([...recipeItems, newItem]);
        setTempInsumoId(''); setTempWidth(''); setTempHeight(''); setTempMeasure(''); setTempQty('1');
    };

    const removeRecipeItem = (idx: number) => setRecipeItems(recipeItems.filter((_, i) => i !== idx));

    const rawIngredientsCost = recipeItems.reduce((acc, item) => item.type !== 'area' ? acc + (item.cost * (1 + Number(wasteFactor || 0) / 100)) : acc + item.cost, 0);
    const materialTotalCost = rawIngredientsCost + Number(extraCosts || 0);
    const depreciationPerHour = Number(config.machineCost || 0) / Number(config.diodeLife || 1);
    const energyPerHour = (Number(config.machinePower || 96) / 1000) * Number(config.energyCost || 0);
    const machinePureHourlyCost = depreciationPerHour + energyPerHour;
    const machinePureCost = (Number(cutTime || 0) / 60) * machinePureHourlyCost;
    const supervisionCost = chargeSupervision ? (Number(cutTime || 0) / 60) * Number(config.hourlyRate || 0) : 0;
    const cutCost = machinePureCost + supervisionCost;
    const laborCost = (Number(finishTime || 0) / 60) * Number(config.hourlyRate || 0);
    const totalBatchCost = materialTotalCost + cutCost + laborCost; 
    const unitCost = totalBatchCost / (Number(yieldQty) || 1); 
    const suggestedProfitValue = unitCost * (Number(config.profitMargin || 0) / 100);
    const suggestedPrice = unitCost + suggestedProfitValue;
    const isManual = manualPrice !== '';
    const activePrice = isManual ? parseFloat(manualPrice) : suggestedPrice;
    const activeProfitValue = activePrice - unitCost;
    const activeProfitMargin = unitCost > 0 ? (activeProfitValue / unitCost) * 100 : 0;
    const realGainBeforeTithe = Math.max(0, activePrice - (materialTotalCost / (Number(yieldQty) || 1)) - (machinePureCost / (Number(yieldQty) || 1)));
    const titheValue = realGainBeforeTithe * 0.10;

    const saveProduct = () => {
        // Lógica FREEMIUM: Verifica limite antes de salvar
        if (!isPremium && savedProducts.length >= FREE_TIER_PRODUCT_LIMIT) {
            alert(`Limite da conta gratuita atingido! Você só pode salvar até ${FREE_TIER_PRODUCT_LIMIT} produtos. Assine o plano Premium para salvar produtos ilimitados.`);
            return;
        }

        if(recipeItems.length === 0) { alert("Adicione pelo menos 1 ingrediente à receita."); return; }
        const nameToSave = productName || `Produto ${savedProducts.length + 1}`;
        const newProduct = {
            id: Date.now(), date: new Date().toLocaleDateString('pt-BR'), name: nameToSave,
            recipeItems, extraCosts: Number(extraCosts || 0), yieldQty: Number(yieldQty || 1), unit: config.unit,
            cutTime, finishTime, wasteFactor, profitMargin: config.profitMargin, manualPrice,
            totalCost: unitCost, activePrice, activeProfitValue, hourlyRate: config.hourlyRate, chargeSupervision, titheValue
        };
        setSavedProducts([newProduct, ...savedProducts]);
        alert('Produto salvo no Catálogo!');
    };

    const deleteProduct = (id: any) => { if (window.confirm('Excluir do catálogo?')) setSavedProducts(savedProducts.filter((p: any) => p && p.id !== id)); };
    
    const loadProduct = (product: any) => {
        if (window.confirm(`Carregar "${product.name || 'Produto'}" para edição?`)) {
            setProductName(product.name || '');
            if(product.recipeItems) setRecipeItems(product.recipeItems);
            setExtraCosts(product.extraCosts || '');
            setYieldQty(product.yieldQty || '1');
            setCutTime(product.cutTime || ''); setFinishTime(product.finishTime || ''); 
            setWasteFactor(product.wasteFactor || '10');
            config.setProfitMargin(product.profitMargin || '50');
            setManualPrice(product.manualPrice || '');
            setChargeSupervision(product.chargeSupervision || false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const exportProductsToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFFData;Nome;Rendimento;Custo Unidade;Preço Venda;Lucro R$;Margem %\n";
        savedProducts.forEach((p: any) => {
            const row = [p.date, `"${p.name}"`, p.yieldQty || 1, Number(p.totalCost || 0).toFixed(2).replace('.', ','), Number(p.activePrice || 0).toFixed(2).replace('.', ','), Number(p.activeProfitValue || 0).toFixed(2).replace('.', ','), (((Number(p.activeProfitValue) || 0) / (Number(p.totalCost) || 1)) * 100).toFixed(1).replace('.', ',') + '%'];
            csvContent += row.join(";") + "\n";
        });
        const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "meus_produtos.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const generateMarketingCopy = async () => {
        // Lógica FREEMIUM: IA de Marketing exclusiva para Premium
        if (!isPremium) {
            setError("🌟 Função exclusiva do Plano Premium. Assine para usar a Inteligência Artificial!");
            return;
        }
        if (!navigator.onLine) { setError("⚠️ Apenas modo ONLINE para essa função."); return; }
        if (!productName) { setError("Nome obrigatório."); return; }
        setError(''); setIsGenerating(true); setAiContent(null);
        try {
            const response = await fetch("/api/marketing/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    activePrice,
                    materials: recipeItems.map((item: any) => String(item.name || '')),
                    productName,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data?.message || "Erro na IA. Tente novamente.");
            setAiContent(data.content || null);
        } catch (err) { setError(err instanceof Error ? err.message : "Erro na IA. Tente novamente."); } finally { setIsGenerating(false); }
    };

    return (
        <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA: CONFIGS E INSERÇÃO */}
            <div className="md:col-span-7 space-y-6">
                <Card>
                    <div className="flex items-center gap-2 text-amber-600 mb-4"><Settings size={20} /><h2 className="font-bold text-lg">1. Configurações Globais</h2></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputGroup label="Sua Hora de Trabalho" value={config.hourlyRate} onChange={config.setHourlyRate} prefix="R$" className="font-bold text-amber-700" tooltip="Quanto você quer ganhar por hora de trabalho?" />
                        <InputGroup label="Custo da Máquina" value={config.machineCost} onChange={config.setMachineCost} prefix="R$" tooltip="Valor pago na máquina (se possuir uma)." />
                        <InputGroup label="Vida Útil Máquina (h)" value={config.diodeLife} onChange={config.setDiodeLife} tooltip="Tempo médio de vida da máquina/módulo." />
                        <InputGroup label="Custo Energia (kW/h)" value={config.energyCost} onChange={config.setEnergyCost} prefix="R$" tooltip="Preço do kW/h na sua conta de luz." />
                    </div>
                </Card>

                <Card className="border-t-4 border-amber-500">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2 text-amber-600"><Package size={20} /><h2 className="font-bold text-lg text-slate-800">2. Materiais & Tempos</h2></div>
                        <div className="flex bg-slate-100 p-1 rounded border"><button onClick={() => config.unit !== 'cm' && toggleUnitGlobal()} className={`px-3 py-1 rounded text-xs font-bold ${config.unit === 'cm' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>CM</button><button onClick={() => config.unit !== 'mm' && toggleUnitGlobal()} className={`px-3 py-1 rounded text-xs font-bold ${config.unit === 'mm' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>MM</button></div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                        <label className="text-xs font-bold text-amber-800 uppercase mb-2 block">Adicionar Material do Estoque</label>
                        <select value={tempInsumoId} onChange={e => setTempInsumoId(e.target.value)} className="w-full p-2.5 mb-3 border border-amber-300 rounded-lg outline-none text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-amber-500">
                            <option value="">-- Selecione um material --</option>
                            {insumos.map((i: any) => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                        
                        {tempInsumoId && (() => {
                            const selIns = insumos.find((i: any) => String(i.id) === String(tempInsumoId));
                            if(!selIns) return null;
                            if (selIns.type === 'area' || selIns.mode === 'area') {
                                let itemArea = Number(selIns.measurePerItem) || (Number(selIns.width) * Number(selIns.height));
                                let boardW = Number(selIns.width); let boardH = Number(selIns.height);
                                if (selIns.unit && selIns.unit.includes('cm') && config.unit === 'mm') { itemArea *= 100; boardW *= 10; boardH *= 10; } 
                                else if (selIns.unit && selIns.unit.includes('mm') && config.unit === 'cm') { itemArea /= 100; boardW /= 10; boardH /= 10; }
                                const currentUsedArea = (Number(tempWidth) || 0) * (Number(tempHeight) || 0);
                                const liveWaste = (itemArea > 0 && currentUsedArea > 0 && itemArea >= currentUsedArea) ? ((itemArea - currentUsedArea) / itemArea) * 100 : 0;
                                return (
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3 animate-fadeIn">
                                        <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-slate-600 bg-white px-2 py-1 rounded border shadow-sm">Placa: {boardW}x{boardH} {config.unit}</span>{currentUsedArea > 0 && currentUsedArea <= itemArea && <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded border">Sobra Auto: {liveWaste.toFixed(1)}%</span>}</div>
                                        <div className="grid grid-cols-3 gap-3"><InputGroup label="Qtd." value={tempQty} onChange={setTempQty} placeholder="1" className="mb-0" /><InputGroup label={`Largura (${config.unit})`} value={tempWidth} onChange={setTempWidth} placeholder="0" className="mb-0" /><InputGroup label={`Altura (${config.unit})`} value={tempHeight} onChange={setTempHeight} placeholder="0" className="mb-0"/></div>
                                    </div>
                                )
                            } else {
                                let labelGasto = 'Quantidade Gasta'; let suffixGasto = '';
                                if (selIns.type === 'weight') { labelGasto = 'Peso Gasto (em gramas)'; suffixGasto = 'g'; }
                                if (selIns.type === 'length') { labelGasto = 'Comprimento Gasto'; suffixGasto = config.unit; }
                                return (
                                    <div className="grid grid-cols-2 gap-3 animate-fadeIn mb-3"><InputGroup label="Qtd. Vezes" value={tempQty} onChange={setTempQty} placeholder="1" className="mb-0" /><InputGroup label={labelGasto} value={tempMeasure} onChange={setTempMeasure} suffix={suffixGasto} placeholder="0" className="mb-0" /></div>
                                )
                            }
                        })()}
                        <button onClick={handleAddIngredient} disabled={!tempInsumoId} className="w-full py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold rounded-lg transition-colors flex justify-center gap-2"><Plus size={18} /> Inserir Material na Ficha</button>
                    </div>

                    {recipeItems.length > 0 && (
                        <div className="space-y-2 mb-4"><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Materiais na Ficha</h3>{recipeItems.map((item, idx) => (<div key={idx} className="flex justify-between items-center bg-white border border-slate-200 p-3 rounded-lg shadow-sm"><div><p className="font-bold text-sm text-slate-700">{item.name}</p><p className="text-xs text-slate-500">{item.display} {item.autoWaste > 0 && <span className="text-amber-500 ml-1">(+{item.autoWaste.toFixed(1)}% sobra incl.)</span>}</p></div><div className="flex items-center gap-3"><span className="font-bold text-slate-800">R$ {item.cost.toFixed(2)}</span><button onClick={() => removeRecipeItem(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></div></div>))}</div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100">
                        <div className="col-span-1 sm:col-span-2"><TimeInputGroup label="Tempo de Máquina (Laser/CNC)" totalMinutes={cutTime} onChange={setCutTime} /><Toggle label="Cobrar supervisão no corte?" checked={chargeSupervision} onChange={setChargeSupervision} tooltip="Adiciona a sua Hora de Trabalho ao tempo da máquina." /></div>
                        <div className="col-span-1 sm:col-span-2"><TimeInputGroup label="Tempo Manual (Acabamento/Confecção)" totalMinutes={finishTime} onChange={setFinishTime} /></div>
                        <InputGroup label="Custos Extras Fixos" value={extraCosts} onChange={setExtraCosts} prefix="R$" tooltip="Caixa, fita não cadastrada, etc." placeholder="0.00" /><InputGroup label="Margem Perda Geral" value={wasteFactor} onChange={setWasteFactor} suffix="%" tooltip="Erro global sobre itens que não são área." placeholder="10" />
                    </div>
                </Card>
            </div>

            {/* COLUNA DA DIREITA: RESULTADO */}
            <div className="md:col-span-5"><div className="sticky top-[88px] space-y-6">
                <div className="bg-slate-900 text-white border border-slate-800 rounded-xl shadow-2xl p-6 relative overflow-hidden"><div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-amber-500 rounded-full opacity-10 blur-2xl"></div><div className="flex items-center gap-2 mb-6 text-amber-400 relative z-10"><DollarSign size={24} /><h2 className="font-bold text-xl">Resumo Financeiro</h2></div><div className="space-y-4 relative z-10"><div className="bg-slate-800/80 rounded-lg p-4 space-y-2 border border-slate-700"><div className="flex justify-between items-center bg-slate-800 p-2 rounded mb-2"><label className="text-sm font-bold text-slate-300 block">Rende quantas un.?</label><input type="number" min="1" step="1" value={yieldQty} onChange={e=>setYieldQty(e.target.value)} className="w-16 text-center p-1 font-bold border border-slate-600 rounded bg-slate-700 outline-none text-white" /></div><div className="flex justify-between text-xs text-slate-400"><span>Materiais (Lote)</span><span>R$ {Number(materialTotalCost || 0).toFixed(2)}</span></div><div className="flex justify-between text-xs text-slate-400"><span>Tempo (Máquina + Mão de Obra)</span><span>R$ {(Number(cutCost || 0) + Number(laborCost || 0)).toFixed(2)}</span></div><div className="border-t border-slate-600 pt-2 flex justify-between text-sm font-bold text-slate-200"><span>Custo Lote ({(yieldQty || 1)} un)</span><span>R$ {Number(totalBatchCost || 0).toFixed(2)}</span></div><div className="bg-slate-700/50 p-2 rounded mt-2 flex justify-between items-center text-amber-400 font-bold border border-slate-600"><span>CUSTO (1 UNIDADE)</span><span className="text-lg">R$ {Number(unitCost || 0).toFixed(2)}</span></div></div><div className="pt-2"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><label className="text-sm font-bold text-amber-400">Lucro Desejado</label><input type="number" value={config.profitMargin} onChange={(e) => config.setProfitMargin(e.target.value)} className="w-16 text-xs p-1 rounded bg-slate-800 border border-slate-700 text-center text-white" /> <span className="text-xs text-amber-400">%</span></div></div><div className="flex justify-between items-center mt-4 mb-2"><label className="text-sm font-bold text-green-400">Preço de Venda (1 Un.)</label>{!isManual && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">Sugerido</span>}{isManual && <button onClick={() => setManualPrice('')} className="text-[10px] bg-slate-700 px-2 py-1 rounded text-white flex gap-1 hover:bg-slate-600 transition-colors"><RefreshCw size={10} /> Restaurar</button>}</div><div className="relative group"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg pointer-events-none z-10">R$</span><input type="number" step="0.10" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} placeholder={Number(suggestedPrice || 0).toFixed(2)} className={`w-full p-4 pl-12 rounded-xl font-bold text-2xl outline-none ring-2 transition-all ${isManual ? 'bg-amber-500 text-white ring-amber-400 placeholder-white/50' : 'bg-slate-800 text-slate-200 ring-slate-700 focus:ring-amber-500/50 placeholder-slate-500'}`} /></div></div><div className={`mt-4 p-4 rounded-xl border flex justify-between items-center ${activeProfitValue > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}><div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Lucro Líquido Real</p><p className={`text-2xl font-bold ${activeProfitValue > 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {Number(activeProfitValue || 0).toFixed(2)}</p></div><div className={`px-3 py-1 rounded-full text-xs font-bold ${activeProfitValue > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{Number(activeProfitMargin || 0).toFixed(1)}%</div></div><div className="mt-2 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex justify-between items-center"><div><p className="text-xs text-indigo-300 uppercase font-bold tracking-wider flex items-center gap-1"><Heart size={14}/> Dízimo (10%)</p><p className="text-[10px] text-indigo-200/70 mt-1 leading-tight">Sobre o Ganho Real</p></div><p className="text-xl font-bold text-indigo-400">R$ {Number(titheValue || 0).toFixed(2)}</p></div></div></div>
                
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-1 shadow-lg"><div className="bg-white rounded-lg p-5"><div className="flex items-center gap-2 mb-4 text-indigo-700"><Sparkles size={20} className="animate-pulse" /><h2 className="font-bold text-lg">Catálogo & Marketing</h2></div><div className="space-y-3"><input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Nome do Produto Final" className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all" /><div className="flex gap-2"><button onClick={saveProduct} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm shadow-lg"><Save size={16} /> Salvar no Catálogo</button><button onClick={generateMarketingCopy} disabled={isGenerating || !productName} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg flex items-center justify-center gap-2 text-sm shadow-lg">{isGenerating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Sparkles size={16} /> Criar Post</>}</button></div>{error && <p className="text-red-500 text-xs mt-2">{error}</p>}{aiContent && (<div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 relative group"><button onClick={() => navigator.clipboard.writeText(aiContent)} className="absolute top-2 right-2 text-indigo-400 hover:text-indigo-700 p-1.5 hover:bg-indigo-100 rounded-md" title="Copiar"><Copy size={16} /></button><div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{aiContent}</div></div>)}</div></div></div>
            </div></div>

            {/* HISTÓRICO DE PRODUTOS */}
            <div className="col-span-1 md:col-span-12 mt-8 animate-fadeIn"><div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"><div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center flex-wrap gap-4"><h3 className="font-bold text-lg text-slate-700 flex items-center gap-2"><Save size={20} className="text-slate-500"/> Catálogo de Produtos Salvos {!isPremium && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold ml-2">Grátis: {savedProducts.length}/{FREE_TIER_PRODUCT_LIMIT}</span>}</h3>{savedProducts.length > 0 && (<button onClick={exportProductsToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Download size={16} /> Baixar Planilha</button>)}</div>
            {savedProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400"><p>Nenhum produto salvo no seu catálogo ainda.</p><p className="text-sm mt-1">Calcule um produto e clique em "Salvar no Catálogo" para visualizá-lo aqui.</p></div>
            ) : (
                <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600 whitespace-nowrap"><thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs"><tr><th className="px-6 py-3">Data</th><th className="px-6 py-3">Nome</th><th className="px-6 py-3 text-center">Rendimento</th><th className="px-6 py-3">Custo 1 Un.</th><th className="px-6 py-3">Preço Venda</th><th className="px-6 py-3">Lucro R$</th><th className="px-6 py-3 text-center">Ações</th></tr></thead><tbody className="divide-y divide-slate-100">
                    {savedProducts.filter((p: any)=>p).map((p: any) => (<tr key={p.id} className="hover:bg-slate-50 group"><td className="px-6 py-4">{p.date}</td><td className="px-6 py-4 font-bold text-slate-800">{p.name || 'Produto'}</td><td className="px-6 py-4 text-center font-medium bg-slate-50">{(p.yieldQty || 1)} un</td><td className="px-6 py-4 text-red-600 font-medium">R$ {Number(p.totalCost || 0).toFixed(2)}</td><td className="px-6 py-4 text-green-700 font-bold">R$ {Number(p.activePrice || 0).toFixed(2)}</td><td className="px-6 py-4 font-medium">R$ {Number(p.activeProfitValue || 0).toFixed(2)}</td><td className="px-6 py-4 text-center"><button onClick={() => loadProduct(p)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1 mr-2"><Upload size={14} /> Carregar</button><button onClick={() => deleteProduct(p.id)} className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1"><Trash2 size={14} /> Excluir</button></td></tr>))}
                </tbody></table></div>
            )}</div></div>
        </div>
    );
}
