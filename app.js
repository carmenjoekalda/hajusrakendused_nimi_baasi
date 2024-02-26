const express = require('express')
const app = express()
const mysql = require('mysql')
const port = 3020
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Form's action
app.post('/', (req, res) => {
    const { name } = req.body;
    
    pool.query('INSERT INTO user (nimi) VALUES (?)', [name], (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error while adding name');
      } else {
        // Response
        res.send('Name added successfully!');
      }
    });
  });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
