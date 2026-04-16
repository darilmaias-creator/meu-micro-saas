# Checklist: Suporte e Operacao

Este guia reduz retrabalho quando surgir pedido de suporte em autenticacao, Premium, reembolso ou backup.

## 1. Troca de senha

- Confirmar se a conta existe em `public.auth_users`
- Confirmar se `password_hash` esta preenchido para contas por e-mail e senha
- Pedir para o usuario testar `Esqueci minha senha`
- Conferir logs de `auth:forgot-password` e `auth:reset-password`
- Se o e-mail nao chegar, conferir logs da Resend e pasta spam

## 2. Premium manual

Quando a conta precisa virar Premium manualmente por decisao interna:

- localizar o usuario pelo e-mail
- atualizar `plan = 'premium'`
- preencher `premium_activated_at`
- manter campos da Stripe nulos se nao existe cobranca real por tras

## 3. Reembolso

- confirmar se a assinatura ainda esta ativa
- confirmar se a conta esta dentro da janela de reembolso
- orientar o usuario a pedir o reembolso dentro do app quando possivel
- conferir logs `billing:refund`
- conferir na Stripe se o refund foi criado
- confirmar no banco se o plano voltou para `free`

## 4. Cancelamento

- conferir se a conta possui `stripe_customer_id` e `stripe_subscription_id`
- abrir o portal da assinatura ou acionar o cancelamento na Stripe
- conferir logs `billing:portal` e `stripe:webhook`
- validar se o status da assinatura foi sincronizado no banco

## 5. Backup e restauracao

- orientar o usuario a exportar backup antes de trocar de conta ou dispositivo
- conferir se o e-mail de backup esta correto
- conferir logs `account:backup-email`, `cron:backup-email`, `app-data:get`, `app-data:put`
- ao restaurar, lembrar que login, e-mail e senha nao mudam junto com o arquivo

## 6. O que buscar nos logs

- Auth:
  - `auth:credentials-login`
  - `auth:credentials-rate-limit`
  - `auth:forgot-password`
  - `auth:reset-password`
  - `auth:route-handler`
- Billing:
  - `billing:checkout`
  - `billing:confirm`
  - `billing:portal`
  - `billing:refund`
  - `stripe:webhook`
- Backup/e-mail:
  - `account:backup-email`
  - `cron:backup-email`

## 7. Regra operacional importante

Antes de qualquer ajuste manual em conta:

- tirar print do estado atual
- anotar e-mail e `user_id`
- registrar o motivo do ajuste
- confirmar o resultado no banco depois da acao
