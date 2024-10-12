import { getWebsocket } from "./websocket-open.js";

	document.getElementById('chat-input').focus();
	document.getElementById('chat-input').onkeyup = function(e)
	{
		if (e.key === 'Enter') {
			chatSend();
			console.log('sent chat');
		}
	}

	

function chatSend() {
		let socket = getWebsocket();
		const messageInputDom = document.getElementById('chat-input');
		const message = messageInputDom.value;
		socket.send(JSON.stringify(
		{
			'type': 'chat_message',
			'message': message
		}));
		messageInputDom.value = '';
}
	
	