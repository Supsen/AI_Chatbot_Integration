document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorLabel = document.getElementById('reset-error-message');
  
    // Get token from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
  
    // Validate the token is present
    if (!token) {
      errorLabel.textContent = 'Invalid or missing reset token.';
      return;
    }
  
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      errorLabel.textContent = 'Passwords do not match.';
      return;
    }
  
    // Optionally: check password length
    if (newPassword.length < 6) {
      errorLabel.textContent = 'Password must be at least 6 characters.';
      return;
    }
  
    try {
      const response = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert('✅ Your password has been reset successfully. Please log in.');
        window.location.href = 'registration2.html'; // redirect to login
      } else {
        errorLabel.textContent = data.message || 'An error occurred.';
      }
    } catch (error) {
      console.error(error);
      errorLabel.textContent = 'Failed to reset password. Please try again.';
    }
});