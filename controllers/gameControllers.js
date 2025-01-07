function generateHex() {
    return Math.floor(Math.random()*16777215).toString(16);
} 

export function game() {
    return {
        hex: generateHex()
    };
}