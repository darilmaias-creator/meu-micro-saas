import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.warn("Supabase env vars not configured - notifications disabled");
    return null;
  }
  
  return createClient(url, key);
}

export async function checkAndNotifyLowStock(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  const { data: insumos } = await supabase
    .from("insumo")
    .select("id, name, estoque_atual, estoque_minimo")
    .eq("user_id", userId)
    .lt("estoque_atual", "estoque_minimo");

  if (!insumos || insumos.length === 0) return;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Estoque Baixo", {
      body: `${insumos.length} insumo(s) com estoque abaixo do mínimo`,
      icon: "/icon.png",
    });
  }
}

export async function checkAndNotifyPendingQuotes(userId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: quotes } = await supabase
    .from("quote")
    .select("id, client_name")
    .eq("user_id", userId)
    .eq("status", "pendente")
    .lt("created_at", sevenDaysAgo.toISOString());

  if (!quotes || quotes.length === 0) return;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Orçamentos Pendentes", {
      body: `${quotes.length} orçamento(s) aguardando resposta`,
      icon: "/icon.png",
    });
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Browser não suporta notificações");
    return;
  }

  if (Notification.permission === "granted") {
    return;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notificações ativadas");
    }
  }
}
