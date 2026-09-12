import React, { useState, useEffect } from 'react';
import { Link2, Users } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface LinkedGroupItem {
  id: string;
  name: string;
  subtitle: string;
}

interface LinkedGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: LinkedGroupItem[];
  linkedIds: string[];
  onSave: (ids: string[]) => void;
}

export const LinkedGroupsModal: React.FC<LinkedGroupsModalProps> = ({
  isOpen,
  onClose,
  items,
  linkedIds,
  onSave,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelected([...linkedIds]);
  }, [isOpen, linkedIds]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vincular grupos"
      subtitle="Selecione os grupos reais que receberão as distribuições do Grupo Monitor."
      maxWidth="md"
    >
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {items.length === 0 ? (
          <div className="py-8 px-4 flex flex-col items-center text-center bg-[#0A1020] border border-[#162340] rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#101B33] border border-[#1C2C50] flex items-center justify-center mb-2">
              <Users className="w-4 h-4 text-[#64748B]" />
            </div>
            <span className="text-xs font-semibold text-[#8E9BAE]">
              Nenhum grupo sincronizado.
            </span>
            <p className="text-[10px] text-[#64748B] mt-1 max-w-[260px] leading-relaxed">
              Sincronize seus grupos reais na aba WhatsApp para poder vinculá-los
              aqui como destinos.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => {
              const checked = selected.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors cursor-pointer text-left ${
                    checked
                      ? 'bg-[#121E38] border-[#1E325C]'
                      : 'bg-[#070C18] border-[#162340] hover:border-[#1E3360]'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-[#1E5EFF] border-[#1E5EFF]'
                        : 'bg-[#0A1020] border-[#2A3E6D]'
                    }`}
                  >
                    {checked && (
                      <span className="text-[9px] text-white font-bold">✓</span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium block truncate ${
                        checked ? 'text-[#E6E8EC]' : 'text-[#94A3B8]'
                      }`}
                    >
                      {item.name}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-[#64748B] block">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-[#14203B] mt-4">
        <div className="flex items-center gap-2 text-[11px] text-[#8E9BAE]">
          <Link2 className="w-3.5 h-3.5" />
          <span>{selected.length} grupo(s) selecionado(s)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            leftIcon={<Link2 className="w-3.5 h-3.5" />}
            className="text-xs font-semibold"
          >
            Salvar vínculos
          </Button>
        </div>
      </div>
    </Modal>
  );
};