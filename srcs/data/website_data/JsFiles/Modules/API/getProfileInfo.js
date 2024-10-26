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
		setEmailUsername();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function setEmailUsername() {
	document.getElementById('usernameDisplay').textContent = localStorage.getItem('username');
	document.getElementById('emailDisplay').textContent = localStorage.getItem('email');
}

function setAvatar() {
    fetch(localStorage.getItem('avatar_url'), {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.blob();
    })
    .then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob); // Convert Blob to Base64
        reader.onloadend = function() {
            const base64data = reader.result;
            localStorage.setItem('avatar_img', base64data); // Store Base64 image in localStorage
            document.getElementById('profileImage').src = base64data; // Set the src of the image element
        };
    })
    .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
    });
}

export function setNameBioAvatar()
{
		document.getElementById('userBiography').textContent = localStorage.getItem('biography');
		document.getElementById('profileName').textContent = localStorage.getItem('name');
		document.getElementById('profile-id').textContent = 'My ID: ' + localStorage.getItem('id');
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
		localStorage.setItem("name", data.name);
		localStorage.setItem("biography", data.biography);
		localStorage.setItem("avatar_url", data.avatar);
		localStorage.setItem("id",data.id);
		setNameBioAvatar();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}