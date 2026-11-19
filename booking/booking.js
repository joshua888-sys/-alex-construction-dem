
// MOBILE NAVIGATION
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

if (menuToggle && navigation) {
  menuToggle.addEventListener('click', function () {
    const isOpen = navigation.classList.toggle('show');

    menuToggle.setAttribute('aria-expanded', isOpen);
    menuToggle.textContent = isOpen ? '×' : '☰';
  });

  navigation.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navigation.classList.remove('show');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰';
    });
  });
}

// HEADER SCROLL EFFECT
const header = document.querySelector('.header');

window.addEventListener('scroll', function () {
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }
});

// AUTOMATIC FOOTER YEAR
const yearElement = document.getElementById('current-year');

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

// CONNECT BOOKING FORM TO BACKEND
const bookingForm = document.getElementById('booking-form');
const formMessage = document.getElementById('form-message');

if (bookingForm && formMessage) {
  bookingForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const submitButton = bookingForm.querySelector(
      'button[type="submit"]'
    );

    const bookingData = {
      name: document.getElementById('full-name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      project: document.getElementById('project-type').value.trim(),
      location: document.getElementById('project-location').value.trim(),
      details: document.getElementById('project-details').value.trim()
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    formMessage.textContent = 'Submitting your enquiry...';

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Could not submit enquiry.');
      }

      formMessage.textContent =
        'Your project enquiry has been received successfully!';

      formMessage.style.color = '#2e8b57';

      bookingForm.reset();

    } catch (error) {
      formMessage.textContent = error.message;
      formMessage.style.color = '#c45b16';

    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Send Project Enquiry';
    }
  });
}
