import { getWebsocket } from "./websocket-open.js";
import { notificationReset } from "./notifications-displays.js"


	document.getElementById('search-input').focus();
	document.getElementById('search-input').onkeyup = function(e)
	{
		if (e.key === 'Enter') {
			friendRequestSend();
		}
	}

	

function friendRequestSend() {
		let socket = getWebsocket();
		const messageInputDom = document.getElementById('search-input');
		const message = messageInputDom.value;
		const profileId = parseInt(message, 10);
		socket.send(JSON.stringify(
		{
			'type': 'friend_request',
			'profile_id': profileId
		}));
		console.log(message);
		messageInputDom.value = '';
		console.log('Friend request sent.');
}


export function getFriendsAvatar(avatarUrl) {
    return new Promise((resolve, reject) => {
        let completeAvatarUrl = 'http://localhost' + avatarUrl;

        fetch(completeAvatarUrl, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.blob(); // Get the image as a Blob
        })
        .then(blob => {
            const imageURL = URL.createObjectURL(blob); // Create a local URL for the blob
            resolve(imageURL); // Resolve the promise with the image URL
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            reject(error); // Reject the promise if there’s an error
        });
    });
}

export function friendRequestReceive(request_id, name, avatar) {
    // Select the container where friend requests should be added
    const requestListDiv = document.getElementById('request_lists');

    // Create the main friend request div
    const friendRequestDiv = document.createElement('div');
    friendRequestDiv.id = 'friend_request_' + request_id; // Make the id unique using request_id
    friendRequestDiv.classList.add('friend');

    // Create the avatar image element (src will be updated later)
    const avatarImg = document.createElement('img');
    avatarImg.alt = name + "'s Avatar";
    avatarImg.classList.add('avatar');

    // Append avatar image first
    friendRequestDiv.appendChild(avatarImg);

    // Fetch and set the avatar image
    getFriendsAvatar(avatar)
        .then(imageURL => {
            avatarImg.src = imageURL; // Set the avatar image once fetched
        })
        .catch(error => {
            console.error('Error fetching avatar:', error);
            avatarImg.src = './default-avatar.png'; // Set a default avatar in case of error
        });

    // Create the span for friend's name
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name; // Set friend's name from the parameter
    nameSpan.classList.add('friend-name-request');
	nameSpan.style.color = "white";
	nameSpan.style.textShadow = '0 0 10px #ffffff';

    // Create the actions div (used for buttons like accept/reject)
    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'friends-options';
    actionsDiv.classList.add('actions');

    // Create "Accept" button
    const acceptButton = document.createElement('button');
    acceptButton.textContent = 'Accept';
    acceptButton.classList.add('message-friend-button');
    acceptButton.onclick = () => handleFriendRequestResponse(request_id, true);

    // Create "Reject" button
    const rejectButton = document.createElement('button');
    rejectButton.textContent = 'Reject';
    rejectButton.classList.add('message-friend-button');
    rejectButton.onclick = () => handleFriendRequestResponse(request_id, false);

    // Append buttons to actions div
    actionsDiv.appendChild(acceptButton);
    actionsDiv.appendChild(rejectButton);

    // Append the name and actions to the friend request div
    friendRequestDiv.appendChild(nameSpan);
    friendRequestDiv.appendChild(actionsDiv);

    // Append the friend request div to the request list container
    requestListDiv.appendChild(friendRequestDiv);
}

function handleFriendRequestResponse(request_id, isAccepted) {
    const socket = getWebsocket();
	notificationReset();

    socket.send(JSON.stringify({
        "type": "friend_request_answer",
        'answer': isAccepted ? true : false,
        'request_id': request_id
    }));


    console.log(`Friend request ${isAccepted ? 'accepted' : 'rejected'} for request_id: ${request_id}`);
}

export function friendRequestRemoveDiv(request_id){
	const friendRequestDiv = document.getElementById('friend_request_' + request_id);
    if (friendRequestDiv) {
        friendRequestDiv.remove();
    }
}