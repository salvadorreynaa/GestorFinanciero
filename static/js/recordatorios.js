// Función para agregar el botón de recordatorio a cada movimiento
function agregarBotonRecordatorio(movimiento, elementoMovimiento) {
    const botonRecordatorio = document.createElement('button');
    botonRecordatorio.className = 'btn btn-info btn-sm ms-2';
    botonRecordatorio.innerHTML = '<i class="fas fa-bell"></i>';
    botonRecordatorio.title = 'Configurar recordatorio';
    
    botonRecordatorio.onclick = () => {
        const fecha = prompt('¿Cuándo quieres recibir el recordatorio? (YYYY-MM-DD)');
        if (fecha) {
            const descripcion = `Recordatorio para ${movimiento.tipo === 'ingreso' ? 'cobrar' : 'pagar'} $${movimiento.monto} a ${movimiento.empresa}`;
            setupNotificationReminder(movimiento.id, fecha, descripcion);
        }
    };
    
    // Agregar el botón junto a los otros controles del movimiento
    const controles = elementoMovimiento.querySelector('.controles-movimiento');
    if (controles) {
        controles.appendChild(botonRecordatorio);
    }
}
