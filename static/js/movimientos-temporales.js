// Objeto global para almacenar los movimientos temporales
window.movimientosTemporales = {};

// Función para editar un movimiento temporal
function editarMovimientoTemporal(fecha) {
    const movimiento = window.movimientosTemporales[fecha];
    if (!movimiento) return;

    const modal = document.getElementById('modalEdicion');
    const editForm = document.getElementById('formEdicion');
    
    if (editForm) {
        // Convertir la fecha DD/MM/YYYY a YYYY-MM-DD para el input date
        const [dia, mes, anio] = fecha.split('/');
        
        // Establecer los valores en el formulario
        editForm.querySelector('#editTipoSelect').value = movimiento.tipo;
        editForm.querySelector('#editTipoMovimiento').value = movimiento.tipoMovimiento;
        editForm.querySelector('#editEmpresa').value = movimiento.empresa;
        editForm.querySelector('#editMonto').value = movimiento.monto;
        editForm.querySelector('#editDescripcion').value = movimiento.descripcion;
        editForm.querySelector('#editFecha').value = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        
        // Cargar los tipos de movimiento y empresas
        cargarTiposMovimiento(movimiento.tipo);
        cargarEmpresas();
    }
    
    // Mostrar el modal
    modal.style.display = 'block';
    
    // Guardar la fecha que se está editando
    window.fechaEnEdicion = fecha;
}

// Función para actualizar la visualización de un movimiento temporal
function actualizarVisualizacionTemporal(fechaAntigua, movimientoNuevo) {
    const elementos = document.querySelectorAll('.fecha-adicional.temporal');
    
    elementos.forEach(elemento => {
        const fechaSpan = elemento.querySelector('.fecha');
        if (fechaSpan && fechaSpan.textContent === fechaAntigua) {
            // Actualizar la información visual
            fechaSpan.textContent = movimientoNuevo.fecha;
            elemento.querySelector('.detalles').textContent = 
                `${movimientoNuevo.empresa} - ${movimientoNuevo.tipoMovimiento} - $${movimientoNuevo.monto}`;
            
            // Actualizar el botón de editar
            const btnEditar = elemento.querySelector('.btn-editar');
            if (btnEditar) {
                btnEditar.setAttribute('onclick', `editarMovimientoTemporal('${movimientoNuevo.fecha}')`);
            }
            
            // Marcar como editado
            elemento.classList.add('editado');
            
            // Actualizar el objeto de movimientos temporales
            delete window.movimientosTemporales[fechaAntigua];
            window.movimientosTemporales[movimientoNuevo.fecha] = movimientoNuevo;
            window.movimientosTemporales[movimientoNuevo.fecha].editado = true;
        }
    });
}

// Función para eliminar un movimiento temporal
function eliminarMovimientoTemporal(boton, fecha) {
    const elemento = boton.closest('.fecha-adicional');
    if (elemento) {
        elemento.remove();
        delete window.movimientosTemporales[fecha];
        actualizarBotonGuardarTodos();
    }
}

// Función para actualizar el botón de guardar todos
function actualizarBotonGuardarTodos() {
    const btnGuardarTodos = document.getElementById('btn-guardar-todos');
    const hayMovimientos = Object.keys(window.movimientosTemporales).length > 0;
    
    if (btnGuardarTodos) {
        btnGuardarTodos.classList.toggle('visible', hayMovimientos);
    }
}

// Función para guardar todos los movimientos
function guardarTodosLosMovimientos() {
    const movimientos = Object.values(window.movimientosTemporales);
    
    if (movimientos.length === 0) {
        alert('No hay movimientos para guardar');
        return;
    }

    // Aquí agregarías los movimientos a la tabla y a la base de datos
    movimientos.forEach(movimiento => {
        agregarMovimientoATabla(movimiento);
    });

    // Limpiar los movimientos temporales
    window.movimientosTemporales = {};
    
    // Limpiar la visualización
    const elementosTemporales = document.querySelectorAll('.fecha-adicional.temporal');
    elementosTemporales.forEach(elemento => elemento.remove());
    
    // Ocultar el botón de guardar todos
    actualizarBotonGuardarTodos();
}
