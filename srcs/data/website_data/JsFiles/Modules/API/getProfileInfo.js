export function getMailAndUsername() {
	fetch('/api/user/me/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
		}
		
	})
	.then(response => {
		// Check if the response is okay (status in the range 200-299)
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		return response.json(); // Parse the JSON from the response
	})
	.then(data => {
		localStorage.setItem("username", data.username);
		localStorage.setItem("email", data.email);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function setAvatar() {
    fetch(localStorage.getItem('avatar_url'), {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        }
    })
    .then(response => {
        // Check if the response is okay (status in the range 200-299)
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.blob(); // Get the response as a Blob (for binary data like an image)
    })
    .then(blob => {
        const imageURL = URL.createObjectURL(blob); // Create a URL for the image
        localStorage.setItem('avatar_img', imageURL); // Store the image URL in localStorage
        document.getElementById('profileImage').src = imageURL; // Set the src of the image element
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

export function setNameBioAvatar()
{
		document.getElementById('userBiography').textContent = localStorage.getItem('biography');
		document.getElementById('profileName').textContent = localStorage.getItem('name');
		setAvatar();
}

export function getNameBioAndAvatar() {
	fetch ('/api/profile/me', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
		}
	})
	.then(response => {
		// Check if the response is okay (status in the range 200-299)
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		return response.json(); // Parse the JSON from the response
	})
	.then(data => {
		console.log('Avatar = ' + data.avatar);
		localStorage.setItem("name", data.name);
		localStorage.setItem("biography", data.biography);
		localStorage.setItem("avatar_url", data.avatar);

		setNameBioAvatar();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}