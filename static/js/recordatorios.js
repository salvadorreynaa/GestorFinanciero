// Función para cargar recordatorios
async function cargarRecordatorios() {
    try {
        const response = await fetch('/api/recordatorios');
        const recordatorios = await response.json();
        
        // Iterar sobre cada movimiento en la tabla
        const movimientos = document.querySelectorAll('#lista-movimientos tr[data-movimiento-id]');
        movimientos.forEach(movimientoRow => {
            const movimientoId = movimientoRow.dataset.movimientoId;
            const recordatorio = recordatorios.find(r => r.movimiento_id === parseInt(movimientoId));
            
            // Encontrar o crear el botón de recordatorio
            let botonRecordatorio = movimientoRow.querySelector('.btn-recordatorio');
            if (!botonRecordatorio) {
                botonRecordatorio = document.createElement('button');
                botonRecordatorio.className = 'btn btn-info btn-sm ms-2 btn-recordatorio';
                botonRecordatorio.innerHTML = '<i class="fas fa-bell"></i>';
                const accionesTd = movimientoRow.querySelector('.acciones');
                if (accionesTd) {
                    accionesTd.appendChild(botonRecordatorio);
                }
            }

            // Actualizar el estado del botón según el recordatorio
            if (recordatorio) {
                botonRecordatorio.classList.add('active');
                botonRecordatorio.title = `Recordatorio programado para: ${new Date(recordatorio.fecha_recordatorio).toLocaleDateString()}`;
            } else {
                botonRecordatorio.classList.remove('active');
                botonRecordatorio.title = 'Configurar recordatorio';
            }

            // Agregar el manejador de eventos
            botonRecordatorio.onclick = () => {
                const fecha = prompt('¿Cuándo quieres recibir el recordatorio? (YYYY-MM-DD)');
                if (fecha) {
                    const descripcion = `Recordatorio para ${movimientoRow.dataset.tipo === 'ingreso' ? 'cobrar' : 'pagar'} $${movimientoRow.dataset.monto} a ${movimientoRow.dataset.empresa}`;
                    crearOActualizarRecordatorio(movimientoId, fecha, descripcion);
                }
            };
        });
    } catch (error) {
        console.error('Error al cargar recordatorios:', error);
    }
}

// Función para manejar las notificaciones
function configurarNotificacion(movimientoId) {
    if (!("Notification" in window)) {
        alert("Este navegador no soporta notificaciones de escritorio");
        return;
    }

    if (Notification.permission !== "granted") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                pedirFechaRecordatorio(movimientoId);
            }
        });
    } else {
        pedirFechaRecordatorio(movimientoId);
    }
}

function pedirFechaRecordatorio(movimientoId) {
    const fecha = prompt('¿Cuándo quieres recibir el recordatorio? (YYYY-MM-DD)');
    if (fecha) {
        const descripcion = `Recordatorio de movimiento #${movimientoId}`;
        fetch(`/api/recordatorios/${movimientoId}/notificar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                fecha: fecha,
                descripcion: descripcion 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Recordatorio configurado correctamente para " + fecha);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert("Error al configurar el recordatorio");
        });
    }
}

