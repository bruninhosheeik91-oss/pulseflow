import { useCallback, useEffect, useState } from 'react';
import {
  getShopeeCredentials,
  sanitizeAffiliateError,
  ShopeeCredentialsView,
} from '../../services/affiliatePrograms/affiliateProgramsService';

export interface UseShopeeCredentialsResult {
  view: ShopeeCredentialsView | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setView: (view: ShopeeCredentialsView | null) => void;
}

export function useShopeeCredentials(
  tenantId: string | null
): UseShopeeCredentialsResult {
  const [view, setView] = useState<ShopeeCredentialsView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) {
      setView(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setView(await getShopeeCredentials(tenantId));
    } catch (err) {
      setError(sanitizeAffiliateError(err));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { view, loading, error, reload, setView };
}