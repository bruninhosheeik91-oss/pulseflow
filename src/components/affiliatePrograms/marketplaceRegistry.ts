import type { LucideIcon } from 'lucide-react';
import { Store, ShoppingBag, Music2, Package, Globe } from 'lucide-react';

// Registry de Programas de Afiliados.
//
// Cada marketplace é declarado AQUI (dados + ícone + disponibilidade). A página
// apenas renderiza AFFILIATE_PROGRAMS + o painel apontado por `configKey`,
// permitindo adicionar novos marketplaces sem duplicar a página. Integrações
// ainda não disponíveis ficam `available: false` → card "Em breve".

export type MarketplaceConfigKey = 'shopee' | null;

export interface MarketplaceProgram {
  id: string;
  name: string;
  programName: string;
  description: string;
  icon: LucideIcon;
  iconColorClass: string;
  available: boolean;
  configKey: MarketplaceConfigKey;
}

export const AFFILIATE_PROGRAMS: MarketplaceProgram[] = [
  {
    id: 'shopee',
    name: 'Shopee',
    programName: 'Programa de Afiliados · Open Platform',
    description:
      'Credenciais da Open Platform para geração automática de links de afiliados.',
    icon: Store,
    iconColorClass: 'text-orange-400',
    available: true,
    configKey: 'shopee',
  },
  {
    id: 'mercadoLivre',
    name: 'Mercado Livre',
    programName: 'Programa de Afiliados',
    description:
      'Programa de afiliados do Mercado Livre em desenvolvimento.',
    icon: ShoppingBag,
    iconColorClass: 'text-yellow-300',
    available: false,
    configKey: null,
  },
  {
    id: 'tiktokShop',
    name: 'TikTok Shop',
    programName: 'TikTok Shop Affiliate',
    description:
      'Afiliados TikTok Shop em desenvolvimento.',
    icon: Music2,
    iconColorClass: 'text-pink-400',
    available: false,
    configKey: null,
  },
  {
    id: 'amazon',
    name: 'Amazon',
    programName: 'Amazon Associates',
    description:
      'Amazon Associates em desenvolvimento.',
    icon: Package,
    iconColorClass: 'text-amber-300',
    available: false,
    configKey: null,
  },
  {
    id: 'aliExpress',
    name: 'AliExpress',
    programName: 'AliExpress Affiliate',
    description:
      'Programa de afiliados AliExpress em desenvolvimento.',
    icon: Globe,
    iconColorClass: 'text-sky-400',
    available: false,
    configKey: null,
  },
];

export function getAffiliateProgram(
  id: string | null
): MarketplaceProgram | undefined {
  if (!id) return undefined;
  return AFFILIATE_PROGRAMS.find((program) => program.id === id);
}