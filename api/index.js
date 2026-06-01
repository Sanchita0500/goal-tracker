require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 5050;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Helpers ---
async function getDB() {
  // If Upstash Redis is configured, use it
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const data = await redis.get('tracker_db');
      if (data) return data;
    } catch (err) {
      console.error('Redis Error reading DB:', err);
    }
  }
  
  // Fallback to local file for development if Redis is not set up
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], goals: [] };
  }
}

async function saveDB(data) {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      await redis.set('tracker_db', data);
      return;
    } catch (err) {
      console.error('Redis Error saving DB:', err);
    }
  }

  // Fallback to local file
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// --- API Routes (mounted on a router so the prefix works in both envs) ---
const router = express.Router();

// GET /data — Return all data
router.get('/data', async (req, res) => {
  const db = await getDB();
  res.json(db);
});

// PUT /users/:id — Update a user's name/avatar
router.put('/users/:id', async (req, res) => {
  const db = await getDB();
  const { name, avatar, color } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  if (color) user.color = color;
  
  await saveDB(db);
  res.json(user);
});

// POST /goals — Create a new goal
router.post('/goals', async (req, res) => {
  const db = await getDB();
  const { ownerId, title, startDate, endDate, frequencyPerWeek, category } = req.body;

  if (!ownerId || !title || !startDate || !endDate || !frequencyPerWeek) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const goal = {
    id: `goal-${Date.now()}`,
    ownerId,
    title,
    startDate,
    endDate,
    frequencyPerWeek: Number(frequencyPerWeek),
    category: category || 'General',
    createdDate: new Date().toISOString().split('T')[0],
    completions: {}
  };

  if (!db.goals) db.goals = [];
  db.goals.push(goal);
  
  await saveDB(db);
  res.status(201).json(goal);
});

// DELETE /goals/:id — Delete a goal
router.delete('/goals/:id', async (req, res) => {
  const db = await getDB();
  const idx = db.goals.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Goal not found' });
  
  const removed = db.goals.splice(idx, 1);
  await saveDB(db);
  res.json(removed[0]);
});

// PUT /goals/:id — Update an existing goal
router.put('/goals/:id', async (req, res) => {
  const db = await getDB();
  const goal = db.goals.find(g => g.id === req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { ownerId, title, startDate, endDate, frequencyPerWeek, category } = req.body;
  if (ownerId) goal.ownerId = ownerId;
  if (title) goal.title = title;
  if (startDate) goal.startDate = startDate;
  if (endDate) goal.endDate = endDate;
  if (frequencyPerWeek) goal.frequencyPerWeek = Number(frequencyPerWeek);
  if (category) goal.category = category;

  await saveDB(db);
  res.json(goal);
});

// POST /goals/:id/toggle — Toggle a day's completion
router.post('/goals/:id/toggle', async (req, res) => {
  const db = await getDB();
  const goal = db.goals.find(g => g.id === req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { date, completed } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  if (completed) {
    if (!goal.completions) goal.completions = {};
    goal.completions[date] = true;
  } else {
    if (goal.completions) delete goal.completions[date];
  }

  await saveDB(db);
  res.json(goal);
});

// Mount router at /api — works for both local dev and Vercel
// On Vercel, the function at api/index.js receives paths WITHOUT /api prefix,
// so we also mount at / to cover both cases.
app.use('/api', router);
app.use('/', router);

// Serve static client build in production (for local testing of built app)
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// Start server if run directly (local development)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  🎯 Goal Tracker API running at:`);
    console.log(`     Local:   http://localhost:${PORT}`);
    // Show LAN IP for sharing
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`     Network: http://${net.address}:${PORT}`);
        }
      }
    }
    console.log('');
  });
}

// Export for Vercel Serverless
module.exports = app;
