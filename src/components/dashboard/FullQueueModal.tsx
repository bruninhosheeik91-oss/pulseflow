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
          <div className="p-2.5 bg-[#122240] border border-[#1E3A6D] text-xs text-[#00C2FF] rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="divide-y divide-[#162340] max-h-96 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#8E9BAE]">
              Nenhuma postagem na fila no momento.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono-numeric font-bold text-[#00C2FF] bg-[#0A1020] px-2.5 py-1 rounded border border-[#182647] shrink-0">
                    {item.time}
                  </span>
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded object-cover border border-[#182647]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#E6E8EC] truncate">
                      {item.productName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#8E9BAE] mt-0.5">
                      <Radio className="w-3 h-3 text-[#1E5EFF]" />
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
                        className="p-1.5 text-[#00C2FF] hover:bg-[#152345] rounded transition-colors"
                        title="Disparar agora"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-[#8E9BAE] hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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

        <div className="flex items-center justify-between pt-3 border-t border-[#162340]">
          <span className="text-xs text-[#8E9BAE]">
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
