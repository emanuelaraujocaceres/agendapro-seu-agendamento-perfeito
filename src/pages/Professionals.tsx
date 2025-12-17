import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Pencil, Trash2, ArrowLeft, Loader2, Users } from 'lucide-react';

interface Professional {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
}

const Professionals = () => {
  const { user, company, isLoading, isSubscriptionActive } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) navigate('/auth');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (company) fetchProfessionals();
  }, [company]);

  const fetchProfessionals = async () => {
    if (!company) return;
    const { data } = await supabase
      .from('professionals')
      .select('*')
      .eq('company_id', company.id)
      .order('name');
    if (data) setProfessionals(data);
    setLoadingData(false);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setIsActive(true);
    setEditingProfessional(null);
  };

  const openEditDialog = (professional: Professional) => {
    setEditingProfessional(professional);
    setName(professional.name);
    setEmail(professional.email || '');
    setPhone(professional.phone || '');
    setIsActive(professional.is_active);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);

    const professionalData = {
      company_id: company.id,
      name,
      email: email || null,
      phone: phone || null,
      is_active: isActive,
    };

    if (editingProfessional) {
      const { error } = await supabase
        .from('professionals')
        .update(professionalData)
        .eq('id', editingProfessional.id);

      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Profissional atualizado!' });
        setIsDialogOpen(false);
        resetForm();
        fetchProfessionals();
      }
    } else {
      const { error } = await supabase.from('professionals').insert(professionalData);

      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Profissional criado!' });
        setIsDialogOpen(false);
        resetForm();
        fetchProfessionals();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
    
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profissional excluído!' });
      fetchProfessionals();
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Profissionais</span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" disabled={!isSubscriptionActive}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Profissional
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (opcional)</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Profissional ativo</Label>
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingProfessional ? 'Salvar Alterações' : 'Criar Profissional'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loadingData ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card animate-pulse">
                <CardContent className="p-6 h-32"></CardContent>
              </Card>
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum profissional cadastrado</h3>
              <p className="text-muted-foreground mb-4">Adicione profissionais se sua empresa tiver mais de uma pessoa atendendo.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((professional) => (
              <Card key={professional.id} className={`glass-card hover-lift ${!professional.is_active ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="gradient-primary text-primary-foreground">
                          {getInitials(professional.name)}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg">{professional.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(professional)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(professional.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {professional.email && (
                    <p className="text-sm text-muted-foreground">{professional.email}</p>
                  )}
                  {professional.phone && (
                    <p className="text-sm text-muted-foreground">{professional.phone}</p>
                  )}
                  {!professional.is_active && (
                    <span className="text-xs text-muted-foreground mt-2 block">Inativo</span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Professionals;
