// Variables globales para el modal de edición
let fechaEnEdicion = null;
let movimientoEnEdicion = null;

// Función para cargar tipos de movimiento
async function cargarTiposMovimiento(tipo, valorSeleccionado = null) {
    try {
        // Asegurarse de que hay un tipo válido
        if (!tipo) {
            console.error('Tipo no especificado');
            return;
        }

        const response = await fetch(`/api/tipos_movimiento/${tipo}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Error al cargar tipos de movimiento: ${response.status}`);
        }
        
        const tipos = await response.json();
        const tipoMovimientoInput = document.getElementById('editTipoMovimiento');
        
        if (tipoMovimientoInput) {
            // Destruir la instancia anterior de Awesomplete si existe
            if (tipoMovimientoInput.awesomplete) {
                tipoMovimientoInput.awesomplete.destroy();
            }

            // Si hay un valor seleccionado, establecerlo
            if (valorSeleccionado) {
                tipoMovimientoInput.value = valorSeleccionado;
            }

            // Crear una nueva instancia de Awesomplete
            const awesomplete = new Awesomplete(tipoMovimientoInput, {
                list: tipos,
                minChars: 0,
                autoFirst: true
            });

            // Configurar el input para manejo de selección
            tipoMovimientoInput.addEventListener('click', function() {
                this.select(); // Seleccionar todo el texto al hacer click
                if (awesomplete.ul.childNodes.length === 0) {
                    awesomplete.evaluate();
                }
                awesomplete.open();
            });

            // Guardar la instancia para uso futuro
            tipoMovimientoInput.awesomplete = awesomplete;
        }
    } catch (error) {
        console.error('Error al cargar tipos de movimiento:', error);
    }
}

// Función para cargar empresas
async function cargarEmpresas() {
    try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/empresas`);
        if (!response.ok) throw new Error('Error al cargar empresas');
        
        const empresas = await response.json();
        const select = document.getElementById('editEmpresa');
        
        if (select) {
            // Mantener la opción por defecto
            select.innerHTML = '<option value="" disabled>Seleccionar...</option>';
            
            // Agregar las empresas
            empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.nombre;
                option.textContent = empresa.nombre;
                select.appendChild(option);
            });

            // Seleccionar la empresa actual si existe
            const empresaActual = document.querySelector('select[name="empresa"]')?.value;
            if (empresaActual) {
                select.value = empresaActual;
            }
        }
    } catch (error) {
        console.error('Error al cargar empresas:', error);
    }
}

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
    
    try {
        // Obtener los valores del formulario principal
        const formPrincipal = document.getElementById('formulario');
        if (!formPrincipal) {
            console.error('No se encontró el formulario principal');
            return;
        }

        // Obtener los valores actuales
        const tipo = formPrincipal.querySelector('select[name="tipo"]')?.value || '';
        const tipoMovimiento = formPrincipal.querySelector('input[name="tipo_movimiento"]')?.value || '';
        const descripcion = formPrincipal.querySelector('input[name="descripcion"]')?.value || '';
        const monto = formPrincipal.querySelector('input[name="monto"]')?.value || '';
        
        // Establecer valores en el formulario de edición
        const editForm = document.getElementById('formEdicion');
        if (editForm) {
            const tipoSelect = editForm.querySelector('#editTipoSelect');
            tipoSelect.value = tipo;
            editForm.querySelector('#editTipoMovimiento').value = tipoMovimiento;
            editForm.querySelector('#editDescripcion').value = descripcion;
            editForm.querySelector('#editMonto').value = monto;

            // Convertir la fecha de DD/MM/YYYY a YYYY-MM-DD
            const [dia, mes, anio] = fecha.split('/');
            editForm.querySelector('#editFecha').value = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

            // Cargar tipos de movimiento para el tipo seleccionado
            cargarTiposMovimiento(tipo, tipoMovimiento);
        }

        // Cargar empresas
        cargarEmpresas();

        // Mostrar el modal
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error al cargar datos para edición:', error);
        alert('Hubo un error al cargar los datos para edición. Por favor, intenta de nuevo.');
    }
}

function cerrarModalEdicion() {
    const modal = document.getElementById('modalEdicion');
    modal.style.display = 'none';
    fechaEnEdicion = null;
    movimientoEnEdicion = null;
}

function guardarEdicion() {
    if (!fechaEnEdicion) return;
    
    try {
        // Obtener los valores editados
        const editForm = document.getElementById('formEdicion');
        if (!editForm) {
            throw new Error('No se encontró el formulario de edición');
        }

        const tipo = editForm.querySelector('#editTipoSelect')?.value;
        const tipoMovimiento = editForm.querySelector('#editTipoMovimiento')?.value;
        const empresa = editForm.querySelector('#editEmpresa')?.value;
        const monto = editForm.querySelector('#editMonto')?.value;
        const descripcion = editForm.querySelector('#editDescripcion')?.value;
        const fecha = editForm.querySelector('#editFecha')?.value;
        
        // Validar campos requeridos
        if (!tipo || !tipoMovimiento || !empresa || !monto || !descripcion || !fecha) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }
        
        // Convertir la fecha de YYYY-MM-DD a DD/MM/YYYY
        const [anio, mes, dia] = fecha.split('-');
        const fechaFormateada = `${parseInt(dia)}/${parseInt(mes)}/${anio}`;
        
        // Actualizar los valores en el formulario principal
        const formPrincipal = document.getElementById('formulario');
        if (formPrincipal) {
            formPrincipal.querySelector('select[name="tipo"]').value = tipo;
            formPrincipal.querySelector('input[name="tipo_movimiento"]').value = tipoMovimiento;
            formPrincipal.querySelector('select[name="empresa"]').value = empresa;
            formPrincipal.querySelector('input[name="descripcion"]').value = descripcion;
            formPrincipal.querySelector('input[name="monto"]').value = monto;
            
            // Actualizar los campos ocultos de mes y año si existen
            const mesInput = formPrincipal.querySelector('input[name="mes"]');
            const anioInput = formPrincipal.querySelector('input[name="año"]');
            if (mesInput && anioInput) {
                mesInput.value = parseInt(mes);
                anioInput.value = anio;
            }
        }

        // Encontrar y actualizar el elemento visual
        const elementos = document.querySelectorAll('.fecha-adicional span');
        elementos.forEach(span => {
            if (span.textContent === fechaEnEdicion) {
                const elementoFecha = span.closest('.fecha-adicional');
                if (elementoFecha) {
                    span.textContent = fechaFormateada;
                    // Si hay un elemento para mostrar detalles, actualizarlo
                    const detalles = elementoFecha.querySelector('.detalles');
                    if (detalles) {
                        detalles.textContent = `${empresa} - ${tipoMovimiento} - $${monto}`;
                    }
                    // Marcar como editado
                    elementoFecha.classList.add('editado');
                }
            }
        });

        // Cerrar el modal
        cerrarModalEdicion();
        
    } catch (error) {
        console.error('Error al guardar la edición:', error);
        alert('Hubo un error al guardar los cambios. Por favor, intenta de nuevo.');
    }
}

function actualizarVisualizacionMovimiento(fechaAntigua, movimientoNuevo) {
    try {
        if (!fechaAntigua || !movimientoNuevo) {
            console.error('Datos faltantes para actualizar la visualización');
            return;
        }

        // Encontrar todos los elementos con la fecha antigua
        const elementos = document.querySelectorAll('.fecha-adicional');
        let actualizado = false;

        elementos.forEach(elemento => {
            const fechaSpan = elemento.querySelector('span');
            if (fechaSpan && fechaSpan.textContent === fechaAntigua) {
                actualizado = true;
                // Actualizar la fecha
                fechaSpan.textContent = movimientoNuevo.fecha;
                
                // Actualizar el botón de edición
                const botonEditar = elemento.querySelector('.btn-editar');
                if (botonEditar) {
                    botonEditar.setAttribute('onclick', `editarFecha(event, '${movimientoNuevo.fecha}')`);
                }
            }
        });

        // Actualizar en la tabla
        const tablaMovimientos = document.querySelector('table');
        if (tablaMovimientos) {
            const filas = tablaMovimientos.querySelectorAll('tr');
            filas.forEach(fila => {
                const celdaFecha = fila.querySelector('td:nth-child(1)');
                if (celdaFecha && celdaFecha.textContent.trim() === fechaAntigua) {
                    actualizado = true;
                    try {
                        const celdas = fila.querySelectorAll('td');
                        if (celdas.length >= 6) {
                            celdas[0].textContent = movimientoNuevo.fecha;
                            celdas[1].textContent = movimientoNuevo.empresa;
                            celdas[2].textContent = movimientoNuevo.descripcion;
                            celdas[3].textContent = movimientoNuevo.tipo;
                            celdas[4].textContent = movimientoNuevo.tipoMovimiento;
                            celdas[5].textContent = movimientoNuevo.monto;
                        }
                    } catch (err) {
                        console.error('Error al actualizar celdas de la tabla:', err);
                    }
                }
            });
        }

        if (!actualizado) {
            console.warn('No se encontró el movimiento a actualizar');
        }
        
        // Actualizar el contador y la explicación si es necesario
        if (typeof actualizarContadorMovimientos === 'function') {
            actualizarContadorMovimientos();
        }
        
    } catch (error) {
        console.error('Error al actualizar la visualización:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Configurar el botón de cierre del modal
    const closeBtn = document.querySelector('#modalEdicion .close');
    if (closeBtn) {
        closeBtn.onclick = cerrarModalEdicion;
    }

    // Configurar evento de cambio de tipo para cargar tipos de movimiento
    const tipoSelect = document.getElementById('editTipoSelect');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            cargarTiposMovimiento(this.value);
        });
    }

    // Cerrar modal al hacer clic fuera
    window.onclick = function(event) {
        const modal = document.getElementById('modalEdicion');
        if (event.target === modal) {
            cerrarModalEdicion();
        }
    };
});
