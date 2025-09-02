async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('Este navegador no soporta notificaciones push');
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: await fetchPublicKey()
            });
            
            // Enviar la suscripción al servidor
            await fetch('/api/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(subscription)
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al solicitar permisos de notificación:', error);
        return false;
    }
}

async function fetchPublicKey() {
    const response = await fetch('/api/push-public-key');
    const data = await response.json();
    return data.publicKey;
}

async function setupNotificationReminder(movimientoId, fecha, descripcion) {
    if (await requestNotificationPermission()) {
        try {
            const response = await fetch('/api/recordatorio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movimientoId,
                    fecha,
                    descripcion
                })
            });
            
            if (response.ok) {
                alert('Recordatorio configurado correctamente');
            } else {
                throw new Error('Error al configurar el recordatorio');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al configurar el recordatorio');
        }
    }
}
