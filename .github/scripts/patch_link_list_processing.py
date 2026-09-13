from pathlib import Path

server = Path('server/server.js')
s = server.read_text(encoding='utf-8')

import_marker = "const { createShopeeApiClient } = require('./linkConversion/shopeeApiClient.js');\n"
import_add = import_marker + "const { isShopeeUrl } = require('./linkConversion/shopeeConverter.js');\n"
if import_marker not in s:
    raise SystemExit('server shopee import marker not found')
s = s.replace(import_marker, import_add, 1)

route_marker = "// ===== Envio manual real (1 produto, 1 grupo, conta salva na automação) =====\n"
routes = r'''// Processa de verdade os links pendentes da lista com a Affiliate Open API.
// Nesta etapa o pipeline valida Shopee e gera o short link afiliado oficial.
// Falha de API/credencial mantém o item pendente para permitir nova tentativa;
// URL fora da Shopee é marcada como inválida. Nenhum dado comercial é inventado.
app.post('/api/affiliate/link-lists/:id/process', resolveTenant, async (req, res) => {
  const tenantId = req.tenantId;
  const list = linkListsStore.get(tenantId, req.params.id);
  if (!list) return res.status(404).json({ ok: false, error: 'Lista não encontrada.' });

  const credentials = affiliateStore.getShopeeApiCredentials(tenantId);
  const view = affiliateStore.getShopeePublicView(tenantId);
  if (!credentials || !view.configured || view.enabled !== true) {
    return res.status(409).json({
      ok: false,
      error: 'Integração Shopee não está configurada e habilitada para este tenant.',
    });
  }

  const client = createShopeeApiClient({ credentials });
  const candidates = list.links.filter((item) => item.status === 'Pendente');
  let valid = 0;
  let invalid = 0;
  let failed = 0;

  for (const item of candidates) {
    linkListsStore.updateLink(tenantId, list.id, item.id, {
      status: 'Processando',
      processError: null,
    });

    if (!isShopeeUrl(item.url)) {
      invalid += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: null,
        affiliateUrl: null,
        status: 'Inválido',
        processError: 'URL não reconhecida como link da Shopee.',
        processedAt: new Date().toISOString(),
      });
      continue;
    }

    try {
      const generated = await client.generateShortLink({
        sourceUrl: item.url,
        subIds: Array.isArray(view.subIds) ? view.subIds : [],
      });
      valid += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: 'Shopee',
        affiliateUrl: generated.affiliateUrl,
        status: 'Válido',
        processError: null,
        processedAt: new Date().toISOString(),
      });
    } catch (err) {
      failed += 1;
      linkListsStore.updateLink(tenantId, list.id, item.id, {
        marketplace: 'Shopee',
        affiliateUrl: null,
        status: 'Pendente',
        processError: sanitizeSendError(err),
        processedAt: new Date().toISOString(),
      });
    }
  }

  const updated = linkListsStore.get(tenantId, list.id);
  logInfo(`lista processada (tenant=${tenantId}, id=${list.id}): válidos=${valid} inválidos=${invalid} falhas=${failed}`);
  res.json({
    ok: true,
    tenant: tenantId,
    list: updated,
    summary: { attempted: candidates.length, valid, invalid, failed },
  });
});

'''
if route_marker not in s:
    raise SystemExit('server route marker not found')
s = s.replace(route_marker, routes + route_marker, 1)
server.write_text(s, encoding='utf-8')

page = Path('src/components/linkList/LinkListPage.tsx')
t = page.read_text(encoding='utf-8')

import_marker = "  listLinkLists,\n  removeLinkFromList,\n"
import_add = "  listLinkLists,\n  processLinkList,\n  removeLinkFromList,\n"
if import_marker not in t:
    raise SystemExit('page service import marker not found')
t = t.replace(import_marker, import_add, 1)

old_handler = '''  const handleProcessLinks = () => {
    setProcessingNotice(true);
    showToast('Processamento real de produto será conectado na próxima etapa.', 'info');
  };
'''
new_handler = '''  const handleProcessLinks = async () => {
    if (!activeList) return;
    setProcessingNotice(true);
    try {
      const updated = await processLinkList(activeList.id);
      setLists((prev) => prev.map((list) => list.id === updated.id ? updated : list));
      const valid = updated.links.filter((link) => link.status === 'Válido').length;
      const invalid = updated.links.filter((link) => link.status === 'Inválido').length;
      const retry = updated.links.filter((link) => link.status === 'Pendente' && link.processError).length;
      showToast(`Processamento real concluído: ${valid} válido(s), ${invalid} inválido(s), ${retry} para tentar novamente.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Falha ao processar links.', 'info');
    } finally {
      setProcessingNotice(false);
    }
  };
'''
if old_handler not in t:
    raise SystemExit('page process handler marker not found')
t = t.replace(old_handler, new_handler, 1)
page.write_text(t, encoding='utf-8')
