// script.js limpio y funcional usando backend con base de datos (Render)
document.addEventListener("DOMContentLoaded", () => {
  let guardando = false;

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
    tipoOpciones = tipoSelect.value === "egreso" ? "egreso" : "ingreso";
    tituloOpciones.textContent = tipoOpciones === "egreso" ? "Tipos de Egreso" : "Tipos de Ingreso";
    inputNuevaOpcion.placeholder = "Nuevo tipo...";
    inputNuevaOpcion.value = "";
    cargarListaOpciones();
    modalOpciones.style.display = "flex";
    inputNuevaOpcion.focus();
  });

  btnCerrarOpciones.addEventListener("click", () => modalOpciones.style.display = "none");
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

            const url = modoOpciones === "empresa" ? '/api/empresas' : '/api/tipos_movimiento';
            const body = modoOpciones === "empresa"
              ? { antiguo: valorAntiguo, nuevo: nuevoValor }
              : { antiguo: valorAntiguo, nuevo: nuevoValor, tipo: tipoOpciones };

            fetch(url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            }).then(() => cargarListaOpciones());
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
        if (!confirm(`¿Seguro que deseas eliminar "${valor}"?`)) return;

        const url = modoOpciones === "empresa" ? `/api/empresas/${encodeURIComponent(valor)}` : `/api/tipos_movimiento/${encodeURIComponent(valor)}?tipo=${tipoOpciones}`;

        fetch(url, { method: 'DELETE' })
          .then(() => {
            if (modoOpciones === "empresa") cargarEmpresas();
            cargarListaOpciones();
          });
      };
    });
  }

  function cargarEmpresas() {
    fetch('/api/empresas')
      .then(res => res.json())
      .then(empresas => {
        selectEmpresa.innerHTML = '';
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