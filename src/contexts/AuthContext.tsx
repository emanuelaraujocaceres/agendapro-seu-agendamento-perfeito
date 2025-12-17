import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  slug: string;
  segment: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  advance_payment_enabled: boolean;
}

interface Subscription {
  id: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  trial_ends_at: string | null;
  current_period_end: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  company: Company | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isSubscriptionActive: boolean;
  signUp: (email: string, password: string, fullName: string, companyName: string, segment: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSubscriptionActive = subscription?.status === 'trialing' || subscription?.status === 'active';

  const fetchCompany = async (userId: string) => {
    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    
    if (data) {
      setCompany(data as Company);
      return data.id;
    }
    return null;
  };

  const fetchSubscription = async (companyId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();
    
    if (data) {
      setSubscription(data as Subscription);
    }
  };

  const refreshCompany = async () => {
    if (user) {
      const companyId = await fetchCompany(user.id);
      if (companyId) {
        await fetchSubscription(companyId);
      }
    }
  };

  const refreshSubscription = async () => {
    if (company) {
      await fetchSubscription(company.id);
    }
  };

  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchCompany(session.user.id).then(companyId => {
              if (companyId) {
                fetchSubscription(companyId);
              }
            });
          }, 0);
        } else {
          setCompany(null);
          setSubscription(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchCompany(session.user.id).then(companyId => {
          if (companyId) {
            fetchSubscription(companyId);
          }
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, companyName: string, segment: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: fullName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      // ⭐⭐ SOLUÇÃO: Aguardar a sessão ser estabelecida ⭐⭐
      // Se não tiver session, espera 1.5 segundos
      if (!authData.session) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Generate unique slug
      const { data: slugData } = await supabase.rpc('generate_unique_slug', { company_name: companyName });
      const slug = slugData || companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          owner_id: authData.user.id,
          name: companyName,
          slug,
          segment,
          email
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Create trial subscription (7 days)
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          company_id: companyData.id,
          status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString()
        });

      if (subError) throw subError;

      // Create default business hours (Mon-Sat 9-18)
      const businessHours = [];
      for (let day = 1; day <= 6; day++) {
        businessHours.push({
          company_id: companyData.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '18:00',
          is_closed: false
        });
      }
      businessHours.push({
        company_id: companyData.id,
        day_of_week: 0,
        start_time: '09:00',
        end_time: '18:00',
        is_closed: true
      });

      await supabase.from('business_hours').insert(businessHours);

      return { error: null };
    } catch (error) {
      console.error('SignUp error:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCompany(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      company,
      subscription,
      isLoading,
      isSubscriptionActive,
      signUp,
      signIn,
      signOut,
      refreshCompany,
      refreshSubscription
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};