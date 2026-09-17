import React from 'react';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';
import { WhatsAppFlowSteps } from './WhatsAppFlowSteps';
import { WhatsAppGroupsSection } from './WhatsAppGroupsSection';
import { WhatsAppIntegrationHint } from './WhatsAppIntegrationHint';
import { WhatsAppAccountsSection } from './WhatsAppAccountsSection';
import { useWhatsAppAccounts } from '../../services/whatsApp/useWhatsAppAccounts';

export const WhatsAppPage: React.FC = () => {
  const { groups } = useWhatsAppGroupConfig();
  const {
    accounts,
    syncingSession,
    syncTimeoutBySession,
    warmingUpBySession,
    syncInProgressBySession,
    syncGroupsFor,
    sendMessage,
  } = useWhatsAppAccounts();

  const primaryAccount =
    accounts.find((a) => a.status === 'connected') ?? accounts[0] ?? null;
  const primarySessionId = primaryAccount?.sessionId ?? null;
  const primaryConnected = primaryAccount?.status === 'connected';
  const primarySyncing =
    primarySessionId !== null && syncingSession === primarySessionId;
  const primaryWarmingUp =
    primarySessionId !== null && Boolean(warmingUpBySession[primarySessionId]);
  const primarySyncInProgress =
    primarySessionId !== null &&
    Boolean(syncInProgressBySession[primarySessionId]);
  const primarySyncError =
    primarySessionId !== null && syncTimeoutBySession[primarySessionId]
      ? 'Não foi possível sincronizar os grupos.'
      : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl font-bold text-[#172033] tracking-tight">
          WhatsApp
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Conecte e gerencie as contas utilizadas pelas automações do PULSE FLOW.
        </p>
      </div>

      {/* Contas (multissessão) */}
      <WhatsAppAccountsSection />

      {/* Flow */}
      <WhatsAppFlowSteps />

      {/* Groups */}
      <WhatsAppGroupsSection
        isConnected={primaryConnected}
        groups={groups}
        isSyncing={primarySyncing}
        isWarmingUp={primaryWarmingUp}
        isSyncInProgress={primarySyncInProgress}
        syncError={primarySyncError}
        onSyncGroups={
          primarySessionId
            ? () => syncGroupsFor(primarySessionId)
            : async () => ({ ok: false, error: 'Nenhuma conta conectada.' })
        }
        onSend={
          primarySessionId
            ? (groupId, message) => sendMessage(primarySessionId, groupId, message)
            : async () => ({ ok: false, error: 'Nenhuma conta conectada.' })
        }
      />

      {/* Integration */}
      <WhatsAppIntegrationHint />
    </div>
  );
};
