"use client";
import React, { useState } from 'react';
import { Package, Box, AlertCircle, Trash2, Save } from 'lucide-react';
import { Card, InputGroup } from './ui';

// Limite da conta gratuita
const FREE_TIER_INSUMO_LIMIT = 20;

export default function InventoryTab({ insumos, setInsumos, unit, isPremium }: any) {
    const [insType, setInsType] = useState('area'); 
    const [insName, setInsName] = useState('');
    const [insPrice, setInsPrice] = useState('');
    const [insPackQty, setInsPackQty] = useState('1'); 
    const [insWidth, setInsWidth] = useState('');
    const [insHeight, setInsHeight] = useState('');
    const [insMeasure, setInsMeasure] = useState(''); 
    const [insStock, setInsStock] = useState('');
    const [insMinStock, setInsMinStock] = useState('');
    
    const handleSaveInsumo = () => {
        // Lógica FREEMIUM: Verifica limite antes de salvar
        if (!isPremium && insumos.length >= FREE_TIER_INSUMO_LIMIT) {
            alert(`Limite da conta gratuita atingido! Você só pode adicionar até ${FREE_TIER_INSUMO_LIMIT} insumos no estoque. Assine o plano Premium para adicionar itens ilimitados.`);
            return;
        }

        let finalTotalQty = 0;
        let measurePItem = 0;
        let pQty = Number(insPackQty) || 1;

        if (insType === 'area') {
            if (!insName || !insPrice || !insWidth || !insHeight) { alert('Preencha Nome, Preço, Largura e Altura de 1 unidade.'); return; }
            measurePItem = Number(insWidth) * Number(insHeight);
            finalTotalQty = measurePItem * pQty;
        } else {
            if (!insName || !insPrice || !insMeasure) { alert('Preencha Nome, Preço e a Medida de 1 unidade do pacote.'); return; }
            measurePItem = Number(insMeasure);
            finalTotalQty = measurePItem * pQty;
        }

        let unitLabel = 'un';
        if(insType === 'area') unitLabel = `${unit}²`;
        if(insType === 'weight') unitLabel = 'g';
        if(insType === 'length') unitLabel = 'cm'; 

        const costPerUnit = Number(insPrice) / finalTotalQty; 
        const costPerItem = Number(insPrice) / pQty; 
        
        const novoInsumo = {
            id: Date.now(), type: insType, name: insName, price: Number(insPrice), packQty: pQty, totalQty: finalTotalQty, 
            unit: unitLabel, costPerUnit, costPerItem, stock: Number(insStock) || 0, minStock: Number(insMinStock) || 0,
            width: insType === 'area' ? Number(insWidth) : null, height: insType === 'area' ? Number(insHeight) : null, measurePerItem: measurePItem
        };
        
        setInsumos([novoInsumo, ...insumos]);
        setInsName(''); setInsPrice(''); setInsPackQty('1'); setInsWidth(''); setInsHeight(''); setInsMeasure(''); setInsStock(''); setInsMinStock('');
        alert(`Insumo "${insName}" cadastrado no estoque!`);
    };

    const delInsumo = (id: any) => { if(window.confirm('Apagar este insumo do estoque?')) setInsumos(insumos.filter((i: any) => i.id !== id)); };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn w-full">
            <Card className={`md:col-span-1 border-t-4 border-amber-500`}>
                <h2 className={`font-bold text-lg mb-4 flex items-center gap-2 text-amber-600`}><Package size={20} /> Novo Insumo</h2>
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Tipo de Medida</label>
                    <select value={insType} onChange={e=>setInsType(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none text-sm font-bold bg-white text-slate-700">
                        <option value="area">Área (Chapas, Placas, Acrílico)</option>
                        <option value="length">Comprimento (Fitas, Tecidos, Correntes)</option>
                        <option value="weight">Peso em Gramas (Barbantes, Fios, Resina)</option>
                        <option value="unit">Unidade Fixa (Argolas, Fechos, Caixas)</option>
                    </select>
                </div>
                <InputGroup label="Nome do Insumo" value={insName} onChange={setInsName} type="text" placeholder={insType === 'area' ? "Ex: Placa MDF 3mm" : insType === 'length' ? "Ex: Fita de Cetim Rosa" : insType === 'weight' ? "Ex: Barbante Euroroma 600g" : "Ex: Fecho de Metal"} />
                <InputGroup label="Preço Total Pago" value={insPrice} onChange={setInsPrice} prefix="R$" tooltip="O valor TOTAL que você pagou no lote/pacote inteiro." />
                <InputGroup label="Quantidade no Pacote" value={insPackQty} onChange={setInsPackQty} type="number" step="1" min="1" tooltip={insType === 'weight' ? "Quantos cones/rolos vieram no pacote fechado?" : "Quantos itens vieram dentro do pacote que você comprou?"} />
                
                {insType === 'area' && (<div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4"><div className="col-span-2 text-xs font-bold text-slate-600 mb-1">Medidas de APENAS 1 unidade:</div><InputGroup label={`Largura (${unit})`} value={insWidth} onChange={setInsWidth} suffix={unit} className="mb-0" /><InputGroup label={`Altura (${unit})`} value={insHeight} onChange={setInsHeight} suffix={unit} className="mb-0" /></div>)}
                {(insType === 'weight' || insType === 'length' || insType === 'unit') && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4"><InputGroup label={insType === 'weight' ? "Peso de 1 rolo/cone (em GRAMAS)" : insType === 'length' ? "Compr. de 1 rolo (cm)" : "Quantidade por item"} value={insMeasure} onChange={setInsMeasure} className="mb-0" tooltip={insType === 'weight' ? "IMPORTANTE: Digite em gramas. Ex: 1Kg = 1000. Rolo de 600g = 600." : insType === 'length' ? "Ex: Um rolo tem 10 metros = 1000cm." : "Para unidades, geralmente é 1."} /></div>)}
                
                <div className="border-t border-slate-100 pt-4"><InputGroup label={insType === 'weight' ? "Estoque Atual (Qtd de Cones/Rolos)" : "Estoque Atual (Qtd Pacotes/Unidades)"} value={insStock} onChange={setInsStock} tooltip={insType === 'weight' ? "Quantos cones ou rolos inteiros você tem na prateleira agora?" : "Quantas unidades físicas você tem aí na prateleira?"} /><InputGroup label="Alerta de Estoque Mínimo" value={insMinStock} onChange={setInsMinStock} /></div>
                <button onClick={handleSaveInsumo} className={`w-full py-3 text-white font-bold rounded-lg flex justify-center items-center gap-2 transition-colors bg-amber-600 hover:bg-amber-700`}><Save size={18} /> Salvar no Estoque</button>
            </Card>
            <Card className="md:col-span-2">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700"><Box size={20} /> Controle de Estoque Completo {!isPremium && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold ml-2">Grátis: {insumos.length}/{FREE_TIER_INSUMO_LIMIT}</span>}</h2>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600 whitespace-nowrap"><thead className="bg-slate-50 uppercase text-xs font-bold text-slate-500"><tr><th className="p-3">Insumo</th><th className="p-3">Tipo</th><th className="p-3 text-right">Custo Unid.</th><th className="p-3 text-center">Estoque</th><th className="p-3 text-right text-green-600">Valor Parado</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">
                    {insumos.map((i: any) => {
                        const isLow = i.stock <= i.minStock; const unitCost = i.costPerItem || i.price; const totalValueInStock = Number(i.stock) * unitCost;
                        return (<tr key={i.id} className="hover:bg-slate-50"><td className="p-3 font-bold text-slate-800">{i.name}</td><td className="p-3 text-xs"><span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">{i.type === 'area' ? 'Área' : i.type === 'length' ? 'Compr.' : i.type === 'weight' ? 'Peso' : 'Unid.'}</span></td><td className="p-3 font-medium text-right">R$ {Number(unitCost || 0).toFixed(2)}</td><td className={`p-3 font-mono font-bold text-center ${isLow ? 'text-red-500' : 'text-slate-700'}`}>{Number(i.stock).toFixed(2)} un</td><td className="p-3 font-bold text-right text-green-600">R$ {Number(totalValueInStock || 0).toFixed(2)}</td><td className="p-3 text-center">{isLow ? (<span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 uppercase"><AlertCircle size={12} /> Comprar</span>) : (<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">OK</span>)}</td><td className="p-3 text-center"><button onClick={() => delInsumo(i.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Apagar Insumo"><Trash2 size={16} /></button></td></tr>)
                    })}
                    {insumos.length === 0 && (<tr><td colSpan={7} className="p-8 text-center text-slate-400">O seu estoque está vazio.</td></tr>)}
                </tbody></table></div>
            </Card>
        </div>
    );
}
