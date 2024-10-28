export function scoreUpdate(score1, score2)
{
		const score1Element = document.getElementById("score1");
		const score2Element = document.getElementById("score2");
		
		// Update the scores displayed on the scoreboard
		score1Element.textContent = score1;
		score2Element.textContent = score2;
}