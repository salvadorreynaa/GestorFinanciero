let guardando = false;

document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos del DOM
  const formulario = document.getElementById("formulario");
  const tipoSelect = document.getElementById("tipo");
  const inputTipoMovimiento = document.getElementById("tiposmovimientos");
  const selectEmpresa = document.getElementById("empresa");

  // Múltiples movimientos automáticos
  const activarMultiples = document.getElementById("activar-multiples");
  const opcionesMultiples = document.getElementById("opciones-multiples");
  const recordatorioInicio = document.getElementById("recordatorio-inicio");
  const mesFinMultiple = document.getElementById("mes-fin-multiple");
  const explicacionMultiples = document.getElementById("explicacion-multiples");
  const inputFecha = document.getElementById("fecha");

  // Opciones de ingreso y egreso (se cargan desde JSON)
  let opcionesIngreso = [];
  let opcionesEgreso = [];

  // Cargar tipos de ingreso y egreso desde JSON al iniciar
  window.storageAPI.leerTipoingreso().then(tipos => {
    opcionesIngreso = Array.isArray(tipos) ? tipos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })) : [];
    if (tipoSelect.value === "ingreso") actualizarAwesomplete("ingreso");
  });

  window.storageAPI.leerTipoegreso().then(tipos => {
    opcionesEgreso = Array.isArray(tipos) ? tipos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })) : [];
    if (tipoSelect.value === "egreso") actualizarAwesomplete("egreso");
  });

  // Instancia de Awesomplete
  let awesomplete;

  function actualizarAwesomplete(tipo) {
    let opciones = [];
    if (tipo === 'ingreso') {
      opciones = opcionesIngreso;
    } else if (tipo === 'egreso') {
      opciones = opcionesEgreso;
    } else {
      opciones = [];
    }

    if (!awesomplete) {
      awesomplete = new Awesomplete(inputTipoMovimiento, {
        list: opciones,
        minChars: 0,
        autoFirst: true,
        maxItems: 999,
        sort: (a, b) => a.value.localeCompare(b.value, 'es', { sensitivity: 'base' })
      });
    } else {
      awesomplete.list = opciones;
      awesomplete.sort = (a, b) => a.value.localeCompare(b.value, 'es', { sensitivity: 'base' });
    }
  }

  // Inicializa Awesomplete al cargar
  actualizarAwesomplete(tipoSelect.value);

  // Cambia las opciones cuando cambia el tipo
  tipoSelect.addEventListener('change', (e) => {
    actualizarAwesomplete(e.target.value);
  });

  // Permite mostrar todas las opciones al hacer clic en el input
  inputTipoMovimiento.addEventListener("focus", function() {
    this.value = "";
    awesomplete.evaluate();
  });

  // Función para cargar empresas en el select
  function cargarEmpresas() {
    selectEmpresa.innerHTML = '<option value="">Selecciona...</option>';
    window.storageAPI.leerEmpresas().then(empresas => {
      empresas.forEach(empresa => {
        const option = document.createElement("option");
        option.value = empresa;
        option.textContent = empresa;
        selectEmpresa.appendChild(option);
      });
    });
  }

  // Inicializar empresas al cargar la página
  cargarEmpresas();

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
  const modalOpciones = document.getElementById("modal-opciones");
  const tituloOpciones = document.getElementById("modal-opciones-titulo");
  const inputNuevaOpcion = document.getElementById("input-nueva-opcion");
  const btnGuardarOpcion = document.getElementById("btn-guardar-opcion");
  const listaOpciones = document.getElementById("lista-opciones");
  const btnCerrarOpciones = document.getElementById("btn-cerrar-opciones");

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

  btnCerrarOpciones.addEventListener("click", () => {
    modalOpciones.style.display = "none";
  });
  modalOpciones.addEventListener("click", (e) => {
    if (e.target === modalOpciones) modalOpciones.style.display = "none";
  });

  btnGuardarOpcion.addEventListener("click", guardarOpcion);

  inputNuevaOpcion.addEventListener("keydown", (e) => {
    if (e.key === "Enter") guardarOpcion();
  });

  function guardarOpcion() {
    const valor = inputNuevaOpcion.value.trim();
    if (!valor) return;
    if (modoOpciones === "empresa") {
      window.storageAPI.leerEmpresas().then(empresas => {
        if (!empresas.includes(valor)) {
          empresas.push(valor);
          empresas.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
          return window.storageAPI.escribirEmpresas(empresas);
        }
      }).then(() => {
        cargarEmpresas();
        cargarListaOpciones();
        inputNuevaOpcion.value = "";
      });
    } else if (modoOpciones === "tipo") {
      const archivo = tipoOpciones === "egreso" ? "tipoegreso" : "tipoingreso";
      window.storageAPI[`leer${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`]()
        .then(tipos => {
          if (!tipos.includes(valor)) {
            tipos.push(valor);
            tipos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
            return window.storageAPI[`escribir${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`](tipos);
          }
        }).then(() => {
          // Actualiza la lista de Awesomplete
          if (tipoOpciones === "ingreso") {
            opcionesIngreso.push(valor);
            opcionesIngreso.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
          } else {
            opcionesEgreso.push(valor);
            opcionesEgreso.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
          }
          if (tipoSelect.value === tipoOpciones) actualizarAwesomplete(tipoOpciones);
          cargarListaOpciones();
          inputNuevaOpcion.value = "";
        });
    }
  }

  function cargarListaOpciones() {
    listaOpciones.innerHTML = "";
    if (modoOpciones === "empresa") {
      window.storageAPI.leerEmpresas().then(empresas => {
        empresas.forEach(empresa => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";
          li.style.padding = "4px 0";
          li.innerHTML = `
            <span>${empresa}</span>
            <span>
              <button class="btn-editar-opcion" title="Editar" data-valor="${empresa}">&#9998;</button>
              <button class="btn-eliminar-opcion" title="Eliminar" data-valor="${empresa}">&#128465;</button>
            </span>
          `;
          listaOpciones.appendChild(li);
        });
        agregarEventosOpciones();
      });
    } else if (modoOpciones === "tipo") {
      const archivo = tipoOpciones === "egreso" ? "tipoegreso" : "tipoingreso";
      window.storageAPI[`leer${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`]()
        .then(tipos => {
          tipos.forEach(tipo => {
            const li = document.createElement("li");
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.padding = "4px 0";
            li.innerHTML = `
              <span>${tipo}</span>
              <span>
                <button class="btn-editar-opcion" title="Editar" data-valor="${tipo}">&#9998;</button>
                <button class="btn-eliminar-opcion" title="Eliminar" data-valor="${tipo}">&#128465;</button>
              </span>
            `;
            listaOpciones.appendChild(li);
          });
          agregarEventosOpciones();
        });
    }
  }

  function agregarEventosOpciones() {
    // Editar inline
    listaOpciones.querySelectorAll(".btn-editar-opcion").forEach(btn => {
      btn.onclick = function() {
        const li = btn.closest("li");
        const valorAntiguo = btn.dataset.valor;
        const span = li.querySelector("span:first-child");
        // Si ya está editando, no hacer nada
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
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            editando = false;
            guardarEdicion();
          }
          if (e.key === "Escape") {
            editando = false;
            cancelarEdicion();
          }
        });
        input.addEventListener("blur", () => {
          if (editando) cancelarEdicion();
        });

        function guardarEdicion() {
          const nuevoValor = input.value.trim();
          if (!nuevoValor || nuevoValor === valorAntiguo) { cancelarEdicion(); return; }
          if (modoOpciones === "empresa") {
            window.storageAPI.leerEmpresas().then(empresas => {
              const idx = empresas.indexOf(valorAntiguo);
              if (idx !== -1) {
                empresas[idx] = nuevoValor;
                empresas.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                return window.storageAPI.escribirEmpresas(empresas);
              }
            }).then(() => {
              cargarEmpresas();
              cargarListaOpciones();
            });
          } else if (modoOpciones === "tipo") {
            const archivo = tipoOpciones === "egreso" ? "tipoegreso" : "tipoingreso";
            window.storageAPI[`leer${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`]()
              .then(tipos => {
                const idx = tipos.indexOf(valorAntiguo);
                if (idx !== -1) {
                  tipos[idx] = nuevoValor;
                  tipos.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                  return window.storageAPI[`escribir${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`](tipos);
                }
              }).then(() => {
                if (tipoOpciones === "ingreso") {
                  opcionesIngreso = opcionesIngreso.map(t => t === valorAntiguo ? nuevoValor : t);
                  opcionesIngreso.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                } else {
                  opcionesEgreso = opcionesEgreso.map(t => t === valorAntiguo ? nuevoValor : t);
                  opcionesEgreso.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
                }
                if (tipoSelect.value === tipoOpciones) actualizarAwesomplete(tipoOpciones);
                cargarListaOpciones();
              });
          }
        }
        function cancelarEdicion() {
          cargarListaOpciones();
        }
      };
    });

    // Eliminar con modal personalizado
    listaOpciones.querySelectorAll(".btn-eliminar-opcion").forEach(btn => {
      btn.onclick = function() {
        const valor = btn.dataset.valor;
        mostrarConfirmacionEliminar(`¿Seguro que deseas eliminar "${valor}"?`).then(confirmado => {
          if (!confirmado) return;
          if (modoOpciones === "empresa") {
            window.storageAPI.leerEmpresas().then(empresas => {
              const idx = empresas.indexOf(valor);
              if (idx !== -1) {
                empresas.splice(idx, 1);
                return window.storageAPI.escribirEmpresas(empresas);
              }
            }).then(() => {
              cargarEmpresas();
              cargarListaOpciones();
            });
          } else if (modoOpciones === "tipo") {
            const archivo = tipoOpciones === "egreso" ? "tipoegreso" : "tipoingreso";
            window.storageAPI[`leer${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`]()
              .then(tipos => {
                const idx = tipos.indexOf(valor);
                if (idx !== -1) {
                  tipos.splice(idx, 1);
                  return window.storageAPI[`escribir${archivo.charAt(0).toUpperCase() + archivo.slice(1)}`](tipos);
                }
              }).then(() => {
                if (tipoOpciones === "ingreso") {
                  opcionesIngreso = opcionesIngreso.filter(t => t !== valor);
                } else {
                  opcionesEgreso = opcionesEgreso.filter(t => t !== valor);
                }
                if (tipoSelect.value === tipoOpciones) actualizarAwesomplete(tipoOpciones);
                cargarListaOpciones();
              });
          }
        });
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