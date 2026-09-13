import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Product,
  ProductQuickFilter,
  ProductFilterState,
  ProductSortOption,
  ProductMarketplaceOffer,
} from '../../types';
import { initialProducts } from '../../data/mockProducts';
import { ProductsHeader } from './ProductsHeader';
import { ProductsMetricsBar } from './ProductsMetricsBar';
import {
  ProductsSearchBar,
  ProductViewMode,
} from './ProductsSearchBar';
import { ProductTable } from './ProductTable';
import { ProductGrid } from './ProductGrid';
import {
  ProductFiltersDrawer,
  initialProductFilterState,
} from './ProductFiltersDrawer';
import { ProductDetailDrawer } from './ProductDetailDrawer';
import { ProductsEmptyState } from './ProductsEmptyState';
import { ProductsSkeleton } from './ProductsSkeleton';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [lastSyncText, setLastSyncText] = useState<string>('—');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<ProductQuickFilter>('Produtos');
  const [drawerFilters, setDrawerFilters] = useState<ProductFilterState>(
    initialProductFilterState
  );
  const [isFiltersDrawerOpen, setIsFiltersDrawerOpen] = useState<boolean>(false);
  const [sortOption, setSortOption] =
    useState<ProductSortOption>('best_opportunity');
  const [viewMode, setViewMode] = useState<ProductViewMode>('list');

  // Selection & Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Refresh simulation
  const handleRefreshCatalog = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      setLastSyncText('agora mesmo');
      showToast('Catálogo sincronizado com sucesso em todos os marketplaces!');
    }, 1200);
  };

  // Count active drawer filters
  const activeDrawerFiltersCount = useMemo(() => {
    let count = 0;
    if (drawerFilters.category !== 'Todas') count++;
    if (drawerFilters.marketplaces.length > 0) count++;
    if (drawerFilters.minOffers > 0) count++;
    if (drawerFilters.minScore > 0) count++;
    if (drawerFilters.minPrice !== '') count++;
    if (drawerFilters.maxPrice !== '') count++;
    if (drawerFilters.status !== 'Todos') count++;
    if (drawerFilters.performance !== 'Todas') count++;
    return count;
  }, [drawerFilters]);

  // Reset all filters
  const handleResetAllFilters = () => {
    setSearchQuery('');
    setQuickFilter('Produtos');
    setDrawerFilters(initialProductFilterState);
    setCurrentPage(1);
    showToast('Filtros restaurados para o padrão.', 'info');
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Quick Filter
        if (quickFilter === 'Com ofertas ativas' && product.activeOffersCount === 0)
          return false;
        if (
          quickFilter === 'Multimarketplace' &&
          product.marketplaces.length < 2
        )
          return false;
        if (quickFilter === 'Publicados' && product.publications === 0)
          return false;
        if (
          quickFilter === 'Alta performance' &&
          product.performance !== 'Alta'
        )
          return false;
        if (
          quickFilter === 'Sem oferta ativa' &&
          product.activeOffersCount > 0 &&
          product.status !== 'Sem oferta ativa'
        )
          return false;

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchBrand = product.brand.toLowerCase().includes(q);
          const matchCategory = product.category.toLowerCase().includes(q);
          const matchModel = product.model?.toLowerCase().includes(q) || false;
          const matchMapped =
            product.mappedTitles?.some((m) =>
              m.title.toLowerCase().includes(q)
            ) || false;

          if (
            !matchName &&
            !matchBrand &&
            !matchCategory &&
            !matchModel &&
            !matchMapped
          ) {
            return false;
          }
        }

        // Drawer Filters: Categoria
        if (
          drawerFilters.category !== 'Todas' &&
          product.category !== drawerFilters.category
        ) {
          return false;
        }

        // Drawer Filters: Marketplaces
        if (drawerFilters.marketplaces.length > 0) {
          const hasAnySelected = drawerFilters.marketplaces.some((mp) =>
            product.marketplaces.includes(mp)
          );
          if (!hasAnySelected) return false;
        }

        // Drawer Filters: Número de Ofertas
        if (
          drawerFilters.minOffers > 0 &&
          product.activeOffersCount < drawerFilters.minOffers
        ) {
          return false;
        }

        // Drawer Filters: Deal Score Mínimo
        if (
          drawerFilters.minScore > 0 &&
          product.bestScore.score.total < drawerFilters.minScore
        ) {
          return false;
        }

        // Drawer Filters: Preço Mínimo
        if (
          drawerFilters.minPrice !== '' &&
          product.bestPrice.amount < Number(drawerFilters.minPrice)
        ) {
          return false;
        }

        // Drawer Filters: Preço Máximo
        if (
          drawerFilters.maxPrice !== '' &&
          product.bestPrice.amount > Number(drawerFilters.maxPrice)
        ) {
          return false;
        }

        // Drawer Filters: Status
        if (
          drawerFilters.status !== 'Todos' &&
          product.status !== drawerFilters.status
        ) {
          return false;
        }

        // Drawer Filters: Performance
        if (
          drawerFilters.performance !== 'Todas' &&
          product.performance !== drawerFilters.performance
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
          case 'score':
            return b.bestScore.score.total - a.bestScore.score.total;
          case 'price_asc':
            return a.bestPrice.amount - b.bestPrice.amount;
          case 'offers_count':
            return b.activeOffersCount - a.activeOffersCount;
          case 'sales':
            return b.salesNumber - a.salesNumber;
          case 'publications':
            return b.publications - a.publications;
          case 'commission':
            return b.commissionGenerated - a.commissionGenerated;
          case 'recent':
            return b.updatedAtTimestamp - a.updatedAtTimestamp;
          case 'best_opportunity':
          default:
            return b.bestScore.score.total - a.bestScore.score.total;
        }
      });
  }, [products, quickFilter, searchQuery, drawerFilters, sortOption]);

  // Paginated records
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#EFF6FF] border border-[#2563EB]/50 text-white px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header com Título, Subtítulo e Ação de Atualização */}
      <ProductsHeader
        lastSyncText={lastSyncText}
        isUpdating={isUpdating}
        onRefreshCatalog={handleRefreshCatalog}
      />

      {/* 2. Barra de Indicadores Operacionais / Filtros Rápidos */}
      <ProductsMetricsBar
        activeFilter={quickFilter}
        onSelectFilter={(filter) => {
          setQuickFilter(filter);
          setCurrentPage(1);
        }}
      />

      {/* 3. Barra de Pesquisa, Filtros Drawer, Ordenação e Alternador Lista/Grade */}
      <ProductsSearchBar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentPage(1);
        }}
        sortOption={sortOption}
        onSortChange={setSortOption}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        activeFiltersCount={activeDrawerFiltersCount}
        onOpenFiltersDrawer={() => setIsFiltersDrawerOpen(true)}
      />

      {/* 4. Tabela ou Grade com Resultados */}
      {isLoading ? (
        <ProductsSkeleton viewMode={viewMode} />
      ) : filteredProducts.length === 0 ? (
        <ProductsEmptyState
          onResetFilters={handleResetAllFilters}
          onRefreshCatalog={handleRefreshCatalog}
        />
      ) : (
        <div className="space-y-3">
          {viewMode === 'list' ? (
            <ProductTable
              products={paginatedProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onPublishProduct={(p) => {
                showToast(`Oferta de "${p.name}" selecionada para envio!`);
              }}
            />
          ) : (
            <ProductGrid
              products={paginatedProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          )}

          {/* Paginação Operacional */}
          {filteredProducts.length > itemsPerPage && (
            <div className="flex items-center justify-between p-3 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-xs text-[#64748B]">
              <div className="font-mono-numeric">
                Mostrando{' '}
                <span className="text-[#172033] font-semibold">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                a{' '}
                <span className="text-[#172033] font-semibold">
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                de{' '}
                <span className="text-[#172033] font-semibold">
                  {filteredProducts.length}
                </span>{' '}
                produtos
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono-numeric font-semibold transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#2563EB]/50'
                            : 'text-[#64748B] hover:text-[#172033] hover:bg-[#FFFFFF]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Drawer de Filtros Avançados */}
      <ProductFiltersDrawer
        isOpen={isFiltersDrawerOpen}
        onClose={() => setIsFiltersDrawerOpen(false)}
        filters={drawerFilters}
        onApplyFilters={(f) => {
          setDrawerFilters(f);
          setCurrentPage(1);
        }}
        onResetFilters={() => {
          setDrawerFilters(initialProductFilterState);
          setCurrentPage(1);
        }}
      />

      {/* 6. Drawer de Detalhes do Produto (com Comparador de Ofertas, Histórico de Preço, Publicações e Insights) */}
      <ProductDetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onPublishOffer={(p, offer) => {
          showToast(
            `Oferta ${offer?.marketplace ? `(${offer.marketplace})` : ''} enviada para publicação!`
          );
        }}
        onScheduleOffer={(p, offer) => {
          showToast(
            `Oferta agendada com sucesso para publicação nos canais de afiliados!`
          );
        }}
      />
    </div>
  );
};
