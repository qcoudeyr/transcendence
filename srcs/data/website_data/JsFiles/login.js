function switchForm(event) {
	event.preventDefault();
	const loginForm = document.querySelector('.login-form');
	const registerForm = document.querySelector('.register-form');
	loginForm.classList.toggle('fade-out');
	loginForm.classList.toggle('fade-in');
	registerForm.classList.toggle('fade-out');
	registerForm.classList.toggle('fade-in');
}

// Fonction pour envoyer les données du formulaire au backend
async function submitRegisterForm(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Assurez-vous que le formulaire est correctement sélectionné
    const registerForm = document.querySelector('.register-form'); // Assurez-vous que le sélecteur est correct

    // Vérifiez que registerForm est bien un élément de formulaire
    if (!(registerForm instanceof HTMLFormElement)) {
        console.error('L\'élément sélectionné n\'est pas un formulaire.');
        return;
    }

    // Créez un objet FormData à partir du formulaire
    const formData = new FormData(registerForm);

    // Utilisez fetch pour envoyer les données au backend
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            body: formData, // Envoie les données du formulaire
        });

        // Traitez la réponse du serveur
        if (response.ok) {
            const result = await response.json();
            console.log('Inscription réussie:', result);
            // Vous pouvez rediriger l'utilisateur ou afficher un message de succès ici
        } else {
            console.error('Erreur lors de l\'inscription:', response.statusText);
            // Gérez les erreurs ici (par exemple, affichez un message d'erreur)
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du formulaire:', error);
        // Gérez les erreurs de réseau ici
    }
}

// Ajoutez un écouteur d'événements sur le formulaire d'inscription pour gérer la soumission

// Fonction pour envoyer les données du formulaire de connexion au backend
async function submitLoginForm(event) {
    event.preventDefault(); // Empêche le rechargement de la page

    // Assurez-vous que le formulaire est correctement sélectionné
    const loginForm = document.querySelector('.login-form'); // Assurez-vous que le sélecteur est correct

    // Vérifiez que loginForm est bien un élément de formulaire
    if (!(loginForm instanceof HTMLFormElement)) {
        console.error('L\'élément sélectionné n\'est pas un formulaire.');
        return;
    }

    // Créez un objet FormData à partir du formulaire
    const formData = new FormData(loginForm);

    // Utilisez fetch pour envoyer les données au backend
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            body: formData, // Envoie les données du formulaire
        });

        // Traitez la réponse du serveur
        if (response.ok) {
            const result = await response.json();
            console.log('Connexion réussie:', result);
            // Vous pouvez rediriger l'utilisateur ou afficher un message de succès ici
        } else {
            console.error('Erreur lors de la connexion:', response.statusText);
            // Gérez les erreurs ici (par exemple, affichez un message d'erreur)
        }
    } catch (error) {
        console.error('Erreur lors de l\'envoi du formulaire:', error);
        // Gérez les erreurs de réseau ici
    }
}

// Ajoutez un écouteur d'événements sur le formulaire de connexion pour gérer la soumission
document.querySelector('.login-form').addEventListener('submit', submitLoginForm);
document.querySelector('.register-form').addEventListener('submit', submitRegisterForm);

