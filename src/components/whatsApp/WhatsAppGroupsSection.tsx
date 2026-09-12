import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  Crown,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import {
  WhatsAppGroup,
  formatGroupParticipantCount,
  getGroupDisplayName,
} from '../../types/whatsApp';
import {
  addChildGroup,
  removeChildGroup,
  setParentGroup,
  useWhatsAppGroupConfig,
} from '../../services/whatsApp/groupConfigStore';

interface WhatsAppGroupsSectionProps {
  isConnected: boolean;
  groups: WhatsAppGroup[];
  isSyncing: boolean;
  syncError: string | null;
  onSyncGroups: () => Promise<{ ok: boolean; error?: string }>;
  onSend: (
    groupId: string,
    message: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

type Feedback = { type: 'success' | 'error'; text: string } | null;

export const WhatsAppGroupsSection: React.FC<
  WhatsAppGroupsSectionProps
> = ({ isConnected, groups, isSyncing, syncError, onSyncGroups, onSend }) => {
  const { parentGroupId, childGroupIds } = useWhatsAppGroupConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const filteredGroups = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((group) => {
      const name = getGroupDisplayName(group).toLowerCase();
      const rawName = (group.name || '').toLowerCase();
      const id = group.id.toLowerCase();
      return (
        name.includes(term) || rawName.includes(term) || id.includes(term)
      );
    });
  }, [groups, searchQuery]);

  const toggleDestination = (group: WhatsAppGroup) => {
    if (group.id === parentGroupId) return;
    if (childGroupIds.includes(group.id)) {
      removeChildGroup(group.id);
    } else {
      addChildGroup(group.id);
    }
  };

  const toggleParent = (group: WhatsAppGroup) => {
    if (parentGroupId === group.id) {
      setParentGroup(null);
    } else {
      setParentGroup(group.id);
    }
  };

  const handleSend = async () => {
    const groupId = selectedGroupId.trim();
    const text = message.trim();
    if (!groupId || !text || sending) return;

    setSending(true);
    setFeedback(null);
    const result = await onSend(groupId, text);
    setSending(false);
    if (result.ok) {
      setFeedback({
        type: 'success',
        text: 'Mensagem enviada com sucesso.',
      });
      setMessage('');
    } else {
      setFeedback({
        type: 'error',
        text: result.error || 'Falha no envio.',
      });
    }
  };

  const hasGroups = groups.length > 0;
  const motherGroup = groups.find((g) => g.id === parentGroupId) ?? null;

  return (
    <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#162442]">
        <div>
          <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
            Grupos do WhatsApp
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Grupos reais retornados pela conta conectada.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isConnected && hasGroups && (
            <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#14203B] border border-[#1E3057] text-[#00C2FF]">
              {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
            </span>
          )}
          {isConnected && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onSyncGroups()}
              loading={isSyncing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
            >
              Sincronizar grupos
            </Button>
          )}
        </div>
      </div>

      <div className="p-5">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Conecte seu WhatsApp para importar seus grupos reais.
            </p>
          </div>
        ) : isSyncing && !hasGroups ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#00C2FF] animate-spin" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Sincronizando grupos reais da conta conectada...
            </p>
          </div>
        ) : !hasGroups ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Nenhum grupo encontrado para esta conta.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void onSyncGroups()}
              loading={isSyncing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs font-medium"
            >
              Sincronizar grupos
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {isSyncing && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E5EFF]/10 border border-[#1E5EFF]/25 text-[11px] text-[#00C2FF]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sincronizando grupos...
              </div>
            )}

            {syncError && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-[11px] text-red-300 leading-relaxed">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold block">Falha ao sincronizar grupos.</span>
                  <span className="text-red-300/90 block">{syncError}</span>
                </div>
              </div>
            )}

            {motherGroup && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E5EFF]/10 border border-[#1E5EFF]/25 text-[11px] text-[#C8D1DE]">
                <Crown className="w-3.5 h-3.5 text-[#00C2FF] shrink-0" />
                <span>
                  <span className="font-semibold text-[#00C2FF]">Grupo Mãe:</span>{' '}
                  {getGroupDisplayName(motherGroup)}
                </span>
                <span className="ml-auto text-[#64748B]">
                  {childGroupIds.length}{' '}
                  {childGroupIds.length === 1 ? 'destino' : 'destinos'}
                </span>
              </div>
            )}

            {/* Busca */}
            <div className="relative">
              <Input
                leftIcon={<Search className="w-3.5 h-3.5" />}
                placeholder="Buscar grupo"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sizeVariant="sm"
                className="pr-8"
              />
              {filteredGroups.length !== groups.length && (
                <span className="absolute right-3 top-0 h-full flex items-center text-[10px] text-[#64748B]">
                  {filteredGroups.length}/{groups.length}
                </span>
              )}
            </div>

            {/* Lista */}
            {filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Inbox className="w-4 h-4 text-[#64748B]" />
                <p className="text-xs text-[#8E9BAE]">
                  Nenhum grupo encontrado para “{searchQuery.trim()}”.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredGroups.map((group) => {
                  const isMother = parentGroupId === group.id;
                  const isDestination = childGroupIds.includes(group.id);
                  return (
                    <li
                      key={group.id}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-colors ${
                        isMother
                          ? 'bg-[#131E38] border-[#1E5EFF]/45'
                          : 'bg-[#0A1020] border-[#16233B] hover:border-[#1E3360]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDestination(group)}
                        disabled={isMother}
                        title={
                          isMother
                            ? 'O Grupo Mãe não pode ser grupo filho'
                            : isDestination
                            ? 'Remover como destino'
                            : 'Adicionar como destino'
                        }
                        className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
                          isDestination
                            ? 'bg-[#1E5EFF] border-[#1E5EFF]'
                            : 'bg-[#0A1020] border-[#2A3E6D] hover:border-[#1E5EFF]'
                        }`}
                      >
                        {isDestination ? (
                          <CheckSquare className="w-3 h-3 text-white" />
                        ) : null}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-medium text-[#E6E8EC] truncate">
                            {getGroupDisplayName(group)}
                          </span>
                          {isMother && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1E5EFF]/20 border border-[#1E5EFF]/40 text-[10px] font-semibold text-[#00C2FF] shrink-0">
                              <Crown className="w-2.5 h-2.5" />
                              Grupo Mãe
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <span className="text-[10px] text-[#64748B] font-mono-numeric block truncate">
                            {formatGroupParticipantCount(group)} · {group.id}
                          </span>
                          {group.sessionId && (
                            <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#101B33] border border-[#1C2C50] text-[#8E9BAE]">
                              {group.sessionId}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-medium text-emerald-400/90 shrink-0">
                        Disponível
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleParent(group)}
                        className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold border transition-colors cursor-pointer ${
                          isMother
                            ? 'bg-[#1E5EFF]/20 border-[#1E5EFF]/40 text-[#00C2FF]'
                            : 'bg-transparent border-[#1E2E52] text-[#8E9BAE] hover:text-[#00C2FF] hover:border-[#1E5EFF]/50'
                        }`}
                        title={
                          isMother
                            ? 'Remover como Grupo Mãe'
                            : 'Definir como Grupo Mãe'
                        }
                      >
                        {!isMother && <Crown className="w-2.5 h-2.5" />}
                        {isMother ? 'Remover' : 'Grupo Mãe'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Legenda */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-[10px] text-[#64748B]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-[#2A3E6D] inline-block" />
                Selecione e adicione como destino
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-[#00C2FF]" />
                Defina 1 grupo como Grupo Mãe
              </span>
            </div>

            {/* Enviar mensagem de teste */}
            <div className="rounded-lg border border-[#1B2947] bg-[#0A1020] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-3.5 h-3.5 text-[#00C2FF]" />
                <h3 className="text-xs font-semibold text-[#E6E8EC]">
                  Enviar mensagem de teste
                </h3>
              </div>

              <div className="space-y-3">
                <Select
                  options={[
                    { value: '', label: 'Selecione um grupo importado...' },
                    ...groups.map((group) => ({
                      value: group.id,
                      label: getGroupDisplayName(group),
                    })),
                  ]}
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setFeedback(null);
                  }}
                  sizeVariant="md"
                  disabled={sending}
                />

                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Escreva a mensagem de teste..."
                  rows={3}
                  disabled={sending}
                  className="w-full bg-[#0A1020] border border-[#1B2947] text-[#E6E8EC] placeholder:text-[#5A6470] rounded-lg p-3 text-xs leading-relaxed resize-y focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] disabled:opacity-40"
                />

                {feedback && (
                  <div
                    className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed border ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/25 text-red-300'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSend()}
                    loading={sending}
                    disabled={!selectedGroupId || !message.trim() || sending}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};