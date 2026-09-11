import React, { Fragment } from 'react';
import { ChevronRight, MessageCircle, Users, Workflow } from 'lucide-react';

const STEPS = [
  {
    title: 'Conecte seu WhatsApp',
    description: 'Ligue a conta que alimentará as automações.',
    icon: MessageCircle,
  },
  {
    title: 'Importe seus grupos',
    description: 'Os grupos conectados entram na sua operação.',
    icon: Users,
  },
  {
    title: 'Configure suas automações',
    description: 'Distribua suas ofertas nos destinos vinculados.',
    icon: Workflow,
  },
];

export const WhatsAppFlowSteps: React.FC = () => {
  return (
    <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl p-4">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Fragment key={step.title}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-[#1E5EFF]/15 border border-[#1E5EFF]/30 text-[#00C2FF] text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#E6E8EC] flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#8E9BAE] shrink-0" />
                    {step.title}
                  </p>
                  <p className="text-[10px] text-[#64748B] leading-relaxed mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[#334155] hidden lg:block shrink-0 mx-1" />
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};