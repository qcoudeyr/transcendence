import { displayChatMessage } from "./chatDisplay.js";

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
		console.log('Uuid :' + data.uuid);
		localStorage.setItem("websocketUrl", 'ws://localhost/ws/events/?uuid=' + data.uuid);
		console.log(localStorage.getItem('websocketUrl'));

		openWebsocket();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}

function openWebsocket(){
	console.log('[Websocket] Connecting...');
	socket = new WebSocket(localStorage.getItem('websocketUrl'));
	localStorage.setItem('WebSocket_', socket);
	socket.onopen = function(e) {
		console.log("[WebSocket] Connection established !");
	};

	socket.onmessage = function(event) {
		// alert(`[message] Data received from server: ${event.data}`);
		console.log(JSON.parse(event.data));
		const content = JSON.parse(event.data);
		if ('type' in content)
		{
			if (content.type === 'chat_message')
			{
					displayChatMessage(content.message);
			}
		}
	}
}