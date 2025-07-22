let guardando = false;

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM (todas al inicio)
  const formulario = document.getElementById("formulario");
  // ...existing code...
      } else {
        opcionesMultiples.style.display = "none";
        explicacionMultiples.textContent = "";
      }
    });

    inputFecha.addEventListener("change", actualizarRecordatorioYExplicacion);
    mesFinMultiple.addEventListener("change", actualizarRecordatorioYExplicacion);

    function actualizarRecordatorioYExplicacion() {
      const fechaInicio = inputFecha.value;
      if (!fechaInicio) {
        recordatorioInicio.textContent = "Selecciona primero la fecha de inicio.";
        explicacionMultiples.textContent = "";
        return;
      }
      const [anioInicio, mesInicio, diaInicio] = fechaInicio.split("-");
      recordatorioInicio.textContent = `La fecha de inicio es el ${diaInicio}/${mesInicio}/${anioInicio}.`;

      const mesFin = mesFinMultiple.value;
      if (mesFin) {
        const [anioFin, mesFinNum] = mesFin.split("-");
        const meses = [
          "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        const nombreMesInicio = meses[parseInt(mesInicio, 10) - 1];
        const nombreMesFin = meses[parseInt(mesFinNum, 10) - 1];
        explicacionMultiples.textContent =
          `Se generará un movimiento el día ${diaInicio} de cada mes, desde ${nombreMesInicio} ${anioInicio} hasta ${nombreMesFin} ${anioFin}, ambos inclusive.`;
      } else {
        explicacionMultiples.textContent = "";
      }
    }
  }

  // Evento submit del formulario para agregar movimiento (único bloque)
  if (formulario) {
    formulario.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (guardando) return;
      const tipo = tipoSelect.value;
      const tipoMovimiento = inputTipoMovimiento.value.trim();
      const descripcion = document.getElementById("descripcion").value.trim();
      const fecha = inputFecha.value.trim(); // formato: YYYY-MM-DD
      let año = "";
      let mes = "";
      if (fecha && fecha.includes("-")) {
        const partes = fecha.split("-");
        año = partes[0];
        mes = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][parseInt(partes[1],10)-1];
      }
      const monto = parseFloat(document.getElementById("monto").value);
      const empresa = selectEmpresa.value;
      if (!tipo || !tipoMovimiento || !descripcion || !fecha || isNaN(monto) || !empresa) {
        mostrarToast("Completa todos los campos obligatorios.");
        return;
      }
      guardando = true;
      try {
        await fetch("/api/movimientos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
  // ...existing code...
            tipoMovimiento,
            descripcion,
            fecha,
            mes,
            año,
            monto,
            empresa,
            estado: "Pendiente"
          })
        });
        formulario.reset();
        mostrarToast("✅ Movimiento guardado correctamente.");
      } catch (err) {
        mostrarToast("Error al guardar el movimiento.");
      } finally {
        guardando = false;
      }
    });
  }

  // Toast visual
  function mostrarToast(mensaje) {
    let toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }

  // --- MODAL DE OPCIONES (EMPRESA O TIPO DE MOVIMIENTO) ---
  // variables DOM ya declaradas arriba
  const tituloOpciones = document.getElementById("modal-opciones-titulo");

  let modoOpciones = ""; // "empresa" o "tipo"
  let tipoOpciones = ""; // "ingreso" o "egreso" (solo para tipo de movimiento)

  document.getElementById("btn-agregar-empresa").addEventListener("click", () => {
    modoOpciones = "empresa";
    tituloOpciones.textContent = "Empresas";
    inputNuevaOpcion.placeholder = "Nueva empresa...";
    inputNuevaOpcion.value = "";
    cargarListaOpciones();
    modalOpciones.style.display = "flex";
    inputNuevaOpcion.focus();
  });

  document.getElementById("btn-agregar-tipo").addEventListener("click", () => {
    modoOpciones = "tipo";
    // Por defecto, usa el tipo seleccionado en el formulario
    tipoOpciones = tipoSelect.value === "egreso" ? "egreso" : "ingreso";
    tituloOpciones.textContent = tipoOpciones === "egreso" ? "Tipos de Egreso" : "Tipos de Ingreso";
    inputNuevaOpcion.placeholder = "Nuevo tipo...";
    inputNuevaOpcion.value = "";
    cargarListaOpciones();
    modalOpciones.style.display = "flex";
    inputNuevaOpcion.focus();
  });

  if (btnCerrarOpciones && modalOpciones) {
    btnCerrarOpciones.addEventListener("click", () => {
      modalOpciones.style.display = "none";
    });
  }
  modalOpciones.addEventListener("click", (e) => {
    if (e.target === modalOpciones) modalOpciones.style.display = "none";
  });

  btnGuardarOpcion.addEventListener("click", guardarOpcion);

  inputNuevaOpcion.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarOpcion();
  });

  async function guardarOpcion() {
    const valor = inputNuevaOpcion.value.trim();
    if (!valor) return;
    if (modoOpciones === "empresa") {
      // Agregar empresa por API
      await fetch("/api/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: valor })
      });
      cargarEmpresas();
      cargarListaOpciones();
      inputNuevaOpcion.value = "";
    } else if (modoOpciones === "tipo") {
      // Agregar tipo de movimiento por API
      await fetch("/api/tipos_movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: valor })
      });
      cargarTiposMovimiento();
      cargarListaOpciones();
      inputNuevaOpcion.value = "";
    }
  }

  async function cargarListaOpciones() {
    listaOpciones.innerHTML = "";
    if (modoOpciones === "empresa") {
      const res = await fetch("/api/empresas");
      const empresas = await res.json();
      empresas.forEach(e => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.padding = "4px 0";
        li.innerHTML = `
          <span>${e.nombre}</span>
          <span>
            <button class="btn-editar-opcion" title="Editar" data-valor="${e.nombre}">&#9998;</button>
            <button class="btn-eliminar-opcion" title="Eliminar" data-valor="${e.nombre}">&#128465;</button>
          </span>
        `;
        listaOpciones.appendChild(li);
      });
      agregarEventosOpciones();
    } else if (modoOpciones === "tipo") {
      const res = await fetch("/api/tipos_movimiento");
      const tipos = await res.json();
      tipos.forEach(t => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.padding = "4px 0";
        li.innerHTML = `
          <span>${t.nombre}</span>
          <span>
            <button class="btn-editar-opcion" title="Editar" data-valor="${t.nombre}">&#9998;</button>
            <button class="btn-eliminar-opcion" title="Eliminar" data-valor="${t.nombre}">&#128465;</button>
          </span>
        `;
        listaOpciones.appendChild(li);
      });
      agregarEventosOpciones();
    }
  }

  function agregarEventosOpciones() {
    // Editar inline
    listaOpciones.querySelectorAll(".btn-editar-opcion").forEach(btn => {
      btn.onclick = async function() {
        const li = btn.closest("li");
        const valorAntiguo = btn.dataset.valor;
        const span = li.querySelector("span:first-child");
        if (li.querySelector("input")) return;
        const input = document.createElement("input");
        input.type = "text";
        input.value = valorAntiguo;
        input.style.flex = "1";
        input.style.marginRight = "8px";
        span.replaceWith(input);
        input.focus();
        input.select();
        let editando = true;
        input.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            editando = false;
            await guardarEdicion();
          }
          if (e.key === "Escape") {
            editando = false;
            cancelarEdicion();
          }
        });
        input.addEventListener("blur", () => {
          if (editando) cancelarEdicion();
        });
        async function guardarEdicion() {
          const nuevoValor = input.value.trim();
          if (!nuevoValor || nuevoValor === valorAntiguo) { cancelarEdicion(); return; }
          if (modoOpciones === "empresa") {
            await fetch(`/api/empresas/${encodeURIComponent(valorAntiguo)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nombre: nuevoValor })
            });
            cargarEmpresas();
            cargarListaOpciones();
          } else if (modoOpciones === "tipo") {
            await fetch(`/api/tipos_movimiento/${encodeURIComponent(valorAntiguo)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nombre: nuevoValor })
            });
            cargarTiposMovimiento();
            cargarListaOpciones();
          }
        }
        function cancelarEdicion() {
          cargarListaOpciones();
        }
      };
    });
    // Eliminar con modal personalizado
    listaOpciones.querySelectorAll(".btn-eliminar-opcion").forEach(btn => {
      btn.onclick = async function() {
        const valor = btn.dataset.valor;
        const confirmado = await mostrarConfirmacionEliminar(`¿Seguro que deseas eliminar "${valor}"?`);
        if (!confirmado) return;
        if (modoOpciones === "empresa") {
          await fetch(`/api/empresas/${encodeURIComponent(valor)}`, { method: 'DELETE' });
          cargarEmpresas();
        } else if (modoOpciones === "tipo") {
          await fetch(`/api/tipos_movimiento/${encodeURIComponent(valor)}`, { method: 'DELETE' });
          cargarTiposMovimiento();
        }
        cargarListaOpciones();
      };
    });
  }

  // Modal de confirmación personalizado
  function mostrarConfirmacionEliminar(mensaje) {
    return new Promise(resolve => {
      const modal = document.getElementById("modal-confirmar-eliminar");
      const msg = document.getElementById("mensaje-confirmar-eliminar");
      const btnSi = document.getElementById("btn-confirmar-si");
      const btnNo = document.getElementById("btn-confirmar-no");
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

  // Modal para agregar tipo de movimiento en INICIO
  const modalAgregarTipo = document.getElementById("modal-agregar-tipo-movimiento");
  const btnCerrarModalAgregarTipo = document.getElementById("btn-cerrar-modal-agregar-tipo");
  if (btnAgregarTipo) {
    btnAgregarTipo.onclick = function() {
      modalAgregarTipo.style.display = "flex";
    };
  }
  if (btnCerrarModalAgregarTipo) {
    btnCerrarModalAgregarTipo.onclick = function() {
      modalAgregarTipo.style.display = "none";
    };
  }
  const formAgregarTipo = document.getElementById("form-agregar-tipo-movimiento");
  if (formAgregarTipo) {
    formAgregarTipo.addEventListener("submit", async function(e) {
      e.preventDefault();
      const nombre = document.getElementById("nuevo-tipo-nombre").value.trim();
      const tipo = document.getElementById("nuevo-tipo-tipo").value;
      if (!nombre) return alert("Debes ingresar un nombre");
      await fetch("/api/tipos_movimiento", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({nombre, tipo})
      });
      modalAgregarTipo.style.display = "none";
      // Recarga las opciones de tipo de movimiento si tienes esa función
      if (typeof cargarTiposMovimiento === "function") await cargarTiposMovimiento();
      // Muestra notificación si tienes esa función
      if (typeof mostrarToast === "function") mostrarToast("✅ Tipo de movimiento agregado");
    });
  }

  // Mostrar todas las opciones de tipo de movimiento al hacer click o focus
  if (inputTipoMovimiento && window.Awesomplete) {
    inputTipoMovimiento.addEventListener("focus", function() {
      this.value = "";
      if (window.awesomplete) window.awesomplete.evaluate();
    });
    inputTipoMovimiento.addEventListener("click", function() {
      this.value = "";
      if (window.awesomplete) window.awesomplete.evaluate();
    });
  }
});

// Corrige el formato de fecha al mostrar en la tabla
function agregarFilaMovimiento(mov, tbody) {
  const monto = parseFloat(mov.monto);
  const fila = document.createElement("tr");
  fila.id = `movimiento-${mov.id}`;
  let fechaFormateada = "";
  if (mov.fecha) {
    // Si viene en formato ISO, extrae solo la fecha
    let soloFecha = mov.fecha.split("T")[0];
    if (soloFecha.includes("-")) {
      const [año, mes, dia] = soloFecha.split("-");
      fechaFormateada = `${dia}/${mes}/${año}`;
    } else {
      fechaFormateada = mov.fecha;
    }
  }
  fila.innerHTML = `
    <td>${fechaFormateada}</td>
    <td>${mov.empresa || ""}</td>
    <td>${mov.tipo}</td>
    <td>${mov.tipoMovimiento || ""}</td>
    <td>${mov.descripcion}</td>
    <td>${mov.mes || ""}</td>
    <td>${mov.año || ""}</td>
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