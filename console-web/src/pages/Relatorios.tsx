import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Analytics, TrendingUp, People, CalendarMonth } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockDailyData = [
  { day: 'Seg', conversations: 45, qualified: 12 },
  { day: 'Ter', conversations: 52, qualified: 15 },
  { day: 'Qua', conversations: 38, qualified: 10 },
  { day: 'Qui', conversations: 61, qualified: 18 },
  { day: 'Sex', conversations: 55, qualified: 14 },
];

const mockSources = [
  { source: 'WhatsApp', count: 145 },
  { source: 'Website', count: 89 },
  { source: 'Indicação', count: 56 },
];

export default function Relatorios() {
  const [period, setPeriod] = useState('7d');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAiInsight(`🎯 Análise da IA:

1. Ponto de queda: 45% dos leads param na etapa de interesse → qualificação

2. Sugestões:
   - Adicionar mais perguntas qualificadoras
   - Antecipar objeções de preço
   - Incluir social proof

3. Recomendação: Focar em melhorar transição de "interesse" para "qualificado"`);
      setAnalyzing(false);
    }, 2000);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Relatórios & Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Métricas completas da performance comercial</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Período</InputLabel>
          <Select value={period} label="Período" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="7d">Últimos 7 dias</MenuItem>
            <MenuItem value="30d">Últimos 30 dias</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={6} sm={4} md={2} className="stagger-entrance">
          <Card className="hover-lift"><CardContent sx={{ textAlign: 'center' }}><People color="primary" sx={{ fontSize: 32, mb: 1 }} /><Typography variant="h4" fontWeight={700}>342</Typography><Typography variant="body2" color="text.secondary">Conversas</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card><CardContent sx={{ textAlign: 'center' }}><Typography variant="h4" fontWeight={700}>45s</Typography><Typography variant="body2" color="text.secondary">Tempo Médio</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card><CardContent sx={{ textAlign: 'center' }}><Typography variant="h4" fontWeight={700}>12%</Typography><Typography variant="body2" color="text.secondary">Abandono</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card><CardContent sx={{ textAlign: 'center' }}><TrendingUp color="success" sx={{ fontSize: 32, mb: 1 }} /><Typography variant="h4" fontWeight={700}>89</Typography><Typography variant="body2" color="text.secondary">Qualificados</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card><CardContent sx={{ textAlign: 'center' }}><CalendarMonth color="primary" sx={{ fontSize: 32, mb: 1 }} /><Typography variant="h4" fontWeight={700}>28</Typography><Typography variant="body2" color="text.secondary">Reuniões</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card><CardContent sx={{ textAlign: 'center' }}><Analytics color="secondary" sx={{ fontSize: 32, mb: 1 }} /><Typography variant="h4" fontWeight={700}>8.2%</Typography><Typography variant="body2" color="text.secondary">Conversão</Typography></CardContent></Card>
        </Grid>

        <Grid item xs={12} md={8} className="stagger-entrance">
          <Card className="glass-panel">
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Performance Semanal</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockDailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversations" fill="#682EE4" name="Conversas" />
                  <Bar dataKey="qualified" fill="#10B981" name="Qualificados" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4} className="stagger-entrance">
          <Card className="glass-panel" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Origem dos Leads</Typography>
              {mockSources.map((item) => (
                <Box key={item.source} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item.source}</Typography>
                  <Chip label={item.count} size="small" />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} className="stagger-entrance">
          <Card className="float-animation" sx={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)', borderColor: 'rgba(59, 130, 246, 0.2)', backdropFilter: 'blur(10px)' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box><Typography variant="h6" fontWeight={600} color="primary.light">🤖 Análise Inteligente</Typography><Typography variant="body2" color="text.secondary" mb={2}>Deixe a IA analisar seus dados</Typography></Box>
              <Button variant="contained" onClick={handleAnalyze} disabled={analyzing} sx={{ ml: 'auto' }}>{analyzing ? <CircularProgress size={24} /> : 'Analisar com IA'}</Button>
            </CardContent>
          </Card>
        </Grid>

        {aiInsight && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} color="#D97706" mb={2}>💡 Insights da IA</Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: '#92400E' }}>{aiInsight}</Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}