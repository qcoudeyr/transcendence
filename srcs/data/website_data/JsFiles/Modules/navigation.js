import { initScene } from "../3d/3d.js";
import { getWebsocket } from "../WebSocket/websocket-open.js";

export function navigateToSection(sections, links) {
	function navigate(sectionId) {
	  sections.forEach((section) => {
		section.style.display = section.id === sectionId ? 'block' : 'none';
	  });
	}
  
	window.addEventListener("popstate", function (event) {
	  const section = event.state?.section || "home";
	  navigate(section);
	//   highlightLink(links, section);
	});
  
	if (window.location.hash) {
	  const sectionId = window.location.hash.replace("#", "");
	  history.replaceState({ section: sectionId }, "", `#${sectionId}`);
	  navigate(sectionId);
	} else {
	  history.replaceState({ section: "home" }, "", "#home");
	  navigate("home");
	}
  }
  
  export function changePages(sections, links, clickSound) {
	links.forEach((link) => {
	  link.addEventListener("click", (event) => {
		event.preventDefault();
		const sectionId = link.dataset.section;
		history.pushState({ section: sectionId }, "", `#${sectionId}`);
		navigateToSection(sections, links);
		clickSound.play();
	  });
	});
  }
  
  export function switchProfileSection(profileLinks, profileSections) {
	profileLinks.forEach((link) => {
	  link.addEventListener("click", (event) => {
		event.preventDefault();
		const sectionId = link.dataset.profileSection;
		profileSections.forEach((section) => {
		  section.classList.toggle("profile_active", section.id === sectionId);
		});
	  });
	});
  }
  
  export function updateNavbar() {
	const connexionLink = document.querySelector('a[data-section="connexion"]');
	const profileLink = document.querySelector('a[data-section="profile"]');
	const playlink = document.querySelector('a[data-section="play"]');
	// const tournamentlink = document.querySelector('a[data-section="tournaments"]');
	const statslink = document.querySelector('a[data-section="statistics"]');
	const chatContainer = document.querySelector('.chat-container');
	const chatInput = document.querySelector('.chat-input');
	const sidebar = document.querySelector('.sidebar');
	const notification = document.querySelector('.notification-container');
  
	function update() {
	  if (localStorage.getItem("accessToken")) {
		connexionLink.style.display = "none";
		profileLink.style.display = "inline-block";
		playlink.style.display = "inline-block";
		// tournamentlink.style.display = "inline-block";
		statslink.style.display = "inline-block";
		chatContainer.style.display = "fixed";
		chatInput.style.display = "fixed";
		sidebar.style.display = "fixed";
		notification.style.opacity = "fixed";
	  } else {
		connexionLink.style.display = "inline-block";
		profileLink.style.display = "none";
		playlink.style.display = "none";
		// tournamentlink.style.display = "none";
		statslink.style.display = "none";
		chatContainer.style.display = "none";
		chatInput.style.display = "none";
		sidebar.style.display = "none";
		notification.style.display = "none";
	  }
	}
  
	update();
	window.addEventListener("storage", update);
  }
  
  let isInitialized = false; // Flag to prevent multiple initializations

export function isUnloaded()
{
	isInitialized = false;
}
  
  export function playButtonSetup(clickSound) {
	let bool = 1;
	const button = document.getElementById("playbuttontext");
	let socket = getWebsocket();
	if (button.textContent === "PLAY" && bool === 1)
	{
		
		socket.send(JSON.stringify({
			'type': 'game_join_queue',
			'mode': 'CLASSIC'
		}));
		button.textContent = "EXIT";
		console.log("im here in the play");
		bool = 0;
	}
	else if(button.textContent === "EXIT" && bool === 1)
	{
		socket = getWebsocket();
		socket.send(JSON.stringify({
			'type': 'game_leave_queue',
		}));
		button.textContent = "PLAY";
		console.log("im here in the exit");
		bool = 0;
	}
	
	// Directly navigate to the "playing" section
	
  
 // Call the function to display "playing" section
	clickSound.play(); // Play the click sound if desired
	 // Initialize the scene
  }
  
  export function showPlayingSection() {
	if (isInitialized) return; // Prevent further calls
	isInitialized = true; // Set the flag to true
	  const sections = document.querySelectorAll("section"); // Select all sections
	  sections.forEach((section) => {
		section.style.display = section.id === "playing" ? "block" : "none";
	  });
	  document.querySelector('nav').style.display = 'none';
	  initScene();
	}

  export function hidePreloaderAfterLoad() {
        const preloader = document.getElementById('preloader');
        // Simulate loading time
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 3000); // Adjust the timeout as needed
}