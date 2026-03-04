export interface Station {
  id: string;
  name: string;
  frequency: string;
  frequencyNum: number;
  streamUrl: string;
  color: string;
  logoUrl: string;
}

export const stations: Station[] = [
  {
    id: 'kan88',
    name: 'כאן 88',
    frequency: '88 FM',
    frequencyNum: 88,
    streamUrl: 'https://24283.live.streamtheworld.com/KAN_88.mp3',
    color: '#E91E63',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/he/0/09/Kan88Logo.svg',
  },
  {
    id: 'galgalatz',
    name: 'גלגל״צ',
    frequency: '91.8 FM',
    frequencyNum: 91.8,
    streamUrl: 'https://glzwizzlv.bynetcdn.com/glglz_mp3',
    color: '#4CAF50',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/GLGLZ.svg',
  },
  {
    id: 'reshet-bet',
    name: 'רשת ב׳',
    frequency: '95.5 FM',
    frequencyNum: 95.5,
    streamUrl: 'https://24443.live.streamtheworld.com/KAN_BET.mp3',
    color: '#2196F3',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/he/e/e8/Kanbet.svg',
  },
  {
    id: 'radius-nostalgi',
    name: 'רדיוס נוסטלגי',
    frequency: '96.3 FM',
    frequencyNum: 96.3,
    streamUrl: 'https://cdna.streamgates.net/radios-audio/Nostalgia_963fm/icecast.audio',
    color: '#FF9800',
    logoUrl: 'https://www.963fm.co.il/wp-content/uploads/2025/09/cropped-Nostalgi-new-scaled-1-1024x775.png',
  },
  {
    id: 'galei-tzahal',
    name: 'גלי צה״ל',
    frequency: '96.6 FM',
    frequencyNum: 96.6,
    streamUrl: 'https://glzwizzlv.bynetcdn.com/glz_mp3',
    color: '#795548',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/GaltzLogo.svg',
  },
  {
    id: 'kol-hamusika',
    name: 'קול המוזיקה',
    frequency: '97.2 FM',
    frequencyNum: 97.2,
    streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/KAN_KOL_HAMUSICA.mp3',
    color: '#9C27B0',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/KanKolMusic.svg',
  },
  {
    id: 'eco99',
    name: 'אקו 99',
    frequency: '99 FM',
    frequencyNum: 99,
    streamUrl: 'https://eco01.mediacast.co.il/ecolive/99fm_aac/icecast.audio',
    color: '#00BCD4',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/he/0/0a/Eco_99_fm.svg',
  },
  {
    id: 'radio-tel-aviv',
    name: 'רדיו תל אביב',
    frequency: '102 FM',
    frequencyNum: 102,
    streamUrl: 'https://cdn88.mediacast.co.il/102fm-tlv/102fm_mp3/icecast.audio',
    color: '#E40041',
    logoUrl: 'https://www.102fm.co.il/_next/static/media/header_logo.95f10cff.svg',
  },
  {
    id: '103fm',
    name: '103 FM',
    frequency: '103 FM',
    frequencyNum: 103,
    streamUrl: 'https://cdn.cybercdn.live/103FM/Live/icecast.audio',
    color: '#3FCAC5',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/he/7/72/103FM.svg',
  },
].sort((a, b) => a.frequencyNum - b.frequencyNum);
