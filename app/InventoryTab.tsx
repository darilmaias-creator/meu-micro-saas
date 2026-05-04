"use client";
import React, { useState } from 'react';
import { Package, Box, AlertCircle, Trash2, Save, Upload, X } from 'lucide-react';
import { Card, InputGroup } from './ui';
import { FREE_TIER_INSUMO_LIMIT } from '@/lib/app-data/plan-limits';
import type { GenericRecord } from '@/lib/app-data/defaults';

type InsumoType = 'area' | 'length' | 'weight' | 'volume' | 'unit';

type InventoryRecord = GenericRecord & {
    id: number;
    type: InsumoType;
    name: string;
    price: number;
    packQty: number;
    totalQty: number;
    unit: string;
    costPerUnit: number;
    costPerItem: number;
    stock: number;
    minStock: number;
    width: number | null;
    height: number | null;
    measurePerItem: number;
};

type InventoryTabProps = {
    insumos: GenericRecord[];
    setInsumos: (value: GenericRecord[] | ((prev: GenericRecord[]) => GenericRecord[])) => void;
    unit: string;
    setUnit: (value: string) => void;
    isPremium: boolean;
};

export default function InventoryTab({ insumos, setInsumos, unit, setUnit, isPremium }: InventoryTabProps) {
    const [insType, setInsType] = useState<InsumoType>('area'); 
    const [insName, setInsName] = useState('');
    const [insPrice, setInsPrice] = useState('');
    const [insPackQty, setInsPackQty] = useState('1'); 
    const [insWidth, setInsWidth] = useState('');
    const [insHeight, setInsHeight] = useState('');
    const [insMeasure, setInsMeasure] = useState(''); 
    const [insStock, setInsStock] = useState('');
    const [insMinStock, setInsMinStock] = useState('');
    const [editingInsumoId, setEditingInsumoId] = useState<number | null>(null);
    const inventoryItems = insumos as InventoryRecord[];
    const freeInsumoUsage = inventoryItems.length;
    const freeInsumoRemaining = Math.max(FREE_TIER_INSUMO_LIMIT - freeInsumoUsage, 0);
    const freeInsumoProgress = Math.min(
        100,
        (freeInsumoUsage / FREE_TIER_INSUMO_LIMIT) * 100
    );
    const isInsumoLimitReached = !isPremium && freeInsumoUsage >= FREE_TIER_INSUMO_LIMIT;
    const isInsumoLimitNear = !isPremium && !isInsumoLimitReached && freeInsumoRemaining <= 2;

    const resetForm = () => {
        setEditingInsumoId(null);
        setInsType('area');
        setInsName('');
        setInsPrice('');
        setInsPackQty('1');
        setInsWidth('');
        setInsHeight('');
        setInsMeasure('');
        setInsStock('');
        setInsMinStock('');
    };

    const toggleUnitGlobal = () => {
        const isToMM = unit === 'cm';
        const factor = isToMM ? 10 : 0.1;

        if (insType === 'area') {
            if (insWidth) setInsWidth(prev => String(parseFloat((Number(prev) * factor).toFixed(2))));
            if (insHeight) setInsHeight(prev => String(parseFloat((Number(prev) * factor).toFixed(2))));
        }

        if (insType === 'length' && insMeasure) {
            setInsMeasure(prev => String(parseFloat((Number(prev) * factor).toFixed(2))));
        }

        setUnit(isToMM ? 'mm' : 'cm');
    };
    
    const handleSaveInsumo = () => {
        // Lógica FREEMIUM: Verifica limite antes de salvar
        if (!editingInsumoId && !isPremium && inventoryItems.length >= FREE_TIER_INSUMO_LIMIT) {
            alert(`Limite da conta gratuita atingido! Você só pode adicionar até ${FREE_TIER_INSUMO_LIMIT} insumos no estoque. Assine o plano Premium para adicionar itens ilimitados.`);
            return;
        }

        let finalTotalQty = 0;
        let measurePItem = 0;
        const pQty = Number(insPackQty) || 1;

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
        if(insType === 'length') unitLabel = unit; 
        if(insType === 'volume') unitLabel = 'ml';

        const costPerUnit = Number(insPrice) / finalTotalQty; 
        const costPerItem = Number(insPrice) / pQty; 
        
        const novoInsumo: InventoryRecord = {
            id: editingInsumoId ?? Date.now(), type: insType, name: insName, price: Number(insPrice), packQty: pQty, totalQty: finalTotalQty, 
            unit: unitLabel, costPerUnit, costPerItem, stock: Number(insStock) || 0, minStock: Number(insMinStock) || 0,
            width: insType === 'area' ? Number(insWidth) : null, height: insType === 'area' ? Number(insHeight) : null, measurePerItem: measurePItem
        };

        if (editingInsumoId) {
            setInsumos(inventoryItems.map((i) => i.id === editingInsumoId ? novoInsumo : i));
            resetForm();
            alert(`Insumo "${insName}" atualizado no estoque!`);
            return;
        }

        setInsumos([novoInsumo, ...inventoryItems]);
        resetForm();
        alert(`Insumo "${insName}" cadastrado no estoque!`);
    };

    const delInsumo = (id: number) => { if(window.confirm('Apagar este insumo do estoque?')) setInsumos(inventoryItems.filter((i) => i.id !== id)); };

    const loadInsumo = (insumo: InventoryRecord) => {
        if (window.confirm(`Carregar "${insumo.name || 'Insumo'}" para edição?`)) {
            setEditingInsumoId(insumo.id);
            setInsType(insumo.type || 'area');
            setInsName(insumo.name || '');
            setInsPrice(String(insumo.price ?? ''));
            setInsPackQty(String(insumo.packQty ?? '1'));
            setInsWidth(insumo.type === 'area' && insumo.width != null ? String(insumo.width) : '');
            setInsHeight(insumo.type === 'area' && insumo.height != null ? String(insumo.height) : '');
            setInsMeasure(insumo.type !== 'area' && insumo.measurePerItem != null ? String(insumo.measurePerItem) : '');
            setInsStock(String(insumo.stock ?? ''));
            setInsMinStock(String(insumo.minStock ?? ''));

            if ((insumo.type === 'area' || insumo.type === 'length') && typeof insumo.unit === 'string') {
                if (insumo.unit.includes('mm')) setUnit('mm');
                if (insumo.unit.includes('cm')) setUnit('cm');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn w-full">
            <Card
                data-onboarding="inventory-insumo-form"
                className={`md:col-span-1 border-t-4 border-amber-500`}
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className={`font-bold text-lg flex items-center gap-2 text-amber-600`}><Package size={20} /> {editingInsumoId ? 'Editar Insumo' : 'Novo Insumo'}</h2>
                    {(insType === 'area' || insType === 'length') && (
                        <div className="flex bg-slate-100 p-1 rounded border shrink-0">
                            <button onClick={() => unit !== 'cm' && toggleUnitGlobal()} className={`px-3 py-1 rounded text-xs font-bold ${unit === 'cm' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>CM</button>
                            <button onClick={() => unit !== 'mm' && toggleUnitGlobal()} className={`px-3 py-1 rounded text-xs font-bold ${unit === 'mm' ? 'bg-white shadow text-amber-600' : 'text-slate-400'}`}>MM</button>
                        </div>
                    )}
                </div>
                {editingInsumoId && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 flex items-center justify-between gap-3">
                        <span>Você está editando um insumo já salvo no estoque.</span>
                        <button onClick={resetForm} className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">
                            <X size={14} /> Cancelar
                        </button>
                    </div>
                )}
                {!isPremium && (
                    <div className={`mb-4 rounded-lg border px-3 py-3 ${
                        isInsumoLimitReached
                            ? 'border-red-200 bg-red-50'
                            : isInsumoLimitNear
                                ? 'border-amber-300 bg-amber-50'
                                : 'border-slate-200 bg-slate-50'
                    }`}>
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Plano grátis • limite de insumos</p>
                            <span className="text-xs font-black text-slate-700">{freeInsumoUsage}/{FREE_TIER_INSUMO_LIMIT}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                            <div
                                className={`h-full rounded-full ${
                                    isInsumoLimitReached ? 'bg-red-500' : isInsumoLimitNear ? 'bg-amber-500' : 'bg-slate-700'
                                }`}
                                style={{ width: `${freeInsumoProgress}%` }}
                            />
                        </div>
                        <p className={`mt-2 text-xs font-semibold ${
                            isInsumoLimitReached
                                ? 'text-red-600'
                                : isInsumoLimitNear
                                    ? 'text-amber-700'
                                    : 'text-slate-600'
                        }`}>
                            {isInsumoLimitReached
                                ? 'Limite atingido. Para adicionar mais insumos, assine o Premium.'
                                : `Faltam ${freeInsumoRemaining} ${freeInsumoRemaining === 1 ? 'insumo' : 'insumos'} para atingir o limite.`}
                        </p>
                    </div>
                )}
                <div className="mb-4">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Tipo de Medida</label>
                    <select value={insType} onChange={e=>setInsType(e.target.value as InsumoType)} className="w-full p-2.5 border border-slate-300 rounded-lg outline-none text-sm font-bold bg-white text-slate-700">
                        <option value="area">Área (Chapas, Placas, Acrílico)</option>
                        <option value="length">Comprimento (Fitas, Tecidos, Correntes)</option>
                        <option value="weight">Peso em Gramas (Farinha, Acucar, Fios, Resina)</option>
                        <option value="volume">Liquidos em ML (Leite, Oleo, Essencia, Caldas)</option>
                        <option value="unit">Unidade Fixa (Argolas, Fechos, Caixas)</option>
                    </select>
                </div>
                <InputGroup label="Nome do Insumo" value={insName} onChange={setInsName} type="text" placeholder={insType === 'area' ? "Ex: Placa MDF 3mm" : insType === 'length' ? "Ex: Fita de Cetim Rosa" : insType === 'weight' ? "Ex: Farinha de Trigo 1Kg" : insType === 'volume' ? "Ex: Leite Condensado 395ml" : "Ex: Fecho de Metal"} />
                <InputGroup label="Preço Total Pago" value={insPrice} onChange={setInsPrice} prefix="R$" tooltip="O valor TOTAL que você pagou no lote/pacote inteiro." />
                <InputGroup label="Quantidade no Pacote" value={insPackQty} onChange={setInsPackQty} type="number" step="1" min="1" tooltip={insType === 'weight' ? "Quantos cones, sacos ou pacotes vieram na compra?" : insType === 'volume' ? "Quantas garrafas, caixas ou frascos vieram na compra?" : "Quantos itens vieram dentro do pacote que você comprou?"} />
                
                {insType === 'area' && (<div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4"><div className="col-span-2 text-xs font-bold text-slate-600 mb-1">Medidas de APENAS 1 unidade:</div><InputGroup label={`Largura (${unit})`} value={insWidth} onChange={setInsWidth} suffix={unit} className="mb-0" /><InputGroup label={`Altura (${unit})`} value={insHeight} onChange={setInsHeight} suffix={unit} className="mb-0" /></div>)}
                {(insType === 'weight' || insType === 'length' || insType === 'volume' || insType === 'unit') && (<div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4"><InputGroup label={insType === 'weight' ? "Peso de 1 pacote/saco (em GRAMAS)" : insType === 'length' ? `Compr. de 1 rolo (${unit})` : insType === 'volume' ? "Volume de 1 frasco/caixa (em ML)" : "Quantidade por item"} value={insMeasure} onChange={setInsMeasure} className="mb-0" tooltip={insType === 'weight' ? "IMPORTANTE: Digite em gramas. Ex: 1Kg = 1000." : insType === 'length' ? unit === 'cm' ? "Ex: Um rolo tem 10 metros = 1000cm." : "Ex: Um rolo tem 10 metros = 10000mm." : insType === 'volume' ? "IMPORTANTE: Digite em ml. Ex: 1 litro = 1000ml. Uma caixa de 395ml = 395." : "Para unidades, geralmente é 1."} suffix={insType === 'length' ? unit : insType === 'volume' ? 'ml' : undefined} /></div>)}
                
                <div className="border-t border-slate-100 pt-4"><InputGroup label={insType === 'weight' ? "Estoque Atual (Qtd de Pacotes/Sacos)" : insType === 'volume' ? "Estoque Atual (Qtd de Frascos/Caixas)" : "Estoque Atual (Qtd Pacotes/Unidades)"} value={insStock} onChange={setInsStock} tooltip={insType === 'weight' ? "Quantos pacotes ou sacos inteiros você tem na prateleira agora?" : insType === 'volume' ? "Quantos frascos, caixas ou garrafas inteiras você tem disponíveis?" : "Quantas unidades físicas você tem aí na prateleira?"} /><InputGroup label="Alerta de Estoque Mínimo" value={insMinStock} onChange={setInsMinStock} /></div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleSaveInsumo}
                        disabled={isInsumoLimitReached && editingInsumoId === null}
                        className={`w-full py-3 text-white font-bold rounded-lg flex justify-center items-center gap-2 transition-colors ${
                            isInsumoLimitReached && editingInsumoId === null
                                ? 'bg-slate-300 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700'
                        }`}
                    ><Save size={18} /> {editingInsumoId ? 'Atualizar no Estoque' : 'Salvar no Estoque'}</button>
                    {editingInsumoId && (
                        <button onClick={resetForm} className="w-full py-2.5 text-slate-700 font-bold rounded-lg flex justify-center items-center gap-2 transition-colors bg-slate-100 hover:bg-slate-200">
                            <X size={16} /> Limpar edição
                        </button>
                    )}
                </div>
            </Card>
            <Card className="md:col-span-2">
                    <h2 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700"><Box size={20} /> Controle de Estoque Completo {!isPremium && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold ml-2">{freeInsumoUsage}/{FREE_TIER_INSUMO_LIMIT} usados</span>}</h2>
                <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600 whitespace-nowrap"><thead className="bg-slate-50 uppercase text-xs font-bold text-slate-500"><tr><th className="p-3">Insumo</th><th className="p-3">Tipo</th><th className="p-3 text-right">Custo Unid.</th><th className="p-3 text-center">Estoque</th><th className="p-3 text-right text-green-600">Valor Parado</th><th className="p-3 text-center">Status</th><th className="p-3 text-center">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">
                    {inventoryItems.map((i) => {
                        const isLow = i.stock <= i.minStock; const unitCost = i.costPerItem || i.price; const totalValueInStock = Number(i.stock) * unitCost;
                        return (<tr key={i.id} className="hover:bg-slate-50"><td className="p-3 font-bold text-slate-800">{i.name}</td><td className="p-3 text-xs"><span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">{i.type === 'area' ? 'Área' : i.type === 'length' ? 'Compr.' : i.type === 'weight' ? 'Peso' : i.type === 'volume' ? 'Líquido' : 'Unid.'}</span></td><td className="p-3 font-medium text-right">R$ {Number(unitCost || 0).toFixed(2)}</td><td className={`p-3 font-mono font-bold text-center ${isLow ? 'text-red-500' : 'text-slate-700'}`}>{Number(i.stock).toFixed(2)} un</td><td className="p-3 font-bold text-right text-green-600">R$ {Number(totalValueInStock || 0).toFixed(2)}</td><td className="p-3 text-center">{isLow ? (<span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 uppercase"><AlertCircle size={12} /> Comprar</span>) : (<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">OK</span>)}</td><td className="p-3 text-center"><button onClick={() => loadInsumo(i)} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1 mr-2" title="Carregar para editar"><Upload size={14} /> Carregar</button><button onClick={() => delInsumo(i.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="Apagar Insumo"><Trash2 size={16} /></button></td></tr>)
                    })}
                    {inventoryItems.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-8 text-center">
                                <p className="text-sm font-semibold text-slate-600">Você ainda não tem nenhum insumo salvo.</p>
                                <p className="text-xs text-slate-500 mt-1">Próximo passo: preencha o bloco <strong>Novo Insumo</strong> e clique em <strong>Salvar no Estoque</strong>.</p>
                            </td>
                        </tr>
                    )}
                </tbody></table></div>
            </Card>
        </div>
    );
}
