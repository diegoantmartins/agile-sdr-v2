// src/presentation/test/chat-sandbox.page.ts
// Interactive chat sandbox UI for testing agent prompts

export function buildChatSandboxPage(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Prompt Sandbox — Agile SDR</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #0f0f1a;
      --bg-secondary: #1a1a2e;
      --bg-chat: #12121f;
      --bg-bubble-user: #6366f1;
      --bg-bubble-agent: #1e1e35;
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --accent: #818cf8;
      --accent-glow: rgba(129, 140, 248, 0.25);
      --border: rgba(255,255,255,0.06);
      --success: #34d399;
      --warning: #fbbf24;
      --danger: #f87171;
      --radius: 12px;
      --radius-sm: 8px;
      --font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font);
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── Header ─────────── */
    .header {
      background: linear-gradient(135deg, var(--bg-secondary) 0%, #16213e 100%);
      border-bottom: 1px solid var(--border);
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-shrink: 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--accent), #a78bfa);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
    }

    .header h1 {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, #e2e8f0, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header h1 span {
      font-weight: 400;
      opacity: 0.7;
    }

    .header-badge {
      background: rgba(251, 191, 36, 0.15);
      color: var(--warning);
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Layout ─────────── */
    .layout {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* ── Sidebar ─────────── */
    .sidebar {
      width: 320px;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-section {
      padding: 16px;
      border-bottom: 1px solid var(--border);
    }

    .sidebar-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 10px;
    }

    .config-field {
      margin-bottom: 12px;
    }

    .config-field label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .config-field input,
    .config-field select,
    .config-field textarea {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 8px 10px;
      font-size: 13px;
      color: var(--text-primary);
      font-family: var(--font);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .config-field input:focus,
    .config-field select:focus,
    .config-field textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .config-field textarea {
      resize: vertical;
      min-height: 60px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
    }

    .toggle-row label {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .toggle-switch {
      position: relative;
      width: 40px;
      height: 22px;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      cursor: pointer;
      inset: 0;
      background: rgba(255,255,255,0.1);
      border-radius: 22px;
      transition: 0.3s;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      height: 16px;
      width: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background: var(--accent);
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(18px);
    }

    .btn-reset {
      width: 100%;
      padding: 10px;
      background: rgba(248, 113, 113, 0.1);
      border: 1px solid rgba(248, 113, 113, 0.2);
      color: var(--danger);
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font);
    }

    .btn-reset:hover {
      background: rgba(248, 113, 113, 0.2);
    }

    /* ── Chat Area ─────────── */
    .chat-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-chat);
      overflow: hidden;
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .chat-messages::-webkit-scrollbar {
      width: 4px;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.1);
      border-radius: 4px;
    }

    .msg {
      display: flex;
      flex-direction: column;
      max-width: 75%;
      animation: msgIn 0.3s ease-out;
    }

    @keyframes msgIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .msg.user {
      align-self: flex-end;
      align-items: flex-end;
    }

    .msg.agent {
      align-self: flex-start;
      align-items: flex-start;
    }

    .msg-bubble {
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .msg.user .msg-bubble {
      background: linear-gradient(135deg, var(--bg-bubble-user), #4f46e5);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .msg.agent .msg-bubble {
      background: var(--bg-bubble-agent);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
    }

    .msg-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .intent-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .intent-BUY_NOW, .intent-HANDOFF_HUMANO { background: rgba(52,211,153,0.15); color: var(--success); }
    .intent-SUPPORT, .intent-FOLLOW_UP_NORMAL { background: rgba(129,140,248,0.15); color: var(--accent); }
    .intent-TRIAGE { background: rgba(251,191,36,0.15); color: var(--warning); }
    .intent-OBRA_SEM_FRENTE { background: rgba(248,113,113,0.15); color: var(--danger); }
    .intent-SERVICO_FECHADO { background: rgba(248,113,113,0.15); color: #fb923c; }
    .intent-LICITACAO_PERDIDA { background: rgba(251,191,36,0.15); color: var(--warning); }

    .confidence-bar {
      width: 50px;
      height: 4px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.4s ease;
    }

    .msg-reasoning {
      font-size: 11px;
      color: var(--text-muted);
      font-style: italic;
      margin-top: 2px;
      max-width: 400px;
    }

    /* ── Typing Indicator ─── */
    .typing-indicator {
      display: none;
      align-self: flex-start;
      padding: 12px 16px;
      background: var(--bg-bubble-agent);
      border: 1px solid var(--border);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
    }

    .typing-indicator.active { display: flex; }

    .typing-dot {
      width: 8px;
      height: 8px;
      background: var(--text-muted);
      border-radius: 50%;
      margin: 0 2px;
      animation: typingBounce 1.2s infinite;
    }

    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* ── Input ─────────── */
    .chat-input-area {
      padding: 16px 24px;
      background: var(--bg-secondary);
      border-top: 1px solid var(--border);
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }

    .chat-input-area textarea {
      flex: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px 16px;
      font-size: 14px;
      color: var(--text-primary);
      font-family: var(--font);
      resize: none;
      max-height: 120px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .chat-input-area textarea:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }

    .btn-send {
      width: 46px;
      height: 46px;
      background: linear-gradient(135deg, var(--accent), #6366f1);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .btn-send:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 20px var(--accent-glow);
    }

    .btn-send:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none;
    }

    .btn-send svg {
      width: 20px;
      height: 20px;
      fill: white;
    }

    /* ── Debug Panel ─────────── */
    .debug-panel {
      width: 360px;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border);
      overflow-y: auto;
      flex-shrink: 0;
    }

    .debug-header {
      padding: 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .debug-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .debug-count {
      font-size: 11px;
      background: rgba(129,140,248,0.15);
      color: var(--accent);
      padding: 2px 8px;
      border-radius: 10px;
    }

    .debug-entry {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      font-size: 12px;
      transition: background 0.2s;
    }

    .debug-entry:hover {
      background: rgba(255,255,255,0.02);
    }

    .debug-entry .de-label {
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10px;
      margin-bottom: 4px;
    }

    .debug-entry .de-value {
      color: var(--text-secondary);
      word-break: break-all;
    }

    .debug-entry .de-value.mono {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 11px;
      background: rgba(0,0,0,0.3);
      padding: 6px 8px;
      border-radius: 6px;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
      margin-top: 4px;
    }

    /* ── Quick Prompts ─────────── */
    .quick-prompts {
      padding: 12px 24px;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid var(--border);
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .qp-btn {
      padding: 6px 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-size: 12px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
      font-family: var(--font);
      white-space: nowrap;
    }

    .qp-btn:hover {
      background: rgba(129,140,248,0.1);
      border-color: rgba(129,140,248,0.3);
      color: var(--accent);
    }

    /* ── Welcome Message ─────────── */
    .welcome-card {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
    }

    .welcome-card .emoji {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .welcome-card h2 {
      font-size: 18px;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    .welcome-card p {
      font-size: 13px;
      max-width: 360px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ── Stats bar ─────────── */
    .stats-bar {
      padding: 12px 16px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid var(--border);
      display: flex;
      gap: 16px;
      font-size: 12px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--text-muted);
    }

    .stat-item .stat-value {
      color: var(--text-primary);
      font-weight: 600;
    }

    @media (max-width: 1100px) {
      .sidebar { width: 260px; }
      .debug-panel { width: 280px; }
    }

    @media (max-width: 900px) {
      .layout { flex-direction: column; }
      .sidebar, .debug-panel { width: 100%; max-height: 200px; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="header-logo">🤖</div>
      <h1>Agent Prompt Sandbox <span>— Agile SDR v2</span></h1>
    </div>
    <div class="header-badge">🧪 Modo Teste</div>
  </div>

  <div class="layout">
    <!-- Sidebar: Config -->
    <div class="sidebar">
      <div class="sidebar-section">
        <h3>🎯 Configuração do Lead</h3>
        <div class="config-field">
          <label>Nome do Lead</label>
          <input type="text" id="leadName" value="João Silva" />
        </div>
        <div class="config-field">
          <label>Telefone</label>
          <input type="text" id="leadPhone" value="5511999887766" />
        </div>
        <div class="config-field">
          <label>Tenant ID</label>
          <input type="text" id="tenantId" value="synapsea" />
        </div>
      </div>

      <div class="sidebar-section">
        <h3>⚙️ Modo de Classificação</h3>
        <div class="config-field">
          <label>Pipeline</label>
          <select id="classificationMode">
            <option value="generic">Genérico (BUY_NOW / SUPPORT / TRIAGE)</option>
            <option value="agile">Agile Steel (Playbook Comercial)</option>
          </select>
        </div>
        <div class="toggle-row">
          <label>Usar LLM (OpenAI)</label>
          <label class="toggle-switch">
            <input type="checkbox" id="useLLM" checked />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="toggle-row">
          <label>Salvar no banco</label>
          <label class="toggle-switch">
            <input type="checkbox" id="persistDB" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="sidebar-section">
        <h3>📝 Prompt Customizado</h3>
        <div class="config-field">
          <textarea id="customPrompt" rows="3" placeholder="Ex: Pergunte sobre o tipo de obra antes de oferecer qualquer produto..."></textarea>
        </div>
      </div>

      <div class="sidebar-section">
        <button class="btn-reset" onclick="resetConversation()">🗑️ Limpar Conversa</button>
      </div>
    </div>

    <!-- Chat -->
    <div class="chat-area">
      <div class="stats-bar">
        <div class="stat-item">Mensagens: <span class="stat-value" id="statMessages">0</span></div>
        <div class="stat-item">Última intent: <span class="stat-value" id="statLastIntent">—</span></div>
        <div class="stat-item">Avg Response: <span class="stat-value" id="statAvgTime">—</span></div>
        <div class="stat-item">Score: <span class="stat-value" id="statScore">0</span></div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="welcome-card">
          <div class="emoji">💬</div>
          <h2>Sandbox de Teste de Prompts</h2>
          <p>Envie mensagens como se fosse um lead real. O agente vai classificar a intenção e gerar respostas usando o mesmo pipeline de produção — sem enviar nada ao WhatsApp.</p>
        </div>
      </div>

      <div class="typing-indicator" id="typingIndicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>

      <div class="quick-prompts">
        <button class="qp-btn" onclick="quickSend('Oi, quero saber sobre os serviços de vocês')">👋 Saudação</button>
        <button class="qp-btn" onclick="quickSend('Qual o preço do drywall para 200m²?')">💰 Preço</button>
        <button class="qp-btn" onclick="quickSend('Já fechei com outro fornecedor')">❌ Fechou com outro</button>
        <button class="qp-btn" onclick="quickSend('A obra não tem frente ainda, sem previsão')">🚧 Sem frente</button>
        <button class="qp-btn" onclick="quickSend('Perdemos a licitação, outra empresa ganhou')">📋 Licit. perdida</button>
        <button class="qp-btn" onclick="quickSend('Fechei a obra, vai começar essa semana!')">🔥 Obra começa</button>
        <button class="qp-btn" onclick="quickSend('Estamos avaliando, proposta recebida')">📊 Follow-up</button>
        <button class="qp-btn" onclick="quickSend('Quero contratar agora, vamos fechar!')">🎯 BUY_NOW</button>
        <button class="qp-btn" onclick="quickSend('Como funciona o steel frame?')">❓ Suporte</button>
      </div>

      <div class="chat-input-area">
        <textarea id="chatInput" placeholder="Digite uma mensagem como lead..." rows="1"
          onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();sendMessage();}"></textarea>
        <button class="btn-send" id="btnSend" onclick="sendMessage()">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>

    <!-- Debug Panel -->
    <div class="debug-panel">
      <div class="debug-header">
        <h3>🔍 Debug / Trace</h3>
        <span class="debug-count" id="debugCount">0 traces</span>
      </div>
      <div id="debugEntries"></div>
    </div>
  </div>

  <script>
    const API_BASE = window.location.origin;
    let messageCount = 0;
    let debugTraceCount = 0;
    let totalResponseTime = 0;
    let conversationHistory = [];
    let currentScore = 0;

    function getConfig() {
      return {
        leadName: document.getElementById('leadName').value,
        phone: document.getElementById('leadPhone').value,
        tenantId: document.getElementById('tenantId').value,
        classificationMode: document.getElementById('classificationMode').value,
        useLLM: document.getElementById('useLLM').checked,
        persistDB: document.getElementById('persistDB').checked,
        customPrompt: document.getElementById('customPrompt').value,
      };
    }

    function addMessage(content, type, metadata = {}) {
      const container = document.getElementById('chatMessages');
      const welcome = container.querySelector('.welcome-card');
      if (welcome) welcome.remove();

      const msg = document.createElement('div');
      msg.className = 'msg ' + type;

      let metaHtml = '';
      if (type === 'agent' && metadata.intent) {
        const confColor = metadata.confidence > 0.8 ? 'var(--success)' : metadata.confidence > 0.5 ? 'var(--warning)' : 'var(--danger)';
        metaHtml = \`
          <div class="msg-meta">
            <span class="intent-badge intent-\${metadata.intent}">\${metadata.intent}</span>
            <div class="confidence-bar"><div class="confidence-fill" style="width:\${Math.round(metadata.confidence * 100)}%;background:\${confColor}"></div></div>
            <span>\${Math.round(metadata.confidence * 100)}%</span>
            \${metadata.responseTime ? '<span>⏱️ ' + metadata.responseTime + 'ms</span>' : ''}
          </div>
          \${metadata.reasoning ? '<div class="msg-reasoning">' + metadata.reasoning + '</div>' : ''}
        \`;
      }

      const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      msg.innerHTML = \`
        <div class="msg-bubble">\${content}</div>
        \${metaHtml}
        <div class="msg-meta"><span>\${time}</span></div>
      \`;

      container.appendChild(msg);
      container.scrollTop = container.scrollHeight;
    }

    function showTyping(show) {
      document.getElementById('typingIndicator').classList.toggle('active', show);
    }

    function updateStats(intent, responseTime) {
      messageCount++;
      document.getElementById('statMessages').textContent = messageCount;
      document.getElementById('statLastIntent').textContent = intent || '—';

      if (responseTime) {
        totalResponseTime += responseTime;
        const avg = Math.round(totalResponseTime / Math.ceil(messageCount / 2));
        document.getElementById('statAvgTime').textContent = avg + 'ms';
      }
    }

    function addDebugTrace(data) {
      debugTraceCount++;
      document.getElementById('debugCount').textContent = debugTraceCount + ' traces';

      const container = document.getElementById('debugEntries');
      const entry = document.createElement('div');
      entry.className = 'debug-entry';

      const time = new Date().toLocaleTimeString('pt-BR');
      entry.innerHTML = \`
        <div class="de-label">Trace #\${debugTraceCount} — \${time}</div>
        <div class="de-value mono">\${JSON.stringify(data, null, 2)}</div>
      \`;

      container.prepend(entry);
    }

    async function sendMessage() {
      const input = document.getElementById('chatInput');
      const message = input.value.trim();
      if (!message) return;

      input.value = '';
      input.style.height = 'auto';

      addMessage(message, 'user');
      updateStats(null, null);

      const cfg = getConfig();
      conversationHistory.push({ role: 'user', content: message });

      showTyping(true);
      document.getElementById('btnSend').disabled = true;

      const startTime = Date.now();

      try {
        const response = await fetch(API_BASE + '/test/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            leadName: cfg.leadName,
            phone: cfg.phone,
            tenantId: cfg.tenantId,
            classificationMode: cfg.classificationMode,
            useLLM: cfg.useLLM,
            persistDB: cfg.persistDB,
            customPrompt: cfg.customPrompt,
            conversationHistory
          })
        });

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        showTyping(false);

        if (data.error) {
          addMessage('⚠️ Erro: ' + data.error, 'agent', {});
        } else {
          const reply = data.reply || data.message || 'Sem resposta';
          addMessage(reply, 'agent', {
            intent: data.intent,
            confidence: data.confidence,
            reasoning: data.reasoning,
            responseTime
          });

          conversationHistory.push({ role: 'assistant', content: reply });

          if (data.score !== undefined) {
            currentScore = data.score;
            document.getElementById('statScore').textContent = currentScore;
          }

          updateStats(data.intent, responseTime);
          addDebugTrace(data);
        }
      } catch (err) {
        showTyping(false);
        addMessage('❌ Erro de conexão: ' + err.message, 'agent', {});
      }

      document.getElementById('btnSend').disabled = false;
      input.focus();
    }

    function quickSend(text) {
      document.getElementById('chatInput').value = text;
      sendMessage();
    }

    function resetConversation() {
      document.getElementById('chatMessages').innerHTML = \`
        <div class="welcome-card">
          <div class="emoji">💬</div>
          <h2>Sandbox de Teste de Prompts</h2>
          <p>Envie mensagens como se fosse um lead real. O agente vai classificar a intenção e gerar respostas usando o mesmo pipeline de produção — sem enviar nada ao WhatsApp.</p>
        </div>
      \`;
      document.getElementById('debugEntries').innerHTML = '';
      messageCount = 0;
      debugTraceCount = 0;
      totalResponseTime = 0;
      currentScore = 0;
      conversationHistory = [];
      document.getElementById('statMessages').textContent = '0';
      document.getElementById('statLastIntent').textContent = '—';
      document.getElementById('statAvgTime').textContent = '—';
      document.getElementById('statScore').textContent = '0';
      document.getElementById('debugCount').textContent = '0 traces';
    }

    // Auto-resize textarea
    document.getElementById('chatInput').addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  </script>

</body>
</html>`;
}
