from pathlib import Path

p = Path('server/server.js')
s = p.read_text(encoding='utf-8')

s = s.replace("const HOST = '127.0.0.1';", "const HOST = String(process.env.HOST || '127.0.0.1').trim();", 1)
s = s.replace(
    "const SESSION_DIR = path.join(__dirname, 'tokens');\nconst DATA_DIR = path.join(__dirname, 'data');",
    "const STATE_DIR = String(process.env.PULSEFLOW_STATE_DIR || __dirname).trim();\nconst SESSION_DIR = path.join(STATE_DIR, 'tokens');\nconst DATA_DIR = path.join(STATE_DIR, 'data');",
    1,
)
s = s.replace(
    "const CHROME_PATH =\n  process.env.WPP_CHROME_PATH ||\n  'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';",
    "const CHROME_PATH =\n  process.env.WPP_CHROME_PATH ||\n  (process.platform === 'win32'\n    ? 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe'\n    : '/usr/bin/chromium');",
    1,
)

needle = "function killSessionBrowser(sessionId) {\n  const profilePath = path.join(SESSION_DIR, sessionId);\n  const ps = `"
if needle not in s:
    raise SystemExit('killSessionBrowser marker not found')
replacement = "function killSessionBrowser(sessionId) {\n  const profilePath = path.join(SESSION_DIR, sessionId);\n  if (process.platform !== 'win32') {\n    const proc = spawn('pkill', ['-f', profilePath], { stdio: 'ignore' });\n    proc.on('error', () => {});\n    proc.unref();\n    logWhatsApp(\n      `[${sessionId}] encerramento best-effort do Chromium órfão da sessão (tokens preservados)`\n    );\n    return;\n  }\n  const ps = `"
s = s.replace(needle, replacement, 1)

needle = "      puppeteerOptions: {\n        executablePath: CHROME_PATH,\n        headless: true,\n      },"
replacement = "      puppeteerOptions: {\n        executablePath: CHROME_PATH,\n        headless: true,\n        args:\n          process.platform === 'win32'\n            ? []\n            : [\n                '--no-sandbox',\n                '--disable-setuid-sandbox',\n                '--disable-dev-shm-usage',\n              ],\n      },"
if needle not in s:
    raise SystemExit('puppeteerOptions marker not found')
s = s.replace(needle, replacement, 1)

p.write_text(s, encoding='utf-8')
