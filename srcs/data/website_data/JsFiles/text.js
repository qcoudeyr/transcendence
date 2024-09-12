document.addEventListener('DOMContentLoaded', function() {
    // Get all nav links and sections
    const navLinks = document.querySelectorAll('.profile_nav-link');
    const sections = document.querySelectorAll('.profile_content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent the default anchor behavior

            // Remove 'profile_active' class from all sections
            sections.forEach(section => section.classList.remove('profile_active'));

            // Remove 'profile_active' class from all nav links
            navLinks.forEach(link => link.classList.remove('profile_active'));

            // Add 'profile_active' class to the clicked link and the corresponding section
            const targetId = this.getAttribute('href').substring(1); // Get the id without '#'
            document.getElementById(targetId).classList.add('profile_active');
            this.classList.add('profile_active');
        });
    });
});
