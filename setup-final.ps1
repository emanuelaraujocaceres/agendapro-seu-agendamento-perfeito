# Save as: setup-final.ps1
Write-Host "🚀 Configurando projeto AGENDAPRO com Supabase..." -ForegroundColor Green

# 1. Configurar arquivo .env
Write-Host "`n📝 Configurando variáveis de ambiente..." -ForegroundColor Yellow
@'
# Supabase Configuration
VITE_SUPABASE_URL=https://azqwrspxksumxrbtpgip.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_SIV9JwsFEcK24sE0AtM6tA_vGKKthFt
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_A6Ewy-QsJplikMn-Y0wjHQ_2q30iHxV
'@ | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Host "   ✅ .env configurado com suas chaves do Supabase" -ForegroundColor Green

# 2. Atualizar o cliente Supabase
Write-Host "`n🔧 Configurando cliente Supabase..." -ForegroundColor Yellow
@'
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
'@ | Out-File -FilePath "src/integrations/supabase/client.ts" -Encoding UTF8 -Force
Write-Host "   ✅ Cliente Supabase configurado" -ForegroundColor Green

# 3. Criar tabelas no Supabase (SQL para executar no dashboard)
Write-Host "`n🗄️ Criando esquema do banco de dados..." -ForegroundColor Yellow
$schemaSQL = @'
-- Tabela de empresas
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  segment TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  advance_payment_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabela de horários comerciais
CREATE TABLE IF NOT EXISTS business_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Função para gerar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(company_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Cria slug base
  base_slug := lower(trim(company_name));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := regexp_replace(base_slug, '^-|-$', '', 'g');
  
  unique_slug := base_slug;
  
  -- Verifica se já existe e incrementa
  WHILE EXISTS (SELECT 1 FROM companies WHERE slug = unique_slug) LOOP
    unique_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN unique_slug;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS (Row Level Security)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- Políticas para companies
CREATE POLICY "Users can view own company" 
  ON companies FOR SELECT 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own company" 
  ON companies FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own company" 
  ON companies FOR UPDATE 
  USING (auth.uid() = owner_id);

-- Políticas para subscriptions
CREATE POLICY "Users can view own subscriptions" 
  ON subscriptions FOR SELECT 
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own subscriptions" 
  ON subscriptions FOR INSERT 
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own subscriptions" 
  ON subscriptions FOR UPDATE 
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

-- Políticas para business_hours
CREATE POLICY "Users can view own business hours" 
  ON business_hours FOR SELECT 
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert own business hours" 
  ON business_hours FOR INSERT 
  WITH CHECK (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update own business hours" 
  ON business_hours FOR UPDATE 
  USING (company_id IN (SELECT id FROM companies WHERE owner_id = auth.uid()));
'@

Write-Host "   📋 SQL para criar tabelas:" -ForegroundColor Cyan
Write-Host "`n$schemaSQL`n" -ForegroundColor Gray

Write-Host "   ⚠️  Execute este SQL no SQL Editor do seu projeto Supabase" -ForegroundColor Yellow
Write-Host "   🔗 Acesse: https://azqwrspxksumxrbtpgip.supabase.co" -ForegroundColor White
Write-Host "   👉 Vá em: SQL Editor > New query > Cole o SQL > Run" -ForegroundColor White

# 4. Verificar se temos todos os componentes necessários
Write-Host "`n🧩 Verificando componentes..." -ForegroundColor Yellow
$missingComponents = @()

# Verificar componentes necessários
$requiredComponents = @(
    "src/components/ProtectedRoute.tsx",
    "src/components/layout/Layout.tsx",
    "src/components/layout/Header.tsx",
    "src/components/layout/Sidebar.tsx"
)

foreach ($component in $requiredComponents) {
    if (-not (Test-Path $component)) {
        $missingComponents += $component
        Write-Host "   ❌ $component não encontrado" -ForegroundColor Red
    } else {
        Write-Host "   ✅ $component já existe" -ForegroundColor Green
    }
}

if ($missingComponents.Count -gt 0) {
    Write-Host "   📝 Criando componentes faltantes..." -ForegroundColor Cyan
    
    # Criar ProtectedRoute se não existir
    if ($missingComponents.Contains("src/components/ProtectedRoute.tsx")) {
        @'
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}
'@ | Out-File -FilePath "src/components/ProtectedRoute.tsx" -Encoding UTF8
        Write-Host "   ✅ ProtectedRoute.tsx criado" -ForegroundColor Green
    }
    
    # Criar Layout se não existir
    if ($missingComponents.Contains("src/components/layout/Layout.tsx")) {
        @'
import Sidebar from './Sidebar';
import Header from './Header';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
'@ | Out-File -FilePath "src/components/layout/Layout.tsx" -Encoding UTF8
        Write-Host "   ✅ Layout.tsx criado" -ForegroundColor Green
    }
}

# 5. Verificar se App.tsx está correto
Write-Host "`n⚛️ Verificando App.tsx..." -ForegroundColor Yellow
if (Test-Path "src/App.tsx") {
    $appContent = Get-Content "src/App.tsx" -Raw
    if ($appContent -match "AuthProvider" -and $appContent -match "ProtectedRoute") {
        Write-Host "   ✅ App.tsx já está configurado" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  App.tsx precisa ser atualizado" -ForegroundColor Yellow
        # Atualizar App.tsx
        @'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Appointments from "./pages/Appointments";
import Booking from "./pages/Booking";
import Professionals from "./pages/Professionals";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rotas públicas */}
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas protegidas com layout */}
            <Route element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agendamentos" element={<Appointments />} />
              <Route path="/agendar" element={<Booking />} />
              <Route path="/profissionais" element={<Professionals />} />
              <Route path="/servicos" element={<Services />} />
              <Route path="/configuracoes" element={<Settings />} />
              <Route path="/agendar/demo" element={<Booking />} />
            </Route>
            
            {/* Rota de fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
'@ | Out-File -FilePath "src/App.tsx" -Encoding UTF8 -Force
        Write-Host "   ✅ App.tsx atualizado" -ForegroundColor Green
    }
}

# 6. Instalar dependências se necessário
Write-Host "`n📦 Verificando dependências..." -ForegroundColor Yellow
$deps = @("sonner", "@tanstack/react-query")
foreach ($dep in $deps) {
    $check = npm list $dep 2>$null
    if (-not $check) {
        Write-Host "   📦 Instalando $dep..." -ForegroundColor Cyan
        npm install $dep
    }
}

Write-Host "`n✨ Configuração concluída!" -ForegroundColor Green
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "   1. Execute o SQL acima no SQL Editor do Supabase" -ForegroundColor White
Write-Host "   2. Inicie o projeto: npm run dev" -ForegroundColor White
Write-Host "   3. Acesse: http://localhost:5173" -ForegroundColor White
Write-Host "   4. Crie uma conta para testar" -ForegroundColor White
Write-Host "`n🔧 PARA ACESSAR O SUPABASE:" -ForegroundColor Cyan
Write-Host "   URL: https://azqwrspxksumxrbtpgip.supabase.co" -ForegroundColor White
Write-Host "   Project ID: azqwrspxksumxrbtpgip" -ForegroundColor White