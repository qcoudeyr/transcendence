// Get the button element
var playButton = document.getElementById("playButton");

// Get the audio element
var clickSound = document.getElementById("clickSound");

// Add click event listener to the button
// playButton.addEventListener("click", function() {
//     // Play the click sound
//     clickSound.play();
// });

function toggleSwitch(activeSwitch) {
	var switch1 = document.getElementById("switch1");
	var switch2 = document.getElementById("switch2");
	var audio = document.getElementById("switchsound");

	if (activeSwitch === 1) {
		switch1.checked = true;
		switch2.checked = false;
	} else if (activeSwitch === 2) {
		switch1.checked = false;
		switch2.checked = true;
	}
	audio.currentTime = 0; // Rewind sound to start
    audio.play();
}

//nav bar
// Add an active class to the current page link
// Function to add active class to the current navigation link
function setActiveLink() {
    // Remove active class from all navigation links
    document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
    
    // Get the current hash value (e.g., #home, #play, etc.)
    var currentHash = window.location.hash;
    
    // Add active class to the navigation link corresponding to the current hash
    var activeLink = document.querySelector(`nav a[href="${currentHash}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Call the setActiveLink function when the page loads and when the hash changes
window.onload = setActiveLink;
window.onhashchange = setActiveLink;

//LOADER
document.addEventListener("DOMContentLoaded", function() {
	const preloader = document.getElementById('preloader');
	// Simulate loading time
	setTimeout(() => {
		preloader.style.display = 'none';
	}, 3000); // Adjust the timeout as needed
});