// script.js limpio y funcional usando backend con base de datos (Render)
document.addEventListener("DOMContentLoaded", () => {
  // ...existing code...

  function cargarEmpresas() {
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
      });
  }
  // ...existing code...
  // (después de inicializar todas las variables DOM)

  function actualizarOpcionesTipoMovimiento() {
    const tipo = tipoSelect.value;
    fetch(`/api/tipos_movimiento?tipo=${tipo}`)
  // --- Referencias al DOM ---
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

  // --- Modal de opciones ---
  const modalOpciones = document.getElementById("modal-opciones");
  const tituloOpciones = document.getElementById("modal-opciones-titulo");
  const inputNuevaOpcion = document.getElementById("input-nueva-opcion");
  const btnGuardarOpcion = document.getElementById("btn-guardar-opcion");
  const listaOpciones = document.getElementById("lista-opciones");
  const btnCerrarOpciones = document.getElementById("btn-cerrar-opciones");

  let modoOpciones = "";
  let tipoOpciones = "";

  // Actualiza las opciones de tipo de movimiento según el tipo seleccionado
  function actualizarOpcionesTipoMovimiento() {
    const tipo = tipoSelect.value;
    fetch(`/api/tipos_movimiento?tipo=${tipo}`)
      .then(res => res.json())
      .then(tipos => {
        inputTipoMovimiento.value = '';
        let datalist = document.getElementById('datalist-tipo-movimiento');
        if (!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = 'datalist-tipo-movimiento';
          inputTipoMovimiento.setAttribute('list', 'datalist-tipo-movimiento');
          document.body.appendChild(datalist);
        }
        datalist.innerHTML = '';
        tipos.forEach(tipoObj => {
          const option = document.createElement('option');
          option.value = tipoObj.nombre;
          datalist.appendChild(option);
        });
      });
  }

  tipoSelect.addEventListener('change', actualizarOpcionesTipoMovimiento);
  actualizarOpcionesTipoMovimiento();

  // ...resto del código (listeners, funciones, etc)...
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
        inputNuevaOpcion.value = "";
      });
    }
  }

  function cargarListaOpciones() {
    listaOpciones.innerHTML = "";
    if (modoOpciones === "empresa") {
      fetch('/api/empresas')
        .then(res => res.json())
        .then(empresas => {
          empresas.forEach(empresa => agregarElementoLista(empresa.nombre));
          agregarEventosOpciones();
        });
    } else if (modoOpciones === "tipo") {
      fetch(`/api/tipos_movimiento?tipo=${tipoOpciones}`)
        .then(res => res.json())
        .then(tipos => {
          tipos.forEach(tipo => agregarElementoLista(tipo.nombre));
          agregarEventosOpciones();
        });
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
              }).then(() => cargarListaOpciones());
            } else if (modoOpciones === "tipo") {
              fetch(`/api/tipos_movimiento/${encodeURIComponent(valorAntiguo)}?tipo=${tipoOpciones}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoValor })
              }).then(() => cargarListaOpciones());
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
          const url = modoOpciones === "empresa" ? `/api/empresas/${encodeURIComponent(valor)}` : `/api/tipos_movimiento/${encodeURIComponent(valor)}?tipo=${tipoOpciones}`;
          fetch(url, { method: 'DELETE' })
            .then(() => {
              if (modoOpciones === "empresa") cargarEmpresas();
              cargarListaOpciones();
            });
        });
      };
    });
  // Modal de confirmación personalizado
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
        modal.style.zIndex = '99999'; // z-index mayor para que siempre esté delante
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
  }

  function cargarEmpresas() {
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
      });
  }

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

    const nuevoMovimiento = {
      tipo,
      tipoMovimiento,
      descripcion,
      fecha,
      mes,
      anio,
      monto,
      empresa,
      estado: "Pendiente"
    };

    fetch('/api/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoMovimiento)
    }).then(() => {
      formulario.reset();
      mostrarToast("✅ Movimiento guardado correctamente.");
    }).catch(console.error).finally(() => guardando = false);
  });

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

  cargarEmpresas();
});