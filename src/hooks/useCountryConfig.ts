import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useGeoCity } from '@/hooks/useGeoCity';

export interface CountryConfig {
  id: string;
  code: string;
  name: string;
  flag_emoji: string;
  currency: string;
  currency_symbol: string;
  language: string;
  support_email: string | null;
  support_whatsapp: string | null;
  commission_rate: number;
  enabled: boolean;
}

const FALLBACK: CountryConfig = {
  id: 'fallback',
  code: 'BF',
  name: 'Burkina Faso',
  flag_emoji: '🇧🇫',
  currency: 'XOF',
  currency_symbol: 'FCFA',
  language: 'fr',
  support_email: 'contact@sapsaphouse.com',
  support_whatsapp: '+22657976660',
  commission_rate: 6,
  enabled: true,
};

export function useAllCountryConfigs() {
  return useQuery({
    queryKey: ['country_configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_configs')
        .select('*')
        .order('name');
      if (error) throw error;
      return (data || []) as CountryConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCountryConfig(): CountryConfig {
  const { activeCity } = useGeoCity();
  const { data } = useAllCountryConfigs();
  const code = activeCity?.country || 'BF';
  return data?.find((c) => c.code === code) ?? FALLBACK;
}
