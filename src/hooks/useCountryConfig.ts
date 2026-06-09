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

// Liste publique (sans contacts support, restreints aux utilisateurs connectés via la fonction get_country_support).
const PUBLIC_COLS = 'id,code,name,flag_emoji,currency,currency_symbol,language,commission_rate,enabled';

export function useAllCountryConfigs() {
  return useQuery({
    queryKey: ['country_configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_configs')
        .select(PUBLIC_COLS)
        .order('name');
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        support_email: null,
        support_whatsapp: null,
      })) as CountryConfig[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Récupère les contacts support (réservé aux utilisateurs authentifiés). */
export async function fetchCountrySupport(code: string): Promise<{ support_email: string | null; support_whatsapp: string | null } | null> {
  const { data, error } = await supabase.rpc('get_country_support', { _code: code });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { support_email: row.support_email ?? null, support_whatsapp: row.support_whatsapp ?? null } : null;
}

export function useCountryConfig(): CountryConfig {
  const { activeCity } = useGeoCity();
  const { data } = useAllCountryConfigs();
  const code = activeCity?.country || 'BF';
  return data?.find((c) => c.code === code) ?? FALLBACK;
}
