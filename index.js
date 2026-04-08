const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

const THEME_MAP = {
  conflict: 'MILITARY',
  climate: 'ENV_GREEN',
  economy: 'ECON_TRADE',
  health: 'HEALTH',
  science: 'SCIENCE',
  society: 'PROTEST'
};

const COUNTRY_COORDS = {
  US: [37.09, -95.71], GB: [55.37, -3.43], FR: [46.22, 2.21],
  DE: [51.16, 10.45], RU: [61.52, 105.31], CN: [35.86, 104.19],
  IN: [20.59, 78.96], BR: [14.23, -51.92], AU: [-25.27, 133.77],
  CA: [56.13, -106.34], JP: [36.20, 138.25], ZA: [-30.55, 22.93],
  NG: [9.08, 8.67], KE: [-0.02, 37.90], EG: [26.82, 30.80],
  SA: [23.88, 45.07], IR: [32.42, 53.68], PK: [30.37, 69.34],
  UA: [48.37, 31.16], IL: [31.04, 34.85], MX: [23.63, -102.55],
  AR: [-38.41, -63.61], TR: [38.96, 35.24], ID: [-0.78, 113.92],
  PH: [12.87, 121.77], TH: [15.87, 100.99], VN: [14.05, 108.27],
  MM: [21.91, 95.95], SY: [34.80, 38.99], IQ: [33.22, 43.67],
  AF: [33.93, 67.70], SD: [12.86, 30.21], SO: [5.15, 46.19],
  ET: [9.14, 40.48], CD: [-4.03, 21.75], LY: [26.33, 17.22],
  YE: [15.55, 48.51], VE: [6.42, -66.58], KP: [40.33, 127.51],
  TW: [23.69, 120.96], PL: [51.91, 19.14], RO: [45.94, 24.96],
  NL: [52.13, 5.29], BE: [50.50, 4.46], SE: [60.12, 18.64],
  NO: [60.47, 8.46], CH: [46.81, 8.22], ES: [40.46, -3.74],
  IT: [41.87, 12.56], PT: [39.39, -8.22], GR: [39.07, 21.82]
};

app.get('/news', async (req, res) => {
  const { theme, timespan } = req.query;
  
  const themeParam = theme && THEME_MAP[theme] ? `theme:${THEME_MAP[theme]}` : 'war OR climate OR economy OR health OR science OR protest';
  const time = timespan === '168h' ? '7days' : '24hours';

  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(themeParam)}&mode=artlist&format=json&timespan=${time}&maxrecords=250&sort=DateDesc`;

  console.log('Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PulseNewsMap/1.0)' }
    });

    console.log('Status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log('Error body:', text.substring(0, 300));
      return res.status(500).json({ error: `GDELT returned ${response.status}` });
    }

    const data = await response.json();
    const articles = data.articles || [];
    console.log('Articles returned:', articles.length);

    // Map source country codes to coordinates
    const features = articles
      .filter(a => a.sourcecountry && COUNTRY_COORDS[a.sourcecountry])
      .map(a => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [COUNTRY_COORDS[a.sourcecountry][1], COUNTRY_COORDS[a.sourcecountry][0]]
        },
        properties: {
          title: a.title,
          url: a.url,
          source: a.domain,
          date: a.seendate,
          country: a.sourcecountry,
          theme: theme || 'general'
        }
      }));

    res.json({ type: 'FeatureCollection', features });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('Pulse backend running on port 3000'));
