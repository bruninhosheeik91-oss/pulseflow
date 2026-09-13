import React, { useState, useEffect } from 'react';
import {
  Link2,
  Plus,
  FileUp,
  RefreshCw,
  Send,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Info,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import {
  LinkList,
  LinkListFrequency,
  LinkListLinkStatus,
  LinkListDeduplication,
  DESTINATION_LABELS,
  ROTATION_LABELS,
} from '../../types/linkList';
import { initialCampaigns } from '../../data/mockCampaigns';
import {
  addLinksToList,
  createLinkList,
  deleteLinkList,
  listLinkLists,
  processLinkList,
  removeLinkFromList,
} from '../../services/linkList/linkListService';
import { Button } from '../ui/Button';
import { Badge, BadgeProps } from '../ui/Badge';
import { NewListModal } from './NewListModal';
import { AddLinksModal } from './AddLinksModal';

const STATUS_BADGE: Record<LinkListLinkStatus, NonNullable<BadgeProps['variant']>> = {
  Pendente: 'neutral',
  Processando: 'info',
  'Válido': 'success',
  'Inválido': 'danger',
  'Duplicado': 'warning',
  'Na fila': 'info',
  'Publicado': 'success',
  'Ignorado': 'neutral',
};

const DEDUP_OPTIONS: { key: keyof LinkListDeduplication; label: string }[] = [
  { key: 'checkQueue', label: 'Verificar itens da fila' },
  { key: 'compareAutoSearch', label: 'Comparar com a Busca Automática' },
  { key: 'compareOtherLists', label: 'Comparar com outras listas' },
  { key: 'compareRecentPublications', label: 'Comparar com publicações recentes' },
];

const frequencyLabel = (f: LinkListFrequency) =>
  `A cada ${f.minIntervalMinutes} min · máx ${f.maxPerHour}/h · máx ${f.maxPerDay}/dia · ${f.windowStart}–${f.windowEnd} · ${
    f.activeDays.length >= 7 ? 'Todos os dias' : f.activeDays.join(', ')
  }`;

export const LinkListPage: React.FC = () => {
  const [lists, setLists] = useState<LinkList[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listsError, setListsError] = useState<string | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [addLinksOpen, setAddLinksOpen] = useState(false);
  const [addLinksMode, setAddLinksMode] = useState<'add' | 'import'>('add');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingNotice, setProcessingNotice] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dedup, setDedup] = useState<LinkListDeduplication>({
    checkQueue: true,
    compareAutoSearch: true,
    compareOtherLists: true,
    compareRecentPublications: false,
  });
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3200);
  };

  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;

  useEffect(() => {
    let mounted = true;
    listLinkLists()
      .then((realLists) => {
        if (!mounted) return;
        setLists(realLists);
        setActiveListId((current) => current || realLists[0]?.id || null);
        setListsError(null);
      })
      .catch((error) => {
        if (!mounted) return;
        setListsError(error instanceof Error ? error.message : 'Falha ao carregar listas reais.');
      })
      .finally(() => {
        if (mounted) setLoadingLists(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (activeListId && !lists.some((l) => l.id === activeListId) && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId]);

  useEffect(() => {
    setSelectedIds([]);
  }, [activeListId]);

  const handleCreateList = async (data: {
    name: string;
    description: string;
    campaignId: string | null;
    campaignName: string | null;
    destination: LinkList['destination'];
    rotation: LinkList['rotation'];
    frequency: LinkListFrequency;
  }) => {
    try {
      const created = await createLinkList(data);
      setLists((prev) => [...prev, created]);
      setActiveListId(created.id);
      setProcessingNotice(false);
      showToast(`Lista "${created.name}" criada e salva.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao criar lista.', 'info');
    }
  };

  const handleAddLinks = async (urls: string[]) => {
    if (!activeList) return;
    try {
      const updated = await addLinksToList(activeList.id, urls);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      setProcessingNotice(false);
      showToast(`${urls.length} link(s) sincronizado(s) com "${activeList.name}".`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao salvar links.', 'info');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    if (!activeList) return;
    try {
      const updated = await removeLinkFromList(activeList.id, linkId);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      setSelectedIds((prev) => prev.filter((id) => id !== linkId));
      showToast('Link removido da lista real.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao remover link.', 'info');
    }
  };

  const handleSendToQueue = () => {
    showToast('Fila real ainda não está conectada à Lista de Links. Nenhum status foi simulado.', 'info');
  };

  const handleDeleteList = async (listId: string) => {
    const target = lists.find((list) => list.id === listId);
    try {
      await deleteLinkList(listId);
      const remaining = lists.filter((list) => list.id !== listId);
      setLists(remaining);
      if (activeListId === listId) setActiveListId(remaining[0]?.id ?? null);
      setSelectedIds([]);
      setProcessingNotice(false);
      showToast(`Lista "${target?.name ?? ''}" excluída do backend.`, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao excluir lista.', 'info');
    }
  };

  const handleProcessLinks = async () => {
    if (!activeList) return;
    setProcessingNotice(true);
    try {
      const updated = await processLinkList(activeList.id);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      const valid = updated.links.filter((link) => link.status === 'Válido').length;
      const invalid = updated.links.filter((link) => link.status === 'Inválido').length;
      const retry = updated.links.filter((link) => link.status === 'Pendente' && link.processError).length;
      showToast(`Processamento real concluído: ${valid} válido(s), ${invalid} inválido(s), ${retry} para tentar novamente.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao processar links.', 'info');
    } finally {
      setProcessingNotice(false);
    }
  };

  const handleCopyLink = async (link: import('../../types/linkList').LinkListItem) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      showToast('Não foi possível copiar o link.', 'info');
    }
  };

  const handleImportAction = () => {
    if (lists.length === 0) {
      showToast('Crie uma lista primeiro para importar links.', 'info');
      return;
    }
    setAddLinksMode('import');
    setAddLinksOpen(true);
  };

  const handleAddAction = () => {
    if (lists.length === 0) {
      showToast('Crie uma lista primeiro para adicionar links.', 'info');
      return;
    }
    setAddLinksMode('add');
    setAddLinksOpen(true);
  };

  const pendingCount =
    activeList?.links.filter((l) => l.status === 'Pendente' || l.status === 'Processando').length ?? 0;
  const queueCount = activeList?.links.filter((l) => l.status === 'Na fila').length ?? 0;
  const selectedPending = activeList?.links.filter(
    (l) => selectedIds.includes(l.id) && l.status === 'Pendente'
  ).length ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-[#172033] tracking-tight">
              Lista de Links
            </h1>
            {activeList && (
              <div className="flex items-center gap-1.5">
                <Badge variant="neutral" size="xs">
                  {activeList.links.length} links
                </Badge>
                <Badge variant="info" size="xs">
                  {queueCount} na fila
                </Badge>
              </div>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Organize links de ofertas e prepare sua distribuição.
          </p>
          {loadingLists && <p className="text-[11px] text-[#64748B] mt-1">Sincronizando listas reais...</p>}
          {listsError && <p className="text-[11px] text-amber-700 mt-1">{listsError}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportAction}
            leftIcon={<FileUp className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Importar links
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewListOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Nova lista
          </Button>
        </div>
      </div>

      {lists.length === 0 ? (
        /* Empty state: nenhuma lista criada */
        <div className="py-10 px-6 bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center">
            <ListChecks className="w-7 h-7 text-[#3B82F6]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-[#172033] tracking-tight">
              Nenhuma lista criada
            </h3>
            <p className="text-xs text-[#64748B] max-w-sm">
              Crie uma lista para adicionar ofertas e preparar o envio para a fila.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewListOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Criar primeira lista
          </Button>
        </div>
      ) : (
        <>
          {/* List selector */}
          <div className="flex flex-wrap items-center gap-2">
            {lists.map((list) => {
              const isActive = activeListId === list.id || (!activeListId && list.id === lists[0].id);
              const pend = list.links.filter(
                (l) => l.status === 'Pendente' || l.status === 'Processando'
              ).length;
              return (
                <button
                  key={list.id}
                  type="button"
                  onClick={() => setActiveListId(list.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-[#E2E8F0] text-[#172033] border-[#2563EB]'
                      : 'bg-[#FFFFFF] text-[#64748B] border-[#DCE3EC] hover:text-[#172033] hover:border-[#93C5FD]'
                  }`}
                >
                  <Link2 className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                  <span className="truncate max-w-[180px]">{list.name}</span>
                  <span className={`text-[10px] font-mono-numeric ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                    {list.links.length}
                  </span>
                  {pend > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setIsNewListOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-dashed border-[#DCE3EC] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova lista
            </button>
          </div>

          {activeList && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left column: lista + links */}
              <div className="lg:col-span-8 space-y-4">
                {/* List summary */}
                <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-[#172033] tracking-tight">
                        {activeList.name}
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        {activeList.description || 'Sem descrição'} · criada em{' '}
                        {activeList.createdAt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteList(activeList.id)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-[#64748B] hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir lista
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="text-[10px] text-[#64748B] block">Campanha</span>
                      <span className="text-xs font-medium text-[#172033] mt-0.5 block truncate">
                        {activeList.campaignName || '—'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="text-[10px] text-[#64748B] block">Destino</span>
                      <span className="text-xs font-medium text-[#2563EB] mt-0.5 block">
                        {DESTINATION_LABELS[activeList.destination]}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="text-[10px] text-[#64748B] block">Rotação</span>
                      <span className="text-xs font-medium text-[#172033] mt-0.5 block">
                        {ROTATION_LABELS[activeList.rotation]}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                      <span className="text-[10px] text-[#64748B] block">Pendentes</span>
                      <span className="text-xs font-medium text-amber-700 mt-0.5 block">
                        {pendingCount}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B]">
                    Frequência: {frequencyLabel(activeList.frequency)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleAddAction}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Adicionar links
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImportAction}
                      leftIcon={<FileUp className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Importar arquivo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleProcessLinks}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Processar links
                    </Button>
                  </div>

                  {processingNotice && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-700">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Processamento disponível após integração com os marketplaces.{' '}
                        <button
                          type="button"
                          onClick={() => setProcessingNotice(false)}
                          className="underline hover:text-amber-700 cursor-pointer"
                        >
                          Dispensar
                        </button>
                      </span>
                    </div>
                  )}
                </div>

                {/* Links table */}
                <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl">
                  <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#172033] tracking-tight">
                        Links adicionados
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Marketplace e produto são preenchidos após o processamento.
                      </p>
                    </div>
                    {activeList.links.length > 0 && (
                      <Badge variant="neutral" size="xs">
                        {activeList.links.length} itens
                      </Badge>
                    )}
                  </div>

                  {activeList.links.length === 0 ? (
                    <div className="py-8 px-6 flex flex-col items-center gap-3 text-center">
                      <Link2 className="w-8 h-8 text-[#475569]" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#172033]">
                          Nenhum link na lista ainda
                        </p>
                        <p className="text-xs text-[#64748B] max-w-sm">
                          Adicione links manualmente ou importe um arquivo TXT/CSV
                          para começar a preparar o envio.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddAction}
                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Adicionar links
                      </Button>
                    </div>
                  ) : (
                    <>
                      {selectedIds.length > 0 && (
                        <div className="px-5 py-2.5 border-b border-[#E2E8F0] flex items-center justify-between gap-3 bg-[#EFF6FF]/60">
                          <span className="text-xs text-[#64748B]">
                            <strong className="text-[#172033]">{selectedPending}</strong> link(s)
                            pendente(s) selecionado(s)
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedIds([])}
                              className="text-[11px] text-[#64748B] hover:text-[#172033] transition-colors cursor-pointer"
                            >
                              Limpar seleção
                            </button>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={handleSendToQueue}
                              disabled={selectedPending === 0}
                              leftIcon={<Send className="w-3 h-3" />}
                              className="text-xs"
                            >
                              Enviar para fila
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#E2E8F0]">
                              <th className="px-3 py-2.5 w-9">
                                <input
                                  type="checkbox"
                                  checked={
                                    activeList.links.length > 0 &&
                                    selectedIds.length ===
                                      activeList.links.filter((l) => l.status === 'Pendente').length &&
                                    activeList.links.some((l) => l.status === 'Pendente')
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedIds(
                                        activeList.links
                                          .filter((l) => l.status === 'Pendente')
                                          .map((l) => l.id)
                                      );
                                    } else {
                                      setSelectedIds([]);
                                    }
                                  }}
                                  className="w-3.5 h-3.5 rounded border-[#374151] bg-[#F8FAFC] text-[#2563EB] focus:ring-0 cursor-pointer"
                                />
                              </th>
                              {['Link', 'Marketplace', 'Produto', 'Status', 'Campanha', 'Fila', 'Ações'].map(
                                (h) => (
                                  <th
                                    key={h}
                                    className="px-3 py-2.5 text-left text-[10px] font-semibold text-[#64748B] uppercase tracking-wider whitespace-nowrap"
                                  >
                                    {h}
                                  </th>
                                )
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {activeList.links.map((link) => (
                              <tr
                                key={link.id}
                                className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F8FAFC] transition-colors"
                              >
                                <td className="px-3 py-2.5">
                                  {link.status === 'Pendente' ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(link.id)}
                                      onChange={(e) =>
                                        setSelectedIds((prev) =>
                                          e.target.checked
                                            ? [...prev, link.id]
                                            : prev.filter((id) => id !== link.id)
                                        )
                                      }
                                      className="w-3.5 h-3.5 rounded border-[#374151] bg-[#F8FAFC] text-[#2563EB] focus:ring-0 cursor-pointer"
                                    />
                                  ) : (
                                    <span className="inline-block w-3.5" />
                                  )}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-1.5 min-w-0 max-w-[260px]">
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-mono text-[11px] text-[#2563EB] truncate hover:underline"
                                    >
                                      {link.url}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyLink(link)}
                                      className="text-[#64748B] hover:text-[#172033] transition-colors shrink-0 cursor-pointer"
                                      title="Copiar link"
                                    >
                                      {copiedId === link.id ? (
                                        <Check className="w-3 h-3 text-emerald-700" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[#64748B] hover:text-[#2563EB] transition-colors shrink-0"
                                      title="Abrir link"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-[#64748B]">
                                    {link.marketplace ? link.marketplace : '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-[#64748B]">
                                    {link.productName ?? '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge variant={STATUS_BADGE[link.status]} size="xs">
                                    {link.status}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-[#64748B]">
                                    {link.campaignName ?? '—'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="text-[#64748B]">
                                    {link.status === 'Na fila' ? (
                                      <Badge variant="info" size="xs">
                                        Na fila
                                      </Badge>
                                    ) : (
                                      '—'
                                    )}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveLink(link.id)}
                                    className="text-[#64748B] hover:text-rose-700 transition-colors cursor-pointer"
                                    title="Remover link"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right column: configurações */}
              <div className="lg:col-span-4 space-y-4">
                {/* Deduplicação */}
                <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl p-5 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                    <h4 className="text-sm font-semibold text-[#172033] tracking-tight">
                      Proteção contra duplicidade
                    </h4>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Antes de enviar para a fila, os links podem ser comparados com os
                    destinos abaixo.
                  </p>
                  <div className="space-y-2">
                    {DEDUP_OPTIONS.map((opt) => (
                      <label
                        key={opt.key}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={dedup[opt.key]}
                          onChange={(e) =>
                            setDedup((prev) => ({
                              ...prev,
                              [opt.key]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded border-[#374151] bg-[#F8FAFC] text-[#2563EB] focus:ring-0 cursor-pointer"
                        />
                        <span className="text-xs text-[#172033]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#64748B] leading-relaxed">
                    Sem algoritmo real nesta etapa — a verificação será aplicada quando
                    a integração for configurada.
                  </p>
                </div>

                {/* Processamento info (agrupado) */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Cada link adicionado entra com status{' '}
                    <Badge variant="neutral" size="xs">Pendente</Badge>. Ao clicar em
                    "Processar links", o marketplace e o produto serão identificados —
                    disponível após integração. Nenhuma consulta externa, scraping ou
                    fetch de URLs é realizado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <NewListModal
        isOpen={isNewListOpen}
        onClose={() => setIsNewListOpen(false)}
        campaigns={initialCampaigns.map((c) => ({ id: c.id, name: c.name }))}
        onSave={handleCreateList}
      />

      <AddLinksModal
        isOpen={addLinksOpen}
        onClose={() => setAddLinksOpen(false)}
        initialMode={addLinksMode}
        listName={activeList?.name ?? ''}
        onAddLinks={handleAddLinks}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toast.type === 'info' ? (
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toast.text}</span>
        </div>
      )}
    </div>
  );
};