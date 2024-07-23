document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const links = document.querySelectorAll('nav a');
    const clickSound = document.getElementById('navsound'); // Reference to the audio element

    // Set the volume to a lower level
    clickSound.volume = 0.2; // Adjust this value to your desired volume (0.2 is 20% of full volume)

    function navigateToSection(sectionId) {
        let sectionFound = false;
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.style.display = 'block';
                sectionFound = true;
            } else {
                section.style.display = 'none';
            }
        });
        // Si aucune section correspondante n'est trouvée, affichez la section 404
        if (!sectionFound) {
            document.getElementById('not-found').style.display = 'none';
        }
    }

    function changePages(sectionId) {
        history.pushState({ section: sectionId }, '', `#${sectionId}`);
        navigateToSection(sectionId);
        // Increase font size of the clicked link smoothly
        links.forEach(link => {
            if (link.getAttribute('onclick').includes(sectionId)) {
                link.style.transition = 'font-size 0.3s ease-in-out';
                link.style.fontSize = '1.5em';
            } else {
                link.style.transition = 'font-size 0.3s ease-in-out';
                link.style.fontSize = '1em';
            }
        });
    }

    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            navigateToSection(event.state.section);
            // Increase font size of the link corresponding to the current section
            links.forEach(link => {
                if (link.getAttribute('onclick').includes(event.state.section)) {
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
            const sectionId = event.target.getAttribute('onclick').match(/'([^']+)'/)[1];
            changePages(sectionId);
            clickSound.play(); // Play the click sound
        });
    });
});
