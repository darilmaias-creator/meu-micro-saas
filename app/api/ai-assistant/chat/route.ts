import { detectAssistantIntent, type AssistantIntent } from "@/lib/assistant-intents";

export const dynamic = "force-dynamic";

const RESPONSES: Record<AssistantIntent, string> = {
  HELP_GETTING_STARTED: `Olá! 👋 Bem-vindo!

A calculadora ajuda você a descobrir o preço certo para seus produtos.

Funciona assim:
1. Você adiciona seus materiais na aba Meus Materiais
2. Você cria um produto na aba Calcular Preço
3. Seleciona os materiais, informa tempo, custos e margem
4. A calculadora mostra o custo e o preço sugerido

Qual é o seu tipo de artesanato?`,

  HELP_ADD_MATERIALS: `Perfeito! Para adicionar um material, você precisa de:

📌 **Nome** - Ex: "Fio de Nylon"
💰 **Custo** - Quanto você paga por unidade
📏 **Medida** - A unidade (kg, metro, peça, etc)
📦 **Estoque** - Quanto você tem agora
⚠️ **Estoque Mínimo** - Quando reabastecer

**Dica:** Se você compra 1kg por R$50, o custo é R$50/kg.
Se compra 10 metros por R$100, o custo é R$10/metro.

Qual é o seu material? Vou te ajudar a configurar.`,

  HELP_CALCULATE_COST: `Ótimo! O custo tem 4 partes:

1️⃣ **Custo de Material** - Quanto você gasta em insumos
2️⃣ **Mão de Obra** - Tempo que você leva para fazer
3️⃣ **Custos Operacionais** - Energia, aluguel, etc
4️⃣ **Acabamento** - Embalagem, etiqueta, frete, se aplicável

Depois de preencher esses campos em Calcular Preço, o app mostra o custo total e o preço sugerido.

Qual produto você quer calcular?`,

  HELP_SUGGEST_PRICE: `Excelente pergunta! A fórmula base é:

**Preço = Custo ÷ (1 - Margem)**

Exemplo:
- Custo: R$8
- Margem desejada: 50%
- Preço = 8 ÷ (1 - 0.5) = R$16

Margens comuns:
- Bijuteria: 50-60%
- Costura: 40-50%
- Cerâmica: 60-70%
- Madeira: 50-60%

Qual é seu tipo de artesanato?`,

  HELP_TROUBLESHOOT: `Sem problema! Vou ajudar a resolver.

Pode me descrever o problema? Por exemplo:
- O preço ficou muito alto
- Não consigo adicionar um insumo
- O custo está dobrando
- A margem não faz sentido

Enquanto isso, confira se todos os campos obrigatórios foram preenchidos e se a unidade do material está correta.`,

  HELP_PREMIUM_FEATURES: `Com Premium você ganha:

✅ Insumos ilimitados
✅ Produtos ilimitados
✅ Personalização nos orçamentos
✅ Backup automático
✅ Histórico completo

Se você já chegou perto dos limites do plano grátis, vale testar o Premium para continuar crescendo sem travar o cadastro.`,

  HELP_BEST_PRACTICES: `Aqui vão boas práticas para ganhar mais controle:

1. Atualize seus custos a cada 3 meses
2. Separe produtos populares, premium e promocionais
3. Inclua embalagem, frete e seu tempo no custo
4. Teste pequenos ajustes de preço
5. Foque nos produtos com melhor margem

Qual dessas você quer explorar?`,

  HELP_OPTIMIZE_PRICE: `Vamos otimizar! Você pode trabalhar em 3 frentes:

1. Reduzir custos comprando melhor ou produzindo com menos desperdício
2. Aumentar preço em pequenos testes, como 5% ou 10%
3. Priorizar produtos com margem melhor

Se você já tiver produtos cadastrados, veja o Resumo para comparar margens antes de decidir onde mexer.`,
};

function fallbackResponse() {
  return `Entendi sua dúvida. Posso te orientar sobre cadastro de insumos, criação de produto, margem, custos, orçamento e Premium.

Se quiser um caminho guiado, pergunte: "Como eu começo?"`;
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { response: "Não consegui ler sua mensagem. Tente enviar novamente." },
      { status: 400 },
    );
  }

  const message =
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
      ? payload.message.trim()
      : "";

  if (!message) {
    return Response.json(
      { response: "Digite uma pergunta para eu conseguir ajudar." },
      { status: 400 },
    );
  }

  const intent = detectAssistantIntent(message);

  return Response.json({
    intent,
    response: intent ? RESPONSES[intent] : fallbackResponse(),
  });
}
