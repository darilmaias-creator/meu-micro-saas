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
- Validação central do payload de dados do app antes de salvar no Supabase.
- Sanitização de output para avisos globais, e-mails e URLs exibidas ao usuário.
- Proteção contra SQL injection por uso de Supabase query builder e ausência de SQL bruto com entrada do usuário.
- Hash de senha no fluxo de credenciais.
- Criptografia utilitária para dados sensíveis em repouso com AES-256-GCM.
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
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` calibrada para Next, Stripe, Sentry, Supabase, Gemini e imagens externas usadas pelo app
  - `Permissions-Policy`
  - `Strict-Transport-Security` em HTTPS
- Remoção do header `X-Powered-By`.
- Redirecionamento obrigatório de HTTP para HTTPS em produção via `proxy.ts`.
- Limpeza automática de logs temporários e rate limits antigos.

### Parcialmente Implementado

- Verificação de e-mail já possui rotas de envio/confirmação, mas ainda não bloqueia acesso antes da confirmação.
- Proteção contra abuso existe em autenticação, mas ainda precisa ser ampliada para outras APIs públicas ou caras, como IA e marketing.
- Validação de payload existe em vários endpoints, mas ainda deve ser padronizada em todos os fluxos.
- Observabilidade existe, mas ainda precisa de alertas operacionais mais claros para falhas críticas.

### Ainda Pendente

- Autenticação de dois fatores real para Premium com TOTP ou provedor dedicado.
- Bloqueio ou limitação de acesso a dados enquanto e-mail não estiver verificado.
- Rate limit para endpoints de IA, marketing, checkout e anúncios.
- Checklist de permissões por papel, especialmente admin.
- Auditoria de exposição de dados em logs.
- Revisão das regras Supabase/RLS ou equivalente de isolamento por usuário.
- Testes de segurança automatizados básicos para endpoints críticos.

## Decisão Técnica Desta Etapa

Nesta etapa foi aplicada uma camada inicial de headers de segurança no `next.config.ts`.

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

## Parte 3: Proteção de Dados

### 3.1 Dados em Trânsito

| Item | Status | Implementação |
| --- | --- | --- |
| HTTPS obrigatório em produção | Implementado | `proxy.ts` redireciona HTTP para HTTPS com status 301 |
| HSTS | Implementado | `Strict-Transport-Security` em `next.config.ts` |
| Anti MIME sniffing | Implementado | `X-Content-Type-Options: nosniff` |
| Proteção contra clickjacking | Implementado | `X-Frame-Options: DENY` e `frame-ancestors 'none'` na CSP |
| Referrer Policy | Implementado | `Referrer-Policy: strict-origin-when-cross-origin` |
| Permissions Policy | Implementado | Bloqueia camera, microfone e geolocalização por padrão |
| Content Security Policy | Implementado | Permite apenas origens necessárias para Next, Stripe, Sentry, Supabase, Gemini e imagens externas do app |

### Observação Sobre CSP

A CSP foi configurada de forma compatível com o checkout embutido da Stripe e com recursos reais do app. Uma política mais rígida com nonce por request pode ser aplicada em uma etapa futura, mas precisa de testes específicos para não bloquear scripts internos do Next ou o checkout.

### 3.2 Dados em Repouso

| Item | Status | Implementação |
| --- | --- | --- |
| Hashing de senhas | Implementado | `lib/auth/password.ts` usa `scrypt`, salt aleatório e `timingSafeEqual` |
| Criptografia de dados sensíveis | Implementado | `lib/crypto.ts` com AES-256-GCM e chave `ENCRYPTION_KEY` |
| Retenção de logs | Implementado | `app/api/cron/cleanup-old-logs/route.ts` remove registros com mais de 90 dias |
| Agendamento da limpeza | Implementado | `vercel.json` agenda `/api/cron/cleanup-old-logs` diariamente |
| Estrutura para logs de acesso | Implementado | `public.access_logs` em `supabase/schema.sql` |

### Observação Sobre Criptografia

A função de criptografia está pronta para campos sensíveis como telefone de cliente, CPF, dados bancários ou informações confidenciais de negócio. Ela não deve ser usada em senha, porque senha precisa de hash irreversível, não criptografia reversível.

Para ativar a criptografia em produção, configure `ENCRYPTION_KEY` na Vercel com 32 bytes em hexadecimal. Um valor válido tem 64 caracteres.

## Parte 4: Validação e Sanitização

### 4.1 Validação de Input

| Item | Status | Implementação |
| --- | --- | --- |
| Validação de dados do app | Implementado | `lib/validation.ts` valida `config`, `insumos`, `savedProducts`, `sales` e `quotes` |
| Bloqueio de payload inválido | Implementado | `app/api/app-data/route.ts` retorna `400 INVALID_APP_DATA` antes de salvar |
| Limite contra payload abusivo | Implementado | Valida tamanho de arrays, quantidade de campos, profundidade e tamanho de textos |
| Validação numérica | Implementado | Bloqueia `Infinity`, `NaN`, valores negativos indevidos e números acima do limite seguro |
| Validação de tipos conhecidos | Implementado | Bloqueia tipos inválidos de insumo, modo de custo operacional e tipo de custo customizado |

### Observação Sobre Biblioteca

O projeto ainda não usa `zod`, então a validação desta etapa foi implementada sem adicionar dependência nova. Se o app passar a usar schemas compartilhados no frontend e backend, `zod` pode entrar em uma etapa futura.

### 4.2 Sanitização de Output

| Item | Status | Implementação |
| --- | --- | --- |
| Escape de HTML | Implementado | `lib/sanitize.ts` expõe `escapeHTML` para e-mails e HTML gerado no servidor |
| Sanitização de HTML simples | Implementado | `sanitizeHTML` remove scripts, estilos, handlers `on*` e URLs `javascript:`/`data:` |
| Sanitização de texto | Implementado | `sanitizePlainText` remove caracteres de controle e limita tamanho quando informado |
| Sanitização de URL | Implementado | `sanitizeUrl` permite apenas caminhos internos seguros, `http` e `https` |
| Avisos globais | Implementado | `lib/announcements/rules.ts` e `lib/announcements/message-content.ts` sanitizam texto, imagem e CTA |
| E-mails de aviso | Implementado | `lib/announcements/email.ts` escapa dados antes de montar HTML |

### Observação Sobre React

Textos renderizados com `{valor}` em componentes React já são escapados pelo React por padrão. A sanitização desta etapa protege principalmente os pontos onde o app interpreta links/imagens de avisos e monta HTML de e-mail.

### 4.3 Proteção Contra SQL Injection

| Item | Status | Implementação |
| --- | --- | --- |
| Query builder Supabase | Implementado | Consultas usam `.from(...).select(...).eq(...)`, `.insert(...)`, `.update(...)`, `.delete(...)` e `.upsert(...)` |
| SQL bruto com interpolação | Verificado | Não foi encontrado `db.query`, template SQL ou concatenação de `SELECT/INSERT/UPDATE/DELETE` com input do usuário |
| Nome de tabela variável | Protegido | `app/api/cron/cleanup-old-logs/route.ts` usa allowlist tipada para tabelas/colunas permitidas |
| Filtros com input do usuário | Implementado | Filtros usam métodos Supabase como `.eq(...)`, sem montar SQL manual |

### Observação Sobre Supabase

O Supabase client envia filtros e valores pela API do PostgREST, sem concatenar SQL manual dentro do app. A regra continua sendo: se no futuro entrar SQL bruto, ele deve usar função segura, RPC validada ou prepared statement, nunca template string com valor vindo do usuário.
