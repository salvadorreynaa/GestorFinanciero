// Función para manejar respuestas de la API
async function fetchWithAuth(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (response.status === 401) {
            // Si no está autorizado, redirigir al login
            window.location.href = '/login';
            return;
        }
        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}
