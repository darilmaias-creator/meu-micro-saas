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

## Politica de precificacao de entregas

O modulo de entregas nao deve nascer com uma tabela nacional unica.

A recomendacao e trabalhar com precificacao variavel por cidade e por faixa operacional.

### Principio principal

O valor interno da entrega deve variar conforme:

- cidade
- CEP de origem e CEP de destino
- distancia estimada
- area de cobertura
- tipo de entrega
- urgencia
- tempo de espera, quando aplicavel

### Modelo recomendado para o inicio

Cada cidade deve ter sua propria configuracao:

- `valor_base`
- `faixas_por_distancia`
- `taxa_de_espera`
- `taxa_de_urgencia`
- `raio_maximo`
- `prazo_estimado`

### Estrutura sugerida de faixas

Exemplo simples:

- ate `3 km`
- de `3 a 6 km`
- de `6 a 10 km`
- acima de `10 km`, sob consulta ou indisponivel

### Regra de calculo sugerida

O sistema pode usar:

- CEP do ponto de coleta
- CEP do destino final
- cidade de origem
- cidade de destino

Com isso, o sistema calcula:

- `valor de repasse do entregador`
- `valor sugerido de entrega para o usuario`
- `prazo estimado`

### O que mostrar para o cliente final

O cliente final nao precisa ver:

- repasse do motoboy
- margem da plataforma
- custo interno detalhado

O cliente final deve ver:

- valor final da entrega, quando houver cobranca
- prazo estimado
- beneficio da entrega com confirmacao

### Linguagem comercial recomendada

O sistema deve vender a entrega como:

- seguranca
- praticidade
- conforto
- confirmacao no recebimento

Mensagem base:

- `Entrega com confirmacao por codigo`
- `Mais seguranca e praticidade para receber sua encomenda`

### Regra importante

Se houver cobranca de entrega ao cliente final, esse valor precisa ser apresentado com clareza no pedido.

## Operacao com Correios e ultima milha

Para envios entre cidades ou estados, o modelo futuro pode usar os Correios como etapa de transporte principal e a rede local como ultima milha.

## Escolhas de recebimento para o cliente final

O cliente final do artesao nao precisa entrar na plataforma, mas deve ter opcoes claras de recebimento no momento da compra.

### Opcoes recomendadas para o futuro

- `entrega por motoboy`
- `retirada nos Correios`

### Quando usar entrega por motoboy

Usar quando:

- houver parceiro local disponivel
- a cidade tiver operacao de ultima milha organizada
- o cliente preferir praticidade e entrega no endereco

Valor percebido para o cliente:

- mais conforto
- menos deslocamento
- confirmacao por codigo no recebimento

### Quando usar retirada nos Correios

Usar quando:

- a cidade nao tiver motoboy parceiro
- a operacao local ainda nao estiver ativa
- o cliente preferir retirar pessoalmente
- a area nao tiver viabilidade operacional de ultima milha

Valor percebido para o cliente:

- previsibilidade
- possibilidade de retirada em agencia
- alternativa segura quando nao houver entrega local

### Regra de apresentacao no pedido

O usuario do SaaS deve conseguir apresentar ao cliente final:

- tipo de recebimento
- prazo estimado
- valor da entrega, quando houver
- observacao de confirmacao por codigo, quando a opcao for motoboy

### Regra recomendada de negocio

O sistema nao deve obrigar o cliente final a escolher motoboy em toda cidade.

Deve haver politica por cidade:

- cidades com `motoboy + retirada`
- cidades com `somente retirada`
- cidades com `somente entrega local`

### Fluxo recomendado

1. usuario produz e embala a encomenda
2. usuario despacha nos Correios
3. sistema registra codigo de rastreio
4. objeto chega na cidade de destino
5. retirada acontece por destinatario ou terceiro autorizado, quando aplicavel
6. parceiro local ou motoboy faz a entrega final
7. cliente confirma com codigo

### Regra operacional importante

Nao assumir desde ja que qualquer motoboy podera simplesmente retirar uma encomenda nos Correios em nome de qualquer pessoa.

Quando a retirada depender de agencia ou ponto de coleta, a operacao futura deve considerar:

- retirada pelo proprio destinatario
- retirada por terceiro autorizado
- eventual uso de Clique e Retire, quando fizer sentido

### Observacao operacional importante

Na fase de implementacao real, assumir que retirada por terceiro nos Correios so entra em fluxo suportado com:

- autorizacao formal do destinatario
- documento do terceiro
- documento do destinatario, conforme exigencia operacional aplicavel

Ou seja:

- a retirada por parceiro local pode ser viavel
- mas deve nascer como fluxo autorizado e documentado
- nunca como retirada livre em nome de qualquer pessoa

### Requisitos de seguranca para esse fluxo

- destinatario precisa estar ciente da retirada por terceiro
- parceiro local precisa estar previamente definido
- retirada precisa ficar registrada no sistema
- entrega final continua dependendo de codigo de confirmacao

### O que validar antes de implementar

- processo real de autorizacao para retirada por terceiros
- quais servicos dos Correios suportam melhor esse fluxo
- prazos de guarda e devolucao
- cidades com operacao suficientemente previsivel para ultima milha

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
