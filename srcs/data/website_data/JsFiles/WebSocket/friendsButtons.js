document.querySelectorAll('.friend').forEach((friendElement) => {
    let buttonsVisible = false; // Track button visibility for each friend

    friendElement.onmouseenter = function(e) {
        const actionButtons = friendElement.querySelector('.actions');
        if (!buttonsVisible) {
            const invite = document.createElement('button');
            invite.classList.add('invite-friend-button');
            invite.textContent = 'Invite';

            const message = document.createElement('button');
            message.classList.add('message-friend-button');
            message.textContent = 'Message';

            const remove = document.createElement('button');
            remove.classList.add('remove-friend-button');
            remove.textContent = 'Remove';

            actionButtons.appendChild(invite);
            actionButtons.appendChild(message);
            actionButtons.appendChild(remove);

            buttonsVisible = true;

            // Hide buttons when mouse leaves the friend area
            friendElement.addEventListener('mouseleave', hideButtons);
        } else {
            hideButtons(); // Remove buttons if already visible
        }

        function hideButtons() {
            // Clear buttons
            while (actionButtons.firstChild) {
                actionButtons.removeChild(actionButtons.firstChild);
            }
            buttonsVisible = false;
            friendElement.removeEventListener('mouseleave', hideButtons);
        }
    };
});