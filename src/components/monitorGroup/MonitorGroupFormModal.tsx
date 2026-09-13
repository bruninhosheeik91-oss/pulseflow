import React, { useState, useEffect } from 'react';
import { Plus, Users } from 'lucide-react';
import { MonitorPlatform } from '../../types/monitorGroup';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

export interface MonitorGroupDraft {
  name: string;
  platform: MonitorPlatform;
  identifier: string;
}

interface MonitorGroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initial?: { name: string; platform: MonitorPlatform; identifier: string } | null;
  onSave: (data: MonitorGroupDraft) => void;
}

export const MonitorGroupFormModal: React.FC<MonitorGroupFormModalProps> = ({
  isOpen,
  onClose,
  initial,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<MonitorPlatform>('WhatsApp');
  const [identifier, setIdentifier] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '');
      setPlatform(initial?.platform ?? 'WhatsApp');
      setIdentifier(initial?.identifier ?? '');
    }
  }, [isOpen, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), platform, identifier: identifier.trim() });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initial ? 'Editar Grupo Monitor' : 'Configurar Grupo Monitor'}
      subtitle="Defina seu grupo central (grupo mãe), usado como hub de distribuição."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <div className="space-y-3 p-3.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
            1. Grupo mãe
          </span>

          <div className="space-y-1">
            <label className="text-xs font-medium text-[#172033]">
              Nome <span className="text-rose-700">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pulse Flow Ofertas Central"
              className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#172033]">
                Plataforma
              </label>
              <Select
                options={[
                  { value: 'WhatsApp', label: 'WhatsApp' },
                  { value: 'Telegram', label: 'Telegram' },
                  { value: 'Outra', label: 'Outra' },
                ]}
                value={platform}
                onChange={(e) => setPlatform(e.target.value as MonitorPlatform)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#172033]">
                Identificação do grupo
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex: @pulseflow_ofertas"
                className="w-full h-9 px-3 bg-[#FFFFFF] border border-[#CBD5E1] rounded-lg text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#2563EB]"
              />
              <p className="text-[10px] text-[#64748B]">
                Campo preparatório para futura integração. Nenhuma credencial é
                solicitada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/[0.07] border border-amber-500/20">
            <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span className="text-[11px] text-amber-700/90">
              <span className="font-semibold text-amber-700">Status:</span>{' '}
              Requer integração — a captura será ativada quando houver integração
              suportada.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            disabled={!name.trim()}
            className="text-xs font-semibold px-4"
          >
            {initial ? 'Salvar Alterações' : 'Configurar Grupo Monitor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};