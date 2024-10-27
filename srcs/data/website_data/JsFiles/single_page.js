import { navigateToSection, changePages, switchProfileSection, playButtonSetup, updateNavbar, hidePreloaderAfterLoad } from './Modules/navigation.js';
import { setupLogin, setupRegister } from './Modules/API/auth.js';
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
	const playButton = document.getElementById("playButton");
    playButton.addEventListener("click", function () {
		const button = document.getElementById("playbuttontext");
		if (bool === 1) {
			if (button.textContent === "PLAY") {
				playAction();
			} else if (button.textContent === "EXIT") {
				exitAction();
			}
			
			// Reset `bool` after a small delay to avoid re-entering both conditions
			setTimeout(() => { bool = 1; }, 100); 
		}
    });
	updateNavbar();
	// Set up auth forms
	setupLogin();
	setupRegister();
	// all info in profile goes in this
	if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')){
		window.onload = function() {
		getMailAndUsername(); // Call the function here
		getNameBioAndAvatar();
		websocketConnect();
		};
	}
});