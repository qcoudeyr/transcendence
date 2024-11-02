import { navigateToSection, changePages, switchProfileSection, playButtonSetup, leaveQueue, updateNavbar, hidePreloaderAfterLoad } from './Modules/navigation.js';
import { setupLogin, setupRegister, checkAccessToken } from './Modules/API/auth.js';
import { getMailAndUsername, getNameBioAndAvatar } from './Modules/API/getProfileInfo.js';
import { websocketConnect } from './WebSocket/websocket-open.js';
// import { checkToken } from './Modules/API/auth.js';

let hoursPlayedChart;
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
	// Assuming `data.hours_played` is an object with month properties
const data = {
    hours_played: {
        jan: 20,
        feb: 30,
        mar: 50,
        apr: 40,
        may: 60,
        jun: 80,
        jul: 90,
        aug: 75,
        sep: 85,
        oct: 70,
        nov: 55,
        dec: 65
    }
	};
	const ctx = document.getElementById('hoursPlayedChart').getContext('2d');
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
                    data.hours_played.jan,
                    data.hours_played.feb,
                    data.hours_played.mar,
                    data.hours_played.apr,
                    data.hours_played.may,
                    data.hours_played.jun,
                    data.hours_played.jul,
                    data.hours_played.aug,
                    data.hours_played.sep,
                    data.hours_played.oct,
                    data.hours_played.nov,
                    data.hours_played.dec
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
});
