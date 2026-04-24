const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'data', 'reviews.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ reviews: [], messages: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// POST /api/review — save a visitor review/rating
app.post('/api/review', (req, res) => {
  const { name, email, rating, message } = req.body;
  if (!name || !rating || !message) {
    return res.status(400).json({ error: 'Name, rating, and message are required.' });
  }
  const db = readDB();
  const review = {
    id: Date.now(),
    name: name.trim(),
    email: (email || '').trim(),
    rating: parseInt(rating),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  db.reviews.push(review);
  writeDB(db);
  res.json({ success: true, review });
});

// GET /api/reviews — get all reviews
app.get('/api/reviews', (req, res) => {
  const db = readDB();
  res.json({ reviews: db.reviews.reverse() });
});

// POST /api/contact — save a contact message
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  const db = readDB();
  const msg = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    createdAt: new Date().toISOString()
  };
  db.messages.push(msg);
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Portfolio backend running at http://localhost:${PORT}`);
});
