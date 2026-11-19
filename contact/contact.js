
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

// CONTACT FORM BACKEND CONNECTION
const contactForm = document.getElementById('contact-form');
const contactFormMessage = document.getElementById('contact-form-message');

if (contactForm && contactFormMessage) {
  contactForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const submitButton = contactForm.querySelector(
      'button[type="submit"]'
    );

    const messageData = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      subject: document.getElementById('contact-subject').value.trim(),
      message: document.getElementById('contact-message').value.trim()
    };

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Sending...';
      }

      contactFormMessage.textContent = 'Sending your message...';
      contactFormMessage.style.color = '#c45b16';

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to send your message.');
      }

      contactFormMessage.textContent =
        'Your message has been received successfully!';

      contactFormMessage.style.color = 'green';

      contactForm.reset();

    } catch (error) {
      contactFormMessage.textContent =
        error.message || 'Something went wrong. Please try again.';

      contactFormMessage.style.color = '#c0392b';

    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
      }
    }
  });
}
