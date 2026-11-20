
// PASSWORD VISIBILITY TOGGLE
const passwordInput = document.getElementById('admin-password');
const togglePassword = document.getElementById('toggle-password');

if (passwordInput && togglePassword) {
  togglePassword.addEventListener('click', function () {
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    togglePassword.textContent = isPassword ? 'Hide' : 'Show';

    togglePassword.setAttribute(
      'aria-label',
      isPassword ? 'Hide password' : 'Show password'
    );
  });
}

// LOGIN FORM
const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const message = document.getElementById('login-message');
    const email = document.getElementById('admin-email').value.trim();
    const password = passwordInput.value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    message.textContent = 'Signing in...';
    message.style.color = '#f07824';

    submitButton.disabled = true;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      message.textContent = 'Login successful!';
      message.style.color = '#4caf50';

      window.location.href = '/admin/dashboard.html';

    } catch (error) {
      message.textContent = error.message;
      message.style.color = '#ff7777';
    } finally {
      submitButton.disabled = false;
    }
  });
}

// FORGOT PASSWORD
const forgotPassword = document.getElementById('forgot-password');

if (forgotPassword) {
  forgotPassword.addEventListener('click', function (event) {
    event.preventDefault();

    alert('Please contact the system administrator to reset your password.');
  });
}

