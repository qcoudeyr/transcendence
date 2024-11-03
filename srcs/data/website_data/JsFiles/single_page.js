import { navigateToSection, changePages, switchProfileSection, playButtonSetup, playTournamentSetup, leaveQueue, updateNavbar, hidePreloaderAfterLoad } from './Modules/navigation.js';
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
	const playButtonTournament = document.getElementById("tournament-box");
	playButtonTournament.addEventListener("click", function() {
		playTournamentSetup(clickSound);
	});
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
});
