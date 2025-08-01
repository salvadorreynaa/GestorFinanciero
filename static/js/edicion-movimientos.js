// Variables globales para el modal de edición
let fechaEnEdicion = null;
let movimientoEnEdicion = null;

// Asegurarse de que el documento está cargado
document.addEventListener('DOMContentLoaded', () => {
    // Agregar el modal al body si no existe
    if (!document.getElementById('modalEdicion')) {
        const modalHTML = `
            <div id="modalEdicion" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Editar Movimiento</h2>
                        <span class="close">&times;</span>
                    </div>
                    <form id="formEdicion">
                        <div class="form-row">
                            <label>
                                Tipo:
                                <select id="editTipoSelect" name="tipo" required>
                                    <option value="ingreso">Ingreso</option>
                                    <option value="egreso">Egreso</option>
                                </select>
                            </label>
                            <label>
                                Tipo de movimiento:
                                <input type="text" id="editTipoMovimiento" class="awesomplete" name="tipo_movimiento" required>
                            </label>
                        </div>
                        <div class="form-row">
                            <label>
                                Descripción:
                                <input type="text" id="editDescripcion" name="descripcion" required>
                            </label>
                        </div>
                        <div class="form-row">
                            <label>
                                Fecha:
                                <input type="date" id="editFecha" name="fecha" required>
                            </label>
                            <label>
                                Monto:
                                <input type="number" id="editMonto" name="monto" step="0.01" required>
                            </label>
                        </div>
                        <div class="form-row">
                            <label>
                                Empresa:
                                <select id="editEmpresa" name="empresa" required>
                                    <option value="" disabled selected>Seleccionar...</option>
                                </select>
                            </label>
                        </div>
                        <div class="form-row buttons-row">
                            <button type="button" onclick="guardarEdicion()" class="btn-guardar">Guardar Cambios</button>
                            <button type="button" onclick="cerrarModalEdicion()" class="btn-cancelar">Cancelar</button>
                        </div>
                    </form>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
});

function editarFecha(event, fecha) {
    event.preventDefault();
    event.stopPropagation();
    
    fechaEnEdicion = fecha;
    const modal = document.getElementById('modalEdicion');
    
    // Obtener los valores actuales del formulario principal
    const tipo = document.querySelector('select[name="tipo"]').value;
    const tipoMovimiento = document.querySelector('input[name="tipo_movimiento"]').value;
    const descripcion = document.querySelector('input[name="descripcion"]').value;
    const monto = document.querySelector('input[name="monto"]').value;
    const empresa = document.querySelector('select[name="empresa"]').value;
    
    // Establecer los valores en el formulario de edición
    document.getElementById('editTipoSelect').value = tipo;
    document.getElementById('editTipoMovimiento').value = tipoMovimiento;
    document.getElementById('editDescripcion').value = descripcion;
    document.getElementById('editFecha').value = fecha;
    document.getElementById('editMonto').value = monto;
    document.getElementById('editEmpresa').value = empresa;
    
    // Configurar Awesomplete para tipo de movimiento
    configureAwesompleteEdit();
    
    // Mostrar el modal
    modal.style.display = 'block';
}

function cerrarModalEdicion() {
    const modal = document.getElementById('modalEdicion');
    modal.style.display = 'none';
    fechaEnEdicion = null;
    movimientoEnEdicion = null;
}

function guardarEdicion() {
    if (!fechaEnEdicion) return;
    
    // Obtener los valores editados
    const tipo = document.getElementById('editTipoSelect').value;
    const tipoMovimiento = document.getElementById('editTipoMovimiento').value;
    const descripcion = document.getElementById('editDescripcion').value;
    const fecha = document.getElementById('editFecha').value;
    const monto = document.getElementById('editMonto').value;
    const empresa = document.getElementById('editEmpresa').value;
    
    // Validar campos requeridos
    if (!tipo || !tipoMovimiento || !descripcion || !fecha || !monto || !empresa) {
        alert('Por favor, complete todos los campos requeridos.');
        return;
    }
    
    // Actualizar los datos en el movimiento correspondiente
    const movimientoActualizado = {
        tipo,
        tipoMovimiento,
        descripcion,
        fecha,
        monto,
        empresa
    };
    
    // Actualizar en el arreglo de fechas adicionales si es una fecha adicional
    Object.keys(window.fechasAdicionales).forEach(fechaPrincipal => {
        const index = window.fechasAdicionales[fechaPrincipal].indexOf(fechaEnEdicion);
        if (index !== -1) {
            window.fechasAdicionales[fechaPrincipal][index] = fecha;
        }
    });
    
    // Actualizar la visualización
    actualizarVisualizacionMovimiento(fechaEnEdicion, movimientoActualizado);
    
    // Cerrar el modal
    cerrarModalEdicion();
}

function actualizarVisualizacionMovimiento(fechaAntigua, movimientoNuevo) {
    // Actualizar la fecha en el elemento visual
    const elementos = document.querySelectorAll('.fecha-adicional');
    elementos.forEach(elemento => {
        const fechaSpan = elemento.querySelector('span');
        if (fechaSpan && fechaSpan.textContent === fechaAntigua) {
            fechaSpan.textContent = movimientoNuevo.fecha;
            // Actualizar el onclick del botón de edición
            const botonEditar = elemento.querySelector('.btn-editar');
            if (botonEditar) {
                botonEditar.setAttribute('onclick', `editarFecha(event, '${movimientoNuevo.fecha}')`);
            }
        }
    });
}

function configureAwesompleteEdit() {
    const tipoMovimientoInput = document.getElementById('editTipoMovimiento');
    const tipoSelect = document.getElementById('editTipoSelect');
    
    if (tipoMovimientoInput && tipoSelect) {
        new Awesomplete(tipoMovimientoInput, {
            list: [],
            minChars: 0
        });
        
        // Actualizar la lista cuando cambie el tipo
        tipoSelect.addEventListener('change', async () => {
            const tipo = tipoSelect.value;
            try {
                const response = await fetch(`/api/tipos_movimiento/${tipo}`);
                if (!response.ok) throw new Error('Error al cargar tipos de movimiento');
                const tipos = await response.json();
                tipoMovimientoInput._awesomplete.list = tipos;
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cerrar el modal cuando se hace clic en la X
    const closeBtn = document.querySelector('#modalEdicion .close');
    if (closeBtn) {
        closeBtn.onclick = cerrarModalEdicion;
    }
    
    // Cerrar el modal cuando se hace clic fuera de él
    window.onclick = function(event) {
        const modal = document.getElementById('modalEdicion');
        if (event.target === modal) {
            cerrarModalEdicion();
        }
    };
});
