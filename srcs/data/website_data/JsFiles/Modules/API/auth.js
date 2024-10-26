// export function checkToken()
// {
// 		fetch("/api/media/auth/", {
// 		method: "POST",
// 		headers: {
//             'Authorization': 'Bearer ' + localStorage.getItem('accessToken') // Authentication token
//         },
// 		body: null
// 	  })
// 		.then((response) => response.ok ? response.json() : Promise.reject(response))
// 		.then((data) => {
// 			console.log('Token is valid proceding.');
// 		})
// 		.catch((error) => {
// 			alert('Login no longer valid reloading..');
// 		  	localStorage.clear();
// 		  	document.reload();
// 		});
	
// }

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
		  	location.reload(true);
			window.location.hash = "#home";
			console.log('data.access=' + data.access);
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