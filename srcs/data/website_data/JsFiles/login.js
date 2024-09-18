function switchForm(event) {
	event.preventDefault();
	const loginForm = document.querySelector('.login-form');
	const registerForm = document.querySelector('.register-form');
	loginForm.classList.toggle('fade-out');
	loginForm.classList.toggle('fade-in');
	registerForm.classList.toggle('fade-out');
	registerForm.classList.toggle('fade-in');
}

function navigateToSectionTemp(sectionId) {
	sections.forEach(section => {
		if (section.id === sectionId) {
			section.style.display = 'block';
		} else {
			section.style.display = 'none';
		}
	});
}

// LoginForm.addEventListener('submit', (event) => {
//     event.preventDefault();
//     event.stopPropagation();
//     const LoginUsername = document.getElementById('LoginFormUsername').value;
//     const LoginPassword = document.getElementById('LoginFormPassword').value;
    
//     const apiUrl = '/api/login/';

//     const postData = {
//         username: LoginUsername,
//         password: LoginPassword
//     };

//     // Make the POST request
//     fetch(apiUrl, {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(postData)
//     })
//     .then(response => {
//         if (response.ok) {
//             return response.json();
//         } else if (response.status === 401) {
//             // Handle 401 error: Unauthorized
//             displayError('Wrong Credentials, please try again.');
//             return; // Return early to avoid throwing an error
//         } else {
//             // Throw error for other unexpected statuses
//             throw new Error('Unexpected error occurred');
//         }
//     })
//     .then(data => {
//         if (data) { // Only proceed if there's data (successful response)
//             console.log('Response:', data);
//             // Store tokens in localStorage
//             localStorage.setItem('accessToken', data.access);
//             localStorage.setItem('refreshToken', data.refresh);
// 			console.log("Tokens logged in localStorage: ", localStorage.getItem('accessToken'))
// 			navigateToSectionTemp('home');
//             // Redirect or perform other actions
//         }
//     })
//     .catch(error => {
//         // Log unexpected errors only
//         if (error.message !== '401 Error: Unauthorized') {
//             console.error('Error during the request:', error);
//         }
//     });
// });

// // Function to display an error message
// function displayError(message) {
//     const errorMessageDiv = document.getElementById('error-message');
//     errorMessageDiv.textContent = message;
//     errorMessageDiv.style.display = 'block';
// }