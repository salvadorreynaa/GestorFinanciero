document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    // Función para abrir el menú
    function openMenu() {
        mobileMenu.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll
    }

    // Función para cerrar el menú
    function closeMenuFunc() {
        mobileMenu.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    // Event listeners
    menuToggle.addEventListener('click', openMenu);
    closeMenu.addEventListener('click', closeMenuFunc);
    menuOverlay.addEventListener('click', closeMenuFunc);

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
