const { Shazam, s16LEToSamplesArray } = require('shazam-api');
const { execFile } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const STREAM_URLS = {
  'kan88': 'https://24283.live.streamtheworld.com/KAN_88.mp3',
  'galgalatz': 'https://glzwizzlv.bynetcdn.com/glglz_mp3',
  'reshet-bet': 'https://24443.live.streamtheworld.com/KAN_BET.mp3',
  'radius-nostalgi': 'https://cdna.streamgates.net/radios-audio/Nostalgia_963fm/icecast.audio',
  'galei-tzahal': 'https://glzwizzlv.bynetcdn.com/glz_mp3',
  'kol-hamusika': 'https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_KOL_HAMUSICA.mp3',
  'eco99': 'https://eco01.mediacast.co.il/ecolive/99fm_aac/icecast.audio',
  'radio-tel-aviv': 'https://cdn88.mediacast.co.il/102fm-tlv/102fm_mp3/icecast.audio',
  '103fm': 'https://cdn.cybercdn.live/103FM/Live/icecast.audio',
};

const SAMPLE_DURATION_S = 12;
const CACHE_TTL_MS = 30_000;

let cache = null;
let cacheTime = 0;
let pendingBatch = null;

const shazam = new Shazam('Asia/Jerusalem');
const origUrl = shazam.endpoint.url.bind(shazam.endpoint);
shazam.endpoint.url = () => origUrl().replace('/en/US/', '/he/IL/');

function captureStreamToPcm(stationId, streamUrl) {
  const pcmPath = path.join('/tmp', `shazam_${stationId}.pcm`);

  return new Promise((resolve, reject) => {
    execFile(ffmpegPath, [
      '-y',
      '-t', String(SAMPLE_DURATION_S),
      '-i', streamUrl,
      '-ar', '16000', '-ac', '1', '-f', 's16le',
      '-loglevel', 'error',
      pcmPath,
    ], { timeout: 25_000 }, (err) => {
      if (err) return reject(err);
      try {
        const pcmBuffer = fs.readFileSync(pcmPath);
        fs.unlinkSync(pcmPath);
        resolve(pcmBuffer);
      } catch (e) {
        reject(e);
      }
    });
  });
}

async function recognizeStation(stationId) {
  const url = STREAM_URLS[stationId];
  if (!url) return null;

  const pcmBuffer = await captureStreamToPcm(stationId, url);
  if (!pcmBuffer || pcmBuffer.length < 1000) return null;

  const samples = s16LEToSamplesArray(pcmBuffer);
  const result = await shazam.recognizeSong(samples);

  if (!result || (!result.title && !result.artist)) return null;

  return {
    title: result.title || null,
    artist: result.artist || null,
  };
}

async function recognizeAllStations() {
  const entries = Object.entries(STREAM_URLS);
  const results = await Promise.allSettled(
    entries.map(([id]) => recognizeStation(id))
  );

  const data = {};
  entries.forEach(([id], i) => {
    const r = results[i];
    data[id] = r.status === 'fulfilled' ? r.value : null;
  });
  return data;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=15');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (cache && Date.now() - cacheTime < CACHE_TTL_MS) {
    return res.status(200).json(cache);
  }

  try {
    if (!pendingBatch) {
      pendingBatch = recognizeAllStations().finally(() => { pendingBatch = null; });
    }
    const data = await pendingBatch;
    cache = data;
    cacheTime = Date.now();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
