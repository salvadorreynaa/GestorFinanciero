let movimientoEnEdicion = null;
let fechaEnEdicion = null;

// Función para cargar tipos de movimiento
async function cargarTiposMovimiento(tipo, valorSeleccionado = null) {
    try {
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
            if (tipoMovimientoInput.awesomplete) {
                tipoMovimientoInput.awesomplete.destroy();
            }

            if (valorSeleccionado) {
                tipoMovimientoInput.value = valorSeleccionado;
            }

            const awesomplete = new Awesomplete(tipoMovimientoInput, {
                list: tipos,
                minChars: 0,
                autoFirst: true
            });

            tipoMovimientoInput.addEventListener('click', function() {
                this.select();
                if (awesomplete.ul.childNodes.length === 0) {
                    awesomplete.evaluate();
                }
                awesomplete.open();
            });

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
            select.innerHTML = '<option value="" disabled>Seleccionar...</option>';

            empresas.forEach(empresa => {
                const option = document.createElement('option');
                option.value = empresa.nombre;
                option.textContent = empresa.nombre;
                select.appendChild(option);
            });

            const empresaActual = document.querySelector('select[name="empresa"]')?.value;
            if (empresaActual) {
                select.value = empresaActual;
            }
        }
    } catch (error) {
        console.error('Error al cargar empresas:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
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

    const closeBtn = document.querySelector('#modalEdicion .close');
    if (closeBtn) {
        closeBtn.onclick = cerrarModalEdicion;
    }

    const tipoSelect = document.getElementById('editTipoSelect');
    if (tipoSelect) {
        tipoSelect.addEventListener('change', function() {
            cargarTiposMovimiento(this.value);
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('modalEdicion');
        if (event.target === modal) {
            cerrarModalEdicion();
        }
    };
});

function editarFecha(event, fecha) {
    event.preventDefault();
    event.stopPropagation();

    fechaEnEdicion = fecha;
    const modal = document.getElementById('modalEdicion');

    try {
        const formPrincipal = document.getElementById('formulario');
        if (!formPrincipal) {
            console.error('No se encontró el formulario principal');
            return;
        }

        const tipo = formPrincipal.querySelector('select[name="tipo"]')?.value || '';
        const tipoMovimiento = formPrincipal.querySelector('input[name="tipo_movimiento"]')?.value || '';
        const descripcion = formPrincipal.querySelector('input[name="descripcion"]')?.value || '';
        const monto = formPrincipal.querySelector('input[name="monto"]')?.value || '';

        const editForm = document.getElementById('formEdicion');
        if (editForm) {
            const tipoSelect = editForm.querySelector('#editTipoSelect');
            tipoSelect.value = tipo;
            editForm.querySelector('#editTipoMovimiento').value = tipoMovimiento;
            editForm.querySelector('#editDescripcion').value = descripcion;
            editForm.querySelector('#editMonto').value = monto;

            const [dia, mes, anio] = fecha.split('/');
            editForm.querySelector('#editFecha').value = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

            cargarTiposMovimiento(tipo, tipoMovimiento);
        }

        cargarEmpresas();
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
        const editForm = document.getElementById('formEdicion');
        if (!editForm) throw new Error('No se encontró el formulario de edición');

        const tipo = editForm.querySelector('#editTipoSelect')?.value;
        const tipoMovimiento = editForm.querySelector('#editTipoMovimiento')?.value;
        const empresa = editForm.querySelector('#editEmpresa')?.value;
        const monto = editForm.querySelector('#editMonto')?.value;
        const descripcion = editForm.querySelector('#editDescripcion')?.value;
        const fecha = editForm.querySelector('#editFecha')?.value;

        if (!tipo || !tipoMovimiento || !empresa || !monto || !descripcion || !fecha) {
            alert('Por favor, complete todos los campos requeridos.');
            return;
        }

        const [anio, mes, dia] = fecha.split('-');
        const fechaFormateada = `${parseInt(dia)}/${parseInt(mes)}/${anio}`;

        const tablaTemp = document.querySelector('.tabla-temporal') || crearTablaMovimientosTemp();
        const tbody = tablaTemp.querySelector('tbody');

        if (movimientoEnEdicion) {
            const celdas = movimientoEnEdicion.querySelectorAll('td');
            celdas[0].textContent = fechaFormateada;
            celdas[1].textContent = empresa;
            celdas[2].textContent = descripcion;
            celdas[3].textContent = tipo;
            celdas[4].textContent = tipoMovimiento;
            celdas[5].textContent = monto;
            movimientoEnEdicion = null;
        } else {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${fechaFormateada}</td>
                <td>${empresa}</td>
                <td>${descripcion}</td>
                <td>${tipo}</td>
                <td>${tipoMovimiento}</td>
                <td>${monto}</td>
                <td>
                    <button onclick="editarMovimientoTemp(this)" class="btn-editar">Editar</button>
                    <button onclick="eliminarMovimientoTemp(this)" class="btn-eliminar">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        }

        const formPrincipal = document.getElementById('formulario');
        const mesInput = formPrincipal.querySelector('input[name="mes"]');
        const anioInput = formPrincipal.querySelector('input[name="año"]');
        if (mesInput && anioInput) {
            mesInput.value = parseInt(mes);
            anioInput.value = anio;
        }

        const elementos = document.querySelectorAll('.fecha-adicional span');
        elementos.forEach(span => {
            if (span.textContent === fechaEnEdicion) {
                const elementoFecha = span.closest('.fecha-adicional');
                if (elementoFecha) {
                    span.textContent = fechaFormateada;
                    const detalles = elementoFecha.querySelector('.detalles');
                    if (detalles) {
                        detalles.textContent = `${empresa} - ${tipoMovimiento} - $${monto}`;
                    }
                    elementoFecha.classList.add('editado');
                }
            }
        });

        cerrarModalEdicion();
    } catch (error) {
        console.error('Error al guardar la edición:', error);
    }
}

function actualizarVisualizacionMovimiento(fechaAntigua, movimientoNuevo) {
    if (!fechaAntigua || !movimientoNuevo) {
        console.error('Datos faltantes para actualizar la visualización');
        return;
    }

    try {
        const elementos = document.querySelectorAll('.fecha-adicional');
        let actualizado = false;

        elementos.forEach(elemento => {
            const fechaSpan = elemento.querySelector('span');
            if (fechaSpan && fechaSpan.textContent === fechaAntigua) {
                actualizado = true;
                fechaSpan.textContent = movimientoNuevo.fecha;
                const botonEditar = elemento.querySelector('.btn-editar');
                if (botonEditar) {
                    botonEditar.setAttribute('onclick', `editarFecha(event, '${movimientoNuevo.fecha}')`);
                }
            }
        });

        const tablaMovimientos = document.querySelector('table');
        if (tablaMovimientos) {
            const filas = tablaMovimientos.querySelectorAll('tr');
            filas.forEach(fila => {
                const celdaFecha = fila.querySelector('td:nth-child(1)');
                if (celdaFecha && celdaFecha.textContent.trim() === fechaAntigua) {
                    actualizado = true;
                    const celdas = fila.querySelectorAll('td');
                    if (celdas.length >= 6) {
                        celdas[0].textContent = movimientoNuevo.fecha;
                        celdas[1].textContent = movimientoNuevo.empresa;
                        celdas[2].textContent = movimientoNuevo.descripcion;
                        celdas[3].textContent = movimientoNuevo.tipo;
                        celdas[4].textContent = movimientoNuevo.tipoMovimiento;
                        celdas[5].textContent = movimientoNuevo.monto;
                    }
                }
            });
        }

        if (!actualizado) {
            console.warn('No se encontró el movimiento a actualizar');
        }

        if (typeof actualizarContadorMovimientos === 'function') {
            actualizarContadorMovimientos();
        }

    } catch (error) {
        console.error('Error al actualizar la visualización:', error);
    }
}

function crearTablaMovimientosTemp() {
    const tabla = document.createElement('table');
    tabla.className = 'tabla-temporal';
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Empresa</th>
                <th>Descripción</th>
                <th>Tipo</th>
                <th>Tipo Movimiento</th>
                <th>Monto</th>
                <th>Acciones</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const formPrincipal = document.getElementById('formulario');
    if (formPrincipal) {
        formPrincipal.parentNode.insertBefore(tabla, formPrincipal);
    } else {
        document.body.appendChild(tabla);
    }
    return tabla;
}

function editarMovimientoTemp(btn) {
    const fila = btn.closest('tr');
    const celdas = fila.querySelectorAll('td');
    const fecha = celdas[0].textContent;
    const empresa = celdas[1].textContent;
    const descripcion = celdas[2].textContent;
    const tipo = celdas[3].textContent;
    const tipoMovimiento = celdas[4].textContent;
    const monto = celdas[5].textContent;

    const modal = document.getElementById('modalEdicion');
    const editForm = document.getElementById('formEdicion');

    if (editForm) {
        const [dia, mes, anio] = fecha.split('/');
        const fechaISO = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

        editForm.querySelector('#editTipoSelect').value = tipo;
        editForm.querySelector('#editTipoMovimiento').value = tipoMovimiento;
        editForm.querySelector('#editEmpresa').value = empresa;
        editForm.querySelector('#editDescripcion').value = descripcion;
        editForm.querySelector('#editMonto').value = monto.replace('$', '');
        editForm.querySelector('#editFecha').value = fechaISO;

        cargarTiposMovimiento(tipo, tipoMovimiento);
        cargarEmpresas();
    }

    if (modal) {
        modal.style.display = 'block';
    }

    movimientoEnEdicion = fila;
}

function eliminarMovimientoTemp(btn) {
    if (confirm('¿Estás seguro de que quieres eliminar este movimiento?')) {
        const fila = btn.closest('tr');
        fila.remove();

        const tabla = document.querySelector('.tabla-temporal');
        if (tabla && !tabla.querySelector('tbody tr')) {
            tabla.remove();
        }
    }
}
