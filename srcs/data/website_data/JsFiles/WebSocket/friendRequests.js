import { getWebsocket } from "./websocket-open.js";

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
		socket.send(JSON.stringify(
		{
			'type': 'friend_request',
			'profile_id': message
		}));
		messageInputDom.value = '';
		console.log('Friend request sent.');
}
	