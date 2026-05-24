# Guia de Segurança

Este guia registra as proteções do Calcula Artesão e serve como checklist para as próximas etapas de segurança.

## Parte 1: Visão Geral de Segurança

### O que Proteger

| O quê | Por quê | Impacto |
| --- | --- | --- |
| Dados do usuário | Nome, e-mail, sessão, perfil e preferências | LGPD, confiança e prevenção de acesso indevido |
| Dados de negócio | Insumos, produtos, preços, vendas, lucro e orçamentos | Sigilo comercial e competitividade |
| Dados de pagamento | Assinaturas, customer id, subscription id e eventos Stripe | PCI-DSS, fraude e integridade financeira |
| Sessões | JWT, cookies e estado de autenticação | Acesso não autorizado |
| APIs | Endpoints públicos e autenticados | Abuso, scraping, automação e indisponibilidade |
| Banco de dados | Supabase e dados persistidos | Vazamento, perda ou alteração indevida |

### Pilares

```text
CONFIDENCIALIDADE: dados não são expostos para quem não deve ver.
INTEGRIDADE: dados não são alterados sem autorização.
DISPONIBILIDADE: o serviço continua acessível e resiliente.
```

## Status Atual

### Já Implementado

- Autenticação com NextAuth e sessão JWT.
- Login por credenciais e Google OAuth.
- Proteção de rotas sensíveis por sessão em APIs como app data, billing, perfil, anúncios e IA.
- Rate limit para login, cadastro, esqueci senha e redefinição de senha.
- Validação de e-mail, nome e senha.
- Hash de senha no fluxo de credenciais.
- Recuperação de conta com link seguro, token com hash e validade de 1 hora.
- Envio e confirmação de e-mail com token assinado e validade de 24 horas.
- Validação de assinatura do webhook Stripe.
- Checkout Stripe sem manipular cartão diretamente no app.
- Sincronização de assinatura por webhook e confirmação de checkout.
- Separação de chaves sensíveis em variáveis de ambiente.
- Logs e captura de exceções com Sentry/monitoramento.
- Política de privacidade, termos de uso e política de cancelamento/reembolso.
- Headers globais de proteção:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`
  - `Strict-Transport-Security` em HTTPS
- Remoção do header `X-Powered-By`.

### Parcialmente Implementado

- Verificação de e-mail já possui rotas de envio/confirmação, mas ainda não bloqueia acesso antes da confirmação.
- Proteção contra abuso existe em autenticação, mas ainda precisa ser ampliada para outras APIs públicas ou caras, como IA e marketing.
- Validação de payload existe em vários endpoints, mas ainda deve ser padronizada em todos os fluxos.
- Observabilidade existe, mas ainda precisa de alertas operacionais mais claros para falhas críticas.

### Ainda Pendente

- Política de Content Security Policy calibrada para Next, Stripe, Sentry, Google e imagens externas.
- Autenticação de dois fatores real para Premium com TOTP ou provedor dedicado.
- Bloqueio ou limitação de acesso a dados enquanto e-mail não estiver verificado.
- Rate limit para endpoints de IA, marketing, checkout e anúncios.
- Checklist de permissões por papel, especialmente admin.
- Auditoria de exposição de dados em logs.
- Revisão das regras Supabase/RLS ou equivalente de isolamento por usuário.
- Testes de segurança automatizados básicos para endpoints críticos.

## Decisão Técnica Desta Etapa

Nesta etapa foi aplicada uma camada inicial de headers de segurança no `next.config.ts`.

A CSP completa ficou pendente de propósito, porque uma política rígida sem inventário de domínios pode quebrar:

- Checkout embutido da Stripe.
- Login Google.
- Sentry.
- Scripts internos do Next.
- Imagens externas usadas em banners e perfil.

Ela deve entrar em uma etapa própria, com testes em produção/staging.

## Parte 2: Autenticação e Autorização

### 2.1 Autenticação Segura

| Item | Status | Implementação |
| --- | --- | --- |
| NextAuth com JWT | Implementado | `lib/auth/options.ts` |
| OAuth Google | Implementado | `lib/auth/options.ts` |
| Login por senha com hash | Implementado | `lib/auth/password.ts` e `app/api/auth/register/route.ts` |
| Rate limit em autenticação | Implementado | `lib/auth/rate-limit.ts` |
| Recuperação de senha com token de 1 hora | Implementado | `app/api/auth/forgot-password/route.ts` e `app/api/auth/reset-password/route.ts` |
| Envio de verificação de e-mail | Implementado | Automático no cadastro e manual em `app/api/auth/send-verification-email/route.ts` |
| Confirmação de e-mail | Implementado | `app/api/auth/verify-email/route.ts` |
| Aviso de e-mail não confirmado | Implementado | `app/components/EmailVerificationNotice.tsx` |
| 2FA Premium | Pendente | Requer segredo TOTP, tela de setup, desafio no login e recovery codes |

### Observação Sobre 2FA

2FA não deve ser criado apenas como endpoint vazio. Para ficar seguro de verdade, precisa:

- Gerar segredo TOTP por usuário Premium.
- Mostrar QR Code para Google Authenticator/Authy.
- Validar código antes de ativar.
- Exigir desafio no login quando 2FA estiver ativo.
- Criar códigos de recuperação.
- Registrar eventos de ativação/desativação.

Essa implementação deve entrar em uma etapa própria.
