const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5050;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Helpers ---
function readDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], goals: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// --- API Routes ---

// GET /api/data — Return all data
app.get('/api/data', (req, res) => {
  const db = readDB();
  res.json(db);
});

// PUT /api/users/:id — Update a user's name/avatar
app.put('/api/users/:id', (req, res) => {
  const db = readDB();
  const { name, avatar, color } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name) user.name = name;
  if (avatar) user.avatar = avatar;
  if (color) user.color = color;
  writeDB(db);
  res.json(user);
});

// POST /api/goals — Create a new goal
app.post('/api/goals', (req, res) => {
  const db = readDB();
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

  db.goals.push(goal);
  writeDB(db);
  res.status(201).json(goal);
});

// DELETE /api/goals/:id — Delete a goal
app.delete('/api/goals/:id', (req, res) => {
  const db = readDB();
  const idx = db.goals.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Goal not found' });
  const removed = db.goals.splice(idx, 1);
  writeDB(db);
  res.json(removed[0]);
});

// PUT /api/goals/:id — Update an existing goal
app.put('/api/goals/:id', (req, res) => {
  const db = readDB();
  const goal = db.goals.find(g => g.id === req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { ownerId, title, startDate, endDate, frequencyPerWeek, category } = req.body;
  if (ownerId) goal.ownerId = ownerId;
  if (title) goal.title = title;
  if (startDate) goal.startDate = startDate;
  if (endDate) goal.endDate = endDate;
  if (frequencyPerWeek) goal.frequencyPerWeek = Number(frequencyPerWeek);
  if (category) goal.category = category;

  writeDB(db);
  res.json(goal);
});

// POST /api/goals/:id/toggle — Toggle a day's completion
app.post('/api/goals/:id/toggle', (req, res) => {
  const db = readDB();
  const goal = db.goals.find(g => g.id === req.params.id);
  if (!goal) return res.status(404).json({ error: 'Goal not found' });

  const { date, completed } = req.body;
  if (!date) return res.status(400).json({ error: 'Date is required' });

  if (completed) {
    goal.completions[date] = true;
  } else {
    delete goal.completions[date];
  }

  writeDB(db);
  res.json(goal);
});

// Serve static client build in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

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
