from pathlib import Path

server = Path('server/server.js')
s = server.read_text(encoding='utf-8')

import_marker = "const {\n  createTenantAutoSearchSendsStore,\n} = require('./linkConversion/tenantAutoSearchSendsStore.js');\n"
import_add = import_marker + "const { createTenantLinkListsStore } = require('./linkConversion/tenantLinkListsStore.js');\n"
if import_marker not in s:
    raise SystemExit('server import marker not found')
s = s.replace(import_marker, import_add, 1)

store_marker = "const autoSearchSendsStore = createTenantAutoSearchSendsStore({ dataDir: DATA_DIR });\n"
store_add = store_marker + "const linkListsStore = createTenantLinkListsStore({ dataDir: DATA_DIR });\n"
if store_marker not in s:
    raise SystemExit('server store marker not found')
s = s.replace(store_marker, store_add, 1)

route_marker = "// ===== Envio manual real (1 produto, 1 grupo, conta salva na automação) =====\n"
routes = r'''// ===== Lista de Links (persistência real por tenant) =====
app.get('/api/affiliate/link-lists', resolveTenant, (req, res) => {
  res.json({ ok: true, tenant: req.tenantId, lists: linkListsStore.list(req.tenantId) });
});

app.post('/api/affiliate/link-lists', resolveTenant, (req, res) => {
  try {
    const list = linkListsStore.upsert(req.tenantId, req.body || {});
    logInfo(`lista de links criada (tenant=${req.tenantId}, id=${list.id})`);
    res.json({ ok: true, tenant: req.tenantId, list });
  } catch (err) {
    logError(`falha ao criar lista de links (tenant=${req.tenantId}): ${sanitizeSendError(err)}`);
    res.status(500).json({ ok: false, error: 'Falha ao salvar lista de links.' });
  }
});

app.delete('/api/affiliate/link-lists/:id', resolveTenant, (req, res) => {
  const removed = linkListsStore.remove(req.tenantId, req.params.id);
  if (!removed) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  res.json({ ok: true, tenant: req.tenantId, removed: true });
});

app.post('/api/affiliate/link-lists/:id/links', resolveTenant, (req, res) => {
  const result = linkListsStore.addLinks(req.tenantId, req.params.id, req.body?.urls || []);
  if (!result) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  res.json({ ok: true, tenant: req.tenantId, list: result.list, added: result.added.length });
});

app.delete('/api/affiliate/link-lists/:id/links/:linkId', resolveTenant, (req, res) => {
  const result = linkListsStore.removeLink(req.tenantId, req.params.id, req.params.linkId);
  if (result === null) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });
  if (result === false) return res.status(404).json({ ok: false, error: 'Link não encontrado.' });
  res.json({ ok: true, tenant: req.tenantId, list: result });
});

'''
if route_marker not in s:
    raise SystemExit('server route marker not found')
s = s.replace(route_marker, routes + route_marker, 1)
server.write_text(s, encoding='utf-8')

page = Path('src/components/linkList/LinkListPage.tsx')
t = page.read_text(encoding='utf-8')

service_import = "import { initialCampaigns } from '../../data/mockCampaigns';\n"
service_add = service_import + "import {\n  addLinksToList,\n  createLinkList,\n  deleteLinkList,\n  listLinkLists,\n  removeLinkFromList,\n} from '../../services/linkList/linkListService';\n"
if service_import not in t:
    raise SystemExit('frontend import marker not found')
t = t.replace(service_import, service_add, 1)

t = t.replace("  LinkListItem,\n", "", 1)
t = t.replace("const nowTime = () =>\n  new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });\n\n", "", 1)

state_marker = "  const [lists, setLists] = useState<LinkList[]>([]);\n"
state_add = state_marker + "  const [loadingLists, setLoadingLists] = useState(true);\n  const [listsError, setListsError] = useState<string | null>(null);\n"
if state_marker not in t:
    raise SystemExit('frontend state marker not found')
t = t.replace(state_marker, state_add, 1)

active_marker = "  const activeList = lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;\n\n"
load_effect = '''  useEffect(() => {
    let mounted = true;
    listLinkLists()
      .then((realLists) => {
        if (!mounted) return;
        setLists(realLists);
        setActiveListId((current) => current || realLists[0]?.id || null);
        setListsError(null);
      })
      .catch((error) => {
        if (!mounted) return;
        setListsError(error instanceof Error ? error.message : 'Falha ao carregar listas reais.');
      })
      .finally(() => {
        if (mounted) setLoadingLists(false);
      });
    return () => { mounted = false; };
  }, []);

'''
if active_marker not in t:
    raise SystemExit('frontend active marker not found')
t = t.replace(active_marker, active_marker + load_effect, 1)

start = t.index("  const handleCreateList = (data: {")
end = t.index("  const handleImportAction = () => {", start)
new_handlers = '''  const handleCreateList = async (data: {
    name: string;
    description: string;
    campaignId: string | null;
    campaignName: string | null;
    destination: LinkList['destination'];
    rotation: LinkList['rotation'];
    frequency: LinkListFrequency;
  }) => {
    try {
      const created = await createLinkList(data);
      setLists((prev) => [...prev, created]);
      setActiveListId(created.id);
      setProcessingNotice(false);
      showToast(`Lista "${created.name}" criada e salva.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao criar lista.', 'info');
    }
  };

  const handleAddLinks = async (urls: string[]) => {
    if (!activeList) return;
    try {
      const updated = await addLinksToList(activeList.id, urls);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      setProcessingNotice(false);
      showToast(`${urls.length} link(s) sincronizado(s) com "${activeList.name}".`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao salvar links.', 'info');
    }
  };

  const handleRemoveLink = async (linkId: string) => {
    if (!activeList) return;
    try {
      const updated = await removeLinkFromList(activeList.id, linkId);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      setSelectedIds((prev) => prev.filter((id) => id !== linkId));
      showToast('Link removido da lista real.', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao remover link.', 'info');
    }
  };

  const handleSendToQueue = () => {
    showToast('Fila real ainda não está conectada à Lista de Links. Nenhum status foi simulado.', 'info');
  };

  const handleDeleteList = async (listId: string) => {
    const target = lists.find((list) => list.id === listId);
    try {
      await deleteLinkList(listId);
      const remaining = lists.filter((list) => list.id !== listId);
      setLists(remaining);
      if (activeListId === listId) setActiveListId(remaining[0]?.id ?? null);
      setSelectedIds([]);
      setProcessingNotice(false);
      showToast(`Lista "${target?.name ?? ''}" excluída do backend.`, 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao excluir lista.', 'info');
    }
  };

  const handleProcessLinks = () => {
    setProcessingNotice(true);
    showToast('Processamento real de produto será conectado na próxima etapa.', 'info');
  };

  const handleCopyLink = async (link: import('../../types/linkList').LinkListItem) => {
    try {
      await navigator.clipboard.writeText(link.url);
      setCopiedId(link.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      showToast('Não foi possível copiar o link.', 'info');
    }
  };

'''
t = t[:start] + new_handlers + t[end:]

subtitle = '''          <p className="text-xs text-[#64748B] mt-1">
            Organize links de ofertas e prepare sua distribuição.
          </p>'''
subtitle_new = subtitle + '''
          {loadingLists && <p className="text-[11px] text-[#64748B] mt-1">Sincronizando listas reais...</p>}
          {listsError && <p className="text-[11px] text-amber-700 mt-1">{listsError}</p>}'''
if subtitle not in t:
    raise SystemExit('frontend subtitle marker not found')
t = t.replace(subtitle, subtitle_new, 1)
page.write_text(t, encoding='utf-8')
