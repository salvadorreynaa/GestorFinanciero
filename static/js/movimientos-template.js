// Función para generar el HTML de cada movimiento
function generarHTMLMovimiento(mov) {
    const fechaFormateada = formatearFecha(new Date(mov.fecha));
    const montoFormateado = formatearMonto(mov.monto);
    const esIngreso = mov.tipo === 'ingreso';
    const montoCss = esIngreso ? 'monto-ingreso' : 'monto-egreso';
    
    return `
        <td>${fechaFormateada}</td>
        <td>${mov.empresa}</td>
        <td>${mov.tipo}</td>
        <td>${mov.tipoMovimiento}</td>
        <td>${mov.descripcion}</td>
        <td>${mov.mes}</td>
        <td>${mov.año}</td>
        <td class="${montoCss}">${montoFormateado}</td>
        <td>
            <select onchange="actualizarEstado(${mov.id}, this.value)" class="estado-${mov.estado.toLowerCase()}">
                <option value="Pendiente" ${mov.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="${esIngreso ? 'Cobrado' : 'Pagado'}" 
                    ${mov.estado === (esIngreso ? 'Cobrado' : 'Pagado') ? 'selected' : ''}>
                    ${esIngreso ? 'Cobrado' : 'Pagado'}
                </option>
            </select>
        </td>
        <td class="acciones">
            <button onclick="editarMovimiento(${mov.id})" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="eliminarMovimiento(${mov.id})" title="Eliminar">
                <i class="fas fa-trash-alt"></i>
            </button>
            <button class="btn-campana" onclick="toggleRecordatorio(${mov.id}, this)" 
                    title="Activar/Desactivar recordatorio">
                <i class="fas fa-bell-slash"></i>
            </button>
        </td>
    `;
}
