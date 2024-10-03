function switchFormProfile(event) {
	event.preventDefault();
	const profileForm = document.querySelector('.profile-form');
	const editForm = document.querySelector('.edit-form');
	profileForm.classList.toggle('fade-out');
	profileForm.classList.toggle('fade-in');
	editForm.classList.toggle('fade-out');
	editForm.classList.toggle('fade-in');
}

function switchFormProfileEdit(event) {
	event.preventDefault();
	const profileForm = document.querySelector('.edit-profile-form-text');
	const userForm = document.querySelector('.edit-user-form-text');
	profileForm.classList.toggle('fade-out');
	profileForm.classList.toggle('fade-in');
	userForm.classList.toggle('fade-out');
	userForm.classList.toggle('fade-in');
	console.log('username =' + localStorage.getItem('username'));
}

//POP UP DELETE CONFIRMATION

const modal = document.getElementById('deleteAccountModal');
const closeModal = document.getElementById('closeModal');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const confirmDeleteBtn = document.getElementById('confirmDelete');

// Open modal when delete button is clicked
deleteAccountBtn.addEventListener('click', function() {
	modal.style.display = 'flex'; // Show modal when button is clicked
});

// Close the modal when the user clicks the close button or outside the modal
closeModal.addEventListener('click', function() {
	modal.style.display = 'none'; // Hide modal
});

window.addEventListener('click', function(event) {
	if (event.target == modal) {
		modal.style.display = 'none'; // Hide modal if clicked outside
	}
});

