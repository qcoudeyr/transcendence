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
