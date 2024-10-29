export function checkAccessToken() {
    fetch("/api/media/auth/", {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('accessToken') // Authentication token
        },
        body: null
    })
    .then((response) => response.ok ? response.json() : Promise.reject(response))
    .then((data) => {
		if (data.authenticated === true)
			return true
		else
			return false;
    })
    .catch((error) => {
        alert('Login no longer valid. Reloading...');
        localStorage.clear();
        location.reload(true); // Use location.reload instead of document.reload
		return false;
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
			localStorage.setItem("accessToken", data.access);
			localStorage.setItem("refreshToken", data.refresh);
		  	window.location.hash = "#home";
			const sections = document.querySelectorAll("section"); // Select all sections
			sections.forEach((section) => {
				section.style.display = section.id === "home" ? "block" : "none";
			});
			document.querySelector('nav').style.display = 'none';
			console.log('data.access=' + data.access);
			window.location.hash = 'home';
			location.reload(true);
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