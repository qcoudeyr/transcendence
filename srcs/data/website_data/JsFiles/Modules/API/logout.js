function logout() {
	// Remove tokens to log the user out
	localStorage.clear();
	// Navigate to the home section and refresh the page
	window.location.hash = "#home";
	location.reload(true);  // Reload the page to update the UI
  }