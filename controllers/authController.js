const pool = require('../db');
const { md5 } = require('../helpers/hash');

// sign up
function signUp(req, res) {
    const { username, password } = req.body;
    const hashPassword = md5(password);

    pool.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashPassword])
        .then(() => {
            res.redirect('/home.html');
        })
        .catch((error) => {
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
              <link rel="stylesheet" href="/style.css"/>
              <title>Sign Up</title>
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
        });
}

// sign in
function signIn(req, res) {
    const { username, password } = req.body;

    pool.execute('SELECT * FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length === 0 || md5(password) !== user[0].password) {
                const errorMessage = 'Invalid username or password.';
                res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="./style.css" />
                <title>Sign In</title>
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
                            <input type="Submit" value="Sign In" name="submit">
                            <div class="link">
                                Don't Have an Account yet? <a href="signup.html" class="btn">Sign Up here</a>
                            </div>
                        </form>
                </div>
            </body>
            </html>
          `);
            } else {
                res.redirect('/home.html');
            }
        })
        .catch((error) => {
            console.error(error.message);
            res.status(500).send('Server error');
        });
}

module.exports = {
    signUp,
    signIn
};