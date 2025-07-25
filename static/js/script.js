// script.js limpio y funcional usando backend con base de datos (Render)
// Funciones para el spinner
const showSpinner = () => document.getElementById('spinner').classList.add('loading');
const hideSpinner = () => document.getElementById('spinner').classList.remove('loading');

// Cache para datos
const cache = {
  empresas: [],
  tiposMovimiento: {
    ingreso: [],
    egreso: []
  },
  ultimaActualizacion: {
    empresas: 0,
    tiposMovimiento: 0
  }
};

// Tiempo de caducidad del cache en milisegundos (5 minutos)
const CACHE_EXPIRY = 5 * 60 * 1000;

document.addEventListener("DOMContentLoaded", () => {
  // --- Referencias al DOM usando un objeto para mejor organización ---
  const elements = {
    formulario: document.getElementById("formulario"),
    tipoSelect: document.getElementById("tipo"),
    inputTipoMovimiento: document.getElementById("tiposmovimientos"),
    selectEmpresa: document.getElementById("empresa"),
    activarMultiples: document.getElementById("activar-multiples"),
    opcionesMultiples: document.getElementById("opciones-multiples"),
    recordatorioInicio: document.getElementById("recordatorio-inicio"),
    mesFinMultiple: document.getElementById("mes-fin-multiple"),
    explicacionMultiples: document.getElementById("explicacion-multiples"),
    inputFecha: document.getElementById("fecha"),
    modalOpciones: document.getElementById("modal-opciones"),
    tituloOpciones: document.getElementById("modal-opciones-titulo"),
    inputNuevaOpcion: document.getElementById("input-nueva-opcion"),
    btnGuardarOpcion: document.getElementById("btn-guardar-opcion"),
    listaOpciones: document.getElementById("lista-opciones"),
    btnCerrarOpciones: document.getElementById("btn-cerrar-opciones"),
    btnAgregarEmpresa: document.getElementById("btn-agregar-empresa"),
    btnAgregarTipo: document.getElementById("btn-agregar-tipo")
  };

  // Configuración de z-index para modal
  elements.modalOpciones?.style?.setProperty('z-index', '1000');

  // --- Variables de estado ---
  const state = {
    modoOpciones: "",
    tipoOpciones: "",
    guardando: false,
    awesompleteInicio: null
  };

  // Inicializar Awesomplete para el campo de tipo de movimiento
  if (elements.inputTipoMovimiento) {
    state.awesompleteInicio = new Awesomplete(elements.inputTipoMovimiento, {
      list: [],
      minChars: 0,
      autoFirst: true,
      maxItems: 999
    });
  }

  // Actualizar opciones de Awesomplete
  function actualizarAwesompleteInicio(tipo) {
    let opciones = [];
    if (tipo === 'ingreso') opciones = opcionesIngreso;
    else if (tipo === 'egreso') opciones = opcionesEgreso;
    if (state.awesompleteInicio) state.awesompleteInicio.list = opciones;
  }

  // --- Definición de funciones ---
  // Función para verificar si el cache está vigente
  function isCacheValid(key) {
    const now = Date.now();
    return (now - cache.ultimaActualizacion[key]) < CACHE_EXPIRY;
  }

  // Función para cargar datos con cache
  async function fetchConCache(url, cacheKey) {
    if (cache[cacheKey] && isCacheValid(cacheKey)) {
      return cache[cacheKey];
    }

    showSpinner();
    try {
      const response = await fetch(url);
      const data = await response.json();
      cache[cacheKey] = data;
      cache.ultimaActualizacion[cacheKey] = Date.now();
      return data;
    } catch (error) {
      console.error('Error al cargar datos:', error);
      return cache[cacheKey] || []; // Usar cache antiguo si hay error
    } finally {
      hideSpinner();
    }
  }

  // Función optimizada para actualizar opciones
  async function actualizarOpcionesTipoMovimiento() {
    const tipo = elements.tipoSelect.value;
    const tipos = await fetchConCache(`/api/tipos_movimiento?tipo=${tipo}`, 'tiposMovimiento');
    
    if (tipo === 'ingreso') {
      opcionesIngreso = tipos.map(t => t.nombre);
    } else if (tipo === 'egreso') {
      opcionesEgreso = tipos.map(t => t.nombre);
    }
    actualizarAwesompleteInicio(tipo);
  }

  function cargarEmpresas() {
    showSpinner();
    fetch('/api/empresas')
      .then(res => res.json())
      .then(empresas => {
        selectEmpresa.innerHTML = '';
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Seleccionar...';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        selectEmpresa.appendChild(defaultOption);
        empresas.forEach(empresa => {
          const option = document.createElement('option');
          option.value = empresa.nombre;
          option.textContent = empresa.nombre;
          selectEmpresa.appendChild(option);
        });
      })
      .finally(() => hideSpinner());
  }

  function cargarListaOpciones() {
    listaOpciones.innerHTML = "";
    showSpinner();
    if (modoOpciones === "empresa") {
      fetch('/api/empresas')
        .then(res => res.json())
        .then(empresas => {
          empresas.forEach(empresa => agregarElementoLista(empresa.nombre));
          agregarEventosOpciones();
        })
        .finally(() => hideSpinner());
    } else if (modoOpciones === "tipo") {
      fetch(`/api/tipos_movimiento?tipo=${tipoOpciones}`)
        .then(res => res.json())
        .then(tipos => {
          tipos.forEach(tipo => agregarElementoLista(tipo.nombre));
          agregarEventosOpciones();
        })
        .finally(() => hideSpinner());
    }
  }

  function agregarElementoLista(valor) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.padding = "4px 0";
    li.innerHTML = `
      <span>${valor}</span>
      <span>
        <button class="btn-editar-opcion" title="Editar" data-valor="${valor}">&#9998;</button>
        <button class="btn-eliminar-opcion" title="Eliminar" data-valor="${valor}">&#128465;</button>
      </span>
    `;
    listaOpciones.appendChild(li);
  }

  function agregarEventosOpciones() {
    listaOpciones.querySelectorAll(".btn-editar-opcion").forEach(btn => {
      btn.onclick = function () {
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
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            editando = false;
            const nuevoValor = input.value.trim();
            if (!nuevoValor || nuevoValor === valorAntiguo) return cargarListaOpciones();

            if (modoOpciones === "empresa") {
              fetch(`/api/empresas/${encodeURIComponent(valorAntiguo)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoValor })
              }).then(() => {
                cargarListaOpciones();
                cargarEmpresas();
              });
            } else if (modoOpciones === "tipo") {
              fetch(`/api/tipos_movimiento/${encodeURIComponent(valorAntiguo)}?tipo=${tipoOpciones}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoValor })
              }).then(() => {
                cargarListaOpciones();
                actualizarOpcionesTipoMovimiento();
              });
            }
          }
          if (e.key === "Escape") {
            editando = false;
            cargarListaOpciones();
          }
        });
        input.addEventListener("blur", () => {
          if (editando) cargarListaOpciones();
        });
      };
    });

    listaOpciones.querySelectorAll(".btn-eliminar-opcion").forEach(btn => {
      btn.onclick = function () {
        const valor = btn.dataset.valor;
        mostrarConfirmacionEliminar(`¿Seguro que deseas eliminar "${valor}"?`).then(confirmado => {
          if (!confirmado) return;
          
          const url = modoOpciones === "empresa" ? 
            `/api/empresas/${encodeURIComponent(valor)}` : 
            `/api/tipos_movimiento/${encodeURIComponent(valor)}?tipo=${tipoOpciones}`;
          
          fetch(url, { method: 'DELETE' })
            .then(async res => {
              const text = await res.text();
              try {
                const data = JSON.parse(text);
                if (!data.status || data.status === 'error') {
                  throw new Error(data.error || 'Error al eliminar');
                }
                if (modoOpciones === "empresa") cargarEmpresas();
                cargarListaOpciones();
                if (modoOpciones === "tipo") actualizarOpcionesTipoMovimiento();
              } catch (e) {
                throw new Error('Error al eliminar: ' + text);
              }
            })
            .catch(error => {
              console.error('Error:', error);
              alert(error.message || 'Error al eliminar. Por favor, intenta de nuevo.');
            });
        });
      };
    });
  }

  function mostrarConfirmacionEliminar(mensaje) {
    return new Promise(resolve => {
      let modal = document.getElementById('modal-confirmar-eliminar');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-confirmar-eliminar';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.3)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '999999';  // Aseguramos que siempre esté por encima
        modal.innerHTML = `
          <div style="background:#fff;padding:24px 32px;border-radius:8px;box-shadow:0 2px 16px #0002;text-align:center;min-width:260px;max-width:90vw;z-index:99999;">
            <div id="mensaje-confirmar-eliminar" style="margin-bottom:18px;font-size:1.1em;"></div>
            <button id="btn-confirmar-si" style="margin-right:16px;" class="btn btn-danger">Sí</button>
            <button id="btn-confirmar-no" class="btn btn-secondary">No</button>
          </div>
        `;
        document.body.appendChild(modal);
      }
      const msg = modal.querySelector('#mensaje-confirmar-eliminar');
      const btnSi = modal.querySelector('#btn-confirmar-si');
      const btnNo = modal.querySelector('#btn-confirmar-no');
      msg.textContent = mensaje;
      modal.style.display = 'flex';
      
      function cerrar(res) {
        modal.style.display = 'none';
        btnSi.removeEventListener('click', onSi);
        btnNo.removeEventListener('click', onNo);
        resolve(res);
      }
      function onSi() { cerrar(true); }
      function onNo() { cerrar(false); }
      btnSi.addEventListener('click', onSi);
      btnNo.addEventListener('click', onNo);
    });
  }

  function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  }

  // --- Event Listeners ---
  // Obtener referencias a elementos del DOM
  const tipoSelect = elements.tipoSelect;
  const inputTipoMovimiento = elements.inputTipoMovimiento;

  // Agregar event listeners si los elementos existen
  if (tipoSelect) {
    tipoSelect.addEventListener('change', function(e) {
      actualizarOpcionesTipoMovimiento();
      if (inputTipoMovimiento) {
        inputTipoMovimiento.value = '';
      }
    });
  }

  // Al enfocar el input, muestra todas las opciones
  if (inputTipoMovimiento) {
    inputTipoMovimiento.addEventListener("focus", function() {
      this.value = "";
      if (state.awesompleteInicio) state.awesompleteInicio.evaluate();
    });
  }

  elements.btnAgregarEmpresa?.addEventListener("click", () => {
    state.modoOpciones = "empresa";
    state.tipoOpciones = "";
    elements.tituloOpciones.textContent = "Empresas";
    elements.inputNuevaOpcion.placeholder = "Nueva empresa...";
    elements.modalOpciones.style.display = "flex";
    cargarListaOpciones();
  });

  elements.btnAgregarTipo?.addEventListener("click", () => {
    state.modoOpciones = "tipo";
    state.tipoOpciones = elements.tipoSelect?.value || "ingreso";
    elements.tituloOpciones.textContent = `Tipos de Movimiento (${state.tipoOpciones})`;
    elements.inputNuevaOpcion.placeholder = "Nuevo tipo de movimiento...";
    elements.modalOpciones.style.display = "flex";
    cargarListaOpciones();
  });

  elements.btnCerrarOpciones?.addEventListener("click", () => {
    elements.modalOpciones.style.display = "none";
    elements.inputNuevaOpcion.value = "";
    elements.listaOpciones.innerHTML = "";
  });

  btnGuardarOpcion.addEventListener("click", () => {
    const valor = inputNuevaOpcion.value.trim();
    if (!valor) return;
    if (modoOpciones === "empresa") {
      fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: valor })
      }).then(() => {
        cargarEmpresas();
        cargarListaOpciones();
        inputNuevaOpcion.value = "";
      });
    } else if (modoOpciones === "tipo") {
      fetch('/api/tipos_movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: valor, tipo: tipoOpciones })
      }).then(() => {
        cargarListaOpciones();
        actualizarOpcionesTipoMovimiento();
        inputNuevaOpcion.value = "";
      });
    }
  });

  // Función para actualizar la explicación de múltiples movimientos
  function actualizarExplicacionMultiples() {
    const fechaInicioStr = inputFecha.value;
    if (!fechaInicioStr) return;

    const [anioI, mesI, diaI] = fechaInicioStr.split('-');
    const diaOriginal = parseInt(diaI);
    
    // Función para obtener el último día del mes
    const obtenerUltimoDiaMes = (anio, mes) => {
      return new Date(anio, mes + 1, 0).getDate();
    };

    // Función para ajustar la fecha al último día si es necesario
    const ajustarFecha = (anio, mes, dia) => {
      const ultimoDia = obtenerUltimoDiaMes(anio, mes);
      return dia > ultimoDia ? ultimoDia : dia;
    };

    // Formateamos la fecha manualmente
    const formatearFecha = (fecha) => {
      return `${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}/${fecha.getFullYear()}`;
    };

    // Ajustamos la fecha de inicio si es necesario
    const mesInicio = parseInt(mesI) - 1;
    const diaAjustadoInicio = ajustarFecha(parseInt(anioI), mesInicio, diaOriginal);
    const fechaInicio = new Date(parseInt(anioI), mesInicio, diaAjustadoInicio);

    recordatorioInicio.textContent = `Fecha de inicio: ${formatearFecha(fechaInicio)}`;
    
    if (!mesFinMultiple.value) return;

    const [anioFin, mesFin] = mesFinMultiple.value.split('-');
    const mesFinal = parseInt(mesFin) - 1;
    const diaAjustadoFin = ajustarFecha(parseInt(anioFin), mesFinal, diaOriginal);
    const fechaFin = new Date(parseInt(anioFin), mesFinal, diaAjustadoFin);

    const meses = (fechaFin.getFullYear() - fechaInicio.getFullYear()) * 12 + 
                 (fechaFin.getMonth() - fechaInicio.getMonth()) + 1;

    // Construir la explicación de las fechas
    let explicacion = `Se crearán ${meses} movimientos en las siguientes fechas:\n`;
    let mesActual = mesInicio;
    let anioActual = parseInt(anioI);
    let fechas = [];

    // Generar todas las fechas
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
    
    explicacionMultiples.textContent = explicacion;
  }

  // Event listener para el checkbox de múltiples movimientos
  activarMultiples.addEventListener('change', function() {
    opcionesMultiples.style.display = this.checked ? 'flex' : 'none';
    if (this.checked) actualizarExplicacionMultiples();
  });

  // Event listeners para actualizar la explicación
  inputFecha.addEventListener('change', () => {
    if (activarMultiples.checked) actualizarExplicacionMultiples();
  });

  mesFinMultiple.addEventListener('change', () => {
    if (activarMultiples.checked) actualizarExplicacionMultiples();
  });

  // Función auxiliar para obtener el último día del mes
  const obtenerUltimoDiaMes = (anio, mes) => {
    return new Date(anio, mes + 1, 0).getDate();
  };

  // Función auxiliar para ajustar la fecha al último día si es necesario
  const ajustarFecha = (anio, mes, dia) => {
    const ultimoDia = obtenerUltimoDiaMes(anio, mes);
    return dia > ultimoDia ? ultimoDia : dia;
  };

  formulario.addEventListener("submit", function (e) {
    e.preventDefault();
    if (guardando) return;

    const tipo = tipoSelect.value;
    const tipoMovimiento = inputTipoMovimiento.value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const fecha = inputFecha.value.trim();
    const mes = document.getElementById("mes").value;
    const anio = document.getElementById("año").value;
    const monto = parseFloat(document.getElementById("monto").value);
    const empresa = selectEmpresa.value;

    if (!tipo || !tipoMovimiento || !descripcion || !fecha || isNaN(monto)) return;
    guardando = true;

    // Función para crear un movimiento para una fecha específica

    const crearMovimiento = async (fechaMovimiento) => {
      const fechaObj = new Date(fechaMovimiento);
      const mesMovimiento = fechaObj.toLocaleString('es', { month: 'long' });
      const anioMovimiento = fechaObj.getFullYear().toString();
      
      const nuevoMovimiento = {
        tipo,
        tipoMovimiento,
        descripcion,
        fecha: fechaMovimiento,
        mes: mesMovimiento.charAt(0).toUpperCase() + mesMovimiento.slice(1),
        anio: anioMovimiento,
        monto,
        empresa,
        estado: "Pendiente"
      };

      return fetch('/api/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoMovimiento)
      });
    };

    // Procesar movimientos únicos o múltiples
    if (!activarMultiples.checked || !mesFinMultiple.value) {
      // Movimiento único
      crearMovimiento(fecha)
        .then(() => {
          formulario.reset();
          mostrarToast("✅ Movimiento guardado correctamente.");
        })
        .catch(console.error)
        .finally(() => guardando = false);
    } else {
      // Movimientos múltiples
      const [anioInicio, mesInicio, diaInicio] = fecha.split('-');
      const [anioFin, mesFin] = mesFinMultiple.value.split('-');
      
      const movimientos = [];
      let mesActual = parseInt(mesInicio) - 1;  // 0-based
      let anioActual = parseInt(anioInicio);
      const diaOriginal = parseInt(diaInicio);
      const mesFinal = parseInt(mesFin) - 1;
      const anioFinal = parseInt(anioFin);
      
      // Calcular el número total de meses
      const mesesTotales = (anioFinal - anioActual) * 12 + (mesFinal - mesActual);
      
      // Crear un movimiento para cada mes
      for (let i = 0; i <= mesesTotales; i++) {
        const diaAjustado = ajustarFecha(anioActual, mesActual, diaOriginal);
        const fechaAjustada = new Date(anioActual, mesActual, diaAjustado);
        const fechaStr = fechaAjustada.toISOString().split('T')[0];
        movimientos.push(crearMovimiento(fechaStr));
        
        // Avanzar al siguiente mes
        mesActual++;
        if (mesActual > 11) {
          mesActual = 0;
          anioActual++;
        }
      }

      Promise.all(movimientos)
        .then(() => {
          formulario.reset();
          mostrarToast(`✅ ${movimientos.length} movimientos guardados correctamente.`);
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Ocurrió un error al guardar algunos movimientos. Por favor, verifica en la sección de movimientos.');
        })
        .finally(() => guardando = false);
    }
  });

  // --- Inicialización ---
  cargarEmpresas();
  actualizarOpcionesTipoMovimiento();
});
