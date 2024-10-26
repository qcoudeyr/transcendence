import { grpRequestNotification, notificationReset } from "./notifications-displays.js"
import { getFriendsAvatar } from "./friendRequests.js";
import { getWebsocket } from "./websocket-open.js";


export function displayGroupList(name, profile_id, avatar) {
    const groupListContainer = document.getElementById("grp-list");

    const friend = document.createElement('div');
    friend.id = 'friend_' + profile_id;
    friend.classList.add('friend');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    nameSpan.classList.add('friend-name');

    const avatarImg = document.createElement('img');
    avatarImg.alt = `${name}'s Avatar`;
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

    friend.appendChild(nameSpan);
    groupListContainer.appendChild(friend);

    // Check if a leave button needs to be displayed
    showLeaveButtonIfMultipleFriends();
}

// Function to check and display the leave button if more than one friend is present
function showLeaveButtonIfMultipleFriends() {
    const groupListContainer = document.getElementById("grp-list");
    const friends = groupListContainer.getElementsByClassName("friend");
    let leaveButton = document.getElementById("leave-btn");

    // Create the leave button if more than one friend is present
    if (friends.length > 1) {
        if (!leaveButton) {
            leaveButton = document.createElement("button");
            leaveButton.id = "leave-btn";
            leaveButton.textContent = "Leave Group";
            leaveButton.onclick = () => {
                const lastFriend = friends[friends.length - 1];
                if (lastFriend) {
                    lastFriend.remove();
                    showLeaveButtonIfMultipleFriends(); // Recheck if button should remain
                }
            };
            groupListContainer.parentNode.insertBefore(leaveButton, groupListContainer);
        }
    } else if (leaveButton) {
        // Remove the button if only one friend remains
        leaveButton.remove();
    }
}




function grpRequestDisplay(name, request_id, avatar)
{
	const requestListDiv = document.getElementById('friends-list');

    // Create the main friend request div
    const friendRequestDiv = document.createElement('div');
    friendRequestDiv.id = 'grp_request_' + request_id; // Make the id unique using request_id
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
    acceptButton.onclick = () => handleGrpRequestResponse(true);

    // Create "Reject" button
    const rejectButton = document.createElement('button');
    rejectButton.textContent = 'Reject';
    rejectButton.classList.add('message-friend-button');
    rejectButton.onclick = () => handleGrpRequestResponse(false);

    // Append buttons to actions div
    actionsDiv.appendChild(acceptButton);
    actionsDiv.appendChild(rejectButton);

    // Append the name and actions to the friend request div
    friendRequestDiv.appendChild(nameSpan);
    friendRequestDiv.appendChild(actionsDiv);

    // Append the friend request div to the request list container
    requestListDiv.appendChild(friendRequestDiv);
}


function handleGrpRequestResponse(isAccepted)
{
		const socket = getWebsocket();
		notificationReset();
	
		socket.send(JSON.stringify({
			"type": "group_request_answer",
			'answer': isAccepted ? true : false,
		}));
		if (isAccepted === true)
			{
				socket.send(JSON.stringify({
					"type": "group_request_remove",
					'answer': isAccepted ? true : false,
				}));
			}
	
		console.log(`Group request ${isAccepted ? 'accepted' : 'rejected'}`);
}

export function groupRequestRevieve(profileId, name, avatar)
{
	grpRequestNotification(name);
	grpRequestDisplay(name, profileId, avatar);

	//create a button with accept and refuse and send to server true or false
}

export function removeGroupRequest(request_id) {
    const requestElement = document.getElementById('grp_request_' + request_id);
    if (requestElement) {
        requestElement.remove();
    } else {
        console.error("No grp request found.");
    }
}

//TODO create a function to leave the group and send 'group leave';
//TODO