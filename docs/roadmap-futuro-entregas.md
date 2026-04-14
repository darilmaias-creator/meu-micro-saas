# Roadmap Futuro: Modulo de Entregas

Este documento organiza a ideia do modulo de entregas para um momento futuro, quando o SaaS ja estiver com recorrencia suficiente para sustentar a complexidade nova.

## Regra para iniciar

O modulo de entregas nao deve entrar enquanto o produto principal ainda estiver em fase de validacao inicial.

### Gatilho principal

Comecar a implementacao quando houver aproximadamente:

- `30%` da base ativa em assinatura recorrente paga

### Gatilhos de seguranca recomendados

Antes de sair construindo, confirmar tambem:

- pelo menos `2 ou 3 meses seguidos` com essa taxa perto de `30%`
- suporte do produto principal estabilizado
- fluxo de assinatura, reembolso e premium sem problemas recorrentes
- base suficiente de usuarios que realmente fazem entregas locais ou interestaduais
- demanda real vinda de usuarios, nao so intuicao

## Objetivo do modulo

Criar um sistema interno de entrega para o usuario do SaaS, sem abrir painel, login ou acompanhamento publico para o cliente final.

O cliente final nao acessa a plataforma.

O cliente final apenas:

- recebe um codigo de confirmacao
- informa esse codigo no recebimento

O usuario do SaaS controla tudo por dentro:

- pedido
- despacho
- entrega local
- motoboy
- confirmacao final

## O que o modulo nao deve ser no inicio

Para manter o projeto sob controle, o modulo nao deve nascer como:

- marketplace aberto ao cliente final
- painel publico de rastreio
- app separado para comprador
- integracao complexa com Correios no primeiro momento
- sistema nacional completo de logistica desde o dia 1

## Estrategia de construcao

### Modulo 0: Descoberta e validacao

Objetivo:
- confirmar se entrega e confirmacao realmente aumentam valor para o usuario pagante

Entradas:
- entrevistar usuarios que vendem com entrega
- separar quem entrega localmente e quem envia para outras cidades
- mapear dores reais:
  - organizacao do envio
  - prova de entrega
  - motoboy
  - ultima milha
  - taxa de entrega

Saida esperada:
- lista das dores mais frequentes
- definicao do MVP real do modulo

Quando considerar concluido:
- houver evidencia clara de que o recurso ajudara a vender mais ou reter mais assinantes

### Modulo 1: Entrega com codigo

Objetivo:
- adicionar confirmacao interna de entrega, sem abrir acesso ao cliente final

Entradas:
- tipo de entrega:
  - `retirada`
  - `entrega_local`
  - `envio_outra_cidade`
- codigo unico de confirmacao
- status de entrega
- nome do entregador
- taxa de entrega
- observacoes

Status sugeridos:
- `pedido_criado`
- `em_producao`
- `pronto_para_envio`
- `despachado`
- `saiu_para_entrega`
- `entregue`
- `falha_na_entrega`

Regras:
- a entrega so finaliza quando o codigo for confirmado
- codigo com validade por pedido
- limite de tentativas
- opcao de gerar novo codigo

Nao entra ainda:
- app para motoboy
- painel para cliente final
- integracao com transportadoras

Quando considerar concluido:
- usuario consegue controlar o ciclo inteiro de uma entrega simples dentro do SaaS

### Modulo 2: Despacho e ultima milha

Objetivo:
- permitir que o usuario registre despacho por transportadora ou Correios e conclua a entrega com confirmacao local

Entradas:
- nome da transportadora ou Correios
- codigo de rastreio
- data de despacho
- cidade de destino
- data de chegada prevista
- recebimento na cidade
- saida para entrega local

Fluxo esperado:
1. usuario registra pedido
2. usuario despacha
3. pedido chega na cidade de destino
4. entregador local recebe
5. cliente confirma com codigo

Nao entra ainda:
- API oficial de rastreio
- automacao com status externos

Quando considerar concluido:
- usuario consegue usar o sistema tanto em entrega local quanto em outra cidade, mesmo com lancamento manual dos dados

### Modulo 3: Cadastro de motoboys e parceiros locais

Objetivo:
- permitir operacao local organizada por cidade

Entradas:
- cadastro de motoboys
- cidade de atuacao
- telefone
- status ativo/inativo
- observacoes
- historico de entregas

Funcoes:
- vincular entrega a motoboy
- listar entregas pendentes por cidade
- marcar retirada, saida e entrega

Nao entra ainda:
- app do motoboy
- repasse automatico
- marketplace de corridas

Quando considerar concluido:
- usuario consegue manter uma pequena rede local de entregadores cadastrados

### Modulo 4: Rede interligada entre cidades

Objetivo:
- transformar entregas entre cidades em uma operacao organizada de ponta a ponta

Entradas:
- parceiros por cidade
- roteamento por origem e destino
- recebimento na cidade destino
- redistribuicao para ultima milha

Conceito:
- o usuario despacha
- um parceiro ou motoboy local recebe
- esse parceiro faz a entrega final
- o cliente informa o codigo

Riscos:
- operacao mais complexa
- confianca entre parceiros
- regras de repasse
- responsabilidade por extravio e atraso

Quando considerar concluido:
- houver processo claro entre despacho, recebimento local e entrega final

### Modulo 5: Operacao avancada

Objetivo:
- transformar a rede em um sistema mais maduro e escalavel

Pode entrar no futuro:
- painel do entregador
- aceite de corridas
- foto da entrega
- assinatura no recebimento
- geolocalizacao
- repasses e comissoes
- historico financeiro por parceiro
- SLA por cidade
- relatorios de falha e atraso

Este modulo so deve existir depois que os anteriores estiverem provados em uso real.

## Estrutura sugerida de dados para o futuro

Quando esse trabalho comecar, a modelagem pode nascer em torno de:

- `orders`
- `deliveries`
- `delivery_confirmation_codes`
- `delivery_partners`
- `delivery_events`

Campos importantes em `deliveries`:

- `order_id`
- `user_id`
- `delivery_type`
- `city_origin`
- `city_destination`
- `courier_name`
- `tracking_code`
- `local_partner_id`
- `confirmation_code_hash`
- `status`
- `delivery_fee`
- `shipped_at`
- `received_in_city_at`
- `out_for_delivery_at`
- `delivered_at`
- `confirmed_at`

## Regras de negocio principais

- entrega nao finaliza sem confirmacao
- codigo de confirmacao precisa ser unico por pedido
- codigo nao deve ser salvo em texto puro no longo prazo
- tentativa excessiva de confirmacao deve ser bloqueada
- reenvio de codigo deve ser controlado
- toda mudanca de status importante deve entrar em historico

## KPI para decidir prioridade

Quando chegar a hora de tirar do papel, acompanhar:

- porcentagem de usuarios pagantes que fazem entregas
- quantidade de pedidos com entrega local
- quantidade de pedidos enviados para outra cidade
- pedidos com disputa de recebimento
- usuarios que pedem motoboy ou controle de entrega
- impacto do recurso na retencao do plano premium

## Ordem recomendada de implementacao

1. `Modulo 0` - descoberta e validacao
2. `Modulo 1` - entrega com codigo
3. `Modulo 2` - despacho e ultima milha
4. `Modulo 3` - cadastro de motoboys
5. `Modulo 4` - rede interligada entre cidades
6. `Modulo 5` - operacao avancada

## Criterio de go/no-go

Se a recorrencia ficar abaixo do esperado ou se o produto principal ainda estiver puxando muito suporte, pausar esse roadmap e manter foco no nucleo:

- ficha tecnica
- estoque
- vendas
- premium
- onboarding
- retencao

## Resumo executivo

O modulo de entregas deve nascer como um recurso interno, simples e controlado.

O primeiro valor nao esta em criar um app aberto para o cliente final.

O primeiro valor esta em permitir que o usuario:

- organize a entrega
- tenha prova de recebimento
- use codigo de confirmacao
- controle entrega local e entre cidades

Quando a base recorrente estiver perto de `30%` com estabilidade, esse roadmap pode sair do papel.
