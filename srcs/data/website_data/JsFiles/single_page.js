import { navigateToSection, changePages, switchProfileSection, updateNavbar, handleLogout, playButtonSetup, hidePreloaderAfterLoad } from './Modules/navigation.js';
import { setupLogin, setupRegister, getMailAndUsername } from './Modules/API/auth.js';

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
	updateNavbar();
	playButtonSetup();
	// Set up auth forms
	setupLogin();
	setupRegister();

	handleLogout(LogoutButton, sections, links, clickSound);
	// all info in profile goes in this
	if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')){
		window.onload = function() {
		getMailAndUsername(); // Call the function here
		};
	}
});