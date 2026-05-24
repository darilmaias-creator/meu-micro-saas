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
- Logout automático após 30 minutos de inatividade no cliente.
- Invalidação de sessões antigas após redefinição de senha.
- Login por credenciais e Google OAuth.
- Proteção de rotas sensíveis por sessão em APIs como app data, billing, perfil, anúncios e IA.
- Rate limit para login, cadastro, esqueci senha e redefinição de senha.
- Rate limit por IP para APIs sensíveis como IA, marketing e checkout.
- Proteção contra brute force no login por e-mail e IP, com limpeza no login bem-sucedido.
- CAPTCHA v2 opcional para cadastro e recuperação de senha.
- Aviso de consentimento para cookies essenciais.
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
- Registro persistente de eventos de segurança em `audit_logs`.
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
- Proteção contra abuso existe em autenticação e APIs caras; ainda pode ser ampliada para outras APIs conforme uso real.
- Validação de payload existe em vários endpoints, mas ainda deve ser padronizada em todos os fluxos.
- Observabilidade existe, mas ainda precisa de alertas operacionais mais claros para falhas críticas.

### Ainda Pendente

- Autenticação de dois fatores real para Premium com TOTP ou provedor dedicado.
- Bloqueio ou limitação de acesso a dados enquanto e-mail não estiver verificado.
- Rate limit para anúncios e demais endpoints administrativos conforme volume real.
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

## Parte 5: Rate Limiting e Proteção Contra Abuso

### 5.1 Rate Limiting por IP

| Item | Status | Implementação |
| --- | --- | --- |
| Rate limit geral por IP | Implementado | `lib/rate-limit.ts` usa IP dos headers, hash SHA-256 e janela por ação |
| Persistência | Implementado | `public.api_rate_limits` em `supabase/schema.sql` |
| Assistente IA Gemini | Implementado | `app/api/ai-assistant/gemini/route.ts` limita chamadas ao Gemini |
| IA de marketing | Implementado | `app/api/marketing/generate/route.ts` limita geração de texto |
| Checkout Stripe | Implementado | `app/api/billing/checkout/route.ts` limita criação de sessões de checkout |
| Resposta de bloqueio | Implementado | Retorna `429` com header `Retry-After` |
| Retenção | Implementado | `app/api/cron/cleanup-old-logs/route.ts` limpa rate limits antigos |

### Observação Sobre Redis/Upstash

O guia sugeria Upstash Redis. Nesta implementação, usei Supabase para evitar adicionar uma nova dependência e uma nova conta de infraestrutura. Se o volume crescer muito, a camada `lib/rate-limit.ts` pode ser trocada por Upstash mantendo a mesma chamada nos endpoints.

### 5.2 Proteção Contra Brute Force

| Item | Status | Implementação |
| --- | --- | --- |
| Limite por e-mail no login | Implementado | `lib/auth/rate-limit.ts` bloqueia após 5 tentativas em 15 minutos |
| Limite por IP no login | Implementado | `lib/auth/rate-limit.ts` bloqueia após 15 tentativas em 15 minutos |
| Bloqueio temporário | Implementado | Bloqueio de 15 minutos para tentativas excessivas |
| Limpeza após sucesso | Implementado | `lib/auth/options.ts` chama `clearAuthRateLimit` depois de senha correta |
| Persistência | Implementado | `public.auth_rate_limits` em `supabase/schema.sql` |
| Cadastro e recuperação de senha | Implementado | Também usam `consumeAuthRateLimit` para reduzir abuso |

### Observação Sobre Login

O exemplo do guia usava `Map` em memória. No app, a proteção está mais adequada para produção porque persiste no Supabase quando as variáveis do banco estão configuradas. Assim o limite continua funcionando mesmo em ambiente serverless, onde memória local pode ser recriada entre requisições.

### 5.3 CAPTCHA para Formulários Públicos

| Item | Status | Implementação |
| --- | --- | --- |
| Widget reCAPTCHA v2 checkbox | Implementado | `app/components/RecaptchaField.tsx` carrega o script oficial do Google sem nova dependência |
| Cadastro com CAPTCHA | Implementado | `app/entrar/page.tsx` envia `recaptchaToken` para `/api/auth/register` |
| Recuperação de senha com CAPTCHA | Implementado | `app/entrar/page.tsx` envia `recaptchaToken` para `/api/auth/forgot-password` |
| Validação no servidor | Implementado | `lib/recaptcha.ts` chama `https://www.google.com/recaptcha/api/siteverify` |
| CSP compatível | Implementado | `next.config.ts` permite scripts/frames/conexões necessários do Google reCAPTCHA |
| Modo opcional | Implementado | CAPTCHA só é exigido quando `RECAPTCHA_SECRET_KEY` está configurada no servidor |

### Variáveis Necessárias

Para ativar em produção, configure:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=sua_site_key_publica
RECAPTCHA_SECRET_KEY=sua_secret_key_privada
```

Sem essas variáveis, o app continua funcionando sem exibir CAPTCHA. Isso evita quebrar desenvolvimento local ou deploy antes da configuração das chaves.

O projeto usa reCAPTCHA v2 checkbox. Por isso o usuário vê a caixa "Não sou um robô" no cadastro e na recuperação de senha.

## Parte 6: Backup e Recuperação

### 6.1 Backup Automático

| Item | Status | Implementação |
| --- | --- | --- |
| Backup diário do banco | Implementado | `app/api/cron/backup-database/route.ts` exporta tabelas críticas |
| Agendamento do backup | Implementado | `vercel.json` agenda `/api/cron/backup-database` diariamente às 02:00 UTC |
| Proteção do cron | Implementado | A rota exige `Authorization: Bearer CRON_SECRET` quando `CRON_SECRET` está configurado |
| Criptografia do backup | Implementado | O payload é criptografado com `ENCRYPTION_KEY` via AES-256-GCM antes de salvar |
| Storage privado | Implementado | Salva no bucket privado `DATABASE_BACKUP_BUCKET` ou `database-backups` no Supabase Storage |
| Tabelas exportadas | Implementado | `auth_users`, `audit_logs`, `user_app_data`, `user_testimonials` e `global_announcements` |

### Variáveis Necessárias

Configure na Vercel:

```env
CRON_SECRET=um_token_forte_para_cron
DATABASE_BACKUP_BUCKET=database-backups
ENCRYPTION_KEY=chave_hexadecimal_de_64_caracteres
```

O app também precisa das variáveis Supabase já usadas pelo servidor:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
SUPABASE_SECRET_KEY=sua_service_role_ou_chave_servidor
```

### Observação Sobre Recuperação

Esta etapa cria o arquivo de backup criptografado. A restauração ainda deve ser feita de forma controlada por alguém técnico: baixar o arquivo do Storage, descriptografar com `ENCRYPTION_KEY`, validar o conteúdo e reimportar no Supabase. Uma rota automática de restore não foi criada para evitar risco de sobrescrever dados em produção por engano.

### 6.2 Plano de Recuperação de Desastres

| Métrica | Alvo | Situação atual |
| --- | --- | --- |
| RTO | 4 horas | Recuperação manual a partir do backup criptografado no Supabase Storage |
| RPO | 24 horas com backup diário | Para RPO de 1 hora, ativar Point-in-Time Recovery/logs de transação no Supabase |
| Frequência de backup | Diário | `vercel.json` executa `/api/cron/backup-database` às 02:00 UTC |
| Local do backup | Supabase Storage privado | Bucket `DATABASE_BACKUP_BUCKET` ou `database-backups` |
| Criptografia | Obrigatória | Backup salvo com AES-256-GCM usando `ENCRYPTION_KEY` |

#### Definições

```text
RTO (Recovery Time Objective): tempo máximo aceitável para restaurar o serviço.
Alvo: 4 horas.

RPO (Recovery Point Objective): volume máximo aceitável de dados perdidos.
Alvo atual: até 24 horas com backup diário.
Alvo futuro: até 1 hora com PITR/logs de transação.
```

#### Procedimento de Recuperação

1. Detectar falha por monitoramento, erro crítico, alerta da Vercel, Sentry ou Supabase.
2. Confirmar impacto: indisponibilidade, corrupção de dados, exclusão indevida ou falha de autenticação.
3. Notificar responsáveis internos e registrar horário de início do incidente.
4. Pausar ações de escrita quando houver risco de sobrescrever dados válidos.
5. Localizar o backup mais recente no Supabase Storage privado.
6. Baixar o arquivo de backup e descriptografar com a mesma `ENCRYPTION_KEY` usada na produção.
7. Validar estrutura e amostra dos dados antes de restaurar.
8. Restaurar primeiro em ambiente seguro de validação, quando possível.
9. Comparar contagens de usuários, dados do app, avisos e depoimentos.
10. Restaurar em produção somente após validação mínima.
11. Comunicar usuários caso exista impacto visível, perda de dados ou janela de instabilidade.
12. Registrar pós-incidente com causa, impacto, duração, dados restaurados e ação preventiva.

#### Checklist de Validação Após Restauração

- Login e cadastro funcionando.
- Dados de `auth_users` disponíveis.
- Dados de calculadora em `user_app_data` restaurados.
- Checkout e status Premium preservados.
- Avisos globais carregando corretamente.
- Amostra de usuários consegue abrir materiais, produtos, vendas e orçamentos.
- Nenhum endpoint crítico retornando erro 500.
- Logs do Sentry/Vercel sem nova falha recorrente.

#### Melhorias Futuras Para RPO de 1 Hora

- Ativar Point-in-Time Recovery no Supabase, se disponível no plano usado.
- Configurar retenção de logs de transação.
- Criar rotina de teste de restauração mensal.
- Documentar responsável primário e secundário pela recuperação.
- Criar alerta explícito para falha do cron `/api/cron/backup-database`.

## Parte 7: Monitoramento e Logging

### 7.1 Logging de Segurança

| Item | Status | Implementação |
| --- | --- | --- |
| Tabela de auditoria | Implementado | `public.audit_logs` em `supabase/schema.sql` |
| Helper central | Implementado | `lib/audit-log.ts` registra eventos com ação, severidade, detalhes e hashes de IP/user-agent |
| Login bem-sucedido | Implementado | `lib/auth/options.ts` registra `auth.login.success` |
| Falha de login | Implementado | `lib/auth/options.ts` registra `auth.login.failed` |
| Rate limit de login | Implementado | `lib/auth/options.ts` registra `auth.login.rate_limited` |
| Cadastro | Implementado | `app/api/auth/register/route.ts` registra sucesso, e-mail duplicado, CAPTCHA falho e rate limit |
| Recuperação de senha | Implementado | `app/api/auth/forgot-password/route.ts` e `app/api/auth/reset-password/route.ts` registram solicitação, conclusão e falhas |
| Exportação de dados | Implementado | `app/api/account/route.ts` registra `account.data_export.requested` |
| Alteração de backup | Implementado | `app/api/account/route.ts` registra `account.backup_settings.updated` |
| Exclusão de conta | Implementado | `app/api/account/route.ts` registra `account.deleted` com severidade crítica |
| Retenção | Implementado | `app/api/cron/cleanup-old-logs/route.ts` remove logs de auditoria com mais de 365 dias |

### Observação Sobre Privacidade

O audit log não grava IP ou user-agent em texto puro. Esses valores são salvos como hash SHA-256 para permitir correlação de abuso sem expor dados diretamente. O helper também remove campos sensíveis como senha, token, segredo, cookie e authorization antes de persistir `details`.

### Eventos Registrados

```text
auth.login.success
auth.login.failed
auth.login.rate_limited
auth.register.success
auth.register.duplicate_email
auth.register.captcha_failed
auth.register.rate_limited
auth.forgot_password.requested
auth.forgot_password.captcha_failed
auth.forgot_password.rate_limited
auth.password_reset.success
auth.password_reset.failed
auth.password_reset.rate_limited
account.data_export.requested
account.backup_settings.updated
account.deleted
```

### Próximas Melhorias

- Criar tela administrativa para consultar eventos críticos.
- Enviar alerta para eventos `critical`, como exclusão de conta em massa.
- Registrar alterações de plano Premium e ações administrativas.
- Criar política de revisão mensal dos eventos de auditoria.

### 7.2 Alertas de Anomalias

| Item | Status | Implementação |
| --- | --- | --- |
| Detector central | Implementado | `lib/anomaly-detection.ts` analisa eventos recentes em `audit_logs` |
| Cron automático | Implementado | `app/api/cron/anomaly-detection/route.ts` roda pelo `vercel.json` diariamente às 03:15 UTC |
| Múltiplos IPs no login | Implementado | Alerta quando há mais de 3 hashes de IP em logins bem-sucedidos no período de 1 hora |
| Muitas ações em pouco tempo | Implementado | Alerta quando há mais de 100 eventos auditados em 5 minutos para o mesmo usuário |
| E-mail de alerta ao usuário | Implementado | `lib/security-alert-email.ts` envia aviso de atividade incomum via Resend |
| Deduplicação de alertas | Implementado | Evita reenviar o mesmo tipo de alerta para o mesmo usuário por 1 hora |
| Registro de alerta | Implementado | Grava `security.anomaly_detected` e `security.anomaly_alert.sent` em `audit_logs` |
| Bloqueio temporário automático | Pendente | Não foi ativado para evitar bloquear usuários legítimos sem tela de desbloqueio/suporte |

### Eventos de Anomalia

```text
security.anomaly_detected
security.anomaly_alert.sent
```

### Observação Sobre IP

Como o audit log salva apenas `ip_hash`, a detecção compara hashes de IP, não o IP real. Isso preserva privacidade e ainda permite identificar logins de múltiplas origens.

### Próximas Melhorias

- Criar lista de permissões para administradores/testes internos.
- Em plano Pro da Vercel, aumentar a frequência do cron para 15 minutos se fizer sentido operacional.
- Adicionar bloqueio temporário com mensagem clara e canal de recuperação.
- Criar painel admin para ver alertas recentes por severidade.
- Enviar alerta interno para eventos críticos além do e-mail ao usuário.

### 7.3 Monitoramento de Performance

| Item | Status | Implementação |
| --- | --- | --- |
| Tempo de resposta no proxy | Implementado | `proxy.ts` mede a duração do processamento do proxy em cada request coberta pelo matcher |
| Header de resposta | Implementado | Adiciona `X-Response-Time` com a duração em milissegundos |
| Log de requisição lenta | Implementado | Registra `console.warn` quando o proxy leva mais de 3000ms |
| Compatibilidade com redirects | Implementado | O header também é aplicado em redirects de HTTPS e autenticação |

### Observação Sobre Escopo

Esse monitoramento mede o tempo gasto no `proxy.ts`, incluindo checagens de HTTPS, autenticação por token e redirects. Ele não mede todo o tempo de renderização da página nem o tempo interno de cada API. Para isso, a próxima etapa deve instrumentar handlers de API críticos ou usar métricas da Vercel/Sentry.

### Próximas Melhorias

- Registrar APIs lentas com wrapper compartilhado para Route Handlers.
- Enviar métricas de performance para Sentry ou provedor dedicado.
- Criar alertas para aumento de latência em checkout, login e IA.

## Parte 8: Conformidade Legal

### 8.1 LGPD

| Item | Status | Implementação |
| --- | --- | --- |
| Direito de acesso/exportação | Implementado | `app/api/user/export-data/route.ts` retorna JSON com `Content-Disposition` para download |
| Exportação pelo app | Implementado | `app/api/account/route.ts` já fornece os dados usados pelo backup/exportação no perfil |
| Direito ao esquecimento | Implementado | `app/api/user/delete-account/route.ts` remove dados sincronizados e conta autenticada |
| Exclusão pelo app | Implementado | `app/api/account/route.ts` já permite exclusão confirmada com `EXCLUIR` |
| Auditoria LGPD | Implementado | Exportação e exclusão registram eventos `lgpd.data_export.downloaded` e `lgpd.account_erasure.requested` |
| Política de privacidade | Implementado | `app/politicas/privacidade/page.tsx` descreve dados coletados, finalidades, proteção, direitos e contato |
| Termos de serviço | Implementado | `app/politicas/termos-de-uso/page.tsx` cobre responsabilidade, uso aceitável, limitação e rescisão |

### Direitos Disponíveis

```text
Acessar dados: GET /api/user/export-data
Excluir conta: POST /api/user/delete-account com confirmationText="EXCLUIR"
Corrigir dados: área de perfil do app
Exportar backup: área de perfil do app
Contato: privacidade@calculaartesao.com.br
```

### Observação Sobre Exclusão

A exclusão remove a conta e os dados sincronizados principais do usuário. Logs de auditoria podem ser mantidos sem vínculo direto ao usuário quando necessário para segurança, prevenção de fraude, cumprimento legal ou defesa de direitos, respeitando minimização e retenção documentada.

### 8.2 Termos de Serviço

| Item | Status | Implementação |
| --- | --- | --- |
| Responsabilidade do usuário | Implementado | Termos indicam responsabilidade por credenciais, dados cadastrados, validação de cálculos e backup próprio |
| Uso aceitável | Implementado | Termos proíbem atividade ilegal, spam, abuso, compartilhamento inseguro de credenciais e tentativa de explorar falhas |
| Limitação de responsabilidade | Implementado | Termos informam serviço como ferramenta de apoio, sem garantia de recuperação total e com limite de responsabilidade |
| Rescisão/cancelamento | Implementado | Termos indicam cancelamento pelo usuário e possibilidade de suspensão por violação, fraude, abuso ou risco de segurança |
| Relação com LGPD | Implementado | Exclusão de conta e retenção seguem política de privacidade, LGPD e obrigações legais aplicáveis |

### Observação Legal

O texto foi escrito em linguagem simples para comunicação pública. Uma revisão jurídica profissional ainda é recomendada antes de escalar comercialmente, especialmente para ajustar limite de responsabilidade, jurisdição, retenção de dados e regras de assinatura conforme o modelo final de cobrança.

## Parte 9: Checklist de Segurança

### Implementação Imediata

#### Autenticação

| Item | Status | Implementação |
| --- | --- | --- |
| Verificação de email após cadastro | Implementado | Cadastro envia confirmação e `EmailVerificationNotice` permite reenviar |
| Recuperação de senha segura | Implementado | Token com hash, validade de 1 hora, rate limit e CAPTCHA |
| Logout automático após inatividade | Implementado | `app/components/InactivityLogout.tsx` encerra sessão após 30 minutos sem atividade |
| Invalidar sessões ao mudar senha | Implementado | `password_changed_at` em `auth_users`; tokens antigos perdem `user.id` e o cliente sai da conta |

#### Dados em Trânsito

| Item | Status | Implementação |
| --- | --- | --- |
| HTTPS obrigatório em produção | Implementado | `proxy.ts` redireciona HTTP para HTTPS |
| Headers de segurança | Implementado | `next.config.ts` aplica HSTS, CSP, X-Frame-Options, nosniff e Permissions-Policy |
| Cookies com flags seguras | Implementado | NextAuth usa cookies HttpOnly por padrão e `useSecureCookies` em produção/HTTPS |

#### Dados em Repouso

| Item | Status | Implementação |
| --- | --- | --- |
| Criptografia de dados sensíveis | Implementado | `lib/crypto.ts` com AES-256-GCM e `ENCRYPTION_KEY` |
| Hashing de senhas | Implementado | `lib/auth/password.ts` usa `scrypt` com salt e comparação segura |
| Política de retenção de logs | Implementado | `cleanup-old-logs` remove logs temporários e retém auditoria por 365 dias |

#### Validação

| Item | Status | Implementação |
| --- | --- | --- |
| Validar todos os inputs com Zod | Parcial | O app usa validação customizada central em `lib/validation.ts`; Zod pode ser adotado futuramente |
| Sanitizar outputs | Implementado | `lib/sanitize.ts` e uso nos avisos/e-mails |
| Proteção contra SQL injection | Implementado | Supabase query builder e allowlists para tabela dinâmica |
| Rate limiting em APIs | Implementado | Auth, Gemini, marketing e checkout usam rate limit persistente |

#### Monitoramento

| Item | Status | Implementação |
| --- | --- | --- |
| Logging de eventos de segurança | Implementado | `lib/audit-log.ts` e `audit_logs` |
| Alertas de anomalias | Implementado | `lib/anomaly-detection.ts` e cron diário compatível com Vercel Hobby |
| Monitoramento de performance | Implementado | `proxy.ts` adiciona `X-Response-Time` e loga proxy lento |

#### Backup

| Item | Status | Implementação |
| --- | --- | --- |
| Backup diário do banco | Implementado | `app/api/cron/backup-database/route.ts` |
| Teste de restauração | Pendente operacional | Precisa ser executado manualmente em ambiente seguro antes de marcar como concluído |
| Documentar plano de recuperação | Implementado | Parte 6.2 deste guia |

#### Conformidade

| Item | Status | Implementação |
| --- | --- | --- |
| Política de Privacidade publicada | Implementado | `/politicas/privacidade` |
| Termos de Serviço publicados | Implementado | `/politicas/termos-de-uso` |
| Consentimento de cookies | Implementado | `app/components/CookieConsentBanner.tsx` para cookies essenciais |

### Pendências Reais

- Executar e registrar um teste de restauração de backup.
- Decidir se vale migrar validação customizada para Zod.
- Criar painel admin para auditoria, anomalias e eventos críticos.

### Implementação Média (Semana 2-4)

#### Autenticação Avançada

| Item | Status | Implementação |
| --- | --- | --- |
| Autenticação de Dois Fatores (2FA) | Pendente | Precisa de etapa própria com TOTP, QR Code, desafio no login e códigos de recuperação |
| Biometria para mobile | Pendente | Em app web/PWA, o caminho mais seguro é avaliar passkeys/WebAuthn em etapa futura |
| Detecção de dispositivo novo | Implementado inicial | `lib/anomaly-detection.ts` detecta login com `user_agent_hash` novo comparando os últimos 90 dias |

#### Dados

| Item | Status | Implementação |
| --- | --- | --- |
| Criptografia de ponta a ponta (E2E) | Pendente | Exige arquitetura própria de chaves por usuário; não deve ser adicionada sem desenho de recuperação |
| Mascaramento de dados sensíveis em logs | Implementado | `lib/audit-log.ts` remove campos sensíveis e salva IP/user-agent apenas como hash |
| Segregação de dados por tenant | Implementado inicial | APIs usam sessão do usuário e `user_id`; revisar políticas RLS antes de escalar multi-tenant |

#### Proteção Contra Abuso

| Item | Status | Implementação |
| --- | --- | --- |
| CAPTCHA em formulários públicos | Implementado | Cadastro e recuperação de senha usam reCAPTCHA v2 quando as chaves estão configuradas |
| Detecção de bot | Parcial | Rate limit, CAPTCHA e anomalias reduzem automação; detecção dedicada ainda é futura |
| Proteção contra DDoS | Parcial | Vercel/CDN, rate limit de APIs caras e CAPTCHA ajudam; WAF/regras avançadas dependem do plano/infra |

#### Conformidade

| Item | Status | Implementação |
| --- | --- | --- |
| Certificação SOC 2 | Pendente operacional | Exige processo formal, controles internos, evidências e auditor independente |
| Auditoria de segurança externa | Pendente operacional | Deve ser contratada antes de escalar base paga ou dados mais sensíveis |
| Plano de resposta a incidentes | Implementado | Procedimento documentado abaixo para classificar, conter, comunicar e corrigir incidentes |

### Plano de Resposta a Incidentes

#### Objetivo

Responder rapidamente a eventos como vazamento de dados, acesso indevido, falha de autenticação, abuso de APIs, indisponibilidade crítica ou alteração indevida de dados.

#### Severidade

| Nível | Exemplo | Ação |
| --- | --- | --- |
| Baixa | Erro isolado sem dados expostos | Registrar, corrigir e acompanhar |
| Média | Tentativas de abuso, bot ou falha recorrente sem vazamento | Ativar mitigação, revisar logs e comunicar internamente |
| Alta | Acesso indevido a conta, perda parcial de dados ou indisponibilidade relevante | Conter, acionar backup, avisar afetados quando necessário |
| Crítica | Vazamento confirmado, comprometimento de chaves ou impacto amplo | Rotacionar segredos, pausar fluxos afetados, comunicar usuários e avaliar obrigação legal |

#### Procedimento

1. Detectar o incidente por logs, alerta, usuário, Vercel, Supabase, Stripe ou Sentry.
2. Classificar severidade e registrar horário, escopo e responsável.
3. Conter o problema: desativar rota, rotacionar segredo, pausar checkout, bloquear abuso ou limitar acesso.
4. Preservar evidências: logs, commits, deploys, eventos Stripe/Supabase e horário dos sintomas.
5. Avaliar impacto em usuários, dados, pagamentos, disponibilidade e obrigações LGPD.
6. Corrigir a causa raiz com revisão de código e validação em produção.
7. Comunicar usuários afetados quando houver risco real, indisponibilidade relevante ou obrigação legal.
8. Fazer pós-incidente com causa, impacto, tempo de resposta, ação preventiva e responsável pela conclusão.

#### Ações Imediatas por Tipo

| Incidente | Primeira ação |
| --- | --- |
| Chave vazada | Revogar/rotacionar chave na Vercel e no provedor, depois redeploy |
| Abuso de API | Aumentar rate limit/regras de bloqueio e revisar logs por IP hash/user-agent hash |
| Falha de checkout | Pausar campanha, verificar Stripe, logs da rota e status de assinatura |
| Perda/corrupção de dados | Congelar escritas se possível e iniciar plano de recuperação da Parte 6 |
| Conta invadida | Invalidar sessão, orientar troca de senha e revisar `audit_logs` do usuário |

#### Evidências a Guardar

- Commit/deploy afetado.
- Horário de início e fim.
- Rotas impactadas.
- Usuários afetados, quando identificável.
- Eventos `audit_logs` relacionados.
- Prints/logs de Vercel, Supabase, Stripe ou Sentry.
- Correção aplicada e validação feita.
