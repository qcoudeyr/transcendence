export function getMailAndUsername() {
	fetch('/api/user/me/', {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
		}
		
	})
	.then(response => {
		// Check if the response is okay (status in the range 200-299)
		if (!response.ok) {
			throw new Error('Network response was not ok ' + response.statusText);
		}
		return response.json(); // Parse the JSON from the response
	})
	.then(data => {
		localStorage.setItem("username", data.username);
		document.getElementById('profileName').textContent = localStorage.getItem('username');
		console.log (data.username + ' = this');
		console.log(localStorage.getItem('username') + ' local storage info');
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	});
}


export function setupLogin() {
	const LoginForm = document.getElementById("LoginForm");
  
	LoginForm.addEventListener("submit", (event) => {
	  event.preventDefault();
	  const username = document.getElementById("LoginFormUsername").value;
	  const password = document.getElementById("LoginFormPassword").value;
  
	  fetch("/api/user/login/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, password }),
	  })
		.then((response) => response.ok ? response.json() : Promise.reject(response))
		.then((data) => {
			console.log('we are here idk why it reloads');
			localStorage.setItem("accessToken", data.access);
			localStorage.setItem("refreshToken", data.refresh);
			getMailAndUsername();
		  	location.reload(true);
			window.location.hash = "#home";
		})
		.catch((error) => {
		  displayError("Wrong Credentials, please try again.");
		});
	});
  }
  
  export function setupRegister() {
	const RegisterForm = document.getElementById("RegisterForm");
  
	RegisterForm.addEventListener("submit", (event) => {
	  event.preventDefault();
	  const username = document.getElementById("RegisterUsername").value;
	  const email = document.getElementById("RegisterEmail").value;
	  const password = document.getElementById("RegisterPassword").value;
	  const confirmPassword = document.getElementById("RegisterConfirmPassword").value;
  
	  fetch("/api/user/register/", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ username, email, password, password_confirmation: confirmPassword }),
	  })
		.then((response) => response.ok ? response.json() : Promise.reject(response))
		.then(() => location.reload(true))
		.catch((error) => displayErrorRegister("Invalid credentials."));
	});
  }
  
  function displayErrorRegister(message) {
	const errorMessageDiv = document.getElementById("error-message-register");
	errorMessageDiv.textContent = message;
	errorMessageDiv.style.display = "block";
  }
  
  function displayError(message) {
	const errorMessageDiv = document.getElementById("error-message");
	errorMessageDiv.textContent = message;
	errorMessageDiv.style.display = "block";
  }