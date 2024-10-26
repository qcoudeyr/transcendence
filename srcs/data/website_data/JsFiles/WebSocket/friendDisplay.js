import { getFriendsAvatar } from "./friendRequests.js";
import { getWebsocket } from "./websocket-open.js";
import { messageFriend } from "./chatSend.js";

export function displayFriendList(name, profile_id, avatar, status) {
    const friend_list = document.getElementById('friends-list');

    // Check if a friend with the same profile_id already exists
    if (document.getElementById('friend_' + profile_id)) {
        console.log(`Friend with profile_id ${profile_id} is already added.`);
        return; // Return early if friend already exists
    }

    // Create the friend container div
    const friend = document.createElement('div');
    friend.id = 'friend_' + profile_id;
    friend.classList.add('friend');

	const nameSpan = document.createElement('span');
	nameSpan.textContent = name;
	nameSpan.classList.add('friend-name');

	const actionsDiv = document.createElement('div');
	actionsDiv.id = 'friends-options';
	actionsDiv.classList.add('actions');

    const friendStatusInfo = document.createElement('a');
    friendStatusInfo.classList.add('friend-status');
    friendStatusInfo.textContent = status;
    if (friendStatusInfo.textContent === "Offline") {
        friendStatusInfo.style.color = "#ff00ff";
		friendStatusInfo.style.top = "6px";
		nameSpan.style.color = "#ff00ff"
		nameSpan.style.textShadow = '0 0 10px #ff00ff';
    } else if (friendStatusInfo.textContent === "Online" || friendStatusInfo.textContent === "In Game") {
        friendStatusInfo.style.color = "#0ef3f3";
		nameSpan.style.color = "#0ef3f3"
		nameSpan.style.textShadow = '0 0 10px rgba(14, 243, 243, 0.8)';
		
		const messageButton = document.createElement('button');
		messageButton.textContent = 'Message';
		messageButton.classList.add('message-friend-button');
		messageButton.addEventListener('click', () => messageFriend(profile_id));
		const inviteGroupeButton = document.createElement('button');
		inviteGroupeButton.textContent = 'Invite';
		inviteGroupeButton.classList.add('message-friend-button');
		inviteGroupeButton.addEventListener('click', () => inviteToGroup(profile_id));
		actionsDiv.appendChild(inviteGroupeButton);
		actionsDiv.appendChild(messageButton);
    	
    }

    // Create actions div with buttons
	


    

    

    const removeFriendButton = document.createElement('button');
    removeFriendButton.textContent = 'Remove';
    removeFriendButton.classList.add('message-friend-button');
    removeFriendButton.addEventListener('click', () => removeFriend(profile_id));

    // Append buttons to actions div
    
    actionsDiv.appendChild(removeFriendButton);

    // Create the avatar image element
    const avatarImg = document.createElement('img');
    avatarImg.alt = name + "'s Avatar";
    avatarImg.classList.add('avatar');

    // Append avatar and load its URL
    friend.appendChild(avatarImg);
    getFriendsAvatar(avatar)
        .then(imageURL => {
            avatarImg.src = imageURL; // Set the avatar image once fetched
        })
        .catch(error => {
            console.error('Error fetching avatar:', error);
            avatarImg.src = './default-avatar.png'; // Set a default avatar in case of error
        });

    // Append elements to the friend container
    friend.appendChild(nameSpan);
    friend.appendChild(friendStatusInfo);
    friend.appendChild(actionsDiv);

    // Append or prepend the friend container based on the status
    if (status === "Online") {
        // Prepend online friends to the top
        friend_list.prepend(friend);
    } else {
        // Append offline friends to the end
        friend_list.appendChild(friend);
    }
}

// Function to invite a friend to a group
function inviteToGroup(profile_id) {
	let socket = getWebsocket();
	socket.send(JSON.stringify(
	{
		'type': 'group_request',
		'profile_id': profile_id
	}));
    // Add your invite logic here (e.g., open group invite dialog, send invite, etc.)
}

// Function to remove a friend
export function removeFriend(profile_id) {
	let socket = getWebsocket();
	socket.send(JSON.stringify(
	{
		'type': 'friend_remove',
		'profile_id': profile_id
	}));
}

export function removeReceivedFriend(profile_id)
{
	console.log(`Removing friend with profile_id: ${profile_id}`);
    const friendElement = document.getElementById('friend_' + profile_id);
    if (friendElement) {
        friendElement.remove(); // Remove friend element from the DOM
    }
}