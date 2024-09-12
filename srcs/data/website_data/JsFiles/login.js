function switchForm(event) {
	event.preventDefault();
	const loginForm = document.querySelector('.login-form');
	const registerForm = document.querySelector('.register-form');
	loginForm.classList.toggle('fade-out');
	loginForm.classList.toggle('fade-in');
	registerForm.classList.toggle('fade-out');
	registerForm.classList.toggle('fade-in');
}