import React from 'react';
import {
  ArrowRight,
  Radio,
  Users,
  Copy,
  Megaphone,
  Clock,
} from 'lucide-react';

const TARGETS = [
  { label: 'Canais e Grupos', icon: Radio },
  { label: 'Grupo Monitor', icon: Users },
  { label: 'Espelhamento', icon: Copy },
  { label: 'Campanhas', icon: Megaphone },
  { label: 'Fila de Publicação', icon: Clock },
];

export const WhatsAppIntegrationHint: React.FC = () => {
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] border border-[#BFDBFE] flex items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Integração com o PULSE FLOW
          </p>
          <p className="text-xs text-[#64748B] leading-relaxed mt-1">
            <span className="text-[#172033] font-semibold">WhatsApp</span> é a{' '}
            <span className="text-[#2563EB] font-medium">origem da conexão</span>.
            Os grupos importados alimentam automaticamente os módulos de
            distribuição,{' '}
            <span className="text-[#172033]">sem duplicar cadastros</span>.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {TARGETS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-medium text-[#334155]"
              >
                <Icon className="w-3 h-3 text-[#64748B]" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};