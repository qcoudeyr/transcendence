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

let hoursPlayedChart;

export function createHoursPlayedChart(chartData) {

	if (chartData.hours_played)
	{
		const ctx = document.getElementById('hoursPlayedChart').getContext('2d');

		// Destroy the existing chart if it already exists
		if (hoursPlayedChart) {
			hoursPlayedChart.destroy();
		}
	
		// Create a new chart instance
		hoursPlayedChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
				datasets: [{
					label: 'Hours Played',
					data: [
						chartData.hours_played.jan,
						chartData.hours_played.feb,
						chartData.hours_played.mar,
						chartData.hours_played.apr,
						chartData.hours_played.may,
						chartData.hours_played.jun,
						chartData.hours_played.jul,
						chartData.hours_played.aug,
						chartData.hours_played.sep,
						chartData.hours_played.oct,
						chartData.hours_played.nov,
						chartData.hours_played.dec
					],
					backgroundColor: 'rgba(255, 0, 255, 0.6)',
					borderColor: '#ff00ff',
					borderWidth: 1,
					hoverBackgroundColor: 'rgb(0, 255, 255)',
					hoverBorderColor: '#ff00ff'
				}]
			},
			options: {
				responsive: true,
				scales: {
					y: {
						beginAtZero: true,
						grid: {
							color: 'rgba(255, 0, 255, 0.6)'
						},
						ticks: {
							color: '#ff00ff'
						}
					},
					x: {
						grid: {
							color: 'rgba(255, 0, 255, 0.6)'
						},
						ticks: {
							color: '#ff00ff'
						}
					}
				},
				plugins: {
					legend: {
						display: false
					}
				}
			}
		});
	}
	else
	{
		console.log("Currently no hours played.");
	}
    
}