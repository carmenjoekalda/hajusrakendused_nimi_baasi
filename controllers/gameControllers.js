const pool = require('../db');
const cron = require('node-cron');

function generateHex() {
    return Math.floor(Math.random()*16777215).toString(16);
} 

// reset user guesses
function resetUserGuesses() {
    pool.execute('UPDATE user_guesses SET guess_1 = NULL, guess_2 = NULL, guess_3 = NULL, guess_4 = NULL, guess_5 = NULL, guess_6 = NULL, guess_date = NULL')
        .then(() => {
            console.log('User guesses have been reset.');
        })
        .catch((error) => {
            console.error('Error resetting user guesses:', error);
        });
}

// insert the daily hexcode to the database
function insertTodaysHexCode() {
    const today = new Date().toISOString().split('T')[0];
    const hexCode = generateHex();

    pool.execute('INSERT INTO daily_challenges (date, hexcode) VALUES (?, ?)', [today, hexCode])
        .then(() => {
            console.log('New hex code inserted:', hexCode);
            resetUserGuesses();
        })
        .catch((error) => {
            console.error('Error inserting hex code:', error);
        });
}

// insertTodaysHexCode() every midnight
cron.schedule('0 0 * * *', insertTodaysHexCode); 

// fetch today's daily hex code
function getTodaysHexCode(req, res) {
    const today = new Date().toISOString().split('T')[0];

    pool.execute('SELECT hexcode FROM daily_challenges WHERE date = ?', [today])
        .then(([result]) => {
            if (result.length > 0) {
                res.json({ hex: result[0].hexcode });
            } else {
                const hexCode = generateHex();
                pool.execute('INSERT INTO daily_challenges (date, hexcode) VALUES (?, ?)', [today, hexCode])
                    .then(() => {
                        res.json({ hex: hexCode });
                    })
                    .catch((error) => {
                        console.error('Error inserting missing hex code:', error);
                        res.status(500).json({ error: 'Internal server error' });
                    });
            }
        })
        .catch((error) => {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        });
}

function saveGuess(req, res) {
    const { guess, guessNumber } = req.body;
    const username = req.cookies.username;

    pool.execute('SELECT id FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                const userId = user[0].id;
                const guessField = `guess_${guessNumber}`;
                const query = `UPDATE user_guesses SET ${guessField} = ? WHERE user_id = ?`;

                pool.execute(query, [guess, userId])
                    .then(() => {
                        res.json({ message: 'Guess saved successfully' });
                    })
                    .catch((error) => {
                        console.error('Error saving guess:', error);
                        res.status(500).json({ error: 'Error saving guess' });
                    });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch((error) => {
            console.error('Error fetching user ID:', error);
            res.status(500).json({ error: 'Error fetching user ID' });
        });
}

function getGuesses(req, res) {
    const username = req.cookies.username;

    pool.execute('SELECT id FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                const userId = user[0].id;
                pool.execute('SELECT * FROM user_guesses WHERE user_id = ?', [userId])
                    .then(([guesses]) => {
                        if (guesses.length > 0) {
                            const userGuesses = [
                                guesses[0].guess_1,
                                guesses[0].guess_2,
                                guesses[0].guess_3,
                                guesses[0].guess_4,
                                guesses[0].guess_5,
                                guesses[0].guess_6
                            ].filter(guess => guess !== null);
                            res.json({ guesses: userGuesses });
                        } else {
                            res.json({ guesses: [] });
                        }
                    })
                    .catch((error) => {
                        console.error('Error fetching guesses:', error);
                        res.status(500).json({ error: 'Error fetching guesses' });
                    });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch((error) => {
            console.error('Error fetching user ID:', error);
            res.status(500).json({ error: 'Error fetching user ID' });
        });
}

module.exports = {
    getTodaysHexCode,
    saveGuess,
    getGuesses,
};