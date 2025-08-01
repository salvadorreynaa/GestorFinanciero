// Función para agregar una fecha adicional
function agregarFechaAdicional(fechaPrincipal) {
    const [dia, mes, anio] = fechaPrincipal.split('/');
    const mesAnio = `${anio}-${mes.padStart(2, '0')}`;
    
    // Crear modal para seleccionar fecha
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Agregar fecha adicional</h3>
            <p>Selecciona una fecha para ${mes}/${anio}:</p>
            <input type="date" id="fecha-adicional-input" 
                   min="${anio}-${mes}-01" 
                   max="${anio}-${mes}-31" 
                   value="${anio}-${mes}-${dia}">
            <div class="modal-buttons">
                <button onclick="confirmarFechaAdicional('${fechaPrincipal}')">Agregar</button>
                <button onclick="this.closest('.modal').remove()">Cancelar</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Función para confirmar y agregar la fecha adicional
function confirmarFechaAdicional(fechaPrincipal) {
    const input = document.getElementById('fecha-adicional-input');
    const fechaSeleccionada = input.value;
    const [anio, mes, dia] = fechaSeleccionada.split('-');
    const nuevaFecha = `${dia}/${mes}/${anio}`;
    
    // Agregar la fecha al array de fechas adicionales
    if (!window.fechasAdicionales[fechaPrincipal]) {
        window.fechasAdicionales[fechaPrincipal] = [];
    }
    window.fechasAdicionales[fechaPrincipal].push(nuevaFecha);
    
    // Actualizar la visualización
    const contenedorAdicionales = document.getElementById(`adicionales-${fechaPrincipal.replace(/\//g, '-')}`);
    const nuevaFechaDiv = document.createElement('div');
    nuevaFechaDiv.className = 'fecha-adicional';
    nuevaFechaDiv.innerHTML = `
        <span>${nuevaFecha}</span>
        <button class="btn-editar" onclick="editarFecha('${nuevaFecha}')">✎</button>
    `;
    contenedorAdicionales.appendChild(nuevaFechaDiv);
    
    // Cerrar el modal
    document.querySelector('.modal').remove();
}

// Función para editar una fecha (implementaremos esto en la siguiente fase)
function editarFecha(fecha) {
    // Por ahora solo mostramos un mensaje
    console.log('Editar fecha:', fecha);
    // Implementaremos el modal de edición en la siguiente fase
}
