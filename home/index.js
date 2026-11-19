
/* =========================
   MOBILE NAVIGATION
========================= */

const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

// Open and close the mobile menu
menuToggle.addEventListener("click", function () {
    navigation.classList.toggle("active");
});

// Close the menu when a navigation link is clicked
const navLinks = navigation.querySelectorAll("a");

navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
        navigation.classList.remove("active");
    });
});


/* =========================
   HEADER SCROLL EFFECT
========================= */

const header = document.querySelector(".header");

window.addEventListener("scroll", function () {

    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }

});


/* =========================
   REVEAL SECTIONS ON SCROLL
========================= */

const revealElements = document.querySelectorAll(
    ".about-content, .about-image, .service-card, .project-card, .why-grid > div"
);

const observer = new IntersectionObserver(function (entries) {

    entries.forEach(function (entry) {

        if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
        }

    });

}, {
    threshold: 0.15
});

revealElements.forEach(function (element) {
    element.classList.add("reveal");
    observer.observe(element);
});


/* =========================
   CURRENT YEAR
========================= */

const footerText = document.querySelector(".footer-bottom");

if (footerText) {
    footerText.innerHTML =
        `© ${new Date().getFullYear()} ALEX'S BUILDING & CONSTRUCTION. All rights reserved.`;
}
