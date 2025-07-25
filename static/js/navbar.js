document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('nav');

    // Función para alternar el menú
    function toggleMenu() {
        hamburgerMenu.classList.toggle('active');
        nav.classList.toggle('active');
    }

    // Event listeners
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleMenu);
    }

    // Cerrar el menú al hacer clic fuera de él
    document.addEventListener('click', function(event) {
        if (!nav.contains(event.target) && !hamburgerMenu.contains(event.target) && nav.classList.contains('active')) {
            toggleMenu();
        }
    });

    // Cerrar menú al redimensionar a vista desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) { // Mismo breakpoint que en CSS
            if (nav.classList.contains('active')) {
                toggleMenu();
            }
        }
    });

    // Cerrar menú al cambiar orientación del dispositivo
    window.addEventListener('orientationchange', toggleMenu);

    // Event listener para enlaces del menú
    const links = document.querySelectorAll('nav a');
    links.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });
});
