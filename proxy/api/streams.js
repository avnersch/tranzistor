const STREAM_URLS = require('./_streams');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600');

  if (req.method === 'OPTIONS') return res.status(204).end();

  return res.status(200).json(STREAM_URLS);
};
