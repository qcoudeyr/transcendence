import { getWebsocket } from "./websocket-open.js";

let currentProfileId = null; // Keep track of the current profile you're chatting with

// Set up general chat by default
document.getElementById('chat-input').focus();
document.getElementById('chat-input').onkeyup = function(e) {
    if (e.key === 'Enter') {
        chatSend(currentProfileId);  // Use the stored profile_id (null for general chat)
    }
};

// Function to send a message (general or private)
export function chatSend(profile_id) {
    let socket = getWebsocket();
    const messageInputDom = document.getElementById('chat-input');
    const message = messageInputDom.value;

    // Send as general chat if no profile_id, otherwise send as private message
    if (!profile_id) {
        socket.send(JSON.stringify({
            'type': 'chat_message',
            'message': message
        }));
    } else {
        socket.send(JSON.stringify({
            'type': 'chat_private_message',
            'message': message,
            'profile_id': profile_id
        }));
    }
    messageInputDom.value = ''; // Clear input field after sending
	switchToGeneralChat();
}

export function messageFriend(profile_id) {

    // Set currentProfileId to the friend's profile_id
    currentProfileId = profile_id;

    // Focus on the chat input field for typing
    const chatInput = document.getElementById('chat-input');
    chatInput.focus();
	chatInput.placeholder = `Sending private message to "${profile_id}": `;

    // Set up 'Enter' key event to send private message
    chatInput.onkeyup = function(e) {
        if (e.key === 'Enter') {
            chatSend(currentProfileId);  // Pass the profile_id to send a private message
            chatInput.value = ''; // Clear input after sending
        }
    }
}

// Function to switch back to general chat
function switchToGeneralChat() {
    currentProfileId = null; // Reset profile_id for general chat

    // Focus on the chat input for typing general messages
    const chatInput = document.getElementById('chat-input');
	chatInput.placeholder = 'Type here..';
    chatInput.focus();

    // Set up 'Enter' key event for general chat
    chatInput.onkeyup = function(e) {
        if (e.key === 'Enter') {
            chatSend();  // Send general chat message (profile_id is null)
            chatInput.value = ''; // Clear input after sending
        }
    }
}
	

export function displayPrivateMessage(messageContent, profile_id) {
    const chatContainer = document.getElementById('messages');
    const messagesContainer = document.getElementById('messagesDivContainer');

    // Create a new message div
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('private-message');
    messageDiv.textContent = messageContent;
	const profileId = document.createElement('a');
	profileId.classList.add('private-message-id');
	profileId.textContent = 'ID: ' + profile_id;

	messageDiv.appendChild(profileId);

    // Append the message div to the chat container
    chatContainer.appendChild(messageDiv);

    // Automatically scroll the messages container to the bottom when a new message is added
    messagesContainer.scrollTo({ top: messagesContainer.scrollHeight, behavior: "smooth" });

    // Add a click event to the message div for replying
    messageDiv.addEventListener('click', () => {
        // Pre-fill the chat input with the message to reply to
        const chatInput = document.getElementById('chat-input');

        // Optionally, set focus to the input for quick typing
        messageFriend(profile_id);
        
        // You can also store the message or profile ID to identify which message is being replied to
        currentProfileId = profile_id;  // You can use this for private replies, as previously set up
    });
}
	