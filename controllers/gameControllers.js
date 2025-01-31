const pool = require('../db');
const cron = require('node-cron');

function generateHex() {
    return Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
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

    pool.execute('SELECT id, total_wins, total_games, current_streak, longest_streak, points, games_won_in_1, games_won_in_2, games_won_in_3, games_won_in_4, games_won_in_5, games_won_in_6 FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                const userId = user[0].id;
                const guessField = `guess_${guessNumber}`;
                const query = `UPDATE user_guesses SET ${guessField} = ? WHERE user_id = ?`;

                pool.execute(query, [guess, userId])
                    .then(() => {
                        // Update total games if this is the first guess
                        if (guessNumber === 1) {
                            const newTotalGames = user[0].total_games + 1;
                            pool.execute('UPDATE user SET total_games = ? WHERE id = ?', [newTotalGames, userId])
                                .then(() => {
                                    console.log('Total games updated.');
                                })
                                .catch((error) => {
                                    console.error('Error updating total games:', error);
                                });
                        }

                        // Check if the guess is correct and update the user stats
                        pool.execute('SELECT hexcode FROM daily_challenges WHERE date = ?', [new Date().toISOString().split('T')[0]])
                            .then(([challenge]) => {
                                const hexCode = challenge[0].hexcode;

                                if (guess.toLowerCase() === hexCode.toLowerCase()) {
                                    // User won, update stats
                                    let newTotalWins = user[0].total_wins + 1;
                                    let newCurrentStreak = user[0].current_streak + 1;
                                    let newLongestStreak = user[0].longest_streak;

                                    if (newCurrentStreak > newLongestStreak) {
                                        newLongestStreak = newCurrentStreak;
                                    }

                                    // Update games won in specific attempts
                                    let gamesWonInX = `games_won_in_${guessNumber}`;
                                    let newGamesWonInX = user[0][gamesWonInX] + 1;

                                    // calculate points
                                    const basePoints = [100, 80, 60, 40, 20, 10][guessNumber - 1] || 0;
                                    let streakMultiplier = 1;
                                    if (newCurrentStreak >= 10) streakMultiplier = 1.3;
                                    else if (newCurrentStreak >= 5) streakMultiplier = 1.2;
                                    else if (newCurrentStreak >= 2) streakMultiplier = 1.1;

                                    const pointsEarned = Math.round(basePoints * streakMultiplier);
                                    const newTotalPoints = user[0].points + pointsEarned;

                                    pool.execute(`UPDATE user SET total_wins = ?, current_streak = ?, longest_streak = ?, points = ?, ${gamesWonInX} = ? WHERE id = ?`, [newTotalWins, newCurrentStreak, newLongestStreak, newTotalPoints, newGamesWonInX, userId])
                                        .then(() => {
                                            res.json({ message: 'You won! Stats updated.' });
                                        })
                                        .catch((error) => {
                                            console.error('Error updating stats after win:', error);
                                            res.status(500).json({ error: 'Error updating stats after win' });
                                        });
                                } else {
                                    // Check if this was the last guess
                                    if (guessNumber >= 6) {
                                        // User lost, reset streak
                                        let newCurrentStreak = 0;  // Reset streak
                                        pool.execute('UPDATE user SET current_streak = ? WHERE id = ?', [newCurrentStreak, userId])
                                            .then(() => {
                                                res.json({ message: 'Game over, you lost.' });
                                            })
                                            .catch((error) => {
                                                console.error('Error resetting streak after loss:', error);
                                                res.status(500).json({ error: 'Error resetting streak after loss' });
                                            });
                                    } else {
                                        // If the user still has guesses left, just return a message
                                        res.json({ message: 'Guess saved, keep going!' });
                                    }
                                }
                            })
                            .catch((error) => {
                                console.error('Error fetching challenge hex code:', error);
                                res.status(500).json({ error: 'Error fetching challenge hex code' });
                            });
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

function getUserStats(req, res) {
    const username = req.cookies.username;

    pool.execute('SELECT * FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                const userStats = {
                    totalWins: user[0].total_wins,
                    totalGames: user[0].total_games,
                    currentStreak: user[0].current_streak,
                    longestStreak: user[0].longest_streak,
                    points: user[0].points
                };
                res.json(userStats);
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        })
        .catch((error) => {
            console.error('Error fetching user stats:', error);
            res.status(500).json({ error: 'Error fetching user stats' });
        });
}

function updateUserStats(req, res) {
    const username = req.cookies.username;
    const { won } = req.body;

    pool.execute('SELECT * FROM user WHERE username = ?', [username])
        .then(([user]) => {
            if (user.length > 0) {
                const userId = user[0].id;
                let { total_wins, total_games, current_streak, longest_streak } = user[0];

                total_games += 1;
                if (won) {
                    total_wins += 1;
                    current_streak += 1;
                    if (current_streak > longest_streak) {
                        longest_streak = current_streak;
                    }
                } else {
                    current_streak = 0;
                }

                const query = `UPDATE user SET total_wins = ?, total_games = ?, current_streak = ?, longest_streak = ? WHERE id = ?`;
                pool.execute(query, [total_wins, total_games, current_streak, longest_streak, userId])
                    .then(() => {
                        const updatedStats = {
                            totalWins: total_wins,
                            totalGames: total_games,
                            currentStreak: current_streak,
                            longestStreak: longest_streak
                        };
                        res.json(updatedStats);
                    })
                    .catch((error) => {
                        console.error('Error updating user stats:', error);
                        res.status(500).json({ error: 'Error updating user stats' });
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

function getTop5(req, res) {
    pool.execute('SELECT username, points FROM user ORDER BY points DESC LIMIT 5')
        .then(([result]) => {
            if (result.length > 0) {
                const top5Players = result.map(player => ({
                    username: player.username,
                    points: player.points
                }));
                res.json(top5Players);
            } else {
                res.status(404).json({ error: 'No players found' });
            }
        })
        .catch((error) => {
            console.error('Error fetching top 5 players:', error);
            res.status(500).json({ error: 'Internal server error' });
        });
} 

module.exports = {
    getTodaysHexCode,
    saveGuess,
    getGuesses,
    getUserStats,
    updateUserStats,
    getTop5,
};