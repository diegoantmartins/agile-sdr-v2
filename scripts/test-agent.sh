#!/bin/bash

# ================================================================
# test-agent.sh - Simulador de conversa com o Agente IA da Agile
# Execute depois de: docker-compose up -d && npm run dev
# ================================================================

BASE_URL="http://localhost:3000"
TENANT="agile-default"
PHONE="5511987654321"

echo ""
echo "======================================================"
echo "   🤖 Simulador do Agente IA - Agile Steel"
echo "======================================================"

# 1. Health check antes de tudo
echo ""
echo "🔍 Verificando se o servidor está rodando..."
HEALTH=$(curl -s "${BASE_URL}/health")
echo "   Health: $HEALTH"

if [[ "$HEALTH" != *"ok"* ]]; then
  echo ""
  echo "❌ Servidor não está respondendo em ${BASE_URL}"
  echo "   Rode primeiro: npm run dev"
  exit 1
fi

echo ""
echo "✅ Servidor online!"

# Função para enviar mensagem e ver a resposta da IA
send_message() {
  local DESCRICAO="$1"
  local MSG="$2"

  echo ""
  echo "──────────────────────────────────────────"
  echo "👤 Cenário: ${DESCRICAO}"
  echo "📨 Mensagem do Lead: \"${MSG}\""
  echo ""

  RESPONSE=$(curl -s -X POST "${BASE_URL}/test/send-message" \
    -H "Content-Type: application/json" \
    -H "x-tenant-id: ${TENANT}" \
    -H "x-api-key: client-test-key" \
    -d "{\"phone\": \"${PHONE}\", \"message\": \"${MSG}\"}")

  echo "🤖 Resposta do Agente:"
  echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); r=d.get('webhookResponse',{}); print('   ' + r.get('message', str(d)))" 2>/dev/null || echo "   $RESPONSE"

  sleep 2
}

# ── TESTES DE CONVERSA ──────────────────────────────────────
send_message "Saudação inicial" \
  "Oi, tudo bem? Vi vocês no instagram e queria saber mais sobre andaimes"

send_message "Intenção de Orçamento (BUY_NOW)" \
  "Preciso de um orçamento urgente para 500m² de andaime em obra industrial, obra começa semana que vem"

send_message "Dúvida Técnica (SUPPORT - NR18)" \
  "Qual a capacidade de carga dos andaimes? A fiscalização pediu conformidade com NR18 pra nossa obra"

send_message "Pergunta sobre Escoramentos" \
  "Vocês têm escoramento metálico para laje de ponte? São 80 metros de vão e 3 meses de locação"

send_message "Objeção de Preço" \
  "Achei o preço caro comparado com outras empresas, vocês dão desconto?"

# ── RESUMO FINAL ────────────────────────────────────────────
echo ""
echo "======================================================"
echo "   📊 Verificando Dados no Banco..."
echo "======================================================"

echo ""
echo "📌 Leads gerados:"
curl -s "${BASE_URL}/api/leads" \
  -H "x-tenant-id: ${TENANT}" \
  -H "x-api-key: client-test-key" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
leads = data.get('leads', [])
for lead in leads:
    print(f'  ► {lead.get(\"name\",\"?\")} | {lead.get(\"phone\",\"?\")} | Intent: {lead.get(\"intentClassified\",\"?\")} | Score: {lead.get(\"score\",0)}')
"

echo ""
echo "======================================================"
echo "🎉 Simulação completa! Veja o Painel em: http://localhost:9000"
echo "======================================================"
