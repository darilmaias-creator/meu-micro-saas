# Checklist: Teste Completo de Pagamento Live

Use este roteiro quando for validar cobranca real da Stripe em producao com uma conta nova.

## Antes de testar

- Confirmar que `NEXTAUTH_URL` esta em `https://calculaartesao.com.br`
- Confirmar que `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_FOUNDER` e `STRIPE_PRICE_ID_STANDARD` sao da conta `live`
- Confirmar que o webhook live da Stripe aponta para `https://calculaartesao.com.br/api/stripe/webhook`
- Confirmar que o login por Google, login por e-mail e recuperacao de senha estao funcionando
- Testar em aba anonima para evitar sessao antiga

## Conta de teste live

- Criar uma conta nova no app
- Usar um e-mail que nunca tenha assinado o Premium nessa base
- Confirmar que a conta inicia como plano `free`

## Fluxo de compra

1. Entrar com a conta nova
2. Abrir o checkout do Premium
3. Concluir um pagamento real
4. Conferir se a pagina de sucesso aparece sem erro
5. Confirmar se o perfil mostra o selo Premium
6. Abrir o portal da assinatura para validar que a Stripe reconheceu a conta

## O que conferir no banco logo depois da compra

Na tabela `public.auth_users`, para o usuario testado, conferir:

- `plan = 'premium'`
- `stripe_customer_id` preenchido
- `stripe_subscription_id` preenchido
- `stripe_subscription_status` com status ativo
- `stripe_price_id` preenchido
- `premium_activated_at` preenchido

## O que conferir nos logs

- Vercel: procurar por `billing:checkout`, `billing:confirm`, `stripe:webhook`
- Stripe: conferir se o evento `checkout.session.completed` chegou
- Stripe: conferir se `customer.subscription.created` ou `customer.subscription.updated` chegou

## Fluxo de cancelamento / reembolso controlado

1. Abrir o perfil da conta teste
2. Acionar o fluxo de reembolso dentro da janela valida
3. Confirmar o texto exibido ao usuario
4. Conferir se a assinatura foi encerrada
5. Conferir se o plano voltou para `free`
6. Confirmar no banco que os campos de assinatura foram atualizados

## O que conferir no banco depois do reembolso

- `plan = 'free'`
- `stripe_subscription_status` refletindo assinatura encerrada
- `stripe_current_period_end` limpo quando aplicavel
- `premium_activated_at` limpo
- `founder_offer_revoked_at` preenchido se a conta tinha o beneficio founder

## Resultado esperado

O teste live so deve ser considerado fechado quando:

- a compra sobe para Premium sem ajuste manual
- o webhook sincroniza o estado sem erro
- o reembolso/cancelamento funciona do inicio ao fim
- o banco reflete o estado final corretamente
