import { getWebsocket } from "../websocket-open.js";

export function gameReadySoStart()
{

document.addEventListener("keydown", handleKeyPress);
// function handleSocketMessage(event) {
//     const data = JSON.parse(event.data);

//     if (data.type === "game_start") {
//         // Set up key press listener when the game starts
//         document.addEventListener("keydown", handleKeyPress);
//     } else if (data.type === "game_end") {
//         // Remove key press listener when the game ends
//         document.removeEventListener("keydown", handleKeyPress);
//     }
// }




	//start the game
}


let lastMoveTime = 0;
const moveCooldown = 5; // Cooldown time in milliseconds (e.g., 300 ms)

function sendGameMove(direction) {
    let socket = getWebsocket();
    const now = Date.now();

    // Check if the cooldown period has passed since the last move
    if (now - lastMoveTime >= moveCooldown) {
        const message = {
            type: "game_move_pad",
            direction: direction
        };
        socket.send(JSON.stringify(message));
        lastMoveTime = now; // Update the last move time
    }
}

export function gameEnd() {
    // Show frame you lost or won, then make the "Leave" button appear on top
}

function handleKeyPress(event) {
    if (event.key === 'D' || event.key === 'd') {
        sendGameMove("right");
    } else if (event.key === 'A' || event.key === 'a') {
        sendGameMove("left");
    }
}

// Add event listener for keypresses if not already set up
document.addEventListener('keydown', handleKeyPress);