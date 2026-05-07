import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
import { Refresh, Search, Terminal } from '@mui/icons-material';
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

  const fetchLogs = async () => {
    try {
      const data = await logsService.get();
      setLogs(data.logs);
      setError('');
    } catch (err: any) {
      setError('Erro ao carregar logs do servidor.');
    } finally {
      setLoading(false);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>System Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Monitoramento em tempo real de eventos e erros do Agente Agile SDR
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Chip 
            label={autoRefresh ? "Auto-refresh: ON (5s)" : "Auto-refresh: OFF"} 
            color={autoRefresh ? "success" : "default"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outlined"
            size="small"
          />
          <IconButton onClick={fetchLogs} disabled={loading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card sx={{ bgcolor: '#1e293b', color: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #334155', display: 'flex', gap: 2, bgcolor: '#0f172a' }}>
          <TextField
            size="small"
            placeholder="Filtrar por mensagem, nível ou serviço..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ 
              flex: 1, 
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: '#94a3b8' },
            }}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: '#64748b' }} />,
            }}
          />
        </Box>
        <CardContent sx={{ p: 0, height: '65vh', overflowY: 'auto', bgcolor: '#0f172a' }}>
          {loading && logs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress color="inherit" />
            </Box>
          ) : (
            <Box sx={{ fontFamily: 'monospace', fontSize: '13px' }}>
              {filteredLogs.map((log, idx) => (
                <Box key={idx} sx={{ 
                  p: 1.5, 
                  borderBottom: '1px solid #1e293b', 
                  display: 'flex', 
                  gap: 2,
                  '&:hover': { bgcolor: '#1e293b' }
                }}>
                  <Typography variant="caption" sx={{ color: '#64748b', minWidth: '130px', flexShrink: 0 }}>
                    {log.timestamp ? format(new Date(log.timestamp), 'HH:mm:ss.SSS', { locale: ptBR }) : '--:--:--'}
                  </Typography>
                  
                  <Box sx={{ minWidth: '70px', flexShrink: 0 }}>
                    <Chip 
                      label={log.level?.toUpperCase() || 'INFO'} 
                      size="small" 
                      variant="outlined"
                      color={getLevelColor(log.level)}
                      sx={{ height: 20, fontSize: '10px', fontWeight: 700, borderRadius: 1 }}
                    />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ 
                      color: log.level === 'error' ? '#fca5a5' : log.level === 'warn' ? '#fcd34d' : '#e2e8f0',
                      wordBreak: 'break-all'
                    }}>
                      {log.message}
                    </Typography>
                    {log.service && (
                      <Typography variant="caption" sx={{ color: '#475569', mr: 2 }}>
                        [service: {log.service}]
                      </Typography>
                    )}
                    {Object.keys(log).filter(k => !['timestamp', 'level', 'message', 'service'].includes(k)).map(key => (
                      <Typography key={key} variant="caption" sx={{ color: '#94a3b8', mr: 2, fontStyle: 'italic' }}>
                        {key}: {typeof log[key] === 'object' ? JSON.stringify(log[key]) : log[key]}
                      </Typography>
                    ))}
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
        <Typography variant="caption">Total carregado: {logs.length} linhas</Typography>
        <Typography variant="caption">Última atualização: {format(new Date(), 'HH:mm:ss')}</Typography>
      </Box>
    </Box>
  );
}
