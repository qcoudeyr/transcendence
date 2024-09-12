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
});
