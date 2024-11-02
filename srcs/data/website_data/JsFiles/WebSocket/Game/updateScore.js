export function scoreUpdate(score1, score2)
{
		const score1Element = document.getElementById("score1");
		const score2Element = document.getElementById("score2");
		
		// Update the scores displayed on the scoreboard
		score1Element.textContent = score1;
		score2Element.textContent = score2;
}

export function scoreboardFill(data)
{
	if (data && data.TIMER) {
        // Get the ball mesh from your existing function
        const time = Document.getElementById("scoreboard-timer")
        time.textContent = data.TIMER.minutes + ":" + data.TIMER.secondes;
	}
	if (data && data.SCORE) {
		const scoreleft = document.getElementById("scoreboard-score-left");
		const scoreright = document.getElementById("scoreboard-score-right");
		scoreright.textContent = data.SCORE.right;
		scoreleft.textContent = data.SCORE.left;
	} 
	
}