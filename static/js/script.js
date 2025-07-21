let guardando = false;

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM (todas al inicio)
  const formulario = document.getElementById("formulario");
  const tipoSelect = document.getElementById("tipo");
  const inputTipoMovimiento = document.getElementById("tiposmovimientos");
  const selectEmpresa = document.getElementById("empresa");
  const activarMultiples = document.getElementById("activar-multiples");
  const opcionesMultiples = document.getElementById("opciones-multiples");
  const recordatorioInicio = document.getElementById("recordatorio-inicio");
  const mesFinMultiple = document.getElementById("mes-fin-multiple");
  const explicacionMultiples = document.getElementById("explicacion-multiples");
  const inputFecha = document.getElementById("fecha");
  const btnAgregarEmpresa = document.getElementById("btn-agregar-empresa");
  const btnAgregarTipo = document.getElementById("btn-agregar-tipo");
  const modalOpciones = document.getElementById("modal-opciones");
  const btnCerrarOpciones = document.getElementById("btn-cerrar-opciones");
  const inputNuevaOpcion = document.getElementById("input-nueva-opcion");
  const btnGuardarOpcion = document.getElementById("btn-guardar-opcion");
  const listaOpciones = document.getElementById("lista-opciones");

  // Definir modalOpcionesTitulo solo si existe
  let modalOpcionesTitulo = null;
  if (document.getElementById("modal-opciones-titulo")) {
    modalOpcionesTitulo = document.getElementById("modal-opciones-titulo");
  }

  // Cargar empresas y tipos de movimiento desde el backend
  function cargarEmpresas() {
    fetch("/api/empresas")
      .then(res => res.json())
      .then(data => {
        selectEmpresa.innerHTML = '<option value="">Selecciona...</option>';
        data.forEach(e => {
          const opt = document.createElement("option");
          opt.value = e.nombre;
          opt.textContent = e.nombre;
          selectEmpresa.appendChild(opt);
        });
      });
  }

  function cargarTiposMovimiento() {
    fetch("/api/tipos_movimiento")
      .then(res => res.json())
      .then(data => {
        // Actualiza Awesomplete
        if (window.Awesomplete) {
          window.awesomplete = new Awesomplete(inputTipoMovimiento, {
            list: data.map(t => t.nombre),
            minChars: 0,
            autoFirst: true,
            maxItems: 999,
            sort: (a, b) => a.value.localeCompare(b.value, 'es', { sensitivity: 'base' })
          });
        }
      });
  }

  cargarEmpresas();
  cargarTiposMovimiento();

  // Mostrar el modal para agregar empresa/tipo
  if (btnAgregarEmpresa) {
    btnAgregarEmpresa.addEventListener("click", () => {
      if (!modalOpcionesTitulo || !modalOpciones || !inputNuevaOpcion || !listaOpciones || !btnGuardarOpcion) return;
      modalOpcionesTitulo.textContent = "Agregar empresa";
      modalOpciones.style.display = "block";
      inputNuevaOpcion.value = "";
      listaOpciones.innerHTML = "";
      btnGuardarOpcion.onclick = () => {
        const nombre = inputNuevaOpcion.value.trim();
        if (nombre) {
          fetch("/api/empresas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
          }).then(() => {
            cargarEmpresas();
            modalOpciones.style.display = "none";
          });
        }
      };
    });
  }

  if (btnAgregarTipo) {
    btnAgregarTipo.addEventListener("click", () => {
      if (!modalOpcionesTitulo || !modalOpciones || !inputNuevaOpcion || !listaOpciones || !btnGuardarOpcion) return;
      modalOpcionesTitulo.textContent = "Agregar tipo de movimiento";
      modalOpciones.style.display = "block";
      inputNuevaOpcion.value = "";
      listaOpciones.innerHTML = "";
      btnGuardarOpcion.onclick = () => {
        const nombre = inputNuevaOpcion.value.trim();
        if (nombre) {
          fetch("/api/tipos_movimiento", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre })
          }).then(() => {
            cargarTiposMovimiento();
            modalOpciones.style.display = "none";
          });
        }
      };
    });
  }

  if (btnCerrarOpciones && modalOpciones) {
    btnCerrarOpciones.addEventListener("click", () => {
      modalOpciones.style.display = "none";
    });
  }

  // Múltiples movimientos automáticos (lógica original)
  activarMultiples.addEventListener("change", () => {
    opcionesMultiples.style.display = activarMultiples.checked ? "flex" : "none";
  });

  // --- MÚLTIPLES MOVIMIENTOS AUTOMÁTICOS ---
  if (activarMultiples && opcionesMultiples && recordatorioInicio && mesFinMultiple && explicacionMultiples && inputFecha) {
    activarMultiples.addEventListener("change", () => {
      if (activarMultiples.checked) {
        opcionesMultiples.style.display = "block";
        actualizarRecordatorioYExplicacion();
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
  formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    if (guardando) return;

    const tipo = tipoSelect.value;
    const tipoMovimiento = inputTipoMovimiento.value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const fecha = inputFecha.value.trim();
    const mes = document.getElementById("mes").value;
    const año = document.getElementById("año").value;
    const monto = parseFloat(document.getElementById("monto").value);
    const empresa = selectEmpresa.value;

    if (!tipo || !tipoMovimiento || !descripcion || !fecha || isNaN(monto)) return;

    guardando = true;

    // --- MODO MÚLTIPLE ---
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

      window.storageAPI.leerDatos().then(movimientos => {
        movimientos = Array.isArray(movimientos) ? movimientos : [];
        movimientos.push(...movimientosMultiples);
        return window.storageAPI.escribirDatos(movimientos);
      }).then(() => {
        formulario.reset();
        actualizarAwesomplete(tipoSelect.value);
        mostrarToast(`✅ Se guardaron ${movimientosMultiples.length} movimientos correctamente.`);
      }).catch(err => {
        console.error(err);
      }).finally(() => {
        guardando = false;
      });

      return; // Detiene aquí si es múltiple
    }

    // --- MODO NORMAL ---
    const nuevoMovimiento = {
      id: Date.now(),
      tipo,
      tipoMovimiento,
      descripcion,
      fecha,
      mes,
      año,
      monto,
      empresa,
      estado: "Pendiente"
    };

    window.storageAPI.leerDatos().then(movimientos => {
      movimientos = Array.isArray(movimientos) ? movimientos : [];
      movimientos.push(nuevoMovimiento);
      return window.storageAPI.escribirDatos(movimientos);
    }).then(() => {
      formulario.reset();
      actualizarAwesomplete(tipoSelect.value);
      mostrarToast("✅ Movimiento guardado correctamente.");
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      guardando = false;
    });
  });

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
            // Eliminar la empresa antigua y agregar la nueva
            await fetch(`/api/empresas`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nombre: nuevoValor })
            });
            // No hay endpoint para editar, así que solo agregamos la nueva
            cargarEmpresas();
            cargarListaOpciones();
          } else if (modoOpciones === "tipo") {
            await fetch(`/api/tipos_movimiento`, {
              method: "POST",
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
          // No hay endpoint para eliminar empresa, pero podrías agregarlo en Flask
          alert("Eliminar empresa no implementado en la API");
        } else if (modoOpciones === "tipo") {
          alert("Eliminar tipo de movimiento no implementado en la API");
        }
        cargarEmpresas();
        cargarTiposMovimiento();
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
});