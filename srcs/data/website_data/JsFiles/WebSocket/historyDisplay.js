

export function createMatchHistory(data) {
		const matchHistoryContainer = document.getElementById("match-history-container");

		data.forEach((match, index) => {
			const matchDiv = document.createElement('div');
			matchDiv.id = `game_${index + 1}`;
			matchDiv.classList.add('game', match.result === 'win' ? 'won' : 'lost');
			matchDiv.onclick = () => selectMatch(match.result, match.score);

			const matchParagraph = document.createElement('p');
			matchParagraph.textContent = `Match ${index + 1}`;
			matchDiv.appendChild(matchParagraph);

			matchHistoryContainer.appendChild(matchDiv);
		});
}
				
// Function to handle match selection
function selectMatch(status, score) {
	document.getElementById('match_status').innerText = status === 'won' ? 'You Won!' : 'You Lost!';
	document.getElementById('match_score').innerText = `Score: ${score}`;
}

// Example WebSocket data
// const websocketData = [
// 	{ result: 'lose', score: '10-15' },
// 	{ result: 'win', score: '15-5' },
// 	{ result: 'lose', score: '8-15' }
// ];

// // Call the function with the example data
// createMatchHistory(websocketData);
