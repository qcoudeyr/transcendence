import { grpRequestNotification } from "./notifications-displays.js"
import { getFriendsAvatar } from "./friendRequests.js";


export function displayGroupList(name, profile_id, avatar) {
    const groupListContainer = document.getElementById("grp-list");

    const friend = document.createElement('div');
    friend.id = 'friend_' + profile_id;
    friend.classList.add('friend');

	const nameSpan = document.createElement('span');
	nameSpan.textContent = name;
	nameSpan.classList.add('friend-name');

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
	friend.appendChild(nameSpan);
	groupListContainer.appendChild(friend);
}

function grpRequestDisplay(name, profileId)
{

}

export function groupRequestRevieve(profileId, name)
{
	grpRequestNotification(name);
	grpRequestDisplay();

	//create a button with accept and refuse and send to server true or false
}

//TODO create a function to leave the group and send 'group leave';
//TODO