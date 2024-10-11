
function deleteAccount(){
	confirmDeleteBtn.addEventListener('click', function() {
		const password = document.getElementById('passwordInput').value;
	
		if (password) {
			// Simulate the account deletion process by sending a DELETE request
			fetch('/api/user/me/', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
				},
				body: JSON.stringify({ password: password })
			})
			.then(response => {
				if (response.ok) {
					alert('Account deleted successfully.');
					// Redirect or take further action after deletion
					window.location.href = '#goodbye'; // MAYBE A GOODBYE PAGE
					localStorage.clear();
					location.reload();
				} else {
					throw new Error('Account deletion failed');
				}
			})
			.catch(error => {
				console.error('Error:', error);
			});
	
			// Close the modal
			modal.style.display = 'none';
		} else {
			alert('Please enter your password to proceed.');
		}
	});
}


