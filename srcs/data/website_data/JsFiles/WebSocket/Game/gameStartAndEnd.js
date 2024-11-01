
// export function gameReadySoStart()
// {

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

// function handleKeyPress(event) {
//     if (event.key === 'D' || event.key === 'd') {
//         sendGameMove("right");
//     } else if (event.key === 'A' || event.key === 'a') {
//         sendGameMove("left");
//     }
// }

// function sendGameMove(direction) {
//     const message = {
//         type: "game_move_pad",
//         direction: direction
//     };
//     socket.send(JSON.stringify(message));
// }
// 	//start the game
// }

export function gameEnd()
{
	//show frame you lost or you won then make the button leave apear on top
}