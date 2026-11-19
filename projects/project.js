
// ==============================
// PROJECTS PAGE JAVASCRIPT
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


// PROJECT FILTER SYSTEM

const filterButtons = document.querySelectorAll('.filter-btn');

const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(function (button) {

    button.addEventListener('click', function () {

        // Remove active class from all buttons

        filterButtons.forEach(function (btn) {
            btn.classList.remove('active');
        });

        // Activate selected button

        button.classList.add('active');

        // Get selected category

        const selectedFilter = button.dataset.filter;

        // Filter project cards

        projectCards.forEach(function (card) {

            const projectCategory = card.dataset.category;

            if (
                selectedFilter === 'all' ||
                selectedFilter === projectCategory
            ) {

                card.style.display = 'block';

            } else {

                card.style.display = 'none';

            }

        });

    });

});


// AUTOMATIC FOOTER YEAR

const yearElement = document.querySelector('#current-year');

if (yearElement) {

    yearElement.textContent = new Date().getFullYear();

}
