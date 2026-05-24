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
- Proteção de rotas sensíveis por sessão em APIs como app data, billing, perfil, anúncios e IA.
- Rate limit para login, cadastro, esqueci senha e redefinição de senha.
- Validação de e-mail, nome e senha.
- Hash de senha no fluxo de credenciais.
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

- Proteção contra abuso existe em autenticação, mas ainda precisa ser ampliada para outras APIs públicas ou caras, como IA e marketing.
- Validação de payload existe em vários endpoints, mas ainda deve ser padronizada em todos os fluxos.
- Observabilidade existe, mas ainda precisa de alertas operacionais mais claros para falhas críticas.

### Ainda Pendente

- Política de Content Security Policy calibrada para Next, Stripe, Sentry, Google e imagens externas.
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
