import React, { useMemo, useState } from 'react';
import {
  CalendarClock,
  MessageSquare,
  Radio,
  Users,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { WhatsAppAccount, WhatsAppGroup, WHATSAPP_STATUS_LABELS } from '../../types/whatsApp';
import { NewScheduleInput } from '../../services/scheduling/schedulingStore';

interface NewScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: WhatsAppAccount[];
  groups: WhatsAppGroup[];
  onSubmit: (input: NewScheduleInput) => Promise<boolean>;
}

interface FormState {
  title: string;
  accountSessionId: string;
  groupId: string;
  date: string;
  time: string;
  message: string;
}

interface FormErrors {
  title?: string;
  accountSessionId?: string;
  groupId?: string;
  date?: string;
  time?: string;
  message?: string;
}

function todayInputValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const textareaClasses =
  'w-full bg-[#F8FAFC] border border-[#DCE3EC] text-[#172033] placeholder:text-[#94A3B8] rounded-lg text-xs px-3 py-2 h-24 resize-none transition-all duration-150 hover:border-[#93C5FD] hover:bg-[#F1F5F9] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]';

export const NewScheduleModal: React.FC<NewScheduleModalProps> = ({
  isOpen,
  onClose,
  accounts,
  groups,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>({
    title: '',
    accountSessionId: '',
    groupId: '',
    date: todayInputValue(),
    time: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setForm({
      title: '',
      accountSessionId: '',
      groupId: '',
      date: todayInputValue(),
      time: '',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const accountOptions = useMemo(() => {
    return accounts.map((acc) => ({
      value: acc.sessionId,
      label: `${acc.displayName || acc.name || acc.number} · ${
        WHATSAPP_STATUS_LABELS[acc.status]
      }`,
    }));
  }, [accounts]);

  const groupsForAccount = useMemo(() => {
    const sessionId = form.accountSessionId;
    if (!sessionId) return [];
    return groups.filter(
      (group) => group.sessionId === sessionId || group.sessionId === null
    );
  }, [groups, form.accountSessionId]);

  const groupOptions = useMemo(() => {
    return groupsForAccount.map((group) => ({
      value: group.id,
      label: group.name || 'Grupo sem nome',
    }));
  }, [groupsForAccount]);

  const handleAccountChange = (sessionId: string) => {
    const belongs = groups.some(
      (group) =>
        group.id === form.groupId &&
        (group.sessionId === sessionId || group.sessionId === null)
    );
    setForm((prev) => ({
      ...prev,
      accountSessionId: sessionId,
      groupId: belongs ? prev.groupId : '',
    }));
    setSubmitted(false);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    if (!form.title.trim()) next.title = 'Informe um título.';
    if (!form.accountSessionId) next.accountSessionId = 'Selecione a conta WhatsApp.';
    if (!form.groupId) next.groupId = 'Selecione o grupo/destino.';
    if (!form.date) next.date = 'Informe a data.';
    if (!form.time) next.time = 'Informe a hora.';
    if (!form.message.trim()) next.message = 'Escreva a mensagem.';
    return next;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const selectedAccount = accounts.find(
      (acc) => acc.sessionId === form.accountSessionId
    );
    const selectedGroup = groupsForAccount.find((g) => g.id === form.groupId);

    setSubmitting(true);
    try {
      const ok = await onSubmit({
        title: form.title,
        accountSessionId: selectedAccount?.sessionId ?? null,
        accountName: selectedAccount
          ? selectedAccount.displayName ||
            selectedAccount.name ||
            selectedAccount.number
          : form.accountSessionId,
        groupId: selectedGroup?.id ?? null,
        groupName: selectedGroup?.name ?? '',
        date: form.date,
        time: form.time,
        message: form.message,
      });
      if (ok) {
        resetForm();
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const noAccountsConnected = accounts.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo Agendamento"
      subtitle="Planeje uma publicação futura. O envio ocorrerá automaticamente na data e hora programadas."
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-[#334155] mb-1 block">
            Título
          </label>
          <Input
            value={form.title}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, title: e.target.value }));
              setSubmitted(false);
            }}
            placeholder="Ex.: Divulgação ofertas do dia"
            error={submitted ? errors.title : undefined}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#334155] mb-1 block">
            Conta WhatsApp
          </label>
          <Select
            value={form.accountSessionId}
            onChange={(e) => handleAccountChange(e.target.value)}
            options={
              noAccountsConnected
                ? []
                : [{ value: '', label: 'Selecione a conta...', disabled: true }, ...accountOptions]
            }
            leftIcon={noAccountsConnected ? undefined : <Radio className="w-3.5 h-3.5" />}
            disabled={noAccountsConnected}
            error={submitted ? errors.accountSessionId : undefined}
          />
          {noAccountsConnected && (
            <p className="text-[11px] text-[#64748B] mt-1 pl-1">
              Nenhuma conta conectada. Adicione e conecte uma conta em{' '}
              <span className="font-medium text-[#2563EB]">Conexões</span> antes
              de agendar.
            </p>
          )}
        </div>

        <div>
          <label className="text-xs font-medium text-[#334155] mb-1 block">
            Destino / Grupo
          </label>
          <Select
            value={form.groupId}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, groupId: e.target.value }));
              setSubmitted(false);
            }}
            options={[
              { value: '', label: 'Selecione o grupo...', disabled: true },
              ...groupOptions,
            ]}
            leftIcon={<Users className="w-3.5 h-3.5" />}
            error={submitted ? errors.groupId : undefined}
          />
          {form.accountSessionId && groupOptions.length === 0 && (
            <p className="text-[11px] text-[#64748B] mt-1 pl-1">
              Nenhum grupo sincronizado para esta conta. Sincronize os grupos em{' '}
              <span className="font-medium text-[#2563EB]">Conexões</span>.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-[#334155] mb-1 block">
              Data
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, date: e.target.value }));
                setSubmitted(false);
              }}
              error={submitted ? errors.date : undefined}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#334155] mb-1 block">
              Hora
            </label>
            <Input
              type="time"
              value={form.time}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, time: e.target.value }));
                setSubmitted(false);
              }}
              error={submitted ? errors.time : undefined}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-[#334155] mb-1 block">
            Mensagem
          </label>
          <textarea
            value={form.message}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, message: e.target.value }));
              setSubmitted(false);
            }}
            placeholder="Escreva aqui a mensagem que será enviada ao grupo..."
            className={textareaClasses}
          />
          {submitted && errors.message ? (
            <p className="text-[11px] text-red-700 mt-1 pl-1">{errors.message}</p>
          ) : (
            <p className="text-[11px] text-[#64748B] mt-1 pl-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Texto que será enviado ao destino automaticamente na data e hora programadas.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            leftIcon={<CalendarClock className="w-3.5 h-3.5" />}
            disabled={submitting}
            loading={submitting}
          >
            Criar Agendamento
          </Button>
        </div>
      </div>
    </Modal>
  );
};