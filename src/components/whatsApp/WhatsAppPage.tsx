import React, { useState } from 'react';
import { useWhatsAppConnection } from '../../services/whatsApp/useWhatsAppConnection';
import {
  configureWhatsAppProvider,
  getWhatsAppProvider,
} from '../../services/whatsApp/provider';
import { createWppConnectProvider } from '../../services/whatsApp/wppConnectProvider';
import { WhatsAppConnectionCard } from './WhatsAppConnectionCard';
import { WhatsAppConnectModal } from './WhatsAppConnectModal';
import { WhatsAppFlowSteps } from './WhatsAppFlowSteps';
import { WhatsAppGroupsSection } from './WhatsAppGroupsSection';
import { WhatsAppIntegrationHint } from './WhatsAppIntegrationHint';

if (!getWhatsAppProvider()) {
  configureWhatsAppProvider(createWppConnectProvider());
}

export const WhatsAppPage: React.FC = () => {
  const {
    status,
    qrData,
    errorMessage,
    account,
    groups,
    isSyncing,
    connect,
    reconnect,
    disconnect,
    syncGroups,
    sendMessage,
  } = useWhatsAppConnection();

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleConnect = () => {
    setIsConnectModalOpen(true);
    void connect();
  };

  const handleRetry = () => {
    void connect();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-1">
        <h1 className="text-xl font-bold text-[#E6E8EC] tracking-tight">
          WhatsApp
        </h1>
        <p className="text-xs text-[#8E9BAE] mt-1">
          Conecte e gerencie a conta utilizada pelas automações do DOMNEX.
        </p>
      </div>

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