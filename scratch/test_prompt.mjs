
import fs from 'fs';
import path from 'path';

// Mock Config
const configPath = path.resolve(process.cwd(), 'data', 'agent-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

function buildSystemPrompt(promptConfig, languageStyle) {
    if (promptConfig.customPrompt && promptConfig.customPrompt.length > 200) {
      return `${promptConfig.customPrompt}

Instruções Adicionais de Formatação:
- Nome do contato: SEMPRE trate o lead como {{leadName}}.
- Idioma: Use estritamente o estilo ${languageStyle}.
- Tom de voz: ${promptConfig.tone}.
- Limite de tamanho: Máximo ${promptConfig.maxReplyChars} caracteres.
- Responda apenas com o texto da mensagem final, sem explicações.`;
    }

    return `Você é um SDR (Sales Development Representative) virtual da ${promptConfig.companyName || 'Agile Steel'}.
Seu Objetivo: ${promptConfig.objective}`;
}

const finalPrompt = buildSystemPrompt(config, 'Português do Brasil (PT-BR)');
console.log('--- FINAL SYSTEM PROMPT ---');
console.log(finalPrompt);
console.log('--- END ---');
