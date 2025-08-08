document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgotEmail').value;
    const errorLabel = document.getElementById('forgot-error-message');
  
    try {
      const response = await fetch('/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
  
      const data = await response.json();
  
      if (data.success) {
        alert('Password reset link has been sent. Please check your email.');
        window.location.href = 'registration2.html';
      } else {
        errorLabel.textContent = data.message || 'An error occurred.';
      }
    } catch (error) {
      console.error(error);
      errorLabel.textContent = 'Failed to send reset link. Please try again.';
    }
});