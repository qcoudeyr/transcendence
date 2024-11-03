import { initScene } from "../3d/3d.js";
import { notificationReset, queueNotification, queueNotificationTournament } from "../WebSocket/notifications-displays.js";
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
	const history = document.querySelector('a[data-section="history"]');
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
		history.style.display = "inline-block";
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
		statslink.style.display = "none";
		chatContainer.style.display = "none";
		history.style.display = "none";
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

export function leaveQueue(clickSound)
{
	const button = document.getElementById("playbuttontext");
	const boxes = document.querySelectorAll('.play-section-box');
    let socket = getWebsocket();

        socket.send(JSON.stringify({
            'type': 'game_leave_queue',
        }));
        console.log("Leaving the queue");
		button.style.display = "none";
		boxes.forEach(b => b.classList.remove('clicked'));
		notificationReset()

    clickSound.play();
}

export function playButtonSetup(clickSound) {
	const button = document.getElementById("playbuttontext");
	let socket = getWebsocket();
  
	button.addEventListener("click", (event) => {
	  event.preventDefault(); // Prevent default action
	  event.stopPropagation(); // Prevent bubbling
  
	  socket.send(JSON.stringify({
		'type': 'game_join_queue',
		'mode': 'CLASSIC'
	  }));
	  console.log("Joining the queue");
	  queueNotification();
	  button.style.display = "block";
	  button.textContent = "EXIT";
  
	  clickSound.play();
	}, { once: true }); // Ensures this listener is executed only once
  }

export function playTournamentSetup(clickSound) {
    const button = document.getElementById("playbuttontext");
    let socket = getWebsocket();

        socket.send(JSON.stringify({
            'type': 'game_join_queue',
            'mode': 'TOURNAMENT'
        }));
        console.log("Joining the queue");
		queueNotificationTournament();
		button.style.display = "block";
        button.textContent = "EXIT";

    clickSound.play();
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