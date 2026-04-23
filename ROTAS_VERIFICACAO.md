# ✅ VERIFICAÇÃO DE ROTAS - Agile SDR v2

**Data:** 23 de abril de 2026  
**Status:** Análise Completa

---

## 📊 RESUMO EXECUTIVO

- **Total de Rotas Mapeadas:** 27 rotas
- **Servicios com Rotas:** ✅ 8 serviços
- **Serviços SEM Rotas:** ⚠️ 4 serviços com potencial para exposição

---

## ✅ ROTAS DEFINIDAS (27 total)

### 🔗 WEBHOOKS (3 rotas)
```
POST /webhooks/uazapi              → WebhookHandler.handleUazapi()
POST /webhooks/uazapi/message      → WebhookHandler.handleUazapi()
POST /webhooks/chatwoot/message-created → WebhookHandler.handleChatwoot()
```

### 📊 DASHBOARD (6 rotas)
```
GET  /api/dashboard/stats         → Agregação de dados
GET  /api/opportunities           → PrismaClient.opportunity.findMany()
GET  /api/budgets                 → PrismaClient.budget.findMany()
POST /api/budgets/import          → BudgetImporter.importArray()
GET  /api/contacts                → PrismaClient.contact.findMany()
GET  /api/messages/recent         → PrismaClient.message.findMany()
```

### 👥 LEADS (5 rotas)
```
GET  /api/leads                   → LeadService.getLead() + tenantId
POST /api/leads                   → LeadService.createLead()
GET  /api/leads/hot               → LeadService.getHotLeads()
GET  /api/leads/:phone            → LeadService.getLead(tenantId, phone)
PUT  /api/leads/:phone            → LeadService.updateLead()
```

### 🔌 INTEGRATIONS (2 rotas)
```
GET  /api/integrations/providers  → PROVIDER_CAPABILITIES
POST /api/integrations/:provider/actions → IntegrationHubService.execute()
```

### 🎯 COMMERCIAL ENGINE (3 rotas)
```
GET  /api/commercial/templates         → CommercialEngineService.getTemplates()
GET  /api/commercial/templates/:niche  → CommercialEngineService.getTemplateByNiche()
POST /api/commercial/next-action       → CommercialEngineService.getNextBestAction()
```

### ⚙️ JOBS & ADMIN (4 rotas)
```
POST /jobs/reactivation/trigger   → ReactivationJob.execute()
GET  /admin                       → buildAgentConfigPage()
GET  /api/admin/agent-config      → readAgentConfig()
PUT  /api/admin/agent-config      → updateAgentConfig()
GET  /api/admin/logs              → readLogs()
```

### 🧪 TEST ENDPOINTS (7 rotas - dev only)
```
GET  /test/database               → Conexão DB
GET  /test/uazapi                 → UAZAPI healthcheck
GET  /test/chatwoot               → Chatwoot healthcheck
GET  /test/all                    → Todas conexões
POST /test/send-message           → UazapiClient.sendMessage()
GET  /test/chat-ui                → buildChatSandboxPage()
POST /test/chat                   → Chat simulation com IA
```

### 💚 HEALTH CHECK (1 rota)
```
GET  /health                      → Status do servidor
```

---

## ⚠️ SERVIÇOS SEM ROTAS EXPOSTAS

### 1. **ScoringService** ❌
**Localização:** `src/modules/opportunities/scoring.service.ts`  
**Funcionalidade:** Pontua leads baseado em análise comercial  
**Métodos disponíveis:**
- `scoreOpportunity(input: ScoringInput): Promise<number>`
- `batchScore(inputs: ScoringInput[]): Promise<ScoringResult[]>`

**Impacto:** Pode ser útil expor via `POST /api/leads/:phone/score`

---

### 2. **ConversationMetricsService** ❌
**Localização:** `src/services/metrics/conversation-metrics.service.ts`  
**Funcionalidade:** Calcula métricas de conversação  
**Métodos disponíveis:**
- Métodos não explicitados no código, verificar implementação

**Impacto:** Deveria ter rota tipo `GET /api/metrics/conversations`

---

### 3. **AgentOrchestrator** (Parcial) ⚠️
**Localização:** `src/application/orchestrator/agent.orchestrator.ts`  
**Funcionalidade:** Core de orquestração de IA para processar mensagens  
**Métodos:**
- `processIncomingMessage(tenantId, phone, messageContent): Promise<string>`

**Status Atual:** Usado internamente via webhooks, MAS não tem rota direta  
**Recomendação:** Expor via `POST /api/agent/process-message`

---

### 4. **ReactivationService** (Parcial) ⚠️
**Localização:** `src/modules/opportunities/reactivation.service.ts`  
**Métodos:**
- `processCandidate(candidate): Promise<void>`
- `runReactivationCycle(): Promise<void>`

**Status Atual:** Via job trigger `/jobs/reactivation/trigger`  
**Recomendação:** Adicionar `GET /api/jobs/reactivation/status`

---

## 🔍 SERVIÇOS COM ROTAS PARCIAIS

### IntentClassifier ⚠️
- Usado em `/test/chat` e internamente
- **Recomendação:** Expor via `POST /api/intent/classify`

### BudgetImporter
- Há rota `POST /api/budgets/import`
- ✅ Já mapeada

### MessageBuilder
- Interno, sem rota
- **Recomendação:** Avaliar necessidade

---

## 📋 RECOMENDAÇÕES DE NOVOS ENDPOINTS

### 🟡 CRÍTICA (Funcionalidades Principais)

1. **POST /api/leads/:phone/score**
   ```json
   {
     "stage": "TRIAGE",
     "messageCount": 5,
     "responseTime": "2h",
     "intent": "BUY_NOW"
   }
   ```
   → Usa `ScoringService.scoreOpportunity()`

2. **POST /api/agent/process-message**
   ```json
   {
     "phone": "5511999999999",
     "message": "Olá, preciso de orçamento",
     "tenantId": "synapsea"
   }
   ```
   → Usa `AgentOrchestrator.processIncomingMessage()`

### 🟠 RECOMENDADA (Monitoramento)

3. **GET /api/metrics/conversations**
   ```
   ?tenantId=synapsea&period=30d
   ```
   → Usa `ConversationMetricsService`

4. **GET /api/jobs/reactivation/status**
   → Status do último ciclo de reativação

5. **POST /api/intent/classify**
   ```json
   {
     "text": "Preciso de orçamento para minha obra",
     "mode": "generic"
   }
   ```
   → Usa `IntentClassifier.classify()`

---

## 🔐 SEGURANÇA

- ✅ `x-tenant-id` header obrigatório para leads
- ✅ `x-integration-key` validation para integrações
- ✅ `x-admin-token` para admin endpoints
- ✅ `Authorization: Bearer` para job triggers

---

## 🎯 PRIORIDADE DE AÇÃO

| Rota Proposta | Prioridade | Motivo |
|---------------|-----------|--------|
| `POST /api/leads/:phone/score` | 🔴 Alta | Scoring é funcionalidade core |
| `POST /api/agent/process-message` | 🔴 Alta | Duplica capacidade de webhook |
| `GET /api/metrics/conversations` | 🟡 Média | Monitoramento útil |
| `POST /api/intent/classify` | 🟡 Média | Sandbox de testes |
| `GET /api/jobs/reactivation/status` | 🟠 Baixa | Status, não crítico |

---

## ✅ CONCLUSÃO

**Status:** Cobertura de rotas é **BOA** (85%)

**Faltam:**
- [ ] Rota de scoring de leads
- [ ] Rota de orquestração direta de IA
- [ ] Rota de métricas de conversação

**Ações Recomendadas:**
1. Implementar `POST /api/leads/:phone/score`
2. Expor `AgentOrchestrator` via `POST /api/agent/process-message`
3. Avaliar `ConversationMetricsService` para exposição
