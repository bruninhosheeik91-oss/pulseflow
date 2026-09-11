import React, { useState, useRef } from 'react';
import {
  ClipboardPaste,
  FileUp,
  Link as LinkIcon,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface AddLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'add' | 'import';
  listName: string;
  onAddLinks: (urls: string[]) => void;
}

export const AddLinksModal: React.FC<AddLinksModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  listName,
  onAddLinks,
}) => {
  const [mode, setMode] = useState<'add' | 'import'>('add');
  const [bulkText, setBulkText] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [importedUrls, setImportedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setBulkText('');
      setSingleUrl('');
      setFileName('');
      setImportedUrls([]);
    }
  }, [isOpen, initialMode]);

  const parseUrls = (raw: string): string[] =>
    raw
      .split(/[\n,;]+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && /^https?:\/\//i.test(line));

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setImportedUrls(parseUrls(String(reader.result || '')));
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    let urls: string[] = [];
    if (mode === 'add') {
      urls = [...parseUrls(bulkText)];
      if (singleUrl.trim()) urls.push(singleUrl.trim());
    } else {
      urls = importedUrls;
    }
    if (urls.length === 0) return;
    onAddLinks(urls);
    onClose();
  };

  const canConfirm = mode === 'add'
    ? bulkText.trim().length > 0 || singleUrl.trim().length > 0
    : importedUrls.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar links à lista"
      subtitle={`Lista: ${listName}`}
      maxWidth="xl"
    >
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#080E1C] border border-[#162340] rounded-lg">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              mode === 'add'
                ? 'bg-[#142340] text-white border border-[#1E5EFF]'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC] border border-transparent'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Colar links
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              mode === 'import'
                ? 'bg-[#142340] text-white border border-[#1E5EFF]'
                : 'text-[#8E9BAE] hover:text-[#E6E8EC] border border-transparent'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Importar arquivo
          </button>
        </div>

        {mode === 'add' ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#E6E8EC]">
                Colar vários links
              </label>
              <textarea
                rows={7}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Cole os links das ofertas, um por linha...\nhttps://...\nhttps://...'}
                className="w-full p-3 bg-[#070C18] border border-[#1A2C4E] rounded-lg text-xs font-mono text-[#E6E8EC] placeholder:text-[#64748B] focus:outline-none focus:border-[#1E5EFF] resize-y"
              />
              <p className="text-[10px] text-[#64748B]">
                {parseUrls(bulkText).length > 0
                  ? `${parseUrls(bulkText).length} link(s) detectado(s)`
                  : 'Somente links válidos (http/https) serão adicionados.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-[#162340]" />
              <span className="text-[10px] uppercase tracking-wider text-[#64748B]">
                ou adicione um link manualmente
              </span>
              <div className="h-px flex-1 bg-[#162340]" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 h-9 px-3 bg-[#070C18] border border-[#1A2C4E] rounded-lg text-xs font-mono text-[#E6E8EC] placeholder:text-[#64748B] focus:outline-none focus:border-[#1E5EFF]"
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LinkIcon className="w-3.5 h-3.5" />}
                disabled={!parseUrls(singleUrl).length}
                onClick={() => {
                  const parsed = parseUrls(singleUrl);
                  if (!parsed.length) return;
                  onAddLinks(parsed);
                  setSingleUrl('');
                }}
              >
                Adicionar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 bg-[#0B1220] border border-[#162340] rounded-xl flex flex-col items-center gap-3 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 px-4 py-6 rounded-lg border border-dashed border-[#1E3A6E] hover:border-[#1E5EFF] hover:bg-[#0E1830] transition-colors cursor-pointer bg-transparent"
              >
                <FileUp className="w-6 h-6 text-[#00C2FF]" />
                <span className="text-xs text-[#E6E8EC] font-medium">
                  {fileName || 'Selecione um arquivo TXT ou CSV'}
                </span>
                <span className="text-[10px] text-[#64748B]">
                  A leitura é feita apenas na interface, sem processamento
                  externo.
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,text/plain,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>

            {importedUrls.length > 0 && (
              <div className="p-3 bg-[#0E1B33] border border-[#1E3B70] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00C2FF]" />
                  <span className="text-[#E6E8EC]">
                    {importedUrls.length} link(s) reconhecido(s) no arquivo.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFileName('');
                    setImportedUrls([]);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-[10px] text-[#8E9BAE] hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}

            {importedUrls.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1">
                {importedUrls.slice(0, 20).map((url) => (
                  <p
                    key={url}
                    className="text-[11px] font-mono text-[#94A3B8] truncate px-2 py-1 bg-[#080E1C] border border-[#14203B] rounded"
                  >
                    {url}
                  </p>
                ))}
                {importedUrls.length > 20 && (
                  <p className="text-[10px] text-[#64748B] px-2">
                    +{importedUrls.length - 20} link(s) restante(s)
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#14203B]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!canConfirm}
            onClick={handleConfirm}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs font-semibold px-4"
          >
            Adicionar links
          </Button>
        </div>
      </div>
    </Modal>
  );
};