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
	const tournamentlink = document.querySelector('a[data-section="tournaments"]');
	const statslink = document.querySelector('a[data-section="statistics"]');
  
	function update() {
	  if (localStorage.getItem("accessToken")) {
		connexionLink.style.display = "none";
		profileLink.style.display = "inline-block";
		playlink.style.display = "inline-block";
		tournamentlink.style.display = "inline-block";
		statslink.style.display = "inline-block";
	  } else {
		connexionLink.style.display = "inline-block";
		profileLink.style.display = "none";
		playlink.style.display = "none";
		tournamentlink.style.display = "none";
		statslink.style.display = "none";
	  }
	}
  
	update();
  
	window.addEventListener("storage", update);
  }
  
  export function playButtonSetup(clickSound) {
	const playButton = document.getElementById("playButton");
	playButton.addEventListener("click", function () {
		window.location.hash = "#playing";
	  	// clickSound.play();
	  	location.reload();
	});
  }


  export function handleLogout(LogoutButton, sections, links, clickSound) {
	LogoutButton.addEventListener("click", function () {
	  logout();
	});
  }
  
  function logout() {
	// Remove tokens to log the user out
	localStorage.clear();
  
	// Navigate to the home section and refresh the page
	window.location.hash = "#home";
	location.reload(true);  // Reload the page to update the UI
  }


  export function hidePreloaderAfterLoad() {
    document.addEventListener("DOMContentLoaded", function() {
        const preloader = document.getElementById('preloader');
        // Simulate loading time
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 3000); // Adjust the timeout as needed
    });
}