


export function createMatchHistory(data) {
	const historyMatchContainer = document.getElementById("match-history-container");

    const matchDiv = document.createElement('div');
    matchDiv.id = data.history_id;
    if (data.result === "LOSE")
        matchDiv.classList.add("game", "lost");
    else
        matchDiv.classList.add("game", "won");

	matchDiv.setAttribute('onclick', `selectMatch('${data.result}', '${data.score.left + '-' + data.score.right}')`);
    const matchText = document.createElement('p');
    matchText.textContent = 'Match ' + data.history_id;
    matchDiv.appendChild(matchText);
    historyMatchContainer.appendChild(matchDiv);
}


// Example WebSocket data
// const websocketData = [
// 	{ result: 'lose', score: '10-15' },
// 	{ result: 'win', score: '15-5' },
// 	{ result: 'lose', score: '8-15' }
// ];

// // Call the function with the example data
// createMatchHistory(websocketData);
