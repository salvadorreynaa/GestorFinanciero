// Función para pedir permiso y mostrar una notificación de prueba
async function pedirPermisoNotificaciones() {
    // Primero verificamos si el navegador soporta notificaciones
    if (!("Notification" in window)) {
        alert("Este navegador no soporta notificaciones");
        return;
    }

    // Pedir permiso
    const permiso = await Notification.requestPermission();
    
    if (permiso === "granted") {
        // Mostrar una notificación de prueba
        new Notification("¡Hola!", {
            body: "Las notificaciones están funcionando",
            icon: "/static/img/logo.png"
        });
    }
}

// Función para mostrar una notificación personalizada
function mostrarNotificacion(titulo, mensaje) {
    if (Notification.permission === "granted") {
        new Notification(titulo, {
            body: mensaje,
            icon: "/static/img/logo.png"
        });
    }
}
