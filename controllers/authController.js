const pool = require('../db');
const { md5 } = require('../helpers/hash');

// sign up
function signUp(req, res) {
    const { username, password } = req.body;
    const hashPassword = md5(password);

    pool.execute('INSERT INTO user (username, password) VALUES (?, ?)', [username, hashPassword])
    .then(() => {
        res.cookie('loggedin', 'true', { path: '/' });
        res.cookie('username', username, { path: '/' });
        console.log(`User signed up and logged in: ${username}`);
        fetchUserDetails(username);
        res.redirect('/index.html');
    })
    .catch((error) => {
        let errorMessage = '';
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = 'Username is already taken.';
        } else {
            errorMessage = 'An unexpected error occurred. Please try again.';
        }
        res.cookie('error', errorMessage);
        res.redirect('/signup.html');
    });
}

// sign in
function signIn(req, res) {
    const { username, password } = req.body;

    pool.execute('SELECT * FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length === 0 || md5(password) !== user[0].password) {
                const errorMessage = 'Invalid username or password.';
                res.cookie('error', errorMessage);
                res.redirect('/signin.html');
            } else {
                res.cookie('loggedin', 'true', { path: '/' });
                res.cookie('username', username, { path: '/' });
                console.log(`User signed in: ${username}`);
                fetchUserDetails(username);
                res.redirect('/index.html');
            }
        })
        .catch((error) => {
            const errorMessage = 'An unexpected error occurred. Please try again.';
            res.cookie('error', errorMessage);
            res.redirect('/signin.html');
        });
}

// Fetch user details
function fetchUserDetails(username) {
    pool.execute('SELECT * FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                console.log('User details:', user[0]);
            } else {
                console.log('User not found');
            }
        })
        .catch((error) => {
            console.error('Error fetching user details:', error);
        });
}

module.exports = {
    signUp,
    signIn
};