const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
};

function getIsraelTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function parseHHMM(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

async function fetchUp(url, opts = {}) {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, ...opts.headers },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

// --- 103FM ---
async function fetch103FM() {
  const res = await fetchUp('https://103fm.maariv.co.il/rss/get_Current_Program_for_Live_Brodcust.aspx');
  const data = await res.json();
  return data.Program_Title || null;
}

// --- Radius Nostalgi ---
let radiusNonce = null;

async function fetchRadiusNonce() {
  const res = await fetchUp('https://www.963fm.co.il/', { headers: { Accept: 'text/html' } });
  const html = await res.text();
  const match = html.match(/data-nonce="([^"]+)"/);
  return match ? match[1] : null;
}

async function fetchRadiusNostalgi() {
  if (!radiusNonce) radiusNonce = await fetchRadiusNonce();
  if (!radiusNonce) return null;

  const url = `https://www.963fm.co.il/wp-admin/admin-ajax.php?action=nostalgia_nowplaying&_wpnonce=${radiusNonce}`;
  try {
    const res = await fetchUp(url);
    const data = await res.json();
    if (!data.success) throw new Error('nonce expired');
    const { artist, title } = data.data || {};
    if (artist && title) return `${artist} – ${title}`;
    return artist || title || null;
  } catch {
    radiusNonce = await fetchRadiusNonce();
    if (!radiusNonce) return null;
    const retryUrl = `https://www.963fm.co.il/wp-admin/admin-ajax.php?action=nostalgia_nowplaying&_wpnonce=${radiusNonce}`;
    const res = await fetchUp(retryUrl);
    const data = await res.json();
    if (!data.success) return null;
    const { artist, title } = data.data || {};
    if (artist && title) return `${artist} – ${title}`;
    return artist || title || null;
  }
}

// --- 102FM ---
const DAY_NAME_TO_INDEX = {
  Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
  Thursday: 4, Friday: 5, Saturday: 6,
};

async function fetch102FM() {
  const res = await fetchUp('https://www.102fm.co.il/api/getBroadcasts');
  const json = await res.json();
  const days = json.data;
  if (!Array.isArray(days)) return null;

  const now = getIsraelTime();
  const todayIndex = now.getDay();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = days.find(d => DAY_NAME_TO_INDEX[d.day] === todayIndex);
  if (!todaySchedule?.programs) return null;

  for (const prog of todaySchedule.programs) {
    const start = parseHHMM(prog.start_time);
    const end = parseHHMM(prog.end_time);
    const inRange = end === 0 ? nowMinutes >= start : nowMinutes >= start && nowMinutes < end;
    if (inRange) return prog.show_title || null;
  }
  return null;
}

// --- Eco99 ---
async function fetchEco99() {
  const res = await fetchUp('https://eco99fm.maariv.co.il/api/v1/public/programsBoard/');
  const json = await res.json();
  const programs = json.programs;
  if (!Array.isArray(programs)) return null;

  const now = getIsraelTime();
  const todayDay = now.getDay() + 1;
  const nowHours = now.getHours() + now.getMinutes() / 60;

  for (const prog of programs) {
    if (prog.day !== todayDay) continue;
    const inRange = prog.endTime === 0 ? nowHours >= prog.startTime : nowHours >= prog.startTime && nowHours < prog.endTime;
    if (inRange) return prog.title?.trim() || null;
  }
  return null;
}

// --- GLZ stations ---
function findCurrentGlzShow(days) {
  const now = getIsraelTime();
  for (const day of days) {
    for (const prog of day.programmes || []) {
      const start = new Date(prog.start);
      const end = new Date(prog.end);
      if (start <= now && now < end) return prog.linkText?.trim() || null;
    }
  }
  return null;
}

async function fetchGalgalatz() {
  const res = await fetchUp('https://glz.co.il/umbraco/api/header/GetCommonData?rootId=1920');
  const json = await res.json();
  const days = json.timeTable?.glzTimeTable;
  if (!Array.isArray(days)) return null;
  return findCurrentGlzShow(days);
}

async function fetchGaleiTzahal() {
  const res = await fetchUp('https://glz.co.il/umbraco/api/timetable/getTimetable?rootId=1051&slideindex=0');
  const json = await res.json();
  const days = json.glzTimeTable;
  if (!Array.isArray(days)) return null;
  return findCurrentGlzShow(days);
}

// --- Kan stations ---
function parseKanHtml(html) {
  const match = html.match(/results-item\s+current[\s\S]*?program-title[^>]*>([^<]+)/);
  return match ? match[1].trim() : null;
}

function makeKanFetcher(channelId) {
  return async () => {
    const now = getIsraelTime();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const url =
      `https://www.kan.org.il/umbraco/surface/LoadBroadcastSchedule/LoadSchedule` +
      `?day=${dd}-${mm}-${yyyy}&channelId=${channelId}&currentPageId=1517`;

    // Try direct first
    try {
      const res = await fetchUp(url);
      const html = await res.text();
      const result = parseKanHtml(html);
      if (result) return result;
    } catch { /* fall through */ }

    // Fallback: codetabs proxy (sometimes bypasses Cloudflare)
    try {
      const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10_000) });
      if (res.ok) {
        const html = await res.text();
        const result = parseKanHtml(html);
        if (result) return result;
      }
    } catch { /* ignore */ }

    return null;
  };
}

// --- Registry ---
const fetchers = {
  'kan88': makeKanFetcher(4444),
  'galgalatz': fetchGalgalatz,
  'reshet-bet': makeKanFetcher(4483),
  'radius-nostalgi': fetchRadiusNostalgi,
  'galei-tzahal': fetchGaleiTzahal,
  'kol-hamusika': makeKanFetcher(4518),
  'eco99': fetchEco99,
  'radio-tel-aviv': fetch102FM,
  '103fm': fetch103FM,
};

// --- Cache ---
let cache = null;
let cacheTime = 0;
const CACHE_TTL_MS = 60_000;

async function getAllNowPlaying() {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL_MS) return cache;

  const entries = Object.entries(fetchers);
  const results = await Promise.allSettled(entries.map(([, fn]) => fn()));

  const data = {};
  entries.forEach(([id], i) => {
    const r = results[i];
    data[id] = r.status === 'fulfilled' ? r.value : null;
  });

  cache = data;
  cacheTime = now;
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');

  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const data = await getAllNowPlaying();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch now playing data', detail: err.message });
  }
};
