const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();
const app = express();
const port = 3000;

// Neon PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add School API
app.post('/addSchool', async (req, res) => {
  const { name, address, latitude, longitude } = req.body;

  if (!name || !address || !latitude || !longitude) {
    return res.status(400).json({ 
      error: 'All fields are required' 
    });
  }

  try {
    const newSchool = await pool.query(
      'INSERT INTO schools (name, address, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, latitude, longitude]
    );
    res.json(newSchool.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate distance function
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// List Schools API
app.get('/listSchools', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const schools = await pool.query('SELECT * FROM schools');
    const sortedSchools = schools.rows.map(school => ({
      ...school,
      distance: calculateDistance(latitude, longitude, school.latitude, school.longitude)
    })).sort((a, b) => a.distance - b.distance);

    res.json(sortedSchools);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
