import { navigateToSection, changePages, switchProfileSection, playButtonSetup, leaveQueue, updateNavbar, hidePreloaderAfterLoad } from './Modules/navigation.js';
import { setupLogin, setupRegister, checkAccessToken } from './Modules/API/auth.js';
import { getMailAndUsername, getNameBioAndAvatar } from './Modules/API/getProfileInfo.js';
import { websocketConnect } from './WebSocket/websocket-open.js';
// import { checkToken } from './Modules/API/auth.js';


document.addEventListener("DOMContentLoaded", function () {
	hidePreloaderAfterLoad();

	// Navigation logic
	const sections = document.querySelectorAll("section");
	const links = document.querySelectorAll("nav a");
	const profileLinks = document.querySelectorAll(".profile_nav-link");
	const profileSections = document.querySelectorAll(".profile_content-section");

	const clickSound = document.getElementById("navsound");
	clickSound.volume = 0.2;

	// Initialize the navigation
	navigateToSection(sections, links);
	changePages(sections, links, clickSound);
	switchProfileSection(profileLinks, profileSections);

	// Update navbar and handle play button
	// if (localStorage.getItem()) {
	// 	checkToken();
	// }
	const playButton = document.getElementById("classic-box");
    playButton.addEventListener("click", function () {
        playButtonSetup(clickSound); // Pass clickSound if necessary
    });
	const LeaveQueue = document.getElementById("playButton")
	LeaveQueue.addEventListener("click", function () {
        leaveQueue(clickSound); // Pass clickSound if necessary
    });
	updateNavbar();
	// Set up auth forms
	setupLogin();
	setupRegister();
	// all info in profile goes in this
	if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')){
		window.onload = function() {
		if (checkAccessToken() === false)
			logout();
		getMailAndUsername(); // Call the function here
		getNameBioAndAvatar();
		websocketConnect();
		};
	}

	const boxes = document.querySelectorAll('.play-section-box');

        boxes.forEach(box => {
            box.addEventListener('click', () => {
                boxes.forEach(b => b.classList.remove('clicked'));
                box.classList.add('clicked');
            });
        });
	//stats script hours played
	const ctx = document.getElementById('hoursPlayedChart').getContext('2d');
    const hoursPlayedChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Hours Played',
                data: [20, 30, 50, 40, 60, 80, 90, 75, 85, 70, 55, 65], // Example data for each month
                backgroundColor: 'rgba(255, 0, 255, 0.6)',
                borderColor: '#ff00ff',
                borderWidth: 1,
                hoverBackgroundColor: 'rgb(0, 255, 255)', // Neon cyan on hover
                hoverBorderColor: '#ff00ff' // Neon pink border on hover
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 0, 255, 0.6)'// Faint neon gridlines
                    },
                    ticks: {
                        color: '#ff00ff' // Neon green y-axis labels
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 0, 255, 0.6)' // Faint neon gridlines
                    },
                    ticks: {
                        color: '#ff00ff' // Neon green x-axis labels
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend to focus on the chart itself
                }
            }
        }
    });
});
