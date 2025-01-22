const pool = require('../db');
const cron = require('node-cron');

function generateHex() {
    return Math.floor(Math.random()*16777215).toString(16);
} 

// insert the deaily hexcode to the database
function insertTodaysHexCode() {
    const today = new Date().toISOString().split('T')[0];
    const hexCode = generateHex();

    pool.execute('INSERT INTO daily_challenges (date, hexcode) VALUES (?, ?)', [today, hexCode])
        .then(() => {
        })
        .catch((error) => {
            console.error('Error inserting hex code:', error);
        });
}


// insertTodaysHxCode() every midnight
cron.schedule('0 0 * * *', insertTodaysHexCode); 


// fetch todays daily hex code
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

module.exports = {
    getTodaysHexCode,
};