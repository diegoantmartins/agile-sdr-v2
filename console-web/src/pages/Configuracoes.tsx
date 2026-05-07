import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Tabs, Tab, TextField, Button, Switch, FormControlLabel, List, ListItem, ListItemText, IconButton, CircularProgress, Alert } from '@mui/material';
import { Save, ContentCopy } from '@mui/icons-material';
import { useAgentConfig, useUpdateAgentConfig } from '../hooks/useApi';

export default function Configuracoes() {
  const [tab, setTab] = useState(0);
  const { data: agentConfig, isLoading, error } = useAgentConfig();
  const updateConfig = useUpdateAgentConfig();

  const [config, setConfig] = useState<Record<string, unknown>>({
    companyName: 'Agile SDR',
    objective: 'Qualificar leads e gerar reuniões',
    tone: 'consultivo',
    targetAudience: 'Empresas que buscam soluções',
    autoReplyEnabled: true,
    responseDelay: 5000,
    maxMessages: 10,
    ...agentConfig,
  });

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync(config);
    } catch (err) {
      console.error('Erro ao salvar config:', err);
    }
  };

  const webhookUrl = `${window.location.origin}/webhooks/uazapi`;
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Configurações</Typography>
          <Typography variant="body2" color="text.secondary">Configure o ambiente do seu agente</Typography>
        </Box>
        <Button variant="contained" startIcon={updateConfig.isPending ? <CircularProgress size={20} /> : <Save />} onClick={handleSave} disabled={updateConfig.isPending}>
          Salvar Alterações
        </Button>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>Erro ao carregar configurações. Usando valores padrão.</Alert>}

      <Card className="glass-panel stagger-entrance">
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Agente" />
          <Tab label="Webhooks" />
          <Tab label="Mensagens" />
          <Tab label="Avançado" />
        </Tabs>
        <CardContent>
          {tab === 0 && isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Configuração do Agente</Typography>
                <TextField
                  label="Nome da Empresa"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={config.companyName as string || ''}
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                />
                <TextField
                  label="Objetivo"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={config.objective as string || ''}
                  onChange={(e) => setConfig({ ...config, objective: e.target.value })}
                />
                <TextField
                  label="Tom de Voz"
                  fullWidth
                  sx={{ mb: 2 }}
                  value={config.tone as string || ''}
                  onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                />
                <TextField
                  label="Público Alvo"
                  fullWidth
                  value={config.targetAudience as string || ''}
                  onChange={(e) => setConfig({ ...config, targetAudience: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Comportamento</Typography>
                <FormControlLabel
                  control={<Switch checked={config.autoReplyEnabled as boolean || false} onChange={(e) => setConfig({ ...config, autoReplyEnabled: e.target.checked })} />}
                  label="Responder automaticamente"
                  sx={{ mb: 2, display: 'block' }}
                />
                <TextField
                  label="Atraso de resposta (ms)"
                  fullWidth
                  type="number"
                  sx={{ mb: 2 }}
                  value={config.responseDelay as number || 5000}
                  onChange={(e) => setConfig({ ...config, responseDelay: parseInt(e.target.value) })}
                />
                <TextField
                  label="Máximo de mensagens"
                  fullWidth
                  type="number"
                  value={config.maxMessages as number || 10}
                  onChange={(e) => setConfig({ ...config, maxMessages: parseInt(e.target.value) })}
                />
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Webhook WhatsApp (UAZAPI)</Typography>
                <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.04)', p: 2, borderRadius: 1, mb: 2, border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Typography variant="caption" color="text.secondary" display="block">URL do Webhook</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', flex: 1 }}>{webhookUrl}</Typography>
                    <IconButton size="small" onClick={() => copyToClipboard(webhookUrl)}><ContentCopy fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">Configure esta URL no painel da UAZAPI para receber mensagens.</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Webhook ChatWoot</Typography>
                <TextField label="ChatWoot URL" fullWidth sx={{ mb: 2 }} placeholder="https://app.chatwoot.com/..." />
                <TextField label="Webhook Secret" fullWidth type="password" placeholder="Segredo 配置" />
              </Grid>
            </Grid>
          )}

          {tab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Mensagem de Boas-vindas</Typography>
                <TextField
                  label="Mensagem"
                  multiline
                  rows={3}
                  fullWidth
                  value={config.welcomeMessage as string || 'Olá! Como posso ajudar?'}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Mensagem de Fallback</Typography>
                <TextField
                  label="Mensagem"
                  multiline
                  rows={3}
                  fullWidth
                  value={config.fallbackMessage as string || 'Entendido. Vou encaminhar para um especialista.'}
                  onChange={(e) => setConfig({ ...config, fallbackMessage: e.target.value })}
                />
              </Grid>
            </Grid>
          )}

          {tab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Configurações Avançadas</Typography>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Usar LLM para geração de respostas"
                  sx={{ mb: 2, display: 'block' }}
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Registrar intent em cada mensagem"
                  sx={{ mb: 2, display: 'block' }}
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Modo debug"
                  sx={{ mb: 2, display: 'block' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" fontWeight={600} mb={2}>Dados do Sistema</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary="Versão do Agente" secondary="v2.0.0" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Última Atualização" secondary={agentConfig ? new Date().toLocaleString('pt-BR') : 'N/A'} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}