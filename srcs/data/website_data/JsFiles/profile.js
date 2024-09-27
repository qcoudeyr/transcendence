function switchFormProfile(event) {
	event.preventDefault();
	const profileForm = document.querySelector('.profile-form');
	const editForm = document.querySelector('.edit-form');
	profileForm.classList.toggle('fade-out');
	profileForm.classList.toggle('fade-in');
	editForm.classList.toggle('fade-out');
	editForm.classList.toggle('fade-in');
}