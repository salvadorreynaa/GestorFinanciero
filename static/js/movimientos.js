// --- ADAPTADO PARA FLASK/API ---
let opcionesIngreso = [];
let opcionesEgreso = [];

async function cargarTiposMovimiento() {
  const tipoSeleccionado = document.getElementById("input-tipo")?.value || "ingreso";
  const res = await fetch(`/api/tipos_movimiento?tipo=${tipoSeleccionado}`);
  const tipos = await res.json();
  opcionesIngreso = tipoSeleccionado === "ingreso" ? tipos.map(t => t.nombre) : [];
  opcionesEgreso = tipoSeleccionado === "egreso" ? tipos.map(t => t.nombre) : [];
}

let movimientosEliminados = [];
let awesompleteModal;

// Funciones para manejar fechas recurrentes
function obtenerUltimoDiaMes(anio, mes) {
  return new Date(anio, mes + 1, 0).getDate();
}

function ajustarFecha(anio, mes, dia) {
  const ultimoDia = obtenerUltimoDiaMes(anio, mes);
  return dia > ultimoDia ? ultimoDia : dia;
}

function formatearFecha(fecha) {
  return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
}

function actualizarExplicacionMultiplesEditar() {
  const fechaInicioStr = document.getElementById("input-fecha").value;
  if (!fechaInicioStr) return;

  const [anioI, mesI, diaI] = fechaInicioStr.split('-');
  const diaOriginal = parseInt(diaI);
  const mesInicio = parseInt(mesI) - 1;

  const diaAjustadoInicio = ajustarFecha(parseInt(anioI), mesInicio, diaOriginal);
  const fechaInicio = new Date(parseInt(anioI), mesInicio, diaAjustadoInicio);

  document.getElementById("editar-recordatorio-inicio").textContent = 
    `Fecha de inicio: ${formatearFecha(fechaInicio)}`;
  
  const mesFinMultiple = document.getElementById("editar-mes-fin-multiple");
  if (!mesFinMultiple.value) return;

  const [anioFin, mesFin] = mesFinMultiple.value.split('-');
  const mesFinal = parseInt(mesFin) - 1;
  const diaAjustadoFin = ajustarFecha(parseInt(anioFin), mesFinal, diaOriginal);
  const fechaFin = new Date(parseInt(anioFin), mesFinal, diaAjustadoFin);

  const meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 + 
               (fechaFin.getMonth() - fechaInicio.getMonth()) + 1;

  // Restamos 1 porque el primer movimiento ya existe
  const nuevosMovimientos = meses - 1;
  let explicacion = nuevosMovimientos > 0 ? 
    `Se crearán ${nuevosMovimientos} movimiento${nuevosMovimientos > 1 ? 's' : ''} adicional${nuevosMovimientos > 1 ? 'es' : ''} en las siguientes fechas:\n` :
    'No se crearán movimientos adicionales.';
    
  let mesActual = mesInicio;
  let anioActual = parseInt(anioI);
  let fechas = [];

  for (let i = 0; i < meses; i++) {
    const diaAjustado = ajustarFecha(anioActual, mesActual, diaOriginal);
    fechas.push(`${diaAjustado}/${(mesActual + 1).toString().padStart(2, '0')}/${anioActual}`);
    
    mesActual++;
    if (mesActual >= 12) {
      mesActual = 0;
      anioActual++;
    }
  }

  explicacion += fechas.join(", ");
  document.getElementById("editar-explicacion-multiples").textContent = explicacion;
}

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
      const clave = mov.mes && mov.año ? `${mov.mes}-${mov.año}` : mov.mes;
      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(mov);
    }
  });

  // Para expandir/collapse: guardar estado en memoria
  if (!window.estadoExpandidoMes) window.estadoExpandidoMes = {};

  // Ordenar claves de mes/año por fecha descendente
  const clavesOrdenadas = Object.keys(grupos).sort((a, b) => {
    const [mesA, añoA] = a.split("-").map(s => s ? s.trim() : '');
    const [mesB, añoB] = b.split("-").map(s => s ? s.trim() : '');
    // Convertir mes a número
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const numA = (parseInt(añoA) || 0) * 100 + (meses.indexOf(mesA) + 1);
    const numB = (parseInt(añoB) || 0) * 100 + (meses.indexOf(mesB) + 1);
    return numB - numA;
  });
  
  let hayMovimientos = false;
  let loadingGrupo = false;

  clavesOrdenadas.forEach(clave => {
    const movimientosMes = grupos[clave];
    if (movimientosMes.length > 0) {
      hayMovimientos = true;
    }

    const todosCompletos = movimientosMes.every(mov => mov.estado === "Pagado" || mov.estado === "Cobrado");
    const hayPendientes = movimientosMes.some(mov => mov.estado === "Pendiente");

    if (todosCompletos && !hayPendientes) {
      const filaResumen = document.createElement("tr");
      filaResumen.className = 'mes-colapsado';
      const [mes, año] = clave.split("-").map(s => s ? s.trim() : '');
      let textoResumen = mes;
      if (año) {
        textoResumen += ` - ${año}`;
      }
      
      filaResumen.innerHTML = `
        <td colspan="10" style="text-align:center;padding:8px;">
          <span style="font-weight:500;">${textoResumen}</span>
          <span style="margin-left:10px;color:#666;">(Click para ver detalles)</span>
        </td>
      `;
      
      filaResumen.addEventListener("click", () => {
        window.estadoExpandidoMes[clave] = !window.estadoExpandidoMes[clave];
        
        // Encontrar y eliminar los movimientos actuales de este mes
        const movimientosParaEliminar = Array.from(tbody.querySelectorAll(`.movimiento-detalle[data-mes="${clave}"]`));
        movimientosParaEliminar.forEach(fila => fila.remove());
        
        if (window.estadoExpandidoMes[clave]) {
          const movimientosOrdenados = [...movimientosMes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          movimientosOrdenados.forEach(mov => {
            const fila = document.createElement('tr');
            fila.className = 'movimiento-detalle';
            fila.setAttribute('data-mes', clave);
            fila.innerHTML = generarHTMLMovimiento(mov);
            filaResumen.insertAdjacentElement('afterend', fila);
          });
        }
      });

      tbody.appendChild(filaResumen);
    } else {
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

// Función para generar el HTML de un movimiento
function generarHTMLMovimiento(mov) {
  const monto = parseFloat(mov.monto);
  let fechaFormateada = "";
  let mes = mov.mes || "";
  let año = mov.año || "";
  
  if (mov.fecha) {
    let soloFecha = mov.fecha.split("T")[0];
    if (soloFecha.includes("-")) {
      const [añoF, mesF, diaF] = soloFecha.split("-");
      fechaFormateada = `${diaF}/${mesF}/${añoF}`;
      if (!mes) {
        const mesesNombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
        mes = mesesNombres[parseInt(mesF,10)-1];
      }
      if (!año) año = añoF;
    } else {
      fechaFormateada = mov.fecha;
    }
  }

  return `
    <td>${fechaFormateada}</td>
    <td>${mov.empresa || ""}</td>
    <td>${mov.tipo || ""}</td>
    <td>${mov.tipoMovimiento || ""}</td>
    <td>${mov.descripcion || ""}</td>
    <td>${mes}</td>
    <td>${año}</td>
    <td>S/ ${monto.toFixed(2)}</td>
    <td>
      <button class="boton-estado ${mov.estado === "Pagado" || mov.estado === "Cobrado" ? "verde" : ""}" onclick="cambiarEstadoMovimiento('${mov.id}', this)">${mov.estado}</button>
    </td>
    <td class="acciones" style="display:flex;gap:6px;align-items:center;">
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
      <button class="boton-notificar" title="Configurar recordatorio" onclick="configurarNotificacion('${mov.id}')">
        <i class="${mov.notificacion_activa ? 'fas' : 'far'} fa-bell"></i>
      </button>
    </td>
  `;
}

// Función para agregar una fila de movimiento
function agregarFilaMovimiento(mov, tbody) {
  const fila = document.createElement("tr");
  fila.id = `movimiento-${mov.id}`;
  fila.className = 'movimiento-detalle';
  const clave = mov.mes && mov.año ? `${mov.mes}-${mov.año}` : mov.mes;
  fila.setAttribute('data-mes', clave);
  fila.innerHTML = generarHTMLMovimiento(mov);
  tbody.appendChild(fila);
}

// Cambiar estado de movimiento
async function cambiarEstadoMovimiento(id, btn) {
  // Prevenir múltiples clics
  if (btn.classList.contains('updating')) return;
  
  const tipo = btn.closest('tr').querySelector('td:nth-child(3)').textContent.toLowerCase();
  const actual = btn.textContent.trim();
  let nuevoEstado = "Pendiente";
  
  // Determinar nuevo estado basado en el tipo
  if (tipo === "egreso") {
    nuevoEstado = actual === "Pendiente" ? "Pagado" : "Pendiente";
  } else {
    nuevoEstado = actual === "Pendiente" ? "Cobrado" : "Pendiente";
  }

  // Añadir clase para animación
  btn.classList.add('estado-transition', 'updating');
  
  try {
    const response = await fetch(`/api/movimientos/${id}/estado`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({estado: nuevoEstado})
    });

    if (!response.ok) throw new Error('Error al actualizar estado');

    // Actualizar UI con animación
    setTimeout(() => {
      btn.textContent = nuevoEstado;
      btn.classList.toggle("verde", nuevoEstado === "Pagado" || nuevoEstado === "Cobrado");
      
      // Verificar si necesitamos actualizar el grupo
      const row = btn.closest('tr');
      const grupo = row.closest('.grupo-mes');
      if (grupo) {
        const estadosGrupo = Array.from(grupo.querySelectorAll('.boton-estado'))
          .map(b => b.textContent.trim());
        
        const todosCompletos = estadosGrupo.every(estado => 
          estado === "Pagado" || estado === "Cobrado"
        );
        
        if (todosCompletos) {
          // Recargar solo si el grupo está completo
          cargarMovimientos();
        }
      }
    }, 300);

  } catch (error) {
    console.error('Error:', error);
    alert('Error al actualizar el estado');
  } finally {
    // Remover clase de animación
    setTimeout(() => {
      btn.classList.remove('estado-transition', 'updating');
    }, 300);
  }
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

// Función para mostrar notificaciones tipo toast
function mostrarToast(mensaje) {
  let toast = document.getElementById("toast-notificacion");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-notificacion";
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "1.1em";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.style.display = "block";
  setTimeout(() => { toast.style.display = "none"; }, 2200);
}

// Botón de cerrar modal edición
document.addEventListener("DOMContentLoaded", function() {
  const btnCerrar = document.getElementById("btn-cerrar-modal");
  if (btnCerrar) {
    btnCerrar.onclick = function() {
      document.getElementById("modal-editar").style.display = "none";
    };
  }
});

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
  await cargarTiposMovimientoEnSelector(mov.tipo);
  document.getElementById("input-tipoMovimiento").value = mov.tipoMovimiento;
  document.getElementById("input-descripcion").value = mov.descripcion;
  // Asigna solo la parte de fecha yyyy-MM-dd
  if (mov.fecha) {
    let soloFecha = mov.fecha.split("T")[0];
    document.getElementById("input-fecha").value = soloFecha;
  }
  document.getElementById("input-mes").value = mov.mes;
  document.getElementById("input-monto").value = mov.monto;
  document.getElementById("input-empresa").value = mov.empresa || "";
  document.getElementById("input-index").value = mov.id;
  actualizarAwesompleteModal(mov.tipo);
  // Cargar estado del checkbox de movimientos automáticos
  const chkAuto = document.getElementById("input-mensual-auto");
  if (chkAuto) {
    chkAuto.checked = mov.mensual_auto === true || mov.mensual_auto === "true";
  }
  document.getElementById("modal-editar").style.display = "flex";
}

// Función para cargar los tipos de movimiento en el selector
async function cargarTiposMovimientoEnSelector(tipo) {
  const select = document.getElementById("input-tipoMovimiento");
  select.innerHTML = '<option value="">Seleccione un tipo</option>';
  
  try {
    const res = await fetch(`/api/tipos_movimiento?tipo=${tipo}`);
    const tipos = await res.json();
    
    tipos.forEach(t => {
      const option = document.createElement("option");
      option.value = t.nombre;
      option.textContent = t.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando tipos de movimiento:", error);
  }
}

// Cambia las opciones del selector al cambiar el tipo en el modal
document.getElementById("input-tipo").addEventListener("change", async function(e) {
  const tipo = e.target.value;
  await cargarTiposMovimientoEnSelector(tipo);
});

// Event listeners para movimientos recurrentes en edición
document.getElementById("editar-activar-multiples").addEventListener('change', function() {
  const opcionesMultiples = document.getElementById("editar-opciones-multiples");
  opcionesMultiples.style.display = this.checked ? 'flex' : 'none';
  if (this.checked) actualizarExplicacionMultiplesEditar();
});

document.getElementById("input-fecha").addEventListener('change', function() {
  const fecha = new Date(this.value);
  if (!isNaN(fecha.getTime())) {
    // Actualizar los campos ocultos de mes y año
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById("input-mes").value = meses[fecha.getMonth()];
    document.getElementById("input-ano").value = fecha.getFullYear().toString();
  }
  // Actualizar explicación de múltiples si está activo
  if (document.getElementById("editar-activar-multiples").checked) {
    actualizarExplicacionMultiplesEditar();
  }
});

document.getElementById("editar-mes-fin-multiple").addEventListener('change', () => {
  if (document.getElementById("editar-activar-multiples").checked) {
    actualizarExplicacionMultiplesEditar();
  }
});

// Al enfocar el input, muestra todas las opciones
document.getElementById("input-tipoMovimiento").addEventListener("focus", function() {
  this.value = "";
  if (awesompleteModal) awesompleteModal.evaluate();
});

// Guardar cambios desde el modal
document.getElementById("form-editar").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const id = document.getElementById("input-index").value;
    const tipo = document.getElementById("input-tipo").value.trim();
    const tipoMovimiento = document.getElementById("input-tipoMovimiento").value.trim();
    const descripcion = document.getElementById("input-descripcion").value.trim();
    const fecha = document.getElementById("input-fecha").value.trim();
    const monto = parseFloat(document.getElementById("input-monto").value);
    const empresa = document.getElementById("input-empresa").value.trim();
    
    if (!fecha) {
      alert("Debes ingresar una fecha válida");
      return;
    }
    if (isNaN(monto) || monto < 0) {
      alert("Monto inválido");
      return;
    }

    const activarMultiples = document.getElementById("editar-activar-multiples").checked;
    const mesFinMultiple = document.getElementById("editar-mes-fin-multiple").value;
    const mesesNombres = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    
    if (activarMultiples && mesFinMultiple) {
      // Crear movimientos múltiples
      const [anioInicio, mesInicio, diaInicio] = fecha.split('-');
      const [anioFin, mesFin] = mesFinMultiple.split('-');
      
      let mesActual = parseInt(mesInicio) - 1;
      let anioActual = parseInt(anioInicio);
      const diaOriginal = parseInt(diaInicio);
      const mesFinal = parseInt(mesFin) - 1;
      const anioFinal = parseInt(anioFin);
      
      const mesesTotales = (anioFinal - anioActual) * 12 + (mesFinal - mesActual);
      
      // Primero actualizamos el movimiento original
      const bodyOriginal = {
        tipo,
        tipoMovimiento,
        descripcion,
        fecha,
        mes: document.getElementById("input-mes").value,
        año: document.getElementById("input-ano").value,
        monto,
        empresa
      };

      await fetch(`/api/movimientos/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bodyOriginal)
      });

      // Avanzamos al siguiente mes para crear los nuevos
      mesActual++;
      if (mesActual > 11) {
        mesActual = 0;
        anioActual++;
      }

      // Crear los movimientos adicionales
      for (let i = 1; i <= mesesTotales; i++) {
        const diaAjustado = ajustarFecha(anioActual, mesActual, diaOriginal);
        const fechaAjustada = new Date(anioActual, mesActual, diaAjustado);
        const fechaStr = fechaAjustada.toISOString().split('T')[0];
        
        const bodyNuevo = {
          tipo,
          tipoMovimiento,
          descripcion,
          fecha: fechaStr,
          mes: mesesNombres[mesActual],
          año: anioActual.toString(),
          monto,
          empresa
        };

        await fetch('/api/movimientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyNuevo)
        });
        
        mesActual++;
        if (mesActual > 11) {
          mesActual = 0;
          anioActual++;
        }
      }
    } else {
      // Movimiento único
      const partes = fecha.split("-");
      const bodyUnico = {
        tipo,
        tipoMovimiento,
        descripcion,
        fecha,
        mes: mesesNombres[parseInt(partes[1],10)-1],
        año: partes[0],
        monto,
        empresa
      };
      
      await fetch(`/api/movimientos/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(bodyUnico)
      });
    }
    
    document.getElementById("modal-editar").style.display = "none";
    await cargarMovimientos();
    mostrarToast("✅ Movimiento editado correctamente.");
  } catch (error) {
    console.error('Error al guardar el movimiento:', error);
    alert('Ocurrió un error al guardar el movimiento. Por favor, intenta de nuevo.');
  }
});


// Filtros y eventos globales
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
window.editarMovimiento = editarMovimiento;

cargarTiposMovimiento();
cargarEmpresasFiltro();
cargarOpcionesFiltroTipoMovimiento();
cargarMovimientos();

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