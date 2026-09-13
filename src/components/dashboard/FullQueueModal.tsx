import React, { useState } from 'react';
import { Radio, Trash2, Send, CheckCircle2 } from 'lucide-react';
import { QueueItem } from '../../types';
import { initialQueue } from '../../data/mockData';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface FullQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullQueueModal: React.FC<FullQueueModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRemove = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setStatusMessage('Publicação removida da fila.');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  const handleDispatchNow = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'Publicado' } : item
      )
    );
    setStatusMessage('Publicação disparada com sucesso!');
    setTimeout(() => setStatusMessage(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fila Completa de Publicações"
      subtitle="Controle da grade de postagens programadas para canais e grupos"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {statusMessage && (
          <div className="p-2.5 bg-[#F8FAFC] border border-[#93C5FD] text-xs text-[#2563EB] rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="divide-y divide-[#E2E8F0] max-h-96 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748B]">
              Nenhuma postagem na fila no momento.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono-numeric font-bold text-[#2563EB] bg-[#F8FAFC] px-2.5 py-1 rounded border border-[#DCE3EC] shrink-0">
                    {item.time}
                  </span>
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded object-cover border border-[#DCE3EC]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#172033] truncate">
                      {item.productName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                      <Radio className="w-3 h-3 text-[#2563EB]" />
                      <span>{item.channel}</span>
                      <span>•</span>
                      <span className="font-mono-numeric">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={item.status === 'Agendado' ? 'info' : item.status === 'Publicado' ? 'success' : 'neutral'}
                    size="xs"
                  >
                    {item.status}
                  </Badge>

                  {item.status !== 'Publicado' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDispatchNow(item.id)}
                        className="p-1.5 text-[#2563EB] hover:bg-[#DBEAFE] rounded transition-colors"
                        title="Disparar agora"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-[#64748B] hover:text-red-700 hover:bg-red-500/10 rounded transition-colors"
                        title="Remover da fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <span className="text-xs text-[#64748B]">
            Total agendado: {queue.filter((q) => q.status !== 'Publicado').length} itens
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
