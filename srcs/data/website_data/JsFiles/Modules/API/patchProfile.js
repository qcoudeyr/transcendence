import { getNameBioAndAvatar } from "./getProfileInfo.js";

let selectedAvatarFile = null; // Global variable to store the selected avatar file

export function updateProfile(event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    // Get form values using IDs
    const name = document.getElementById('nameInput').value;
    const biography = document.getElementById('bioInput').value;

    // Debugging: log the values
    console.log('Name:', name);
    console.log('Biography:', biography);
    console.log('Avatar File:', selectedAvatarFile);

    // Create a FormData object to hold the data
    const formData = new FormData();
    if (name) formData.append('name', name);
    if (biography) formData.append('biography', biography);
    if (selectedAvatarFile) formData.append('avatar', selectedAvatarFile);

    // Log formData contents
    console.log('This is the formData:');
    formData.forEach((value, key) => {
        console.log(key + ':', value);
    });

    // Send the PATCH request
    fetch('/api/profile/me/', {
        method: 'PATCH',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken') // Authentication token
        },
        body: formData // Send the form data
    })
    .then(response => {
        if (!response.ok) {
			if (response.status === 413) {
				alert('The file is too large. Please select a smaller file.');
			}
            throw new Error('Failed to update profile: ' + response.statusText);
        }
        return response.json(); // Parse the response
    })
    .then(data => {
        console.log('Profile updated successfully:', data);
        getNameBioAndAvatar(); // Call the imported function
		// location.reload();
    })
    .catch(error => {
        console.error('Error during the profile update:', error);
    });
}

// Bind the updateProfile function to the button click event
document.getElementById('profile-edit-submit-btn').addEventListener('click', updateProfile);

// Drag and Drop Functionality
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");

uploadArea.addEventListener("click", () => {
    fileInput.click();
});

uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("hover");
});

uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("hover");
});

uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("hover");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        uploadFile(files[0]); // Call your existing function to upload the file
        selectedAvatarFile = files[0]; // Set the selected file to the global variable
    }
});

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        uploadFile(file);
        selectedAvatarFile = file; // Set the selected file to the global variable
    }
});

function uploadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.createElement("img");
        img.src = reader.result;
        img.classList.add("uploaded-image"); // Add the class to the image

        uploadArea.innerHTML = ""; // Clear the previous content
        uploadArea.appendChild(img); // Append the image
    };
    reader.readAsDataURL(file);
}