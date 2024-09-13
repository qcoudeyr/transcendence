const callbackHandler = async (logtoClient) => {
  await logtoClient.handleSignInCallback(window.location.href);

  if (!logtoClient.isAuthenticated) {
    // Handle failed sign-in
    alert('Failed to sign in');
    return;
  }

  // Handle successful sign-in
  window.location.assign('/');
};
