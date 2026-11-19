
// ==============================
// SERVICES PAGE JAVASCRIPT
// ==============================

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

// MOBILE NAVIGATION
if (menuToggle && navigation) {

    menuToggle.addEventListener('click', function () {

        const isOpen = navigation.classList.toggle('show');

        menuToggle.setAttribute('aria-expanded', isOpen);

        menuToggle.textContent = isOpen ? '×' : '☰';

    });

    // Close menu when a navigation link is clicked
    const navLinks = navigation.querySelectorAll('a');

    navLinks.forEach(function (link) {

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
        header.classList.toggle('scrolled', window.scrollY > 50);
    }

});


// FOOTER YEAR
const yearElement = document.querySelector('#current-year');

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
