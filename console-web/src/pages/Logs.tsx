import { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip, TextField, IconButton, CircularProgress, Alert, Tooltip, Button } from '@mui/material';
import { Refresh, Search, Terminal, DeleteSweep, Chat, SmartToy, BugReport, Warning } from '@mui/icons-material';
import { logsService } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  [key: string]: any;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const data = await logsService.get();
      // Reverse because backend returns newest first for optimization, but we want to display as a stream
      setLogs([...data.logs].reverse());
      setError('');
    } catch (err: any) {
      setError('Erro ao carregar logs do servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Tem certeza que deseja limpar os logs atuais do console?')) return;
    try {
      await logsService.clear();
      setLogs([]);
      fetchLogs();
    } catch (err) {
      setError('Erro ao limpar logs.');
    }
  };

  useEffect(() => {
    fetchLogs();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    if (scrollRef.current && autoRefresh) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter(log => 
    log.message?.toLowerCase().includes(filter.toLowerCase()) ||
    log.level?.toLowerCase().includes(filter.toLowerCase()) ||
    log.service?.toLowerCase().includes(filter.toLowerCase()) ||
    JSON.stringify(log).toLowerCase().includes(filter.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'secondary';
      default: return 'default';
    }
  };

  const getLogIcon = (log: LogEntry) => {
    if (log.message?.includes('CHATWOOT')) return <Chat sx={{ fontSize: 16, mr: 1, color: '#3b82f6' }} />;
    if (log.message?.includes('AgentOrchestrator') || log.service === 'ai-agent') return <SmartToy sx={{ fontSize: 16, mr: 1, color: '#10b981' }} />;
    if (log.level === 'error') return <BugReport sx={{ fontSize: 16, mr: 1, color: '#ef4444' }} />;
    if (log.level === 'warn') return <Warning sx={{ fontSize: 16, mr: 1, color: '#f59e0b' }} />;
    return <Terminal sx={{ fontSize: 16, mr: 1, color: '#64748b' }} />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>System Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitoramento de atividades do Agente IA e integrações Chatwoot
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            startIcon={<DeleteSweep />}
            onClick={handleClear}
          >
            Limpar Console
          </Button>
          <Chip 
            label={autoRefresh ? "Auto-refresh: ON" : "Auto-refresh: OFF"} 
            color={autoRefresh ? "success" : "default"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outlined"
            size="small"
            sx={{ cursor: 'pointer' }}
          />
          <Tooltip title="Atualizar Agora">
            <IconButton onClick={fetchLogs} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ bgcolor: '#0f172a', color: '#e2e8f0', borderRadius: 2, overflow: 'hidden', border: '1px solid #1e293b' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #1e293b', display: 'flex', gap: 2, bgcolor: '#1e293b' }}>
          <TextField
            size="small"
            placeholder="Filtrar por mensagem, nível ou serviço..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ 
              flex: 1, 
              '& .MuiOutlinedInput-root': { color: '#fff', bgcolor: '#0f172a' },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#64748b' }} />,
            }}
          />
        </Box>
        <CardContent 
          ref={scrollRef}
          sx={{ p: 0, height: '65vh', overflowY: 'auto', bgcolor: '#020617' }}
        >
          {loading && logs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : (
            <Box sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {filteredLogs.map((log, idx) => (
                <Box key={idx} sx={{ 
                  p: '8px 16px', 
                  borderBottom: '1px solid #0f172a', 
                  display: 'flex', 
                  gap: 2,
                  '&:hover': { bgcolor: '#1e293b' }
                }}>
                  <Typography variant="caption" sx={{ color: '#475569', minWidth: '130px', flexShrink: 0 }}>
                    {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.SSS', { locale: ptBR }) : '--:--:--'}
                  </Typography>
                  
                  <Box sx={{ minWidth: '70px', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={log.level?.toUpperCase() || 'INFO'} 
                      size="small" 
                      variant="filled"
                      color={getLevelColor(log.level)}
                      sx={{ height: 18, fontSize: '9px', fontWeight: 900, borderRadius: 0.5 }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getLogIcon(log)}
                      <Typography variant="body2" sx={{ 
                        color: log.level === 'error' ? '#fca5a5' : log.level === 'warn' ? '#fcd34d' : '#cbd5e1',
                        wordBreak: 'break-all',
                        fontWeight: log.level === 'error' ? 600 : 400
                      }}>
                        {log.message}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ ml: 3, mt: 0.5 }}>
                      {log.service && (
                        <Chip label={`svc: ${log.service}`} size="small" variant="outlined" sx={{ height: 16, fontSize: '8px', color: '#64748b', borderColor: '#1e293b', mr: 1 }} />
                      )}
                      {Object.keys(log).filter(k => !['timestamp', 'level', 'message', 'service'].includes(k)).map(key => (
                        <Box key={key} component="span" sx={{ display: 'inline-block', mr: 2 }}>
                          <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>{key}:</Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', ml: 0.5 }}>
                            {typeof log[key] === 'object' ? JSON.stringify(log[key]) : String(log[key])}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              ))}
              {filteredLogs.length === 0 && (
                <Box sx={{ p: 4, textAlign: 'center', color: '#64748b' }}>
                  <Terminal sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                  <Typography>Nenhum log encontrado para o filtro atual.</Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', color: 'text.secondary' }}>
        <Typography variant="caption">Streaming: {logs.length} eventos carregados</Typography>
        <Typography variant="caption">Retenção: 7 dias (Auto-cleanup)</Typography>
      </Box>
    </Box>
  );
}
