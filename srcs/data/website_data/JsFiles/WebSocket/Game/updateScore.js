export function scoreboardFill(data)
{
	if (data && data.TIMER) {
        // Get the ball mesh from your existing function
        const time = document.getElementById("scoreboard-timer")
        time.textContent = data.TIMER.minutes + ":" + data.TIMER.seconds;
	}
	if (data && data.SCORE) {
		const scoreleft = document.getElementById("scoreboard-score-left");
		const scoreright = document.getElementById("scoreboard-score-right");
		scoreright.textContent = data.SCORE.right;
		scoreleft.textContent = data.SCORE.left;
	} 
	
}