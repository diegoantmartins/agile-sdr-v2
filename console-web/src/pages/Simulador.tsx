import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Send,
  SmartToy,
  Person,
  Psychology,
  History,
  Timer,
} from '@mui/icons-material';
import { useAgentConfig } from '../hooks/useApi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3030';

const scenarios = [
  { value: 'cold', label: 'Lead Frio (Curiosidade)', message: 'Olá, vi seu anúncio mas ainda não sei se preciso de drywall agora.' },
  { value: 'warm', label: 'Lead Interessado (Orçamento)', message: 'Olá, gostaria de um orçamento para instalação de forros em uma obra em SP.' },
  { value: 'hot', label: 'Lead Pronto (Fechamento)', message: 'Preciso fechar o steel frame de uma ampliação hoje, qual o melhor preço?' },
  { value: 'objection_price', label: 'Objeção de Preço', message: 'Achei o valor um pouco alto, a concorrência fez mais barato apenas o material.' },
];

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    reasoning?: string;
    responseTime?: number;
  };
}

export default function Simulador() {
  const [selectedScenario, setSelectedScenario] = useState('warm');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: agentConfig } = useAgentConfig();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const processMessage = async (text: string, currentMessages: ChatMessage[]) => {
    setLoading(true);
    const startTime = Date.now();

    try {
      // Formatar histórico para o formato que o backend espera (OpenAI format)
      const history = currentMessages.map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content
      }));

      const response = await axios.post(`${API_URL}/test/chat`, {
        message: text,
        leadName: 'Lead de Teste',
        phone: '5511999999999',
        useLLM: true,
        classificationMode: 'agile',
        conversationHistory: history
      });

      const data = response.data;
      const responseTime = Date.now() - startTime;

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: data.reply || 'Desculpe, tive um problema ao processar sua mensagem.',
        timestamp: new Date(),
        metadata: {
          intent: data.intent,
          confidence: data.confidence,
          reasoning: data.reasoning,
          responseTime,
        },
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (error) {
      console.error('Simulation error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'agent',
        content: 'Ocorreu um erro na conexão com o servidor de teste.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const startScenario = async () => {
    const scenario = scenarios.find(s => s.value === selectedScenario);
    if (!scenario) return;

    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: scenario.message,
      timestamp: new Date(),
    };

    const newMessages = [initialMessage];
    setMessages(newMessages);
    await processMessage(scenario.message, []);
  };

  const handleSend = async () => {
    if (!userInput.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };

    const prevMessages = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    await processMessage(userInput, prevMessages);
  };

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'BUY_NOW': return 'success';
      case 'HANDOFF_HUMANO': return 'success';
      case 'SUPPORT': return 'info';
      case 'TRIAGE': return 'warning';
      case 'OBRA_SEM_FRENTE': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.03em' }}>
          Simulador <span style={{ color: '#3B82F6' }}>Neural</span>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, fontSize: '1.1rem' }}>
          Valide a arquitetura de decisão do agente e ajuste as regras de negócio em um ambiente sandbox de alta fidelidade.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 24 }} className="stagger-entrance">
            <Card className="glass-panel" sx={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight={800} mb={3} display="flex" alignItems="center" gap={1.5} sx={{ color: 'primary.light' }}>
                  <Psychology /> Parâmetros de Teste
                </Typography>
                
                <FormControl fullWidth sx={{ mb: 4 }}>
                  <InputLabel sx={{ color: 'text.secondary' }}>Cenário Rápido</InputLabel>
                  <Select 
                    value={selectedScenario} 
                    label="Cenário Rápido" 
                    onChange={(e) => setSelectedScenario(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {scenarios.map(s => <MenuItem key={s.value} value={s.value} sx={{ fontWeight: 500 }}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
 
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large"
                  startIcon={<PlayArrow />} 
                  onClick={startScenario}
                  disabled={loading}
                  sx={{ 
                    py: 2, 
                    borderRadius: 2, 
                    fontWeight: 800, 
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Inicializar Cenário
                </Button>
 
                <Box sx={{ mt: 5 }}>
                  <Typography variant="overline" color="text.secondary" gutterBottom sx={{ display: 'block', opacity: 0.8 }}>
                    Configuração Ativa
                  </Typography>
                  <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)', borderStyle: 'dashed' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.light' }}>{agentConfig?.companyName || 'Sincronizando...'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>{agentConfig?.tone} • {agentConfig?.businessNiche}</Typography>
                    </CardContent>
                  </Card>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12} md={8} className="stagger-entrance">
          <Card className="glass-panel" sx={{ 
            height: '70vh', 
            display: 'flex', 
            flexDirection: 'column', 
            borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ 
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', 
                  width: 40, 
                  height: 40,
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                  className: 'float-animation'
                }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Terminal de Simulação</Typography>
                  <Typography variant="caption" sx={{ color: 'success.light', display: 'flex', alignItems: 'center', gap: 0.8, fontWeight: 600 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'currentColor', boxShadow: '0 0 8px currentColor' }} /> CONVERSA LIVRE ATIVA
                  </Typography>
                </Box>
              </Box>
              <Button 
                size="small" 
                variant="outlined" 
                startIcon={<History />} 
                onClick={() => setMessages([])}
                sx={{ borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)', color: 'text.secondary' }}
              >
                Nova Conversa
              </Button>
            </Box>

            <CardContent id="chat-container" sx={{ 
              flex: 1, 
              overflowY: 'auto', 
              bgcolor: 'rgba(0,0,0,0.15)', 
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}>
              {messages.length === 0 ? (
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3 }}>
                  <Psychology sx={{ fontSize: 80, mb: 2, color: 'primary.main' }} />
                  <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">Conversa Livre</Typography>
                  <Typography variant="body2">Comece a digitar abaixo para conversar livremente com o Agente.</Typography>
                </Box>
              ) : (
                messages.map((m) => (
                  <Box key={m.id} sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 1
                  }}>
                    <Box sx={{ display: 'flex', gap: 2, maxWidth: '85%', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                      <Avatar sx={{ 
                        width: 36, 
                        height: 36, 
                        bgcolor: m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'primary.main',
                        border: m.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        mt: 0.5
                      }}>
                        {m.role === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                      </Avatar>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <Box sx={{ 
                          p: 2, 
                          borderRadius: 3, 
                          bgcolor: m.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.03)',
                          color: '#fff',
                          boxShadow: m.role === 'agent' ? 'inset 0 0 20px rgba(255,255,255,0.02)' : '0 4px 12px rgba(59, 130, 246, 0.2)',
                          border: '1px solid',
                          borderColor: m.role === 'user' ? 'primary.main' : 'rgba(255,255,255,0.08)',
                          borderTopRightRadius: m.role === 'user' ? 2 : 24,
                          borderTopLeftRadius: m.role === 'agent' ? 2 : 24,
                        }}>
                          <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                        </Box>
                        
                        {m.role === 'agent' && m.metadata && (
                          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Tooltip title={`Raciocínio: ${m.metadata.reasoning}`}>
                              <Chip 
                                label={m.metadata.intent} 
                                size="small" 
                                color={getIntentColor(m.metadata.intent)}
                                sx={{ 
                                  height: 22, 
                                  fontSize: '0.65rem', 
                                  fontWeight: 800, 
                                  fontFamily: '"JetBrains Mono", monospace',
                                  textTransform: 'uppercase'
                                }}
                              />
                            </Tooltip>
                            {m.metadata.confidence !== undefined && (
                              <Chip 
                                label={`${Math.round(m.metadata.confidence * 100)}% Match`} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  height: 22, 
                                  fontSize: '0.65rem', 
                                  fontFamily: '"JetBrains Mono", monospace',
                                  borderColor: 'rgba(255,255,255,0.1)' 
                                }}
                              />
                            )}
                            <Chip 
                              icon={<Timer sx={{ fontSize: '10px !important' }} />}
                              label={`${m.metadata.responseTime}ms`} 
                              size="small" 
                              variant="outlined"
                              sx={{ 
                                height: 22, 
                                fontSize: '0.65rem', 
                                fontFamily: '"JetBrains Mono", monospace',
                                borderColor: 'rgba(255,255,255,0.1)' 
                              }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
              {loading && (
                <Box sx={{ display: 'flex', gap: 2, maxWidth: '85%' }}>
                   <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', mt: 0.5 }}>
                    <SmartToy fontSize="small" />
                  </Avatar>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255,255,255,0.03)', 
                    borderRadius: 3, 
                    borderTopLeftRadius: 2, 
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: 'inset 0 0 20px rgba(255,255,255,0.02)' 
                  }}>
                    <Box sx={{ display: 'flex', gap: 0.8, py: 0.5 }}>
                      <Box sx={{ width: 6, height: 6, bgcolor: 'primary.light', borderRadius: '50%', animation: 'bounce 1s infinite 0s', opacity: 0.7 }} />
                      <Box sx={{ width: 6, height: 6, bgcolor: 'primary.light', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s', opacity: 0.7 }} />
                      <Box sx={{ width: 6, height: 6, bgcolor: 'primary.light', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s', opacity: 0.7 }} />
                    </Box>
                  </Box>
                </Box>
              )}
              <div ref={chatEndRef} />
            </CardContent>

            <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.05)', bgcolor: 'rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField 
                  fullWidth 
                  size="medium" 
                  placeholder="Envie uma mensagem livre ou escolha um cenário..." 
                  value={userInput} 
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  disabled={loading}
                  variant="outlined"
                  sx={{ 
                    '& .MuiOutlinedInput-root': { 
                      borderRadius: 4,
                      bgcolor: 'rgba(0,0,0,0.2)'
                    } 
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={handleSend} 
                  disabled={!userInput.trim() || loading}
                  sx={{ 
                    borderRadius: 3, 
                    minWidth: 56, 
                    height: 56,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <Send />
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </Box>
  );
}