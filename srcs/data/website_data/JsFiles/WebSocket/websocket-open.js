import { displayChatMessage } from "./chatDisplay.js";
import { friendRequestReceive, friendRequestRemoveDiv } from "./friendRequests.js"
import { displayFriendList, removeReceivedFriend } from "./friendDisplay.js";
import { displayPrivateMessage } from "./chatSend.js";
import { friendRequestNotification } from "./notifications-displays.js";
import { removeFriendFromGroup, removeGroupRequest, groupRequestRevieve, displayGroupList } from "./groupRequests.js";

let socket;



export function getWebsocket() {
    return socket;
}

export function websocketConnect()
{
	fetch('/ws/user/login/', {
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
		let socketurl = "ws://" + window.location.host + "/ws/events/?uuid=" + data.uuid;
		openWebsocket(socketurl);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function openWebsocket(socketurl){
	console.log('\x1b[33m[Websocket] Connecting..\x1b[0m');
	socket = new WebSocket(socketurl);
	socket.onopen = function(e) {
		console.log("\x1b[34m[WebSocket] Connection established !\x1b[0m");
		socket.send(JSON.stringify({
            'type': 'friend_list',
        }));
		socket.send(JSON.stringify({
            'type': 'friend_request_list',
        }));
		socket.send(JSON.stringify({
            'type': 'group_list',
        }));
	};
	socket.onmessage = function(event) {
		// alert(`[message] Data received from server: ${event.data}`);
		// console.log(JSON.parse(event.data));
		const content = JSON.parse(event.data);
		if ('type' in content)
		{
			if (content.type === 'chat_message')
			{
				displayChatMessage(content.message);
			}
			if (content.type === 'chat_private_message')
			{
				displayPrivateMessage(content.message, content.profile_id);
			}
			if (content.type === 'friend_request')
			{
				friendRequestReceive(content.request_id, content.name, content.avatar);
				friendRequestNotification(content.name);
			}
			if (content.type === 'friend')
			{
				displayFriendList(content.name, content.profile_id, content.avatar, content.status);
			}
			if (content.type === 'friend_request_remove')
			{
				friendRequestRemoveDiv(content.request_id);
			}
			if (content.type === 'friend_remove')
			{
				removeReceivedFriend(content.profile_id);
			}
			if(content.type === 'group_request')
			{
				groupRequestRevieve(content.profile_id, content.name, content.avatar);
			}
			if(content.type === 'group_member')
			{
				displayGroupList(content.name, content.profile_id, content.avatar);
			}
			if(content.type === 'group_request_remove')
			{
				removeGroupRequest(content.profile_id);
			}
			if(content.type === 'group_member_remove')
			{
				removeFriendFromGroup(content.profile_id);
			}
		}
	}
	
}