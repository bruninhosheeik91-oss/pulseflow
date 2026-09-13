import React, { useState } from 'react';
import {
  Settings,
  Server,
  ShieldAlert,
  Sparkles,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import {
  initialGatewaySettings,
  initialAntiBanSettings,
  initialScoringWeightsSettings,
  initialCopywritingSettings,
  initialSystemGeneralSettings,
} from '../../data/mockSettings';
import {
  GatewaySettings,
  AntiBanSettings,
  ScoringWeightsSettings,
  CopywritingSettings,
  SystemGeneralSettings,
} from '../../types';
import { SettingsGatewaysTab } from './SettingsGatewaysTab';
import { SettingsAntiBanTab } from './SettingsAntiBanTab';
import { SettingsScoringTab } from './SettingsScoringTab';
import { SettingsCopywritingTab } from './SettingsCopywritingTab';
import { SettingsGeneralTab } from './SettingsGeneralTab';

type SettingsTab =
  | 'gateways'
  | 'antiban'
  | 'scoring'
  | 'copywriting'
  | 'general';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('gateways');

  // State for all setting groups
  const [gateways, setGateways] =
    useState<GatewaySettings>(initialGatewaySettings);
  const [antiBan, setAntiBan] =
    useState<AntiBanSettings>(initialAntiBanSettings);
  const [scoring, setScoring] = useState<ScoringWeightsSettings>(
    initialScoringWeightsSettings
  );
  const [copywriting, setCopywriting] = useState<CopywritingSettings>(
    initialCopywritingSettings
  );
  const [general, setGeneral] = useState<SystemGeneralSettings>(
    initialSystemGeneralSettings
  );

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveGateways = (newData: GatewaySettings) => {
    setGateways(newData);
    showToast('Configurações dos gateways WhatsApp e Telegram salvas!');
  };

  const handleSaveAntiBan = (newData: AntiBanSettings) => {
    setAntiBan(newData);
    showToast('Regras de proteção anti-ban e espaçamento salvas!');
  };

  const handleSaveScoring = (newData: ScoringWeightsSettings) => {
    setScoring(newData);
    showToast('Pesos e cortes do algoritmo de Deal Score calibrados!');
  };

  const handleSaveCopywriting = (newData: CopywritingSettings) => {
    setCopywriting(newData);
    showToast('Modelos de copywriting e encurtadores atualizados!');
  };

  const handleSaveGeneral = (newData: SystemGeneralSettings) => {
    setGeneral(newData);
    showToast('Configurações gerais do sistema atualizadas!');
  };

  const handleResetFactory = () => {
    setGateways(initialGatewaySettings);
    setAntiBan(initialAntiBanSettings);
    setScoring(initialScoringWeightsSettings);
    setCopywriting(initialCopywritingSettings);
    setGeneral(initialSystemGeneralSettings);
    showToast('Todas as configurações foram restauradas para os padrões de fábrica!');
  };

  const tabs: {
    id: SettingsTab;
    label: string;
    icon: React.ElementType;
    badge?: string;
  }[] = [
    { id: 'gateways', label: 'Gateways & Disparo', icon: Server },
    { id: 'antiban', label: 'Proteção Anti-Ban', icon: ShieldAlert },
    { id: 'scoring', label: 'Scoring & Algoritmo', icon: Sparkles },
    { id: 'copywriting', label: 'Copywriting & Links', icon: FileText },
    { id: 'general', label: 'Geral & Notificações', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Information */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#172033] tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2563EB]" />
            <span>Configurações & Parâmetros do Sistema</span>
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            Gerencie credenciais de APIs parceiras, regras de inteligência artificial, cadência anti-ban e templates de copy
          </p>
        </div>
      </div>

      {/* 2. Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-[#E2E8F0] pb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#E2E8F0] text-[#172033] border border-[#2563EB] shadow-xs'
                  : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 px-1.5 py-0.2 rounded-full font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Content */}
      <div className="min-h-[420px]">
        {activeTab === 'gateways' && (
          <SettingsGatewaysTab
            settings={gateways}
            onSave={handleSaveGateways}
          />
        )}
        {activeTab === 'antiban' && (
          <SettingsAntiBanTab
            settings={antiBan}
            onSave={handleSaveAntiBan}
          />
        )}
        {activeTab === 'scoring' && (
          <SettingsScoringTab
            settings={scoring}
            onSave={handleSaveScoring}
          />
        )}
        {activeTab === 'copywriting' && (
          <SettingsCopywritingTab
            settings={copywriting}
            onSave={handleSaveCopywriting}
          />
        )}
        {activeTab === 'general' && (
          <SettingsGeneralTab
            settings={general}
            onSave={handleSaveGeneral}
            onResetFactory={handleResetFactory}
          />
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#FFFFFF] border border-[#BFDBFE] text-[#172033] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-medium leading-relaxed">{toast}</span>
        </div>
      )}
    </div>
  );
};
