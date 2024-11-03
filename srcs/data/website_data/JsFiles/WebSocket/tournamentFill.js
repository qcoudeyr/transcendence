export function fillTournament(data) {
    const games = [];
    const playerElements = [];

    // Collect game elements and player elements
    for (let i = 0; i < 7; i++) {
        games.push(document.getElementById(`game${i}`));
        playerElements.push({
            player0: document.getElementById(`game${i}-p0`),
            player1: document.getElementById(`game${i}-p1`)
        });
    }
	console.log(games);
	console.log(playerElements);
    // Fill player names and set winner/loser classes
    games.forEach((game, index) => {
        const player0 = playerElements[index].player0;
        const player1 = playerElements[index].player1;

        player0.textContent = data[`game_${index}`].player_0.name;
        player1.textContent = data[`game_${index}`].player_1.name;


		player0.className = '';
        player1.className = '';
        // Set classes based on winner
		player0.class.clear;
        if (data[`game_${index}`].winner === "player_0") {
            player0.classList.add("winner-team");
            player1.classList.add("loser-team");
        } else {
            player0.classList.add("loser-team");
            player1.classList.add("winner-team");
        }
    });
}