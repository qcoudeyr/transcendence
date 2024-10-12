export function displayChatMessage(messageContent)
{
	const chatContainer = document.getElementById('messages');
	const messagesContainer = document.getElementById('messagesDivContainer')
	const  messageDiv = document.createElement('div');
	messageDiv.classList.add('message');
	messageDiv.textContent = messageContent;
	chatContainer.appendChild(messageDiv);
	messagesContainer.scrollTo({top: messagesContainer.scrollHeight, behavior: "smooth"});

}