"use client";

import React, { useMemo, useState } from "react";
import {
  Clock,
  FileText,
  Save,
  ShoppingBag,
  Trash2,
  Upload,
} from "lucide-react";

import {
  DEFAULT_STORE_LOGO,
  resolveQuoteDocumentConfig,
  type AppConfigState,
  type GenericRecord,
} from "@/lib/app-data/defaults";
import { Card, InputGroup } from "./ui";

type RecordId = string | number;

type RecipeItem = Record<string, unknown> & {
  insumoId: RecordId;
  usedMeasure: number;
};

type SavedProduct = Record<string, unknown> & {
  id: RecordId;
  name?: string;
  totalCost?: number | string;
  activePrice?: number | string;
  titheValue?: number | string;
  finishTime?: number | string;
  hourlyRate?: number | string;
  chargeSupervision?: boolean;
  cutTime?: number | string;
  yieldQty?: number | string;
  recipeItems?: RecipeItem[];
};

type Insumo = Record<string, unknown> & {
  id: RecordId;
  name: string;
  stock: number;
  minStock?: number;
  measurePerItem?: number;
};

type QuoteLineItem = {
  id: RecordId;
  productId: RecordId;
  productName: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  grossSale: number;
  totalCost: number;
  baseTithe: number;
};

type Quote = Record<string, unknown> & {
  id: RecordId;
  quoteNumber: number;
  productId: RecordId;
  productName: string;
  clientName: string;
  clientPhone: string;
  quantity: number;
  date: string;
  discountFixed: string;
  discountPercent: string;
  unitPrice: number;
  grossSale?: number;
  totalCost?: number;
  totalTithe?: number;
  netSale: number;
  items?: QuoteLineItem[];
  status: string;
};

type Sale = Record<string, unknown> & {
  id: number;
  productId: RecordId;
  productName: string;
  date: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  discount: number;
  totalCost: number;
  totalSale: number;
  totalTithe: number;
  totalProfit: number;
};

type CurrentSaleData = {
  p: SavedProduct;
  q: number;
  uCost: number;
  uPrice: number;
  baseTithe: number;
  grossSale: number;
  discountTotal: number;
  netSale: number;
  totalC: number;
  totalTithe: number;
  totalProfit: number;
};

type CurrentDocumentData = {
  items: QuoteLineItem[];
  grossSale: number;
  discountTotal: number;
  netSale: number;
  totalCost: number;
  totalTithe: number;
  totalProfit: number;
};

type SalesTabProps = {
  appData: {
    savedProducts: GenericRecord[];
    insumos: GenericRecord[];
    setInsumos: (items: GenericRecord[]) => void;
    sales: GenericRecord[];
    setSales: (items: GenericRecord[]) => void;
    quotes: GenericRecord[];
    setQuotes: (items: GenericRecord[]) => void;
    config: AppConfigState;
  };
  isPremium: boolean;
};

function formatDocumentDate(value: string) {
  return value && value.includes("-") ? value.split("-").reverse().join("/") : value;
}

function formatQuoteQuantity(value: number) {
  return `${value} ${value === 1 ? "unidade" : "unidades"}`;
}

function buildQuoteValidityLabel(date: string, validityDays: string) {
  const numericValidityDays = Math.max(1, Number(validityDays || 0));

  if (!date) {
    return `${numericValidityDays} dias`;
  }

  const baseDate = new Date(`${date}T12:00:00`);

  if (Number.isNaN(baseDate.getTime())) {
    return `${numericValidityDays} dias`;
  }

  baseDate.setDate(baseDate.getDate() + numericValidityDays);

  return `${baseDate.toLocaleDateString("pt-BR")} (${numericValidityDays} dias)`;
}

function summarizeQuoteProducts(items: QuoteLineItem[]) {
  if (items.length === 0) {
    return "Produto";
  }

  if (items.length === 1) {
    return items[0].productName;
  }

  return `${items[0].productName} + ${items.length - 1} ${
    items.length - 1 === 1 ? "item" : "itens"
  }`;
}

function totalQuoteQuantity(items: QuoteLineItem[]) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

type SaveFilePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    id?: string;
    suggestedName?: string;
    types?: Array<{
      description?: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<{
    createWritable: () => Promise<{
      write: (data: Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

function fallbackBlobDownload(blob: Blob, fileName: string) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 0);
}

async function savePdfWithPickerOrDownload(blob: Blob, fileName: string) {
  const pickerWindow = window as SaveFilePickerWindow;

  if (typeof pickerWindow.showSaveFilePicker === "function") {
    try {
      const fileHandle = await pickerWindow.showSaveFilePicker({
        id: "orcamentos-calcula-artesao",
        suggestedName: fileName,
        types: [
          {
            description: "Documento PDF",
            accept: { "application/pdf": [".pdf"] },
          },
        ],
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") {
        return;
      }
    }
  }

  fallbackBlobDownload(blob, fileName);
}

export default function SalesTab({ appData, isPremium }: SalesTabProps) {
  const {
    savedProducts,
    insumos,
    setInsumos,
    sales,
    setSales,
    quotes,
    setQuotes,
    config,
  } = appData;
  const savedProductItems = savedProducts as SavedProduct[];
  const insumoItems = insumos as Insumo[];
  const saleItems = sales as Sale[];
  const quoteItems = quotes as Quote[];

  const [saleProductId, setSaleProductId] = useState("");
  const [saleQuantity, setSaleQuantity] = useState<number | string>(1);
  const [saleDate, setSaleDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [saleDiscountFixed, setSaleDiscountFixed] = useState("");
  const [saleDiscountPercent, setSaleDiscountPercent] = useState("");

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [activeQuoteId, setActiveQuoteId] = useState<RecordId | null>(null);
  const [quoteNumber, setQuoteNumber] = useState(
    () => Math.floor(Math.random() * 90000) + 10000,
  );
  const [docType, setDocType] = useState<"orcamento" | "recibo">("orcamento");
  const [quoteLineItems, setQuoteLineItems] = useState<QuoteLineItem[]>([]);

  const resolvedQuoteConfig = useMemo(
    () => resolveQuoteDocumentConfig(config, isPremium),
    [config, isPremium],
  );
  const formattedSaleDate = formatDocumentDate(saleDate || "");
  const quoteValidityLabel = buildQuoteValidityLabel(
    saleDate,
    resolvedQuoteConfig.quoteValidityDays,
  );

  const quoteConditionRows = useMemo(() => {
    if (docType !== "orcamento") {
      return [];
    }

    return [
      {
        label: "Prazo",
        value: resolvedQuoteConfig.quoteLeadTimeText,
      },
      {
        label: "Entrega",
        value: resolvedQuoteConfig.quoteDeliveryText,
      },
      {
        label: "Pagamento",
        value: resolvedQuoteConfig.quotePaymentText,
      },
      {
        label: "Sinal",
        value: resolvedQuoteConfig.quoteAdvanceText,
      },
      {
        label: "Aprovação",
        value: resolvedQuoteConfig.quoteApprovalText,
      },
    ].filter((item) => item.value.trim().length > 0);
  }, [docType, resolvedQuoteConfig]);

  const quoteContactRows = useMemo(() => {
    if (docType !== "orcamento") {
      return [];
    }

    return [
      {
        label: "Instagram",
        value: resolvedQuoteConfig.businessInstagram,
      },
      {
        label: "WhatsApp",
        value: resolvedQuoteConfig.businessWhatsapp,
      },
    ].filter((item) => item.value.trim().length > 0);
  }, [docType, resolvedQuoteConfig]);

  const hasQuoteNotes =
    docType === "orcamento" && resolvedQuoteConfig.quoteNotesText.trim().length > 0;

  function resetSalesForm() {
    setSaleProductId("");
    setSaleQuantity(1);
    setSaleDiscountFixed("");
    setSaleDiscountPercent("");
    setClientName("");
    setClientPhone("");
    setQuoteLineItems([]);
    setQuoteNumber(Math.floor(Math.random() * 90000) + 10000);
    setActiveQuoteId(null);
    setDocType("orcamento");
  }

  let currentSaleData: CurrentSaleData | null = null;

  if (saleProductId) {
    const product = savedProductItems.find(
      (candidate) => candidate && String(candidate.id) === String(saleProductId),
    );

    if (product) {
      const quantity = Number(saleQuantity) || 1;
      const unitCost = Number(product.totalCost || 0);
      const unitPrice = Number(product.activePrice || 0);
      const grossSale = unitPrice * quantity;
      const fixedDiscount = Number(saleDiscountFixed) || 0;
      const percentDiscount = Number(saleDiscountPercent) || 0;
      const discountTotal = fixedDiscount + grossSale * (percentDiscount / 100);
      const netSale = Math.max(0, grossSale - discountTotal);
      const totalCost = unitCost * quantity;

      let baseTithe = 0;

      if (product.titheValue !== undefined) {
        baseTithe = Number(product.titheValue) * quantity;
      } else {
        const laborFinish =
          (Number(product.finishTime || 0) / 60) * Number(product.hourlyRate || 0);
        const laborSupervision = product.chargeSupervision
          ? (Number(product.cutTime || 0) / 60) * Number(product.hourlyRate || 0)
          : 0;
        const laborPerBatch = laborFinish + laborSupervision;
        const unitLaborCost =
          laborPerBatch / Number(product.yieldQty || 1);
        const totalLaborForSale = unitLaborCost * quantity;
        const costWithoutLabor = totalCost - totalLaborForSale;
        baseTithe = Math.max(0, grossSale - costWithoutLabor) * 0.1;
      }

      const totalTithe = Math.max(0, baseTithe - discountTotal * 0.1);
      const totalProfit = netSale - totalCost - totalTithe;

      currentSaleData = {
        p: product,
        q: quantity,
        uCost: unitCost,
        uPrice: unitPrice,
        baseTithe,
        grossSale,
        discountTotal,
        netSale,
        totalC: totalCost,
        totalTithe,
        totalProfit,
      };
    }
  }

  const previewQuoteItem: QuoteLineItem | null = currentSaleData
    ? {
        id: "preview",
        productId: currentSaleData.p.id,
        productName: currentSaleData.p.name || "Produto",
        quantity: currentSaleData.q,
        unitCost: currentSaleData.uCost,
        unitPrice: currentSaleData.uPrice,
        grossSale: currentSaleData.grossSale,
        totalCost: currentSaleData.totalC,
        baseTithe: currentSaleData.baseTithe,
      }
    : null;

  const effectiveQuoteItems =
    quoteLineItems.length > 0
      ? quoteLineItems
      : previewQuoteItem
        ? [previewQuoteItem]
        : [];

  const currentDocumentData: CurrentDocumentData | null =
    effectiveQuoteItems.length > 0
      ? (() => {
          const grossSale = effectiveQuoteItems.reduce(
            (total, item) => total + Number(item.grossSale || 0),
            0,
          );
          const discountTotal =
            (Number(saleDiscountFixed) || 0) +
            grossSale * ((Number(saleDiscountPercent) || 0) / 100);
          const netSale = Math.max(0, grossSale - discountTotal);
          const totalCost = effectiveQuoteItems.reduce(
            (total, item) => total + Number(item.totalCost || 0),
            0,
          );
          const totalBaseTithe = effectiveQuoteItems.reduce(
            (total, item) => total + Number(item.baseTithe || 0),
            0,
          );
          const totalTithe = Math.max(0, totalBaseTithe - discountTotal * 0.1);
          const totalProfit = netSale - totalCost - totalTithe;

          return {
            items: effectiveQuoteItems,
            grossSale,
            discountTotal,
            netSale,
            totalCost,
            totalTithe,
            totalProfit,
          };
        })()
      : null;

  function addCurrentProductToQuote() {
    if (!previewQuoteItem) {
      alert("Selecione um produto e a quantidade.");
      return;
    }

    setQuoteLineItems((previous) => {
      const existingIndex = previous.findIndex(
        (item) => String(item.productId) === String(previewQuoteItem.productId),
      );

      if (existingIndex < 0) {
        return [
          ...previous,
          {
            ...previewQuoteItem,
            id: `${previewQuoteItem.productId}-${Date.now()}`,
          },
        ];
      }

      return previous.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: item.quantity + previewQuoteItem.quantity,
              grossSale: item.grossSale + previewQuoteItem.grossSale,
              totalCost: item.totalCost + previewQuoteItem.totalCost,
              baseTithe: item.baseTithe + previewQuoteItem.baseTithe,
            }
          : item,
      );
    });

    setSaleProductId("");
    setSaleQuantity(1);
  }

  function removeQuoteLineItem(id: QuoteLineItem["id"]) {
    setQuoteLineItems((previous) => previous.filter((item) => item.id !== id));
  }

  function saveQuote() {
    if (!currentDocumentData) {
      alert("Selecione pelo menos um produto para o orçamento.");
      return;
    }

    const firstItem = currentDocumentData.items[0];

    const nextQuote = {
      id: activeQuoteId || Date.now(),
      quoteNumber,
      productId: firstItem.productId,
      productName: summarizeQuoteProducts(currentDocumentData.items),
      clientName,
      clientPhone,
      quantity: totalQuoteQuantity(currentDocumentData.items),
      date: saleDate || new Date().toISOString().split("T")[0],
      discountFixed: saleDiscountFixed,
      discountPercent: saleDiscountPercent,
      unitPrice: firstItem.unitPrice,
      grossSale: currentDocumentData.grossSale,
      totalCost: currentDocumentData.totalCost,
      totalTithe: currentDocumentData.totalTithe,
      netSale: currentDocumentData.netSale,
      items: currentDocumentData.items,
      status: "pendente",
    };

    if (activeQuoteId) {
      setQuotes(
        quoteItems.map((quote) =>
          quote.id === activeQuoteId ? nextQuote : quote,
        ),
      );
      alert("Orçamento atualizado!");
    } else {
      setQuotes([nextQuote, ...quoteItems]);
      alert("Orçamento salvo nos Pendentes!");
    }

    resetSalesForm();
  }

  function loadQuote(quote: Quote) {
    setClientName(quote.clientName || "");
    setClientPhone(quote.clientPhone || "");
    setSaleDate(quote.date);
    setSaleDiscountFixed(quote.discountFixed || "");
    setSaleDiscountPercent(quote.discountPercent || "");
    setQuoteNumber(quote.quoteNumber);
    setActiveQuoteId(quote.id);
    setDocType("orcamento");

    if (Array.isArray(quote.items) && quote.items.length > 0) {
      setQuoteLineItems(quote.items);
      setSaleProductId("");
      setSaleQuantity(1);
    } else {
      setQuoteLineItems([]);
      setSaleProductId(String(quote.productId));
      setSaleQuantity(quote.quantity);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteQuote(id: Quote["id"]) {
    if (!window.confirm("Excluir este orçamento pendente?")) {
      return;
    }

    setQuotes(quoteItems.filter((quote) => quote.id !== id));

    if (activeQuoteId === id) {
      resetSalesForm();
    }
  }

  function registerSale() {
    if (!currentDocumentData) {
      alert("Selecione pelo menos um produto para concluir a venda.");
      return;
    }

    const updatedInsumos = [...insumoItems];
    const stockWarnings: string[] = [];
    const premiumLowStockWarnings: string[] = [];
    const missingProducts = currentDocumentData.items.filter(
      (item) =>
        !savedProductItems.find(
          (product) => String(product.id) === String(item.productId),
        ),
    );

    if (missingProducts.length > 0) {
      alert(
        `Os seguintes produtos não estão mais no catálogo e precisam ser recriados antes de concluir a venda: ${missingProducts
          .map((item) => item.productName)
          .join(", ")}.`,
      );
      return;
    }

    currentDocumentData.items.forEach((quoteItem) => {
      const product = savedProductItems.find(
        (candidate) => String(candidate.id) === String(quoteItem.productId),
      );

      if (!product || !product.recipeItems || product.recipeItems.length === 0) {
        return;
      }

      product.recipeItems.forEach((item) => {
        const insumoIndex = updatedInsumos.findIndex(
          (insumo) => String(insumo.id) === String(item.insumoId),
        );

        if (insumoIndex < 0) {
          return;
        }

        const insumo = updatedInsumos[insumoIndex];
        const unitSize = insumo.measurePerItem || 1;
        const spentPerFinalUnit =
          item.usedMeasure / Number(product.yieldQty || 1);
        const totalSpentOnSale =
          spentPerFinalUnit * Number(quoteItem.quantity || 0);
        const deductionInUnits = totalSpentOnSale / unitSize;

        insumo.stock -= deductionInUnits;

        if (insumo.stock < 0 && !stockWarnings.includes(insumo.name)) {
          stockWarnings.push(insumo.name);
        }

        if (
          isPremium &&
          insumo.stock <= (insumo.minStock || 0) &&
          insumo.stock >= 0 &&
          !premiumLowStockWarnings.includes(insumo.name)
        ) {
          premiumLowStockWarnings.push(insumo.name);
        }
      });
    });

    if (stockWarnings.length > 0) {
      const shouldContinue = window.confirm(
        `O estoque de ${stockWarnings.join(
          ", ",
        )} ficará negativo. Continuar venda e dar baixa?`,
      );

      if (!shouldContinue) {
        return;
      }
    }

    let remainingDiscount = Number(currentDocumentData.discountTotal || 0);
    const nextSales = currentDocumentData.items.map((quoteItem, index) => {
      const isLastItem = index === currentDocumentData.items.length - 1;
      const grossRatio =
        currentDocumentData.grossSale > 0
          ? quoteItem.grossSale / currentDocumentData.grossSale
          : 1 / currentDocumentData.items.length;
      const itemDiscount = isLastItem
        ? remainingDiscount
        : Number((currentDocumentData.discountTotal * grossRatio).toFixed(2));
      const itemNetSale = Math.max(0, quoteItem.grossSale - itemDiscount);
      const itemTotalTithe = Math.max(0, quoteItem.baseTithe - itemDiscount * 0.1);
      const itemTotalProfit = itemNetSale - quoteItem.totalCost - itemTotalTithe;

      remainingDiscount = Math.max(0, remainingDiscount - itemDiscount);

      return {
        id: Date.now() + index,
        productId: quoteItem.productId,
        productName: quoteItem.productName,
        date: saleDate || new Date().toISOString().split("T")[0],
        quantity: quoteItem.quantity,
        unitCost: quoteItem.unitCost,
        unitPrice: quoteItem.unitPrice,
        discount: itemDiscount,
        totalCost: quoteItem.totalCost,
        totalSale: itemNetSale,
        totalTithe: itemTotalTithe,
        totalProfit: itemTotalProfit,
      };
    });

    setSales([...nextSales, ...saleItems]);
    setInsumos(updatedInsumos);

    if (activeQuoteId) {
      setQuotes(quoteItems.filter((quote) => quote.id !== activeQuoteId));
    }

    alert("Venda Registrada! Estoque deduzido.");

    if (isPremium && premiumLowStockWarnings.length > 0) {
      alert(
        `💎 ALERTA PREMIUM DE ESTOQUE:\n\nOs seguintes materiais chegaram no limite mínimo e estão acabando:\n${premiumLowStockWarnings
          .map((item) => `- ${item}`)
          .join("\n")}\n\nConsidere reabastecer o quanto antes!`,
      );
    }

    resetSalesForm();
  }

  async function generateQuotePDF() {
    if (!isPremium) {
      alert("O download em PDF está disponível apenas no plano Premium.");
      return;
    }

    if (!currentDocumentData) {
      alert("Selecione pelo menos um produto para gerar o documento.");
      return;
    }

    const html2pdf = (await import("html2pdf.js")).default;
    const originalScrollY = window.scrollY;
    const element = document.getElementById("quote-receipt");
    const container = document.getElementById("pdf-container");

    if (!container || !element) {
      return;
    }

    window.scrollTo(0, 0);

    const originalStyle = container.getAttribute("style") || "";
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.left = "0px";
    container.style.zIndex = "9999";

    window.setTimeout(() => {
      const docPrefix = docType === "orcamento" ? "Orcamento" : "Recibo";
      const fileLabel =
        currentDocumentData.items.length > 1
          ? "Varios_Produtos"
          : (currentDocumentData.items[0]?.productName || "Produto").replace(
              /\s+/g,
              "_",
            );
      const fileName = `${docPrefix}_${fileLabel}_${saleDate}.pdf`;

      const options = {
        margin: 0,
        filename: fileName,
        image: { type: "jpeg" as const, quality: 1 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: {
          mode: ["css", "legacy"] as const,
          avoid: [".pdf-avoid-break"],
        },
      };

      html2pdf()
        .set(options)
        .from(element)
        .outputPdf("blob")
        .then((pdfBlob: Blob) => savePdfWithPickerOrDownload(pdfBlob, fileName))
        .finally(() => {
          container.setAttribute("style", originalStyle);
          window.scrollTo(0, originalScrollY);
        });
    }, 800);
  }

  return (
    <div className="animate-fadeIn max-w-3xl mx-auto w-full">
      <Card
        data-onboarding="sales-quote-workflow"
        className="border-t-4 border-t-amber-500 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-100 p-3 rounded-full text-amber-600">
            <ShoppingBag size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Orçamentos & Vendas
            </h2>
            <p className="text-sm text-slate-500">
              Gere orçamentos e conclua vendas com baixa no estoque.
            </p>
          </div>
        </div>

        {savedProductItems.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-lg text-center text-slate-500 border border-slate-200">
            <p className="mb-2">
              Você precisa salvar produtos no seu catálogo antes de orçar ou
              vender.
            </p>
            <p className="text-amber-600 font-bold">Vá para a aba de Ficha Técnica.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Selecione o Produto:
              </label>
              <select
                value={saleProductId}
                onChange={(event) => setSaleProductId(event.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold text-slate-700"
              >
                <option value="">-- Escolher Produto do Catálogo --</option>
                {savedProductItems.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name || "Produto"} (Venda Sugerida: R${" "}
                    {Number(product.activePrice || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Dados do Cliente (Sai no PDF)
                </label>
                <div className="flex bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setDocType("orcamento")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      docType === "orcamento"
                        ? "bg-amber-100 text-amber-700"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Orçamento
                  </button>
                  <button
                    onClick={() => setDocType("recibo")}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                      docType === "recibo"
                        ? "bg-green-100 text-green-700"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Recibo (Pago)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label="Nome do Cliente"
                  type="text"
                  value={clientName}
                  onChange={setClientName}
                  placeholder="Ex: João da Silva"
                />
                <InputGroup
                  label="Telefone / Contato"
                  type="text"
                  value={clientPhone}
                  onChange={setClientPhone}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InputGroup
                label="Quantidade Solicitada"
                type="number"
                min="1"
                step="1"
                value={saleQuantity}
                onChange={setSaleQuantity}
              />
              <InputGroup
                label="Data"
                type="date"
                value={saleDate}
                onChange={setSaleDate}
              />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Monte um orçamento com vários produtos
                  </p>
                  <p className="text-xs text-amber-800">
                    Adicione quantos itens quiser para o mesmo cliente. Se for só um
                    produto, você também pode seguir direto.
                  </p>
                </div>
                <button
                  onClick={addCurrentProductToQuote}
                  disabled={!currentSaleData}
                  className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:bg-slate-300"
                >
                  Adicionar produto
                </button>
              </div>
            </div>

            {quoteLineItems.length > 0 ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase">
                    Itens deste orçamento
                  </h3>
                  <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                    {quoteLineItems.length}{" "}
                    {quoteLineItems.length === 1 ? "produto" : "produtos"}
                  </span>
                </div>
                <div className="space-y-2">
                  {quoteLineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{item.productName}</p>
                        <p className="text-xs text-slate-500">
                          {formatQuoteQuantity(item.quantity)} • R${" "}
                          {Number(item.unitPrice || 0).toFixed(2)} cada
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">
                          R$ {Number(item.grossSale || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeQuoteLineItem(item.id)}
                          className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100"
                          title="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-dashed border-amber-300 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">
                  Itens deste orçamento
                </h3>
                <p className="text-sm font-semibold text-amber-900">
                  Nenhum produto adicionado ainda.
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Próximo passo: selecione um produto e clique em{" "}
                  <strong>Adicionar produto</strong>.
                </p>
              </div>
            )}

            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                Aplicar Desconto ao Cliente
              </label>
              <div className="grid grid-cols-2 gap-4">
                <InputGroup
                  label="Desconto Fixo (R$)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={saleDiscountFixed}
                  onChange={setSaleDiscountFixed}
                  prefix="R$"
                  placeholder="0.00"
                />
                <InputGroup
                  label="Desconto (%)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={saleDiscountPercent}
                  onChange={setSaleDiscountPercent}
                  suffix="%"
                  placeholder="0"
                />
              </div>
            </div>

            {currentDocumentData && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">
                  Resumo da Proposta
                </h3>
                {currentDocumentData.items.length > 1 && (
                  <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">
                      {currentDocumentData.items.length} itens neste orçamento:
                    </span>{" "}
                    {currentDocumentData.items
                      .map(
                        (item) =>
                          `${item.productName} (${formatQuoteQuantity(item.quantity)})`,
                      )
                      .join(" • ")}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-bold text-slate-800">
                      R$ {Number(currentDocumentData.grossSale || 0).toFixed(2)}
                    </span>
                  </div>
                  {currentDocumentData.discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Desconto Aplicado:</span>
                      <span className="font-bold text-red-500">
                        - R$ {Number(currentDocumentData.discountTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Valor Final:</span>
                    <span className="font-bold text-green-600">
                      R$ {Number(currentDocumentData.netSale || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between text-lg">
                    <span className="font-bold text-slate-800">TOTAL A PAGAR:</span>
                    <span className="font-black text-amber-600">
                      R$ {Number(currentDocumentData.netSale || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {isPremium ? (
                <button
                  onClick={generateQuotePDF}
                  disabled={!currentDocumentData}
                  className={`py-4 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2 ${
                    !currentDocumentData
                      ? "bg-slate-300"
                      : docType === "orcamento"
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  <FileText size={20} />
                  Baixar {docType === "orcamento" ? "Orçamento" : "Recibo"} em PDF
                </button>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-start gap-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold">PDF disponível no Premium</p>
                    <p className="text-amber-800">
                      Você ainda pode salvar orçamentos pendentes e concluir
                      vendas. Para baixar orçamento ou recibo em PDF, use o plano
                      Premium.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={saveQuote}
                  disabled={!currentDocumentData}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition-all flex justify-center items-center gap-2 text-sm"
                >
                  <Save size={18} />
                  {activeQuoteId ? "Atualizar Orçamento" : "Salvar Pendente"}
                </button>
                <button
                  onClick={registerSale}
                  disabled={!currentDocumentData}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow transition-all flex justify-center items-center gap-2 text-sm"
                >
                  <ShoppingBag size={18} />
                  Concluir Venda (Baixa Estoque)
                </button>
              </div>

              {activeQuoteId && (
                <button
                  onClick={resetSalesForm}
                  className="text-xs text-slate-500 hover:text-slate-700 underline text-center mt-2"
                >
                  Cancelar Edição de Orçamento
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={20} className="text-slate-500" />
          <h3 className="font-bold text-lg text-slate-700">
            Orçamentos Pendentes
          </h3>
        </div>
        {quoteItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
              <thead className="bg-slate-50 uppercase text-xs font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Nº Doc</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Produto</th>
                  <th className="p-3 text-center">Qtd</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quoteItems.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-amber-700">
                      {quote.quoteNumber}
                    </td>
                    <td className="p-3">{formatDocumentDate(quote.date || "")}</td>
                    <td className="p-3 font-medium text-slate-800">
                      {quote.clientName || "-"}
                    </td>
                    <td className="p-3">{quote.productName}</td>
                    <td className="p-3 text-center font-bold">{quote.quantity}</td>
                    <td className="p-3 text-right font-bold text-green-700">
                      R$ {Number(quote.netSale).toFixed(2)}
                    </td>
                    <td className="p-3 flex justify-center gap-2">
                      <button
                        onClick={() => loadQuote(quote)}
                        className="text-blue-600 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <Upload size={16} />
                      </button>
                      <button
                        onClick={() => deleteQuote(quote.id)}
                        className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Você ainda não tem orçamentos pendentes.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Preencha os dados acima e clique em <strong>Salvar Pendente</strong> para registrar o primeiro orçamento.
            </p>
          </div>
        )}
      </Card>

      {currentDocumentData && (
        <div
          id="pdf-container"
          style={{
            position: "fixed",
            top: "-10000px",
            left: "-10000px",
            zIndex: -9999,
          }}
        >
          <div
            id="quote-receipt"
            style={{
              width: "794px",
              minHeight: "1123px",
              backgroundColor: "#ffffff",
              fontFamily: "Arial, Helvetica, sans-serif",
              padding: "0",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                height: "16px",
                backgroundColor: docType === "orcamento" ? "#d97706" : "#15803d",
                width: "100%",
              }}
            />

            <div
              style={{
                padding: "40px 50px",
                display: "flex",
                flexDirection: "column",
                flex: 1,
              }}
            >
              <div>
              <table
                className="pdf-avoid-break"
                style={{
                  width: "100%",
                  borderBottom: "2px solid #f1f5f9",
                  paddingBottom: "20px",
                  marginBottom: "30px",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ width: "60%", verticalAlign: "middle" }}>
                      <table style={{ borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ paddingRight: "20px" }}>
                              <img
                                src={
                                  isPremium && config.userLogo
                                    ? config.userLogo
                                    : DEFAULT_STORE_LOGO
                                }
                                alt="Logo"
                                style={{
                                  maxWidth: "100px",
                                  maxHeight: "70px",
                                  width: "auto",
                                  height: "auto",
                                }}
                                crossOrigin={
                                  isPremium &&
                                  config.userLogo &&
                                  config.userLogo.startsWith("data:")
                                    ? undefined
                                    : "anonymous"
                                }
                              />
                            </td>
                            <td
                              style={{
                                borderLeft: "2px solid #e2e8f0",
                                paddingLeft: "20px",
                              }}
                            >
                              <h2
                                style={{
                                  fontSize: "24px",
                                  fontWeight: "900",
                                  color: "#1e293b",
                                  margin: "0 0 4px 0",
                                  letterSpacing: "1px",
                                }}
                              >
                                {config.storeName || "Calcula Artesão"}
                              </h2>
                              <p
                                style={{
                                  fontSize: "13px",
                                  color: "#64748b",
                                  margin: "0 0 2px 0",
                                }}
                              >
                                {config.storeSubtitle ||
                                  "Orçamentos claros. Clientes seguros. Negócios fechados."}
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td
                      style={{
                        width: "40%",
                        verticalAlign: "middle",
                        textAlign: "right",
                      }}
                    >
                      <h1
                        style={{
                          fontSize: "32px",
                          fontWeight: "900",
                          color: docType === "orcamento" ? "#d97706" : "#15803d",
                          textTransform: "uppercase",
                          letterSpacing: "2px",
                          margin: "0 0 10px 0",
                        }}
                      >
                        {docType === "orcamento" ? "Orçamento" : "Recibo"}
                      </h1>
                      <table
                        style={{
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "6px",
                          width: docType === "orcamento" ? "230px" : "200px",
                          marginLeft: "auto",
                          borderCollapse: "separate",
                          borderSpacing: 0,
                        }}
                      >
                        <tbody>
                          <tr>
                            <td
                              style={{
                                padding: "10px 15px 5px 15px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#475569",
                                textAlign: "left",
                              }}
                            >
                              Data:
                            </td>
                            <td
                              style={{
                                padding: "10px 15px 5px 15px",
                                fontSize: "12px",
                                color: "#334155",
                                fontWeight: "bold",
                                textAlign: "right",
                              }}
                            >
                              {formattedSaleDate}
                            </td>
                          </tr>
                          <tr>
                            <td
                              style={{
                                padding:
                                  docType === "orcamento"
                                    ? "5px 15px"
                                    : "5px 15px 10px 15px",
                                fontSize: "12px",
                                fontWeight: "bold",
                                color: "#475569",
                                textAlign: "left",
                              }}
                            >
                              Nº Doc:
                            </td>
                            <td
                              style={{
                                padding:
                                  docType === "orcamento"
                                    ? "5px 15px"
                                    : "5px 15px 10px 15px",
                                fontSize: "12px",
                                color: "#334155",
                                fontWeight: "bold",
                                textAlign: "right",
                              }}
                            >
                              {quoteNumber}
                            </td>
                          </tr>
                          {docType === "orcamento" && (
                            <tr>
                              <td
                                style={{
                                  padding: "5px 15px 10px 15px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  color: "#92400e",
                                  textAlign: "left",
                                }}
                              >
                                Validade:
                              </td>
                              <td
                                style={{
                                  padding: "5px 15px 10px 15px",
                                  fontSize: "12px",
                                  color: "#b45309",
                                  fontWeight: "bold",
                                  textAlign: "right",
                                }}
                              >
                                {quoteValidityLabel}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                className="pdf-avoid-break"
                style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "40px",
                }}
              >
                <h3
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    margin: "0 0 15px 0",
                  }}
                >
                  Preparado Para:
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          width: "50%",
                          borderBottom: "1px solid #cbd5e1",
                          paddingBottom: "4px",
                          paddingRight: "20px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Nome:
                        </span>
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#1e293b",
                          }}
                        >
                          {clientName || "__________________________________"}
                        </span>
                      </td>
                      <td
                        style={{
                          width: "50%",
                          borderBottom: "1px solid #cbd5e1",
                          paddingBottom: "4px",
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          Telefone:
                        </span>
                        <span
                          style={{
                            marginLeft: "10px",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#1e293b",
                          }}
                        >
                          {clientPhone || "______________________"}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <table
                className="pdf-avoid-break"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "30px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        backgroundColor:
                          docType === "orcamento" ? "#d97706" : "#15803d",
                        color: "white",
                        padding: "14px 15px",
                        textAlign: "left",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Descrição do Serviço / Produto
                    </th>
                    <th
                      style={{
                        backgroundColor:
                          docType === "orcamento" ? "#d97706" : "#15803d",
                        color: "white",
                        padding: "14px 15px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Qtd.
                    </th>
                    <th
                      style={{
                        backgroundColor:
                          docType === "orcamento" ? "#d97706" : "#15803d",
                        color: "white",
                        padding: "14px 15px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Valor Unit.
                    </th>
                    <th
                      style={{
                        backgroundColor:
                          docType === "orcamento" ? "#d97706" : "#15803d",
                        color: "white",
                        padding: "14px 15px",
                        textAlign: "right",
                        fontSize: "13px",
                        fontWeight: "bold",
                        textTransform: "uppercase",
                      }}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentDocumentData.items.map((item) => (
                    <tr key={item.id}>
                      <td
                        style={{
                          padding: "20px 15px",
                          borderBottom: "2px solid #f1f5f9",
                          fontSize: "16px",
                          fontWeight: "bold",
                          color: "#1e293b",
                        }}
                      >
                        {item.productName || "Produto Sem Nome"}
                      </td>
                      <td
                        style={{
                          padding: "20px 15px",
                          borderBottom: "2px solid #f1f5f9",
                          fontSize: "16px",
                          textAlign: "center",
                          color: "#475569",
                        }}
                      >
                        {docType === "orcamento"
                          ? formatQuoteQuantity(item.quantity)
                          : `${item.quantity}x`}
                      </td>
                      <td
                        style={{
                          padding: "20px 15px",
                          borderBottom: "2px solid #f1f5f9",
                          fontSize: "16px",
                          textAlign: "right",
                          color: "#475569",
                        }}
                      >
                        R$ {Number(item.unitPrice || 0).toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: "20px 15px",
                          borderBottom: "2px solid #f1f5f9",
                          fontSize: "16px",
                          textAlign: "right",
                          fontWeight: "bold",
                          color: docType === "orcamento" ? "#d97706" : "#15803d",
                        }}
                      >
                        R$ {Number(item.grossSale || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <table style={{ width: "100%", marginBottom: "50px" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "50%" }} />
                    <td style={{ width: "50%" }}>
                      <div
                        className="pdf-avoid-break"
                        style={{
                          padding: "0 15px 15px 15px",
                          borderBottom: "1px solid #e2e8f0",
                          marginBottom: "15px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            color: "#475569",
                            marginBottom: "8px",
                          }}
                        >
                          <span>Subtotal:</span>
                          <span style={{ fontWeight: "bold", color: "#1e293b" }}>
                            R$ {Number(currentDocumentData.grossSale || 0).toFixed(2)}
                          </span>
                        </div>
                        {Number(currentDocumentData.discountTotal || 0) > 0 && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "14px",
                              color: "#ef4444",
                              fontWeight: "600",
                            }}
                          >
                            <span>Desconto Aplicado:</span>
                            <span>
                              - R${" "}
                              {Number(currentDocumentData.discountTotal || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div
                        className="pdf-avoid-break"
                        style={{
                          backgroundColor:
                            docType === "orcamento" ? "#fffbeb" : "#f0fdf4",
                          border: `2px solid ${
                            docType === "orcamento" ? "#fde68a" : "#bbf7d0"
                          }`,
                          borderRadius: "8px",
                          padding: "15px 20px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: "900",
                            color: docType === "orcamento" ? "#92400e" : "#166534",
                            textTransform: "uppercase",
                          }}
                        >
                          {docType === "orcamento" ? "Total a Pagar:" : "Total Pago:"}
                        </span>
                        <span
                          style={{
                            fontSize: "24px",
                            fontWeight: "900",
                            color: docType === "orcamento" ? "#d97706" : "#15803d",
                          }}
                        >
                          R$ {Number(currentDocumentData.netSale || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              </div>

              <div
                className="pdf-avoid-break"
                style={{
                  marginTop: "auto",
                  paddingTop: "20px",
                }}
              >
              <table
                style={{
                  width: "100%",
                  borderTop: "2px solid #f1f5f9",
                  paddingTop: "20px",
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        width: "60%",
                        verticalAlign: "top",
                        paddingTop: "20px",
                        paddingRight: "24px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#475569",
                          margin: "0 0 10px 0",
                          textTransform: "uppercase",
                        }}
                      >
                        {docType === "orcamento"
                          ? "Condições do Orçamento:"
                          : "Declaração de Recebimento:"}
                      </p>

                      {docType === "orcamento" ? (
                        <div>
                          {quoteConditionRows.map((row) => (
                            <p
                              key={row.label}
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                margin: "0 0 6px 0",
                                lineHeight: "1.45",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color: "#334155",
                                }}
                              >
                                {row.label}:
                              </span>{" "}
                              {row.value}
                            </p>
                          ))}

                          {hasQuoteNotes && (
                            <div style={{ marginTop: "10px" }}>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#334155",
                                  margin: "0 0 4px 0",
                                  fontWeight: "bold",
                                }}
                              >
                                Observações:
                              </p>
                              <p
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  margin: 0,
                                  lineHeight: "1.45",
                                  whiteSpace: "pre-line",
                                }}
                              >
                                {resolvedQuoteConfig.quoteNotesText}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              margin: "0 0 5px 0",
                              lineHeight: "1.4",
                            }}
                          >
                            • Confirmamos o recebimento do valor referente aos
                            produtos.
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "#64748b",
                              margin: "0",
                              lineHeight: "1.4",
                            }}
                          >
                            • Damos plena e geral quitação referente a este lote.
                          </p>
                        </>
                      )}
                    </td>

                    <td
                      style={{
                        width: "40%",
                        verticalAlign: "bottom",
                        textAlign: "center",
                        paddingLeft: "24px",
                        paddingTop: "20px",
                      }}
                    >
                      {docType === "orcamento" && quoteContactRows.length > 0 && (
                        <div
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            backgroundColor: "#f8fafc",
                            padding: "12px 14px",
                            marginBottom: "18px",
                            textAlign: "left",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: "bold",
                              color: "#475569",
                              margin: "0 0 8px 0",
                              textTransform: "uppercase",
                            }}
                          >
                            Contato
                          </p>
                          {quoteContactRows.map((row) => (
                            <p
                              key={row.label}
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                margin: "0 0 5px 0",
                                lineHeight: "1.4",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color: "#334155",
                                }}
                              >
                                {row.label}:
                              </span>{" "}
                              {row.value}
                            </p>
                          ))}
                        </div>
                      )}

                      <div
                        style={{
                          borderTop: "1px solid #94a3b8",
                          paddingTop: "10px",
                          marginTop: "20px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: "bold",
                            color: "#1e293b",
                            margin: "0 0 2px 0",
                          }}
                        >
                          {config.storeName || "Calcula Artesão"}
                        </p>
                        <p
                          style={{
                            fontSize: "10px",
                            color: "#64748b",
                            margin: "0",
                          }}
                        >
                          Responsável Comercial
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: "center", marginTop: "30px" }}>
                <p
                  style={{
                    fontSize: "10px",
                    fontStyle: "italic",
                    color: "#94a3b8",
                    margin: 0,
                  }}
                >
                  Obrigado pela preferência! Gerado pela Calcula Artesão.
                  Orçamentos claros. Clientes seguros. Negócios fechados.
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
