const express = require('express')
const app = express()
const mysql = require('mysql2/promise')
const port = 3030
const path = require('path');
const crypto = require('crypto')

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
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// create hash password function
function md5(data) {
  return crypto.createHash('md5').update(data).digest("hex");
}

// sign up
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashPassword = md5(password);
    await pool.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashPassword]);
    res.redirect('/home.html');
  } catch (error) {
    let errorMessage = '';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Username is already taken.';
    } else {
      errorMessage = 'An unexpected error occurred. Please try again.';
    }

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="./style.css"/>
          <title>Sign up</title>
      </head>
      <body>
          <div class="container">
              <div class="center">
                  <h1>Sign Up</h1>
                  <p class="error-message">${errorMessage}</p>
                  <form method="POST" action="/signup">
                      <div class="txt_field">
                          <input type="text" id="username" name="username" required>
                          <span></span>
                          <label for="name">Username:</label>
                      </div>
                      <div class="txt_field">
                          <input type="password" id="password" name="password" required>
                          <span></span>
                          <label for="password">Password:</label>
                      </div>

                      <input type="submit" value="Sign Up" name="submit">
                      <div class="link">
                          Have an Account? <a href="signin.html">Sign In Here</a>
                      </div>
                  </form>
              </div>
          </div>
      </body>
      </html>
    `);
  }
});

// sign in
app.post('/signin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [user] = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
    if (user.length === 0 || md5(password) !== user[0].password) {
      let errorMessage = 'Invalid username or password.';
      res.send(`<!DOCTYPE html>
      <html lang="en">
      
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="./style.css" />
          <title>Sign in</title>
      </head>
      
      <body>
          <div class="container">
              <div class="center">
                  <h1>Sign In</h1>
                  <p class="error-message">${errorMessage}</p>
                  <form method="POST" action="/signin">
                      <div class="txt_field">
                          <input type="text" id="username" name="username" required>
                          <span></span>
                          <label for="name">Username:</label>
                      </div>
                      <div class="txt_field">
                          <input type="password" id="password" name="password" required>
                          <span></span>
                          <label for="password">Password:</label>
                      </div>
                      <input type="Submit" value="Sign in" name="submit">
                      <div class="link">
                          Don't Have an Account yet? <a href="signup.html" class="btn">Sign Up here</a>
                      </div>
                  </form>
      </body>
      
      </html>`)
    } else {
      res.redirect('/home.html');
    }
  } catch (error) {
    console.error(error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});