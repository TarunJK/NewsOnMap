const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/news', async (req, res) => {
  const { theme, timespan } = req.query;
  
  const query = theme ? `theme:${theme}` : 'war OR climate OR economy OR health OR science OR protest';
  const time = timespan || '24h';
  
  const url = `https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(query)}&mode=pointdata&format=json&timespan=${time}&maxrecords=250`;
  
  console.log('Fetching URL:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PulseNewsMap/1.0)'
      }
    });
    
    console.log('GDELT response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      console.log('GDELT error body:', text);
      return res.status(500).json({ error: `GDELT returned ${response.status}`, body: text });
    }
    
    const data = await response.json();
    console.log('Points returned:', data?.features?.length || 0);
    res.json(data);
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('Pulse backend running on port 3000'));
