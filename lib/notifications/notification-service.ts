import type { GenericRecord } from "@/lib/app-data/defaults";

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

const lowStockNoticeKey = "notification.low-stock.signature";
const pendingQuotesNoticeKey = "notification.pending-quotes.signature";

function getStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStoredSignature(key: string) {
  return getStorage()?.getItem(key) ?? null;
}

function saveStoredSignature(key: string, signature: string) {
  getStorage()?.setItem(key, signature);
}

function clearStoredSignature(key: string) {
  getStorage()?.removeItem(key);
}

function notify(title: string, body: string, targetPath?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "granted") {
    const n = new Notification(title, {
      body,
      icon: "/icon.png",
      tag: title,
    });

    n.onclick = (event) => {
      event.preventDefault();
      n.close();

      if (targetPath) {
        window.focus();
        window.location.assign(targetPath);
      }
    };
  }
}

function getLowStockItems(items: GenericRecord[] | undefined) {
  return (items ?? []).filter((item) => {
    const stock = toNumber(item.stock);
    const minStock = toNumber(item.minStock);
    return stock <= minStock;
  });
}

function getLowStockSignature(items: GenericRecord[] | undefined) {
  const lowStockItems = getLowStockItems(items);

  return lowStockItems
    .map((item) => `${String(item.id ?? "" )}|${String(item.name ?? "")}|${toNumber(item.stock)}|${toNumber(item.minStock)}`)
    .sort()
    .join(";");
}

function getPendingQuotes(quotes: GenericRecord[] | undefined) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return (quotes ?? []).filter((quote) => {
    const status = String(quote.status ?? "").toLowerCase();
    if (status !== "pendente") {
      return false;
    }

    const rawDate =
      typeof quote.date === "string"
        ? quote.date
        : typeof quote.createdAt === "string"
          ? quote.createdAt
          : typeof quote.created_at === "string"
            ? quote.created_at
            : "";

    if (!rawDate) {
      return false;
    }

    const parsedDate = new Date(
      rawDate.includes("T") ? rawDate : `${rawDate}T00:00:00`,
    );

    return (
      Number.isFinite(parsedDate.getTime()) &&
      parsedDate.getTime() <= sevenDaysAgo
    );
  });
}

function getPendingQuotesSignature(quotes: GenericRecord[] | undefined) {
  const pendingQuotes = getPendingQuotes(quotes);

  return pendingQuotes
    .map((quote) => `${String(quote.id ?? "")} | ${String(quote.date ?? quote.createdAt ?? quote.created_at ?? "")}`)
    .sort()
    .join(";");
}

export async function checkAndNotifyLowStock(items: GenericRecord[] | undefined) {
  const lowStockItems = getLowStockItems(items);
  const signature = getLowStockSignature(items);

  if (lowStockItems.length === 0) {
    clearStoredSignature(lowStockNoticeKey);
    return;
  }

  if (readStoredSignature(lowStockNoticeKey) === signature) {
    return;
  }

  notify(
    "Estoque Baixo",
    String(lowStockItems.length) + " insumo(s) com estoque no nivel de aviso ou abaixo.",
    "/estoque",
  );
  saveStoredSignature(lowStockNoticeKey, signature);
}

export async function checkAndNotifyPendingQuotes(quotes: GenericRecord[] | undefined) {
  const pendingQuotes = getPendingQuotes(quotes);
  const signature = getPendingQuotesSignature(quotes);

  if (pendingQuotes.length === 0) {
    clearStoredSignature(pendingQuotesNoticeKey);
    return;
  }

  if (readStoredSignature(pendingQuotesNoticeKey) === signature) {
    return;
  }

  notify(
    "Orcamentos Pendentes",
    String(pendingQuotes.length) + " orcamento(s) aguardando resposta ha mais de 7 dias.",
    "/vendas",
  );
  saveStoredSignature(pendingQuotesNoticeKey, signature);
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!("Notification" in window)) {
    console.log("Browser nao suporta notificacoes");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return Notification.permission;
  }

  if (Notification.permission === "denied") {
    return Notification.permission;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notificacoes ativadas");
  }

  return permission;
}
