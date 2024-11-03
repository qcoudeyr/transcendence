import { getWebsocket } from "../websocket-open.js";

export function gameReadySoStart()
{


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


// let lastMoveTime = Date.now();
// const moveCooldown = 1;

function sendGameMove(direction) {
    let socket = getWebsocket();
    // const now = Date.now();

    // if (now - lastMoveTime >= moveCooldown) {
        const message = {
            type: "game_move_pad",
            direction: direction
        };
        socket.send(JSON.stringify(message));
        // lastMoveTime = now; 
    // }
}

export function gameEnd() {
	const frame = document.getElementById("frames")
	frame.style.display = "block";
	const endFrame = document.getElementById("end-frame");
	endFrame.textContent = "you lost!";
	const endButton = document.getElementById("unloadButton");
	endButton.style.display = "block";
}

let keyPressed = {};
let intervalIds = {};

document.addEventListener("keydown", (event) => {
    if (!keyPressed[event.key]) {
        keyPressed[event.key] = true;
        handleKeyPress(event);

        // Start a repeating interval for the key if it doesn't already exist
        if (!intervalIds[event.key]) {
            intervalIds[event.key] = setInterval(() => {
                handleKeyPress(event);
            }, 100); // Adjust interval time as needed
        }
    }
});

document.addEventListener("keyup", (event) => {
    keyPressed[event.key] = false;

    // Clear the interval for the released key and remove it from the interval tracker
    if (intervalIds[event.key]) {
        clearInterval(intervalIds[event.key]);
        delete intervalIds[event.key];
    }
});

function handleKeyPress(event) {
    if (event.key === 'D' || event.key === 'd') {
        sendGameMove("right");
    } else if (event.key === 'A' || event.key === 'a') {
        sendGameMove("left");
    }
}
