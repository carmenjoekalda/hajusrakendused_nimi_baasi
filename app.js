const express = require('express')
const app = express()
const mysql = require('mysql2/promise')
const port = 3030
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Setup database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'margusDB',
  password: 'qwerty',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// HTML file connection
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

// sign up
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [result] = await pool.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, password]);
    res.status(201).json({ message: "Successfully signed up" });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username taken'});
    }
    res.status(500).json({ message: error.message });
  } 
});

// sign in
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
    if (user.length === 0 || user[0].password !== password) {
      return res.status(401).json({ message: 'Sign in failed'});
    }
    res.status(200).json({ message: "Successfully signed in" });
  } catch (error) {
    res.status(500).json({ message: error.message});
  } 
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});