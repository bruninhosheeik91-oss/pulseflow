import React, { useState } from 'react';
import { MessageCircle, Send, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { WhatsAppGroup } from '../../types/whatsApp';

interface WhatsAppGroupsSectionProps {
  isConnected: boolean;
  groups: WhatsAppGroup[];
  onSend: (
    groupId: string,
    message: string
  ) => Promise<{ ok: boolean; error?: string }>;
}

type Feedback = { type: 'success' | 'error'; text: string } | null;

export const WhatsAppGroupsSection: React.FC<
  WhatsAppGroupsSectionProps
> = ({ isConnected, groups, onSend }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const handleSend = async () => {
    const groupId = selectedGroupId.trim();
    const text = message.trim();
    if (!groupId || !text || sending) return;

    setSending(true);
    setFeedback(null);
    const result = await onSend(groupId, text);
    setSending(false);
    if (result.ok) {
      setFeedback({
        type: 'success',
        text: 'Mensagem enviada com sucesso.',
      });
      setMessage('');
    } else {
      setFeedback({
        type: 'error',
        text: result.error || 'Falha no envio.',
      });
    }
  };

  const hasGroups = groups.length > 0;

  return (
    <div className="bg-[#0E1628] border border-[#1B2947] rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 pb-4 border-b border-[#162442]">
        <div>
          <h2 className="text-sm font-semibold text-[#E6E8EC] tracking-tight">
            Grupos do WhatsApp
          </h2>
          <p className="text-xs text-[#8E9BAE] mt-0.5">
            Dados reais retornados pela conta conectada.
          </p>
        </div>
        {isConnected && hasGroups && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-md bg-[#14203B] border border-[#1E3057] text-[#00C2FF] shrink-0">
            {groups.length} {groups.length === 1 ? 'grupo' : 'grupos'}
          </span>
        )}
      </div>

      <div className="p-5">
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Conecte seu WhatsApp para importar seus grupos.
            </p>
          </div>
        ) : !hasGroups ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-[#14203B] border border-[#1E3057] flex items-center justify-center">
              <Users className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <p className="text-xs text-[#8E9BAE] leading-relaxed">
              Nenhum grupo importado. Use "Sincronizar grupos" após conectar.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <ul className="space-y-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#0A1020] border border-[#16233B]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#14203B] border border-[#1E3057] flex items-center justify-center shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#00C2FF]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[#E6E8EC] block truncate">
                      {group.name}
                    </span>
                    <span className="text-[10px] text-[#64748B] font-mono-numeric block truncate mt-0.5">
                      {group.memberCount > 0
                        ? `${group.memberCount} participantes`
                        : 'participantes não informados'}
                      {' · '}
                      {group.id}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="rounded-lg border border-[#1B2947] bg-[#0A1020] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-3.5 h-3.5 text-[#00C2FF]" />
                <h3 className="text-xs font-semibold text-[#E6E8EC]">
                  Enviar mensagem de teste
                </h3>
              </div>

              <div className="space-y-3">
                <Select
                  options={[
                    { value: '', label: 'Selecione um grupo importado...' },
                    ...groups.map((group) => ({
                      value: group.id,
                      label: group.name,
                    })),
                  ]}
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setFeedback(null);
                  }}
                  sizeVariant="md"
                  disabled={sending}
                />

                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setFeedback(null);
                  }}
                  placeholder="Escreva a mensagem de teste..."
                  rows={3}
                  disabled={sending}
                  className="w-full bg-[#0A1020] border border-[#1B2947] text-[#E6E8EC] placeholder:text-[#5A6470] rounded-lg p-3 text-xs leading-relaxed resize-y focus:outline-none focus:border-[#1E5EFF] focus:ring-1 focus:ring-[#1E5EFF] disabled:opacity-40"
                />

                {feedback && (
                  <div
                    className={`flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs leading-relaxed border ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/25 text-red-300'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{feedback.text}</span>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void handleSend()}
                    loading={sending}
                    disabled={!selectedGroupId || !message.trim()}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                    className="text-xs font-semibold"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};