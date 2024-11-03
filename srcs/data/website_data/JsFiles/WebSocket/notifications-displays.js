export function friendRequestNotification(requestName) {
    // Get the notification elements
    const bellImg = document.getElementById("notification-bell-img");
    const notificationText = document.getElementById("notification-messages");

    // Replace the bell image with another image (for example, a pink-colored bell)
    bellImg.src = "./images/colored-bell.svg"; // Replace with the correct image path

    // Change the notification text and style
    notificationText.textContent = `${requestName} sent you a friend request.`; // Example text
    notificationText.style.color = "#0ef3f3";
	notificationText.style.textShadow = "0 0 10px rgba(14, 243, 243, 0.8)"
    
    // Add a background effect with box shadow when notified
    const notificationContainer = document.getElementById("notification-bell-container");
    notificationContainer.style.boxShadow = "0 0 10px rgba(14, 243, 243, 0.8)";
}

export function grpRequestNotification(requestName) {
    // Get the notification elements
    const bellImg = document.getElementById("notification-bell-img");
    const notificationText = document.getElementById("notification-messages");

    // Replace the bell image with another image (for example, a pink-colored bell)
    bellImg.src = "./images/colored-bell.svg"; // Replace with the correct image path

    // Change the notification text and style
    notificationText.textContent = `${requestName} invited you to a group.`; // Example text
    notificationText.style.color = "#0ef3f3";
	notificationText.style.textShadow = "0 0 10px rgba(14, 243, 243, 0.8)"
    
    // Add a background effect with box shadow when notified
    const notificationContainer = document.getElementById("notification-bell-container");
    notificationContainer.style.boxShadow = "0 0 10px rgba(14, 243, 243, 0.8)";
}


export function notificationReset()
{
	const bellImg = document.getElementById("notification-bell-img");
    const notificationText = document.getElementById("notification-messages");

    // Replace the bell image with another image (for example, a pink-colored bell)
    bellImg.src = "./images/bell.svg"; // Replace with the correct image path

    // Change the notification text and style
    notificationText.textContent = `You don't have any notifications.`; // Example text
    notificationText.style.color = "#ff00ff";
	notificationText.style.textShadow = "0 0 10px rgba(205, 14, 243, 0.8)"
    
    // Add a background effect with box shadow when notified
    const notificationContainer = document.getElementById("notification-bell-container");
    notificationContainer.style.boxShadow = "0 0 0px";
}


export function queueNotification() {
    // Get the notification elements
    const bellImg = document.getElementById("notification-bell-img");
    const notificationText = document.getElementById("notification-messages");

    // Replace the bell image with another image (for example, a pink-colored bell)
    bellImg.src = "./images/colored-bell.svg"; // Replace with the correct image path

    // Change the notification text and style
    notificationText.textContent = `You are queuing for the classic mode`; // Example text
    notificationText.style.color = "#0ef3f3";
	notificationText.style.textShadow = "0 0 10px rgba(14, 243, 243, 0.8)"
    
    // Add a background effect with box shadow when notified
    const notificationContainer = document.getElementById("notification-bell-container");
    notificationContainer.style.boxShadow = "0 0 10px rgba(14, 243, 243, 0.8)";
}

export function queueNotificationTournament() {
    // Get the notification elements
    const bellImg = document.getElementById("notification-bell-img");
    const notificationText = document.getElementById("notification-messages");

    // Replace the bell image with another image (for example, a pink-colored bell)
    bellImg.src = "./images/colored-bell.svg"; // Replace with the correct image path

    // Change the notification text and style
    notificationText.textContent = `You are queuing for the tournament mode`; // Example text
    notificationText.style.color = "#0ef3f3";
	notificationText.style.textShadow = "0 0 10px rgba(14, 243, 243, 0.8)"
    
    // Add a background effect with box shadow when notified
    const notificationContainer = document.getElementById("notification-bell-container");
    notificationContainer.style.boxShadow = "0 0 10px rgba(14, 243, 243, 0.8)";
}