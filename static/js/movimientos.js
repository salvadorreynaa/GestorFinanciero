// --- ADAPTADO PARA FLASK/API ---
let opcionesIngreso = [];
let opcionesEgreso = [];

async function cargarTiposMovimiento() {
  const res = await fetch('/api/tipos_movimiento');
  const tipos = await res.json();
  opcionesIngreso = tipos.map(t => t.nombre);
  opcionesEgreso = tipos.map(t => t.nombre);
}

let movimientosEliminados = [];
let awesompleteModal;

// Función para actualizar las opciones de Awesomplete en el modal
function actualizarAwesompleteModal(tipo) {
  let opciones = [];
  if (tipo === 'ingreso') opciones = opcionesIngreso;
  else if (tipo === 'egreso') opciones = opcionesEgreso;
  else opciones = [];

  if (!awesompleteModal) {
    awesompleteModal = new Awesomplete(document.getElementById("input-tipoMovimiento"), {
      list: opciones,
      minChars: 0,
      autoFirst: true,
      maxItems: 999
    });
  } else {
    awesompleteModal.list = opciones;
  }
}

async function cargarMovimientos() {
  let res = await fetch('/api/movimientos');
  movimientos = await res.json();
  movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  const tbody = document.getElementById("lista-movimientos");
  const mesSeleccionado = document.getElementById("filtroMes")?.value || "Todos";
  const añoSeleccionado = document.getElementById("filtroAño")?.value || "Todos";
  const tipoMovimientoSeleccionado = document.getElementById("filtroTipoMovimiento")?.value || "Todos";
  const busquedaDescripcion = document.getElementById("busqueda-descripcion")?.value.trim().toLowerCase() || "";
  const filtroTipoBusqueda = document.getElementById("filtroTipoBusqueda")?.value || "Todos";
  const empresaSeleccionada = document.getElementById("filtroEmpresa")?.value || "Todas";

  tbody.innerHTML = "";
  let ingresos = 0;
  let egresos = 0;

  // Agrupar movimientos por mes y año
  const grupos = {};
  movimientos.forEach((mov) => {
    // Aplicar los mismos filtros que antes
    const monto = parseFloat(mov.monto);
    if (isNaN(monto)) return;
    const coincideDescripcion = busquedaDescripcion === "" ||
      (mov.descripcion && mov.descripcion.toLowerCase().includes(busquedaDescripcion));
    let coincideTipoBusqueda = true;
    if (filtroTipoBusqueda === "Ingreso") {
      coincideTipoBusqueda = mov.tipo && mov.tipo.toLowerCase() === "ingreso";
    } else if (filtroTipoBusqueda === "Egreso") {
      coincideTipoBusqueda = mov.tipo && mov.tipo.toLowerCase() === "egreso";
    } else if (filtroTipoBusqueda === "Pendiente") {
      coincideTipoBusqueda = mov.estado && mov.estado.toLowerCase() === "pendiente";
    }
    if (
      (mesSeleccionado === "Todos" || mov.mes === mesSeleccionado) &&
      (añoSeleccionado === "Todos" || mov.año === añoSeleccionado) &&
      (tipoMovimientoSeleccionado === "Todos" || mov.tipoMovimiento === tipoMovimientoSeleccionado) &&
      (empresaSeleccionada === "Todas" || mov.empresa === empresaSeleccionada) &&
      coincideDescripcion &&
      coincideTipoBusqueda
    ) {
      const clave = `${mov.mes}-${mov.año}`;
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(mov);
    }
  });

  // Para expandir/collapse: guardar estado en memoria
  if (!window.estadoExpandidoMes) window.estadoExpandidoMes = {};

  // Ordenar claves de mes/año por fecha descendente
  const clavesOrdenadas = Object.keys(grupos).sort((a, b) => {
    const [mesA, añoA] = a.split("-");
    const [mesB, añoB] = b.split("-");
    // Convertir mes a número
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const numA = parseInt(añoA) * 100 + (meses.indexOf(mesA) + 1);
    const numB = parseInt(añoB) * 100 + (meses.indexOf(mesB) + 1);
    return numB - numA;
  });

  let hayMovimientos = false;
  clavesOrdenadas.forEach(clave => {
    const movimientosMes = grupos[clave];
    if (movimientosMes.length > 0) hayMovimientos = true;
    const todosCompletos = movimientosMes.every(mov => mov.estado === "Pagado" || mov.estado === "Cobrado");
    const hayPendientes = movimientosMes.some(mov => mov.estado === "Pendiente");
    // Si todos completos y no hay pendientes, mostrar fila resumen
    if (todosCompletos && !hayPendientes) {
      // Fila resumen personalizada
      const filaResumen = document.createElement("tr");
      filaResumen.className = "fila-resumen-mes" + (window.estadoExpandidoMes[clave] ? " abierta" : "");
      filaResumen.innerHTML = `
        <td colspan="10" style="text-align:center;">
          <span class="resumen-mes-texto">
            ${clave.split("-")[0]} - ${clave.split("-")[1]}
          </span>
        </td>
      `;
      filaResumen.addEventListener("click", () => {
        window.estadoExpandidoMes[clave] = !window.estadoExpandidoMes[clave];
        cargarMovimientos();
      });
      tbody.appendChild(filaResumen);
      // Si expandido, mostrar movimientos
      if (window.estadoExpandidoMes[clave]) {
        movimientosMes.forEach(mov => {
          agregarFilaMovimiento(mov, tbody);
        });
      }
    } else {
      // Mostrar todos los movimientos normalmente
      movimientosMes.forEach(mov => {
        agregarFilaMovimiento(mov, tbody);
      });
    }
  });
  // Si no hay movimientos, mostrar mensaje
  if (!hayMovimientos) {
    const filaVacia = document.createElement("tr");
    filaVacia.innerHTML = `<td colspan='10' style='text-align:center;color:#888;'>No hay movimientos para mostrar.</td>`;
    tbody.appendChild(filaVacia);
  }
}

// Función para agregar una fila de movimiento (sin modificar el original)
function agregarFilaMovimiento(mov, tbody) {
  const monto = parseFloat(mov.monto);
  const fila = document.createElement("tr");
  fila.id = `movimiento-${mov.id}`;
  let fechaFormateada = "";
  if (mov.fecha) {
    let soloFecha = mov.fecha.split("T")[0];
    if (soloFecha.includes("-")) {
      const [año, mes, dia] = soloFecha.split("-");
      fechaFormateada = `${dia}/${mes}/${año}`;
    } else {
      fechaFormateada = mov.fecha;
    }
  }
  // Asegura que mes y año nunca sean undefined
  const mes = mov.mes || "";
  const año = mov.año || "";
  fila.innerHTML = `
    <td>${fechaFormateada}</td>
    <td>${mov.empresa || ""}</td>
    <td>${mov.tipo}</td>
    <td>${mov.tipoMovimiento || ""}</td>
    <td>${mov.descripcion}</td>
    <td>${mes}</td>
    <td>${año}</td>
    <td>${monto.toFixed(2)}</td>
    <td>
      <button class="boton-estado ${mov.estado === "Pagado" || mov.estado === "Cobrado" ? "verde" : ""}" onclick="cambiarEstado('${mov.id}')">${mov.estado}</button>
    </td>
    <td style="display:flex;gap:6px;align-items:center;">
      <button class="boton-editar" title="Editar" onclick="editarMovimiento('${mov.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M4 21h17v2H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2v2H4v17zm16.7-13.3a1 1 0 0 0 0-1.4l-2-2a1 1 0 0 0-1.4 0l-9.3 9.3a1 1 0 0 0-.3.7V17a1 1 0 0 0 1 1h4.3a1 1 0 0 0 .7-.3l9.3-9.3zm-2.4-1.4 2 2-1.3 1.3-2-2 1.3-1.3zm-8.3 8.3 7-7 2 2-7 7H8v-2z"/>
        </svg>
      </button>
      <button class="boton-eliminar" title="Eliminar" onclick="eliminarMovimiento('${mov.id}')">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M9 3V4H4V6H5V20A2 2 0 0 0 7 22H17A2 2 0 0 0 19 20V6H20V4H15V3H9ZM7 6H17V20H7V6ZM9 8V18H11V8H9ZM13 8V18H15V8H13Z"/>
        </svg>
      </button>
    </td>
  `;
  tbody.appendChild(fila);
}

async function cargarOpcionesFiltroTipoMovimiento() {
  const select = document.getElementById("filtroTipoMovimiento");
  if (!select) return;
  select.innerHTML = '<option value="Todos">Todos</option>';
  const res = await fetch('/api/tipos_movimiento');
  const tipos = await res.json();
  tipos.forEach(t => {
    const option = document.createElement("option");
    option.value = t.nombre;
    option.textContent = t.nombre;
    select.appendChild(option);
  });
}

async function cambiarEstado(id) {
  // Aquí deberías hacer un fetch PUT/PATCH a tu API para cambiar el estado
  // Por ahora solo recarga los movimientos
  await cargarMovimientos();
}

// Eliminar movimiento
function mostrarConfirmacion(mensaje) {
  return new Promise(resolve => {
    const modal = document.getElementById("modal-confirmacion");
    const msg = document.getElementById("modal-confirmacion-mensaje");
    const btnSi = document.getElementById("modal-confirmacion-si");
    const btnNo = document.getElementById("modal-confirmacion-no");

    msg.textContent = mensaje;
    modal.style.display = "flex";

    function cerrar(res) {
      modal.style.display = "none";
      btnSi.removeEventListener("click", onSi);
      btnNo.removeEventListener("click", onNo);
      resolve(res);
    }
    function onSi() { cerrar(true); }
    function onNo() { cerrar(false); }

    btnSi.addEventListener("click", onSi);
    btnNo.addEventListener("click", onNo);
  });
}

async function eliminarMovimiento(id) {
  const confirmado = await mostrarConfirmacion("¿Estás seguro de que deseas eliminar esta transacción?");
  if (!confirmado) return;
  await fetch(`/api/movimientos/${id}`, { method: 'DELETE' });
  await cargarMovimientos();
}

async function editarMovimiento(id) {
  const res = await fetch(`/api/movimientos`);
  const movimientos = await res.json();
  const mov = movimientos.find(m => m.id == id);
  if (!mov) {
    alert("Movimiento no encontrado");
    return;
  }
  await cargarEmpresasEnModal();
  const selectTipo = document.getElementById("input-tipo");
  if (selectTipo && selectTipo.options.length < 2) {
    selectTipo.innerHTML = `
      <option value="ingreso">Ingreso</option>
      <option value="egreso">Egreso</option>
    `;
  }
  selectTipo.value = mov.tipo;
  document.getElementById("input-tipoMovimiento").value = mov.tipoMovimiento;
  document.getElementById("input-descripcion").value = mov.descripcion;
  document.getElementById("input-fecha").value = mov.fecha;
  document.getElementById("input-mes").value = mov.mes;
  document.getElementById("input-monto").value = mov.monto;
  document.getElementById("input-empresa").value = mov.empresa || "";
  document.getElementById("input-index").value = mov.id;
  actualizarAwesompleteModal(mov.tipo);
  document.getElementById("modal-editar").style.display = "flex";
}

// Cambia las opciones de Awesomplete al cambiar el tipo en el modal
document.getElementById("input-tipo").addEventListener("change", function(e) {
  actualizarAwesompleteModal(e.target.value);
  document.getElementById("input-tipoMovimiento").value = "";
});

// Al enfocar el input, muestra todas las opciones
document.getElementById("input-tipoMovimiento").addEventListener("focus", function() {
  this.value = "";
  if (awesompleteModal) awesompleteModal.evaluate();
});

// Guardar cambios desde el modal
document.getElementById("form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("input-index").value;
  const tipo = document.getElementById("input-tipo").value.trim();
  const tipoMovimiento = document.getElementById("input-tipoMovimiento").value.trim();
  const descripcion = document.getElementById("input-descripcion").value.trim();
  const fecha = document.getElementById("input-fecha").value.trim();
  const mes = document.getElementById("input-mes").value.trim();
  const monto = parseFloat(document.getElementById("input-monto").value);
  const empresa = document.getElementById("input-empresa").value.trim();

  // NUEVO: Múltiples movimientos automáticos en edición
  const activarMultiples = document.getElementById("editar-activar-multiples");
  const mesFinMultiple = document.getElementById("editar-mes-fin-multiple");

  if (isNaN(monto) || monto < 0) {
    alert("Monto inválido");
    return;
  }

  let movimientos = await leerDatos() || [];
  const index = movimientos.findIndex(mov => mov.id == id);
  if (index === -1) {
    alert("Movimiento no encontrado");
    return;
  }

  // Si está activado el modo múltiple y hay fecha de fin
  if (activarMultiples && activarMultiples.checked && mesFinMultiple && mesFinMultiple.value) {
    const [anioInicio, mesInicio, diaInicio] = fecha.split("-");
    const [anioFin, mesFinNum] = mesFinMultiple.value.split("-");
    const movimientosMultiples = [];
    let y = parseInt(anioInicio, 10);
    let m = parseInt(mesInicio, 10);

    while (y < parseInt(anioFin, 10) || (y === parseInt(anioFin, 10) && m <= parseInt(mesFinNum, 10))) {
      const fechaMovimiento = `${y}-${String(m).padStart(2, "0")}-${diaInicio}`;
      const nombreMes = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ][m - 1];

      movimientosMultiples.push({
        id: Date.now() + movimientosMultiples.length,
        tipo,
        tipoMovimiento,
        descripcion,
        fecha: fechaMovimiento,
        mes: nombreMes,
        año: y,
        monto,
        empresa,
        estado: "Pendiente"
      });

      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    // Elimina el movimiento original editado
    movimientos.splice(index, 1);
    movimientos.push(...movimientosMultiples);
    await guardarDatos(movimientos);
    await cargarMovimientos();
    cerrarModalEditar();
    return;
  }

  // Modo normal (edición simple)
  movimientos[index] = {
    ...movimientos[index],
    tipo,
    tipoMovimiento,
    descripcion,
    fecha,
    mes,
    monto,
    empresa
  };

  await guardarDatos(movimientos);
  await cargarMovimientos();
  cerrarModalEditar();
});

// Cerrar modal al cancelar o al hacer click fuera del contenido
document.getElementById("btn-cerrar-modal").addEventListener("click", cerrarModalEditar);

function cerrarModalEditar() {
  document.getElementById("modal-editar").style.display = "none";
  limpiarFormularioEditar();
  if (document.activeElement) document.activeElement.blur();
}

function limpiarFormularioEditar() {
  document.getElementById("form-editar").reset();
}

function mostrarOcultarBotonDeshacer() {
  const botonDeshacer = document.getElementById("fila-deshacer");
  if (!botonDeshacer) return;
  botonDeshacer.style.display = movimientosEliminados.length > 0 ? "table-row" : "none";
}

async function deshacerEliminacion() {
  if (movimientosEliminados.length === 0) return;

  let movimientos = await leerDatos() || [];
  const movRestaurado = movimientosEliminados.pop();
  movimientos.push(movRestaurado);

  await guardarDatos(movimientos);
  await cargarMovimientos();
  mostrarOcultarBotonDeshacer();
}

document.addEventListener("DOMContentLoaded", () => {
  // --- Lógica para mostrar/ocultar y explicar movimientos automáticos en edición ---
  const editarActivarMultiples = document.getElementById("editar-activar-multiples");
  const editarOpcionesMultiples = document.getElementById("editar-opciones-multiples");
  const editarRecordatorioInicio = document.getElementById("editar-recordatorio-inicio");
  const editarMesFinMultiple = document.getElementById("editar-mes-fin-multiple");
  const editarExplicacionMultiples = document.getElementById("editar-explicacion-multiples");
  const editarInputFecha = document.getElementById("input-fecha");

  if (editarActivarMultiples && editarOpcionesMultiples && editarRecordatorioInicio && editarMesFinMultiple && editarExplicacionMultiples && editarInputFecha) {
    editarActivarMultiples.addEventListener("change", () => {
      if (editarActivarMultiples.checked) {
        editarOpcionesMultiples.style.display = "block";
        actualizarRecordatorioYExplicacionEdicion();
      } else {
        editarOpcionesMultiples.style.display = "none";
        editarExplicacionMultiples.textContent = "";
      }
    });
    editarInputFecha.addEventListener("change", actualizarRecordatorioYExplicacionEdicion);
    editarMesFinMultiple.addEventListener("change", actualizarRecordatorioYExplicacionEdicion);

    function actualizarRecordatorioYExplicacionEdicion() {
      const fechaInicio = editarInputFecha.value;
      if (!fechaInicio) {
        editarRecordatorioInicio.textContent = "Selecciona primero la fecha de inicio.";
        editarExplicacionMultiples.textContent = "";
        return;
      }
      const [anioInicio, mesInicio, diaInicio] = fechaInicio.split("-");
      editarRecordatorioInicio.textContent = `La fecha de inicio es el ${diaInicio}/${mesInicio}/${anioInicio}.`;

      const mesFin = editarMesFinMultiple.value;
      if (mesFin) {
        const [anioFin, mesFinNum] = mesFin.split("-");
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const nombreMesInicio = meses[parseInt(mesInicio, 10) - 1];
        const nombreMesFin = meses[parseInt(mesFinNum, 10) - 1];
        editarExplicacionMultiples.textContent =
          `Se generará un movimiento el día ${diaInicio} de cada mes, desde ${nombreMesInicio} ${anioInicio} hasta ${nombreMesFin} ${anioFin}, ambos inclusive.`;
      } else {
        editarExplicacionMultiples.textContent = "";
      }
    }
  }
  const filtroMes = document.getElementById("filtroMes");
  const filtroAño = document.getElementById("filtroAño");
  const filtroTipoMovimiento = document.getElementById("filtroTipoMovimiento");
  const filtroEmpresa = document.getElementById("filtroEmpresa");

  if (filtroEmpresa) filtroEmpresa.addEventListener("change", cargarMovimientos);
  if (filtroMes) filtroMes.addEventListener("change", cargarMovimientos);
  if (filtroAño) filtroAño.addEventListener("change", cargarMovimientos);
  if (filtroTipoMovimiento) filtroTipoMovimiento.addEventListener("change", cargarMovimientos);

  window.cambiarEstado = cambiarEstado;
  window.eliminarMovimiento = eliminarMovimiento;
  window.deshacerEliminacion = deshacerEliminacion;
  window.editarMovimiento = editarMovimiento;

  cargarTiposMovimiento();
  cargarEmpresasFiltro();
  cargarOpcionesFiltroTipoMovimiento();
  cargarMovimientos();
});

const inputBusquedaDescripcion = document.getElementById("busqueda-descripcion");
if (inputBusquedaDescripcion) {
  inputBusquedaDescripcion.addEventListener("input", cargarMovimientos);
}

const filtroTipoBusqueda = document.getElementById("filtroTipoBusqueda");
if (filtroTipoBusqueda) {
  filtroTipoBusqueda.addEventListener("change", cargarMovimientos);
}

async function cargarEmpresasFiltro() {
  const res = await fetch('/api/empresas');
  const empresas = await res.json();
  const filtroEmpresa = document.getElementById("filtroEmpresa");
  filtroEmpresa.innerHTML = '<option value="Todas">Todas</option>';
  empresas.forEach(e => {
    const option = document.createElement("option");
    option.value = e.nombre;
    option.textContent = e.nombre;
    filtroEmpresa.appendChild(option);
  });
}

async function cargarEmpresasEnModal() {
  const res = await fetch('/api/empresas');
  const empresas = await res.json();
  const select = document.getElementById("input-empresa");
  select.innerHTML = '';
  empresas.forEach(e => {
    const option = document.createElement("option");
    option.value = e.nombre;
    option.textContent = e.nombre;
    select.appendChild(option);
  });
}