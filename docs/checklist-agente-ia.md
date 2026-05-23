# Implementação do Agente IA

Este checklist resume o que já foi implementado no assistente da Calcula Artesão e o que ainda fica para evoluções futuras.

## Fase 1: Setup Básico

- [x] Criar componente `AIAssistant.tsx`
- [x] Integrar assistente no layout principal (`AppHelpAssistant` no shell autenticado)
- [x] Criar API endpoint `/api/ai-assistant/chat`
- [x] Criar API endpoint `/api/ai-assistant/gemini`
- [ ] Testar chat básico manualmente no navegador após deploy

## Fase 2: Intenções

- [x] Implementar detecção de intenções
- [x] Criar respostas para cada intenção principal
- [x] Testar com exemplos reais da conversa
- [x] Ajustar padrões de detecção
- [x] Usar Gemini nas perguntas livres com fallback local

## Fase 3: Contexto

- [x] Acessar dados do usuário, insumos e produtos
- [x] Personalizar respostas baseado em contexto
- [x] Rastrear histórico de conversa
- [x] Testar recomendações personalizadas com dados disponíveis
- [x] Enviar contexto e histórico para Gemini sem inventar dados

## Fase 4: Gatilhos

- [x] Implementar gatilho de primeiro acesso
- [x] Implementar gatilho de primeiro produto
- [x] Implementar gatilho de limite atingido
- [x] Implementar gatilho de margem baixa
- [x] Implementar gatilho de inatividade

## Fase 5: Métricas

- [x] Rastrear mensagens por sessão
- [x] Rastrear problemas resolvidos
- [x] Rastrear satisfação do usuário
- [x] Rastrear conversões iniciadas pelo agente
- [x] Criar visualização de métricas no chat

## Fase 6: Otimização

- [ ] A/B testing de respostas
- [x] Melhorar detecção de intenções
- [x] Adicionar mais exemplos de diálogos
- [x] Coletar feedback do usuário
- [ ] Iterar baseado em dados reais de uso

## Observações

- O componente `AIAssistant.tsx` é um exemplo isolado da Parte 9. O assistente em uso no app continua sendo o `AppHelpAssistant`, porque ele já conversa com abas, contexto, gatilhos e métricas.
- A rota `/api/ai-assistant/chat` usa regras locais de intenção.
- A rota `/api/ai-assistant/gemini` chama Gemini com contexto real do usuário e histórico recente.
- O `AppHelpAssistant` tenta Gemini em perguntas livres e volta para as respostas locais caso a IA falhe, falte chave ou retorne erro.
- O teste manual no navegador deve confirmar se o chat abre, responde e mantém histórico ao navegar entre abas.
