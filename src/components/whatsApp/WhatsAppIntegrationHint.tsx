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
    <div className="bg-[#0A1020] border border-[#16233B] rounded-xl p-4">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
          <ArrowRight className="w-4 h-4 text-[#00C2FF]" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">
            Integração com o PULSE FLOW
          </p>
          <p className="text-xs text-[#8E9BAE] leading-relaxed mt-1">
            <span className="text-[#E6E8EC] font-semibold">WhatsApp</span> é a{' '}
            <span className="text-[#00C2FF] font-medium">origem da conexão</span>.
            Os grupos importados alimentam automaticamente os módulos de
            distribuição,{' '}
            <span className="text-[#E6E8EC]">sem duplicar cadastros</span>.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {TARGETS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#101B33] border border-[#1C2C50] text-[10px] font-medium text-[#C8D1DE]"
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