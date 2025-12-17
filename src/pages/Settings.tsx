import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, ArrowLeft, Loader2, Building, Clock, CreditCard } from 'lucide-react';

interface BusinessHour {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const Settings = () => {
  const { user, company, subscription, isLoading, refreshCompany } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [advancePayment, setAdvancePayment] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingHours, setLoadingHours] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (company) {
      setCompanyName(company.name);
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setAddress(company.address || '');
      setAdvancePayment(company.advance_payment_enabled);
      fetchBusinessHours();
    }
  }, [company]);

  const fetchBusinessHours = async () => {
    if (!company) return;
    const { data } = await supabase
      .from('business_hours')
      .select('*')
      .eq('company_id', company.id)
      .order('day_of_week');
    
    if (data && data.length > 0) {
      setBusinessHours(data);
    } else {
      // Default hours
      const defaultHours = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i,
        start_time: '09:00',
        end_time: '18:00',
        is_closed: i === 0
      }));
      setBusinessHours(defaultHours);
    }
    setLoadingHours(false);
  };

  const handleSaveCompany = async () => {
    if (!company) return;
    setSaving(true);

    const { error } = await supabase
      .from('companies')
      .update({
        name: companyName,
        phone: phone || null,
        email: email || null,
        address: address || null,
        advance_payment_enabled: advancePayment
      })
      .eq('id', company.id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Dados salvos com sucesso!' });
      refreshCompany();
    }
    setSaving(false);
  };

  const handleSaveHours = async () => {
    if (!company) return;
    setSaving(true);

    // Delete existing hours and insert new ones
    await supabase.from('business_hours').delete().eq('company_id', company.id);

    const hoursToInsert = businessHours.map(h => ({
      company_id: company.id,
      day_of_week: h.day_of_week,
      start_time: h.start_time,
      end_time: h.end_time,
      is_closed: h.is_closed
    }));

    const { error } = await supabase.from('business_hours').insert(hoursToInsert);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Horários salvos!' });
    }
    setSaving(false);
  };

  const updateBusinessHour = (dayOfWeek: number, field: keyof BusinessHour, value: any) => {
    setBusinessHours(hours => 
      hours.map(h => h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h)
    );
  };

  const handleManageSubscription = async () => {
    const { data } = await supabase.functions.invoke('customer-portal');
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  const handleCheckout = async () => {
    const { data } = await supabase.functions.invoke('create-checkout');
    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Configurações</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horários
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Assinatura
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>Informações exibidas para seus clientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, bairro..." />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                  <div>
                    <Label>Pagamento Antecipado</Label>
                    <p className="text-sm text-muted-foreground">Clientes pagam ao agendar</p>
                  </div>
                  <Switch checked={advancePayment} onCheckedChange={setAdvancePayment} />
                </div>
                <Button onClick={handleSaveCompany} className="w-full gradient-primary" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Salvar Alterações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
                <CardDescription>Configure os dias e horários disponíveis para agendamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingHours ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <>
                    {businessHours.map((hour) => (
                      <div key={hour.day_of_week} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="w-24">
                          <span className="font-medium">{dayNames[hour.day_of_week]}</span>
                        </div>
                        <Switch
                          checked={!hour.is_closed}
                          onCheckedChange={(checked) => updateBusinessHour(hour.day_of_week, 'is_closed', !checked)}
                        />
                        {!hour.is_closed && (
                          <>
                            <Input
                              type="time"
                              value={hour.start_time}
                              onChange={(e) => updateBusinessHour(hour.day_of_week, 'start_time', e.target.value)}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">até</span>
                            <Input
                              type="time"
                              value={hour.end_time}
                              onChange={(e) => updateBusinessHour(hour.day_of_week, 'end_time', e.target.value)}
                              className="w-32"
                            />
                          </>
                        )}
                        {hour.is_closed && (
                          <span className="text-muted-foreground">Fechado</span>
                        )}
                      </div>
                    ))}
                    <Button onClick={handleSaveHours} className="w-full gradient-primary" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Salvar Horários
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Sua Assinatura</CardTitle>
                <CardDescription>Gerencie seu plano e pagamentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {subscription?.status === 'trialing' && (
                      <span className="px-2 py-1 rounded bg-warning/20 text-warning text-sm font-medium">
                        Período de Teste
                      </span>
                    )}
                    {subscription?.status === 'active' && (
                      <span className="px-2 py-1 rounded bg-success/20 text-success text-sm font-medium">
                        Ativa
                      </span>
                    )}
                    {(subscription?.status === 'canceled' || subscription?.status === 'past_due' || subscription?.status === 'unpaid') && (
                      <span className="px-2 py-1 rounded bg-destructive/20 text-destructive text-sm font-medium">
                        Inativa
                      </span>
                    )}
                  </div>
                  {subscription?.trial_ends_at && subscription.status === 'trialing' && (
                    <p className="text-sm text-muted-foreground">
                      Teste termina em: {new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {subscription?.current_period_end && subscription.status === 'active' && (
                    <p className="text-sm text-muted-foreground">
                      Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-bold">R$ 12,99</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Acesso completo a todas as funcionalidades
                  </p>
                </div>

                {subscription?.status === 'active' ? (
                  <Button variant="outline" className="w-full" onClick={handleManageSubscription}>
                    Gerenciar Assinatura
                  </Button>
                ) : (
                  <Button className="w-full gradient-primary" onClick={handleCheckout}>
                    {subscription?.status === 'trialing' ? 'Assinar Agora' : 'Reativar Assinatura'}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
