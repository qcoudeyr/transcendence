document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('nav a');
    const clickSound = document.getElementById('navsound'); // Reference to the audio element
    const playButton = document.getElementById('playButton'); // Reference to the play button

    const profileLinks = document.querySelectorAll('.profile_nav-link');
    const profileSections = document.querySelectorAll('.profile_content-section');

    // Set the volume to a lower level
    clickSound.volume = 0.2; // Adjust this value to your desired volume (0.2 is 20% of full volume)

    function navigateToSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    }

	function changePages(sectionId) {
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
        navigateToSection(sectionId);
        // Increase font size of the clicked link smoothly
        links.forEach(link => {
            if (link.dataset.section === sectionId) {
                link.style.transition = 'font-size 0.3s ease-in-out';
                link.style.fontSize = '1.5em';
            } else {
                link.style.transition = 'font-size 0.3s ease-in-out';
                link.style.fontSize = '1em';
            }
        });
    }

    function switchProfileSection(sectionId) {
        profileSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('profile_active');
            } else {
                section.classList.remove('profile_active');
            }
        });
    }

    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            navigateToSection(event.state.section);
            // Increase font size of the link corresponding to the current section
            links.forEach(link => {
                if (link.dataset.section === event.state.section) {
                    link.style.transition = 'font-size 0.3s ease-in-out';
                    link.style.fontSize = '1.5em';
                } else {
                    link.style.transition = 'font-size 0.3s ease-in-out';
                    link.style.fontSize = '1em';
                }
            });
        } else {
            navigateToSection('home');
        }
    });

    // On initial load, check the hash and navigate accordingly
    if (window.location.hash) {
        const sectionId = window.location.hash.replace('#', '');
        history.replaceState({ section: sectionId }, '', `#${sectionId}`);
        navigateToSection(sectionId);
    } else {
        history.replaceState({ section: 'home' }, '', '#home');
        navigateToSection('home');
    }

    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            const sectionId = link.dataset.section;
            changePages(sectionId);
            clickSound.play(); // Play the click sound
        });
    });

    // Handle profile sidebar separately
    profileLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor behavior
            const profileSectionId = link.dataset.profileSection;
            switchProfileSection(profileSectionId);
        });
    });

    // Handle play button separately
    playButton.addEventListener('click', function() {
        changePages('playing');
        clickSound.play(); // Play the click sound
    });


			/// get to see how geoffrey wants it to work but its work also make a Logout Button							TODO
		const connexionLink = document.querySelector('a[data-section="connexion"]');
		const profileLink = document.querySelector('a[data-section="profile"]');
	  
		function updateNavbar() {
		  if (localStorage.getItem('accessToken')) {
			connexionLink.style.display = 'none';
			profileLink.style.display = 'inline-block';
		  } else {
			connexionLink.style.display = 'inline-block';
			profileLink.style.display = 'none';
		  }
		}
	  
		// Initial update
		updateNavbar();
	  
		// Listen for changes in localStorage	every time theirs a change it listens
		window.addEventListener('storage', function(event) {
		  if (event.key === 'token') {
			updateNavbar();
		  }
		});


		//logout

		LogoutButton.addEventListener('click', function(){
			changePages('home');
			localStorage.removeItem('accessToken');
			location.reload(true);
		});
	//LOGIN SECTION WITH API

	LoginForm.addEventListener('submit', (event) => {
		event.preventDefault();
		event.stopPropagation();
		const LoginUsername = document.getElementById('LoginFormUsername').value;
		const LoginPassword = document.getElementById('LoginFormPassword').value;
		
		const apiUrl = '/api/login/';
	
		const postData = {
			username: LoginUsername,
			password: LoginPassword
		};
	
		// Make the POST request
		fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(postData)
		})
		.then(response => {
			if (response.ok) {
				return response.json();
			} else if (response.status === 401) {
				// Handle 401 error: Unauthorized
				displayError('Wrong Credentials, please try again.');
				return; // Return early to avoid throwing an error
			} else {
				// Throw error for other unexpected statuses
				throw new Error('Unexpected error occurred');
			}
		})
		.then(data => {
			if (data) { // Only proceed if there's data (successful response)
				console.log('Response:', data);
				// Store tokens in localStorage
				localStorage.setItem('accessToken', data.access);
				localStorage.setItem('refreshToken', data.refresh);
				console.log("Tokens logged in localStorage: ", localStorage.getItem('accessToken'))
				location.reload(true);

				changePages('home');
				// Redirect or perform other actions
			}
		})
		.catch(error => {
			// Log unexpected errors only
			if (error.message !== '401 Error: Unauthorized') {
				console.error('Error during the request:', error);
			}
		});
	});
	
	// Function to display an error message
	function displayError(message) {
		const errorMessageDiv = document.getElementById('error-message');
		errorMessageDiv.textContent = message;
		errorMessageDiv.style.display = 'block';
	}
});
