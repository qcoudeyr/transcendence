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

function handleKeyPress(event) {
    if (event.key === 'D' || event.key === 'd') {
        sendGameMove("right");
    } else if (event.key === 'A' || event.key === 'a') {
        sendGameMove("left");
    }
}
