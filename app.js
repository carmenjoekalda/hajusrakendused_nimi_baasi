const express = require('express');
const app = express();
const routes = require('./routes/authRoutes');
const port = 3030;
const path = require('path');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Route for serving the signup page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// routes
app.use('/', routes);

// start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});