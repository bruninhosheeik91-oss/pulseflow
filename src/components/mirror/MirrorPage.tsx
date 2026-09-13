import React, { useState } from 'react';
import {
  Plus,
  RefreshCw,
  Eye,
  Pause,
  Play,
  Trash2,
  Share2,
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  MirrorSource,
  MirrorStatus,
  DESTINATION_LABELS,
  STATUS_LABELS,
  PROCESSING_STEPS,
  DEFAULT_PROCESSING,
  DEFAULT_HANDLING,
  DEFAULT_DEDUP,
} from '../../types/mirror';
import { Badge, BadgeProps } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  MirrorSourceFormModal,
  MirrorSourceDraft,
} from './MirrorSourceFormModal';
import { MirrorSourceDrawer } from './MirrorSourceDrawer';
import { initialCampaigns } from '../../data/mockCampaigns';

const TYPE_ICONS = {
  Grupo: Share2,
  Canal: MessageSquare,
  'Outra fonte': Target,
};

const STATUS_BADGE: Record<MirrorStatus, NonNullable<BadgeProps['variant']>> = {
  not_configured: 'warning',
  configured: 'info',
  paused: 'neutral',
  requires_integration: 'warning',
};

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'error';
}

export const MirrorPage: React.FC = () => {
  const [sources, setSources] = useState<MirrorSource[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MirrorSource | null>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  };

  const drawerSource =
    sources.find((s) => s.id === drawerId) ?? null;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (source: MirrorSource) => {
    setEditing(source);
    setFormOpen(true);
    setDrawerId(null);
  };

  const handleSave = (data: MirrorSourceDraft) => {
    if (editing) {
      setSources((prev) =>
        prev.map((s) => (s.id === editing.id ? { ...s, ...data } : s))
      );
      showToast('Fonte atualizada.', 'success');
    } else {
      const created: MirrorSource = {
        id: `MIR-${Date.now().toString(36).toUpperCase()}`,
        ...data,
        status: 'configured',
        processing: { ...DEFAULT_PROCESSING },
        handling: { ...DEFAULT_HANDLING },
        dedup: { ...DEFAULT_DEDUP },
        createdAt: new Date().toLocaleDateString('pt-BR'),
        automationSource: 'MIRROR',
      };
      setSources((prev) => [...prev, created]);
      setDrawerId(created.id);
      showToast('Fonte monitorada criada.', 'success');
    }
  };

  const handleUpdate = (id: string, patch: Partial<MirrorSource>) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  };

  const handleToggleStatus = (id: string) => {
    setSources((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const next: MirrorStatus =
          s.status === 'paused' ? 'configured' : 'paused';
        return { ...s, status: next };
      })
    );
    showToast(
      sources.find((s) => s.id === id)?.status === 'paused'
        ? 'Fonte retomada.'
        : 'Fonte pausada.',
      'info'
    );
  };

  const handleDelete = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    if (drawerId === id) setDrawerId(null);
    showToast('Fonte excluída.', 'info');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-bold text-[#172033] tracking-tight">
            Espelhamento
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Configure fontes monitoradas para preparar novas ofertas para sua
            operação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Adicionar fonte
          </Button>
        </div>
      </div>

      {/* Integration notice */}
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-700/90 leading-relaxed">
          <span className="font-semibold text-amber-700">
            Requer integração.
          </span>{' '}
          Este módulo prepara o fluxo de espelhamento, mas nenhuma leitura
          externa é realizada — a captura será ativada quando houver integração
          tecnicamente suportada.
        </p>
      </div>

      {/* Empty state */}
      {sources.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl py-10 px-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center mb-4">
            <RefreshCw className="w-5 h-5 text-[#2563EB]" />
          </div>
          <h2 className="text-sm font-semibold text-[#172033]">
            Nenhuma fonte configurada
          </h2>
          <p className="text-xs text-[#64748B] mt-1.5 max-w-sm leading-relaxed">
            Adicione uma fonte para começar a configurar o fluxo de
            espelhamento.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="mt-5 text-xs font-semibold"
          >
            Adicionar fonte
          </Button>
        </div>
      ) : (
        /* Sources table */
        <div className="bg-[#FFFFFF] border border-[#DCE3EC] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Fonte</th>
                  <th className="px-4 py-3 text-left">Plataforma</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Destino</th>
                  <th className="px-4 py-3 text-left">Processamento</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {sources.map((source) => {
                  const TypeIcon = TYPE_ICONS[source.type];
                  const enabledSteps = PROCESSING_STEPS.filter(
                    (s) => source.processing[s.key]
                  ).length;
                  return (
                    <tr
                      key={source.id}
                      className="hover:bg-[#F1F5F9] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
                            <TypeIcon className="w-3.5 h-3.5 text-[#A78BFA]" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[#172033] block truncate">
                              {source.name}
                            </span>
                            <span className="text-[10px] text-[#64748B] font-mono-numeric block">
                              {source.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#94A3B8]">
                          {source.platform}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={STATUS_BADGE[source.status]}
                          size="xs"
                        >
                          {STATUS_LABELS[source.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#94A3B8]">
                          {DESTINATION_LABELS[source.destination]}
                        </span>
                        {source.destination === 'campaign' &&
                          source.campaignName && (
                            <span className="text-[10px] text-[#64748B] block">
                              {source.campaignName}
                            </span>
                          )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono-numeric text-[#334155]">
                          {enabledSteps}/{PROCESSING_STEPS.length} etapas
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDrawerId(source.id)}
                            title="Abrir fonte"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-white transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(source.id)}
                            title={
                              source.status === 'paused'
                                ? 'Retomar fonte'
                                : 'Pausar fonte'
                            }
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] hover:text-white transition-colors cursor-pointer"
                          >
                            {source.status === 'paused' ? (
                              <Play className="w-3.5 h-3.5" />
                            ) : (
                              <Pause className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(source.id)}
                            title="Excluir fonte"
                            className="w-7 h-7 rounded-md flex items-center justify-center text-[#64748B] hover:bg-red-500/10 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <MirrorSourceFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
        campaigns={initialCampaigns}
        onSave={handleSave}
      />

      {/* Detail Drawer */}
      {drawerSource && (
        <MirrorSourceDrawer
          source={drawerSource}
          onClose={() => setDrawerId(null)}
          onUpdate={handleUpdate}
          onToggleStatus={(id) => handleToggleStatus(id)}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-[#BFDBFE] bg-[#FFFFFF] shadow-lg shadow-black/30 animate-in slide-in-from-bottom-3 fade-in"
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            ) : (
              <AlertTriangle
                className={`w-4 h-4 shrink-0 ${
                  t.type === 'info' ? 'text-[#2563EB]' : 'text-red-700'
                }`}
              />
            )}
            <span className="text-xs text-[#172033]">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};