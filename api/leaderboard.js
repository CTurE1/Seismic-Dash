// /api/leaderboard.js
// Vercel Serverless Function для безопасной работы с JSONBin.io
// API ключи хранятся в переменных окружения Vercel

const BIN_ID = process.env.JSONBIN_BIN_ID;          // ID вашего bin
const SECRET = process.env.JSONBIN_SECRET_KEY;      // X-Master-Key из jsonbin
const READ_KEY = process.env.JSONBIN_READ_KEY || ""; // опционально: отдельный read key
const JSONBIN_BASE = "https://api.jsonbin.io/v3/b";

function ok(res, data, code = 200) {
  res.status(code).setHeader('Content-Type', 'application/json');
  // CORS для работы с любого домена
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

function err(res, message, code = 400) {
  ok(res, { ok: false, error: message }, code);
}

// Получить лидерборд из JSONBin.io
async function jsonbinGet() {
  const r = await fetch(`${JSONBIN_BASE}/${BIN_ID}/latest`, {
    headers: {
      'X-Master-Key': SECRET,
      ...(READ_KEY ? { 'X-Access-Key': READ_KEY } : {}),
    }
  });
  if (!r.ok) throw new Error(`jsonbin GET error ${r.status}`);
  const j = await r.json();
  // ожидаем структуру вида { record: { leaderboard: [...] } }
  return j.record?.leaderboard || [];
}

// Сохранить лидерборд в JSONBin.io
async function jsonbinPut(leaderboard) {
  const r = await fetch(`${JSONBIN_BASE}/${BIN_ID}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': SECRET,
    },
    body: JSON.stringify({ leaderboard }),
  });
  if (!r.ok) throw new Error(`jsonbin PUT error ${r.status}`);
  const j = await r.json();
  return !!j;
}

// Валидация и нормализация данных игрока
function sanitizeEntry(e) {
  const name = String((e.name || 'Player').slice(0, 20)).trim();
  const score = Math.max(0, Math.floor(Number(e.score || 0)));
  const magnitude = String(e.magnitude || 'Magnitude 1.0').slice(0, 20);
  
  return { 
    name, 
    score, 
    magnitude, 
    date: new Date().toISOString(),
    timestamp: Date.now()
  };
}

// Сортировка и обрезка лидерборда
function sortAndTrim(arr, limit = 10) {
  // сортировка по очкам (по убыванию)
  arr.sort((a, b) => b.score - a.score);
  return arr.slice(0, limit);
}

// Простой rate-limit (не чаще чем раз в 1.5 секунды)
let lastWrite = 0;
function softRateLimit() {
  const now = Date.now();
  if (now - lastWrite < 1500) return false;
  lastWrite = now;
  return true;
}

export default async function handler(req, res) {
  try {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    // GET: получить лидерборд
    if (req.method === 'GET') {
      const leaderboard = await jsonbinGet();
      return ok(res, { ok: true, leaderboard });
    }

    // POST: добавить результат
    if (req.method === 'POST') {
      if (!softRateLimit()) {
        return err(res, 'Too many requests, please slow down', 429);
      }

      // Читаем тело запроса
      let body = '';
      await new Promise((resolve) => {
        req.on('data', chunk => body += chunk);
        req.on('end', resolve);
      });
      
      const payload = JSON.parse(body || '{}');
      const entry = sanitizeEntry(payload);

      // Загружаем текущий лидерборд
      const leaderboard = await jsonbinGet();
      
      // Добавляем новый результат
      leaderboard.push(entry);
      
      // Сортируем и обрезаем до топ-10
      const trimmed = sortAndTrim(leaderboard, 10);
      
      // Сохраняем обратно
      await jsonbinPut(trimmed);

      return ok(res, { 
        ok: true, 
        saved: entry,
        leaderboard: trimmed 
      });
    }

    return err(res, 'Method not allowed', 405);
  } catch (e) {
    console.error('Leaderboard API error:', e);
    return err(res, 'Server error', 500);
  }
}
