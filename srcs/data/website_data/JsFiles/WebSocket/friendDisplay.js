import { getFriendsAvatar } from "./friendRequests.js";

export function displayFriendList(name, profile_id, avatar, status)
{
	console.log('ur displaying the friends list');

	const friend_list = document.getElementById('friends-list');

    const friend = document.createElement('div');
    friend.id = 'friend_' + profile_id;
    friend.classList.add('friend');

    const avatarImg = document.createElement('img');
    avatarImg.alt = name + "'s Avatar";
    avatarImg.classList.add('avatar');

    friend.appendChild(avatarImg);
    getFriendsAvatar(avatar)
        .then(imageURL => {
            avatarImg.src = imageURL; // Set the avatar image once fetched
        })
        .catch(error => {
            console.error('Error fetching avatar:', error);
            avatarImg.src = './default-avatar.png'; // Set a default avatar in case of error
        });
    const nameSpan = document.createElement('span');
    nameSpan.textContent = name;
    nameSpan.classList.add('friend-name');

    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'friends-options';
    actionsDiv.classList.add('actions');


    friend_list.appendChild(friend);	
}