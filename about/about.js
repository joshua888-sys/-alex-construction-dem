
// ==============================
// ABOUT PAGE JAVASCRIPT
// ==============================

// MOBILE NAVIGATION

const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.navigation');

if (menuToggle && navigation) {

    menuToggle.addEventListener('click', function () {

        const isOpen = navigation.classList.toggle('show');

        menuToggle.setAttribute('aria-expanded', isOpen);

        menuToggle.textContent = isOpen ? '×' : '☰';

    });

    // Close menu after selecting a page

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

        header.classList.toggle(
            'scrolled',
            window.scrollY > 50
        );

    }

});


// AUTOMATIC FOOTER YEAR

const yearElement = document.querySelector('#current-year');

if (yearElement) {

    yearElement.textContent = new Date().getFullYear();

}
