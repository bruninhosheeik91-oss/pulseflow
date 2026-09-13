import React from 'react';
import {
  Plug,
  Smartphone,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';
import {
  WhatsAppAccount,
  WhatsAppGroup,
  WhatsAppConnectionStatus,
  DOMNEX_DEFAULT_SESSION_ID,
} from '../../types/whatsApp';

const STATUS_TONES: Record<WhatsAppConnectionStatus, string> = {
  connected: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  reconnecting: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  connecting: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  awaiting_qr: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  disconnected: 'bg-[#16243F] border-[#22365E] text-[#8E9BAE]',
};

const STATUS_LABELS: Record<WhatsAppConnectionStatus, string> = {
  connected: 'Conectado',
  connecting: 'Conectando',
  awaiting_qr: 'Aguardando QR',
  reconnecting: 'Reconectando',
  disconnected: 'Desconectado',
  error: 'Erro',
};

function formatSyncTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function accountLabel(account: WhatsAppAccount | undefined): string | null {
  if (!account) return null;
  const label = account.name || account.number || null;
  if (label) return label;
  return account.sessionId;
}

function getGroupDisplayName(group: WhatsAppGroup): string {
  return group.name && group.name.trim() ? group.name : 'Grupo sem nome';
}

interface WhatsAppGroupRow {
  group: WhatsAppGroup;
  account: WhatsAppAccount | undefined;
}

interface GroupStats {
  totalGroups: number;
  totalMembers: number;
  groupsWithParticipants: number;
  connectedGroups: number;
  connectedAccounts: number;
}

export const GroupsDashboard: React.FC = () => {
  const config = useWhatsAppGroupConfig();
  const { accounts } = useWhatsAppAccounts();

  const accountBySession = new Map<string, WhatsAppAccount>();
  accounts.forEach((account) => {
    accountBySession.set(account.sessionId, account);
  });

  const rows: WhatsAppGroupRow[] = config.groups
    .map((group) => ({
      group,
      account: accountBySession.get(
        group.sessionId ?? DOMNEX_DEFAULT_SESSION_ID
      ),
    }))
    .sort((a, b) => {
      const pa = a.group.participantCount;
      const pb = b.group.participantCount;
      if (pa !== null && pa !== undefined && pb !== null && pb !== undefined) {
        return pb - pa;
      }
      return getGroupDisplayName(a.group).localeCompare(
        getGroupDisplayName(b.group)
      );
    });

  const stats: GroupStats = {
    totalGroups: config.groups.length,
    totalMembers: config.groups.reduce(
      (acc, g) => acc + (g.participantCount ?? 0),
      0
    ),
    groupsWithParticipants: config.groups.filter(
      (g) => g.participantCount !== null && g.participantCount !== undefined
    ).length,
    connectedGroups: rows.filter(
      (r) => r.account?.connectionStatus === 'connected'
    ).length,
    connectedAccounts: accounts.filter(
      (a) => a.connectionStatus === 'connected'
    ).length,
  };

  const syncedAtLabel = formatSyncTime(config.syncedAt);
  const totalMembersLabel = stats.totalMembers === 0 && stats.totalGroups > 0
    ? '—'
    : stats.totalMembers.toLocaleString('pt-BR');

  return (
    <div className="space-y-6">
      {/* KPI Cards: dados reais dos grupos */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Total de Grupos
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
              {stats.totalGroups.toLocaleString('pt-BR')}
            </span>
          </div>
          <span className="text-[10px] text-[#8E9BAE]">
            grupos sincronizados
          </span>
        </div>

        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Total de Membros
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF]">
              <UserPlus className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
              {totalMembersLabel}
            </span>
          </div>
          <span className="text-[10px] text-[#8E9BAE]">
            {stats.groupsWithParticipants > 0
              ? `somados de ${stats.groupsWithParticipants} de ${stats.totalGroups} grupos`
              : stats.totalGroups > 0
              ? 'contagem de membros indisponível'
              : 'aguardando sincronização'}
          </span>
        </div>

        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Grupos Conectados
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF]">
              <Plug className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
              {stats.connectedGroups.toLocaleString('pt-BR')}
            </span>
          </div>
          <span className="text-[10px] text-[#8E9BAE]">
            {stats.connectedAccounts.toLocaleString('pt-BR')} conta(s)
            conectada(s)
          </span>
        </div>

        <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
              Contas WhatsApp
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center text-[#00C2FF]">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono-numeric text-[#E6E8EC] tracking-tight">
              {accounts.length.toLocaleString('pt-BR')}
            </span>
          </div>
          <span className="text-[10px] text-[#8E9BAE]">
            {accounts.length === 0
              ? 'registre uma conta no WhatsApp'
              : 'contas registradas'}
          </span>
        </div>
      </section>

      {/* Visão dos Grupos (dados reais) */}
      <section className="bg-[#0E1628] border border-[#1B2947] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-[#162442]">
          <div>
            <h2 className="text-base font-semibold text-[#E6E8EC] tracking-tight">
              Visão dos Grupos
            </h2>
            <p className="text-xs text-[#8E9BAE] mt-0.5">
              {syncedAtLabel
                ? `Última sincronização: ${syncedAtLabel}`
                : 'Grupos sincronizados no WhatsApp'}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center px-6">
            <TrendingUp className="w-8 h-8 text-[#22365E]" />
            <p className="text-sm font-semibold text-[#C8D1DE] mt-1">
              Nenhum grupo sincronizado ainda
            </p>
            <p className="text-xs text-[#8E9BAE] max-w-sm">
              Conecte uma conta no WhatsApp e sincronize os grupos para
              acompanhar aqui a operação real.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#162442]">
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Membros
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Conta WhatsApp
                </th>
                <th className="px-4 py-2.5 text-[10px] font-semibold text-[#8E9BAE] uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ group, account }) => (
                <tr
                  key={group.id}
                  className="border-b border-[#101C34] last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-[#E6E8EC] truncate max-w-[220px]">
                      {getGroupDisplayName(group)}
                    </div>
                    <div className="text-[10px] text-[#64748B] truncate max-w-[220px] font-mono">
                      {group.sessionId ?? '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono-numeric text-xs font-medium text-[#E6E8EC]">
                    {group.participantCount ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#8E9BAE]">
                    {accountLabel(account) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {account ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${STATUS_TONES[account.connectionStatus] || STATUS_TONES.disconnected}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_LABELS[account.connectionStatus] || 'Desconectado'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#64748B]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Evolução de Grupos e Membros (área preparada, sem dados inventados) */}
      <section className="bg-[#0E1628] border border-[#1B2947] rounded-xl">
        <div className="p-4 border-b border-[#162442]">
          <h2 className="text-base font-semibold text-[#E6E8EC] tracking-tight">
            Evolução de Grupos e Membros
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Crescimento de grupos e membros ao longo do tempo
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
          <TrendingUp className="w-8 h-8 text-[#22365E]" />
          <p className="text-sm font-semibold text-[#C8D1DE] mt-1">
            Sem histórico de crescimento ainda
          </p>
          <p className="text-xs text-[#8E9BAE] max-w-sm">
            Quando houver histórico acumulado das sincronizações, esta área
            exibirá a evolução de grupos e membros.
          </p>
        </div>
      </section>
    </div>
  );
};
