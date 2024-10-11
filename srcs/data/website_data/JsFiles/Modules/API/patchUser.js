import { getMailAndUsername } from "./getProfileInfo.js";

export function updateUser(event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    // Clear previous error messages
    clearErrorMessages();

    // Get form values using IDs
    const username = document.getElementById('usernameInput').value;
    const email = document.getElementById('emailInput').value;
    const newpassword = document.getElementById('passwordUserInput').value;
    const oldpassword = document.getElementById('passwordEditInput').value;

    // Create a FormData object to hold the data
    const formData = new FormData();
    if (username) formData.append('username', username);
    if (email) formData.append('email', email);
    if (newpassword) formData.append('new_password', newpassword);
    if (oldpassword) formData.append('password', oldpassword);

    // Send the PATCH request
    fetch('/api/user/me/', {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken') // Authentication token
        },
        body: formData // Send the form data
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 400) {
                return response.json().then(errorBody => {
                    // Handle specific error messages for each field
                    if (errorBody.email) {
                        errorBody.email.forEach(errorMessage => {
                            displayErrorMessage('emailInput', errorMessage);
							editModal.style.display = 'none';
                        });
                    }
                    if (errorBody.password) {
                        errorBody.password.forEach(errorMessage => {
                            displayErrorMessage('passwordEditInput', errorMessage);
                        });
                    }
					if (errorBody.username) {
                        errorBody.username.forEach(errorMessage => {
                            displayErrorMessage('usernameInput', errorMessage);
							editModal.style.display = 'none';
                        });
                    }
                    throw new Error('Failed to update profile. Check error details.');
                });
            }
            throw new Error('Failed to update profile: ' + response.statusText);
        }
        return response.json(); // Parse the response
    })
    .then(data => {
        console.log('Profile updated successfully:', data);
		editModal.style.display = 'none';
        getMailAndUsername(); // Call the imported function
		location.reload();
    })
    .catch(error => {
        console.error('Error during the profile update:', error);
    });
}

export function displayErrorMessage(inputId, message) {
    const inputElement = document.getElementById(inputId);
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message'; // Add a class for styling
    errorElement.style.color = 'red'; // Set text color to red
    errorElement.innerText = message; // Set the error message text
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling); // Insert the error message below the input
}

export function clearErrorMessages() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove()); // Remove existing error messages
}

document.getElementById('confirmEdit').addEventListener('click', updateUser);