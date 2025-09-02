// Función para agregar el botón de recordatorio a cada movimiento
function agregarBotonRecordatorio(movimiento, elementoMovimiento) {
    const botonRecordatorio = document.createElement('button');
    botonRecordatorio.className = 'btn btn-info btn-sm ms-2';
    botonRecordatorio.innerHTML = '<i class="fas fa-bell"></i>';
    botonRecordatorio.title = 'Configurar recordatorio';
    
    // Verificar si ya existe un recordatorio
    fetch(`/api/recordatorios/${movimiento.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.estado && data.estado !== 'no_existe') {
                botonRecordatorio.classList.add('active');
                botonRecordatorio.title = `Recordatorio programado para: ${data.fecha_recordatorio}`;
            }
        })
        .catch(console.error);
    
    botonRecordatorio.onclick = () => {
        const fecha = prompt('¿Cuándo quieres recibir el recordatorio? (YYYY-MM-DD)');
        if (fecha) {
            const descripcion = `Recordatorio para ${movimiento.tipo === 'ingreso' ? 'cobrar' : 'pagar'} $${movimiento.monto} a ${movimiento.empresa}`;
            crearOActualizarRecordatorio(movimiento.id, fecha, descripcion);
        }
    };
    
    // Agregar el botón junto a los otros controles del movimiento
    const controles = elementoMovimiento.querySelector('.controles-movimiento');
    if (controles) {
        controles.appendChild(botonRecordatorio);
    }
}

// Función para crear o actualizar un recordatorio
async function crearOActualizarRecordatorio(movimientoId, fecha, descripcion) {
    try {
        const response = await fetch('/api/recordatorios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                movimiento_id: movimientoId,
                fecha: fecha,
                descripcion: descripcion
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al crear el recordatorio');
        }
        
        const data = await response.json();
        
        // Actualizar la interfaz
        const boton = document.querySelector(`[data-movimiento-id="${movimientoId}"] .btn-info`);
        if (boton) {
            boton.classList.add('active');
            boton.title = `Recordatorio programado para: ${fecha}`;
        }
        
        alert('Recordatorio configurado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al configurar el recordatorio');
    }
}

// Función para eliminar un recordatorio
async function eliminarRecordatorio(movimientoId) {
    try {
        const response = await fetch(`/api/recordatorios/${movimientoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Error al eliminar el recordatorio');
        }
        
        // Actualizar la interfaz
        const boton = document.querySelector(`[data-movimiento-id="${movimientoId}"] .btn-info`);
        if (boton) {
            boton.classList.remove('active');
            boton.title = 'Configurar recordatorio';
        }
        
        alert('Recordatorio eliminado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el recordatorio');
    }
}
