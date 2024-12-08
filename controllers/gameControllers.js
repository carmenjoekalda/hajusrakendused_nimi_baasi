function helloWorld() {
    return 'Hello World';
}
function game() {
    return helloWorld();
}

module.exports = {
    game
};