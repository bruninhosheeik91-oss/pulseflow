import React, { useState } from 'react';
import { useWhatsAppConnection } from '../../services/whatsApp/useWhatsAppConnection';
import { useWhatsAppGroupConfig } from '../../services/whatsApp/groupConfigStore';
import { WhatsAppConnectionCard } from './WhatsAppConnectionCard';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';
import { WhatsAppFlowSteps } from './WhatsAppFlowSteps';
import { WhatsAppGroupsSection } from './WhatsAppGroupsSection';
import { WhatsAppIntegrationHint } from './WhatsAppIntegrationHint';
import { WhatsAppAccountsSection } from './WhatsAppAccountsSection';

export const WhatsAppPage: React.FC = () => {
  const {
    status,
    qrData,
    errorMessage,
    account,
    isSyncing,
    groupsError,
    connect,
    reconnect,
    recover,
    disconnect,
    syncGroups,
    sendMessage,
  } = useWhatsAppConnection();
  const { groups } = useWhatsAppGroupConfig();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleConnect = () => {
    setIsConnectModalOpen(true);
    void connect();
  };

  const handleRetry = () => {
    void recover();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
          WhatsApp
        </h1>
        <p className="text-xs text-[#8E9BAE] mt-1">
          Conecte e gerencie a conta utilizada pelas automações do PULSE FLOW.
        </p>
      </div>

      {/* Contas (multissessão) */}
      <WhatsAppAccountsSection />

      {/* Connection */}
      <WhatsAppConnectionCard
        status={status}
        account={account}
        isSyncing={isSyncing}
        onConnect={handleConnect}
        onSyncGroups={() => void syncGroups()}
        onReconnect={() => void reconnect()}
        onDisconnect={() => void disconnect()}
      />

      {/* Flow */}
      <WhatsAppFlowSteps />

      {/* Groups */}
      <WhatsAppGroupsSection
        isConnected={status === 'connected'}
        groups={groups}
        isSyncing={isSyncing}
        syncError={groupsError}
        onSyncGroups={syncGroups}
        onSend={sendMessage}
      />

      {/* Integration */}
      <WhatsAppIntegrationHint />

      {/* Connection modal */}
      <WhatsAppConnectModal
        isOpen={isConnectModalOpen}
        status={status}
        qrData={qrData}
        errorMessage={errorMessage}
        onClose={() => setIsConnectModalOpen(false)}
        onRetry={handleRetry}
      />
    </div>
  );
};