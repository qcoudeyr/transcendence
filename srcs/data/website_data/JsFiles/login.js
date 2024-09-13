import LogtoClient from '@logto/browser';

const logtoClient = new LogtoClient({
  endpoint: 'https://qywu8v.logto.app/',
  appId: 's699oq36lcet7unczsad9',
});

const isAuthenticated = await logtoClient.isAuthenticated();

const onClickSignIn = () => {
  logtoClient.signIn('http://localhost:3000/');
};
const onClickSignOut = () => {
  logtoClient.signOut('http://localhost:3000/');
};

const button = document.createElement('button');
button.innerHTML = isAuthenticated ? 'Sign Out' : 'Sign In';
button.addEventListener('click', isAuthenticated ? onClickSignOut : onClickSignIn);

document.body.appendChild(button);

function switchForm(event) {
	event.preventDefault();
	const loginForm = document.querySelector('.login-form');
	const registerForm = document.querySelector('.register-form');
	loginForm.classList.toggle('fade-out');
	loginForm.classList.toggle('fade-in');
	registerForm.classList.toggle('fade-out');
	registerForm.classList.toggle('fade-in');
}
