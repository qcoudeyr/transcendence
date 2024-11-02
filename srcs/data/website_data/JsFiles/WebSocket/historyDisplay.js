// Function to handle match selection
export function selectMatch(status, score) {
	document.getElementById('match_status').innerText = status === 'won' ? 'You Won!' : 'You Lost!';
	document.getElementById('match_score').innerText = `Score: ${score}`;
}


export function createMatchHistory(data) {
    const matchDiv = document.createElement('div');
    matchDiv.id = data.id;
    if (data.result === "LOSE")
        matchDiv.classList.add("game", "lost");
    else
        matchDiv.classList.add("game", "won");
    matchDiv.setAttribute('onclick', `selectMatch('${data.result}', '${data.score}')`);
    const matchText = document.createElement('p');
    matchText.textContent = 'Match ' + data.id;
    matchDiv.appendChild(matchText);
    document.body.appendChild(matchDiv);
}


// Example WebSocket data
// const websocketData = [
// 	{ result: 'lose', score: '10-15' },
// 	{ result: 'win', score: '15-5' },
// 	{ result: 'lose', score: '8-15' }
// ];

// // Call the function with the example data
// createMatchHistory(websocketData);
