import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
      <div className="w-14 h-14 rounded-2xl bg-[#121E38] border border-[#1E325C] flex items-center justify-center">
        <Construction className="w-6 h-6 text-[#00C2FF]" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-sm font-semibold text-[#E6E8EC]">{title}</h3>
        <p className="text-xs text-[#8E9BAE]">Em breve</p>
      </div>
      <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#0D162B] text-[#64748B] border border-[#1E325C]">
        Módulo em desenvolvimento
      </span>
    </div>
  );
};
