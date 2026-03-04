import { Platform } from 'react-native';

const NOW_PLAYING_URL = 'https://proxy-sigma-sand.vercel.app/api/now-playing';
const FETCH_TIMEOUT_MS = 15_000;

const KAN_CHANNELS: Record<string, number> = {
  'kan88': 4444,
  'reshet-bet': 4483,
  'kol-hamusika': 4518,
};

function getIsraelTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
}

function parseKanHtml(html: string): string | null {
  const match = html.match(/results-item\s+current[\s\S]*?program-title[^>]*>([^<]+)/);
  return match ? match[1].trim() : null;
}

async function fetchKanDirect(channelId: number): Promise<string | null> {
  const now = getIsraelTime();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const url =
    `https://www.kan.org.il/umbraco/surface/LoadBroadcastSchedule/LoadSchedule` +
    `?day=${dd}-${mm}-${yyyy}&channelId=${channelId}&currentPageId=1517`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const html = await res.text();
    return parseKanHtml(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAllNowPlaying(): Promise<Record<string, string | null>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let data: Record<string, string | null> = {};
  try {
    const res = await fetch(NOW_PLAYING_URL, { signal: controller.signal });
    if (res.ok) data = await res.json();
  } catch { /* use empty */ } finally {
    clearTimeout(timer);
  }

  if (Platform.OS !== 'web') {
    const kanFills = Object.entries(KAN_CHANNELS)
      .filter(([id]) => !data[id])
      .map(async ([id, channelId]) => {
        const name = await fetchKanDirect(channelId);
        if (name) data[id] = name;
      });
    await Promise.all(kanFills);
  }

  return data;
}

export async function fetchNowPlaying(stationId: string): Promise<string | null> {
  const all = await fetchAllNowPlaying();
  return all[stationId] ?? null;
}
