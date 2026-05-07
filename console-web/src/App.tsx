import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import Conversas from './pages/Conversas';
import Leads from './pages/Leads';
import Relatorios from './pages/Relatorios';
import Agente from './pages/Agente';
import Fluxos from './pages/Fluxos';
import Simulador from './pages/Simulador';
import Integracoes from './pages/Integracoes';
import Configuracoes from './pages/Configuracoes';
import Alertas from './pages/Alertas';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Logs from './pages/Logs';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route index element={<Dashboard />} />
                      <Route path="conversas" element={<Conversas />} />
                      <Route path="leads" element={<Leads />} />
                      <Route path="relatorios" element={<Relatorios />} />
                      <Route path="agente" element={<Agente />} />
                      <Route path="fluxos" element={<Fluxos />} />
                      <Route path="simulador" element={<Simulador />} />
                      <Route path="integracoes" element={<Integracoes />} />
                      <Route path="configuracoes" element={<Configuracoes />} />
                      <Route path="alertas" element={<Alertas />} />
                      <Route path="logs" element={<Logs />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;