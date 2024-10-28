
function switchDisplayForm(event) {
	event.preventDefault();
	const profileForm = document.querySelector('.profile-form');
	const userForm = document.querySelector('.user-form')
	profileForm.classList.toggle('fade-out');
	profileForm.classList.toggle('fade-in');
	userForm.classList.toggle('fade-out');
	userForm.classList.toggle('fade-in');
}

function switchEditProfileForm(event){
	event.preventDefault();
	const profileForm = document.querySelector('.profile-form');
	const editForm = document.querySelector('.edit-profile-form-text');
	profileForm.classList.toggle('fade-out');
	profileForm.classList.toggle('fade-in');
	editForm.classList.toggle('fade-out');
	editForm.classList.toggle('fade-in');
}

function switchEditUserForm(event){
	event.preventDefault();
	const userForm = document.querySelector('.user-form');
	const editUserForm = document.querySelector('.edit-user-form-text');
	userForm.classList.toggle('fade-out');
	userForm.classList.toggle('fade-in');
	editUserForm.classList.toggle('fade-out');
	editUserForm.classList.toggle('fade-in');
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


// Reference the Edit Account modal and related elements
const editModal = document.getElementById('EditAccountModal');
const closeEditModal = document.getElementById('closeEditModal');
const saveChangesBtn = document.getElementById('saveChangesBtn'); 

// Open modal when the Save Changes button is clicked
saveChangesBtn.addEventListener('click', function() {
    editModal.style.display = 'flex'; // Show the Edit Account modal
});

// Close the modal when the user clicks the close button or outside the modal
closeEditModal.addEventListener('click', function() {
    editModal.style.display = 'none'; // Hide the Edit Account modal
});

window.addEventListener('click', function(event) {
    if (event.target === editModal) {
        editModal.style.display = 'none'; // Hide modal if clicked outside of the modal content
    }
});
