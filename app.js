const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const port = 3030;
const path = require('path');
const cookieParser = require('cookie-parser');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/controllers', express.static(path.join(__dirname, 'controllers')));
app.use(cookieParser());

// Route for serving the index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// routes
app.use('/', authRoutes);

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});