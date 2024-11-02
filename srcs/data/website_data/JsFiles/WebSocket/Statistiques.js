export function fillStats(data)
{
	if(data)
	{
		const totalWins = document.getElementById("total-wins");
		const totalLosses = document.getElementById("total-losses");
		const bestStreak = document.getElementById("top-streak");
		const gamesPlayed = document.getElementById("games-played");
		// const playtime = document.getElementById("play-time");
		const currentStreak = document.getElementById("current-streak");

		totalWins.textContent = data.total_wins;
		totalLosses.textContent = data.total_loss;
		bestStreak.textContent = data.best_streak;
		gamesPlayed.textContent = data.games_played;
		// playtime.textContent = data.games_played;
		currentStreak.textContent = data.actual_streak;
		console.log("\x1b[34m[Statistiques] Loaded!\x1b[0m");
	}
	else
	{
		console.error("Stats data not found !");
	}
}