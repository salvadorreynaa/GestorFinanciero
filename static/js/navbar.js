document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const nav = document.querySelector('nav');
    const overlay = document.querySelector('.overlay');

    // Función para alternar el menú
    function toggleMenu() {
        hamburgerMenu.classList.toggle('active');
        nav.classList.toggle('active');
        overlay.classList.toggle('active');
        document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
    }

    // Event listeners
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleMenu);
    }
    
    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Cerrar menú al redimensionar a vista desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 769) { // Mismo breakpoint que en CSS
            if (nav.classList.contains('active')) {
                toggleMenu();
            }
        }
    });

    // Cerrar menú al cambiar orientación del dispositivo
    window.addEventListener('orientationchange', closeMenuFunc);

    // Cerrar menú al redimensionar a vista desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 992) {
            closeMenuFunc();
        }
    });

    // Event listener para enlaces del menú móvil
    const mobileLinks = document.querySelectorAll('.mobile-menu-items a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMenuFunc);
    });
});
