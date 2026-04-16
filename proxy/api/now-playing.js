const { Redis } = require('@upstash/redis');

let _redis;
function getRedis() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

const NOW_PLAYING_KEY = 'now-playing:all';

let memCache = null;
let memCacheTime = 0;
const MEM_CACHE_TTL_MS = 30_000;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const now = Date.now();
  if (memCache && now - memCacheTime < MEM_CACHE_TTL_MS) {
    return res.status(200).json(memCache);
  }

  try {
    const redis = getRedis();
    const raw = await redis.get(NOW_PLAYING_KEY);
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (data) {
      memCache = data;
      memCacheTime = now;
      return res.status(200).json(data);
    }
    return res.status(200).json(memCache || {});
  } catch (err) {
    if (memCache) return res.status(200).json(memCache);
    return res.status(500).json({ error: 'Failed to fetch now playing data', detail: err.message });
  }
};
