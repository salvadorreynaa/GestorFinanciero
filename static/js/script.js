document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM cargado, iniciando aplicación...');
  
  // Establecer la fecha actual por defecto y disparar el evento change
  const fechaActual = new Date().toISOString().split('T')[0];
  if (elements.inputFecha) {
    elements.inputFecha.value = fechaActual;
    elements.inputFecha.dispatchEvent(new Event('change'));
  }

  // Función para mostrar notificaciones
  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = type === 'success' ? '#4caf50' : '#f44336';
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  // Referencias del DOM
  const elements = {
    // Formulario principal
    activarMultiples: document.getElementById('activar-multiples'),
    opcionesMultiples: document.getElementById('opciones-multiples'),
    explicacionMultiples: document.getElementById('explicacion-multiples'),
    inputFecha: document.getElementById('fecha'),
    mesSelect: document.getElementById('mes'),
    anoSelect: document.getElementById('ano'), // Ahora usando 'ano' en lugar de 'año'
    mesFinMultiple: document.getElementById('mes-fin-multiple'),
    tipoSelect: document.getElementById('tipo'),
    tiposMovimientosInput: document.getElementById('tiposmovimientos'),
    
    // Modal de opciones
    btnAgregarEmpresa: document.getElementById('btn-agregar-empresa'),
    btnAgregarTipo: document.getElementById('btn-agregar-tipo'),
    modalOpciones: document.getElementById('modal-opciones'),
    btnCerrarOpciones: document.getElementById('btn-cerrar-opciones'),
    inputNuevaOpcion: document.getElementById('input-nueva-opcion'),
    btnGuardarOpcion: document.getElementById('btn-guardar-opcion'),
    tituloModal: document.getElementById('modal-opciones-titulo'),
    listaOpciones: document.getElementById('lista-opciones'),
    selectTipoOpcion: document.getElementById('select-tipo-opcion'),
    listasTipos: document.getElementById('listas-tipos'),
    listaTiposIngreso: document.getElementById('lista-tipos-ingreso'),
    listaTiposEgreso: document.getElementById('lista-tipos-egreso'),
    
    // Modal de confirmación
    modalConfirmar: document.getElementById('modal-confirmar-eliminar'),
    btnConfirmarEliminar: document.getElementById('btn-confirmar-eliminar'),
    btnCancelarEliminar: document.getElementById('btn-cancelar-eliminar'),
    mensajeConfirmar: document.getElementById('mensaje-confirmar-eliminar')
  };

  // Estado global
  const state = {
    opcionesIngreso: [],
    opcionesEgreso: [],
    elementoActual: null,
    tipoActual: null,
    lastSelected: null // Para mantener la última selección
  };

  // Funciones auxiliares
  function setDisplay(element, value) {
    if (element && element.style) {
      element.style.display = value;
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function setValue(element, value) {
    if (element) {
      element.value = value;
    }
  }

  // Funciones principales
  async function cargarEmpresas() {
    try {
      const response = await fetch('/api/empresas');
      if (!response.ok) throw new Error('Error al cargar empresas');
      const data = await response.json();
      const empresas = data.map(e => e.nombre);
      
      const selectEmpresa = document.getElementById('empresa');
      if (selectEmpresa) {
        selectEmpresa.innerHTML = '<option value="">Selecciona...</option>';
        empresas.forEach(empresa => {
          const option = document.createElement('option');
          option.value = empresa;
          option.textContent = empresa;
          selectEmpresa.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  async function cargarTiposMovimiento() {
    try {
      // Cargar tipos de ingreso
      const responseIngreso = await fetch('/api/tipos_movimiento?tipo=ingreso');
      if (!responseIngreso.ok) throw new Error('Error al cargar tipos de ingreso');
      const dataIngreso = await responseIngreso.json();
      state.opcionesIngreso = dataIngreso.map(t => t.nombre);

      // Cargar tipos de egreso
      const responseEgreso = await fetch('/api/tipos_movimiento?tipo=egreso');
      if (!responseEgreso.ok) throw new Error('Error al cargar tipos de egreso');
      const dataEgreso = await responseEgreso.json();
      state.opcionesEgreso = dataEgreso.map(t => t.nombre);
      
      console.log('Tipos de ingreso cargados:', state.opcionesIngreso);
      console.log('Tipos de egreso cargados:', state.opcionesEgreso);
      
      actualizarAutocompletado();
      actualizarListasTipos();
    } catch (error) {
      console.error('Error al cargar tipos de movimiento:', error);
    }
  }

  function actualizarListasTipos() {
    if (elements.listaTiposIngreso && elements.listaTiposEgreso) {
      elements.listaTiposIngreso.innerHTML = state.opcionesIngreso
        .map(tipo => `<li style="padding:8px;margin:4px 0;background:#f5f5f5;border-radius:4px;">${tipo}</li>`)
        .join('');
      
      elements.listaTiposEgreso.innerHTML = state.opcionesEgreso
        .map(tipo => `<li style="padding:8px;margin:4px 0;background:#f5f5f5;border-radius:4px;">${tipo}</li>`)
        .join('');
    }
  }

  async function cargarListaOpciones() {
    try {
      if (!elements.listaOpciones) return;

      if (state.tipoActual === 'empresa') {
        const response = await fetch('/api/empresas');
        if (!response.ok) throw new Error('Error al cargar empresas');
        const data = await response.json();
        const empresas = data.map(e => e.nombre);
        
        elements.listaOpciones.innerHTML = empresas
          .map(empresa => `
            <li style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;background:#f5f5f5;border-radius:4px;">
              <span style="flex-grow:1;">${empresa}</span>
              <div style="display:flex;gap:8px;">
                <button onclick="editarElemento('${empresa}', 'empresa')" 
                  style="background:none;border:none;color:#2196F3;cursor:pointer;padding:4px;">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarElemento('${empresa}', 'empresa')" 
                  style="background:none;border:none;color:#e53935;cursor:pointer;padding:4px;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </li>
          `).join('');
      } else if (state.tipoActual === 'tipo') {
        // Obtener el tipo seleccionado (ingreso/egreso)
        const tipoSeleccionado = elements.selectTipoOpcion?.value || 'ingreso';
        
        // Obtener los tipos de movimiento filtrados por el tipo seleccionado
        const response = await fetch(`/api/tipos_movimiento?tipo=${tipoSeleccionado}`);
        if (!response.ok) throw new Error('Error al cargar tipos de movimiento');
        const data = await response.json();
        const tipos = data.map(t => ({ nombre: t.nombre, tipo: tipoSeleccionado }));
        
        elements.listaOpciones.innerHTML = tipos
          .map(tipo => `
            <li style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:4px 0;background:#f5f5f5;border-radius:4px;">
              <span style="flex-grow:1;">${tipo.nombre}</span>
              <div style="display:flex;gap:8px;">
                <button onclick="editarElemento('${tipo.nombre}', 'tipo', '${tipo.tipo}')" 
                  style="background:none;border:none;color:#2196F3;cursor:pointer;padding:4px;">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarElemento('${tipo.nombre}', 'tipo')" 
                  style="background:none;border:none;color:#e53935;cursor:pointer;padding:4px;">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </li>
          `).join('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Event Listeners
  elements.btnAgregarEmpresa?.addEventListener('click', () => {
    setText(elements.tituloModal, 'Gestionar Empresas');
    setDisplay(elements.selectTipoOpcion, 'none');
    setDisplay(elements.listasTipos, 'none');
    setValue(elements.inputNuevaOpcion, '');
    if (elements.inputNuevaOpcion) elements.inputNuevaOpcion.placeholder = 'Nueva empresa...';
    setDisplay(elements.modalOpciones, 'flex');
    state.tipoActual = 'empresa';
    cargarListaOpciones();
  });

  elements.btnAgregarTipo?.addEventListener('click', () => {
    setText(elements.tituloModal, 'Gestionar Tipos de Movimiento');
    setDisplay(elements.selectTipoOpcion, 'inline-block');
    setDisplay(elements.listasTipos, 'block');
    setValue(elements.inputNuevaOpcion, '');
    if (elements.inputNuevaOpcion) elements.inputNuevaOpcion.placeholder = 'Nuevo tipo...';
    setDisplay(elements.modalOpciones, 'flex');
    state.tipoActual = 'tipo';
    cargarListaOpciones();
  });

  function cerrarModalOpciones() {
    setDisplay(elements.modalOpciones, 'none');
    state.tipoActual = null;
  }

  elements.btnCerrarOpciones?.addEventListener('click', cerrarModalOpciones);

  // Agregar event listener para el cambio de tipo en el select
  elements.selectTipoOpcion?.addEventListener('change', () => {
    if (state.tipoActual === 'tipo') {
      cargarListaOpciones();
    }
  });

  // Funciones globales
  window.editarElemento = async function(nombre, tipo, tipoMovimiento = null) {
    const nuevoNombre = prompt(`Ingrese el nuevo nombre para ${tipo === 'empresa' ? 'la empresa' : 'el tipo de movimiento'}:`, nombre);
    if (!nuevoNombre || nuevoNombre === nombre) return;

    try {
      if (tipo === 'empresa') {
        const response = await fetch('/api/empresas/' + encodeURIComponent(nombre), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre })
        });

        if (!response.ok) throw new Error('Error al editar empresa');
        await cargarEmpresas();
      } else if (tipoMovimiento) {
        const response = await fetch('/api/tipos_movimiento/' + encodeURIComponent(nombre), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre, tipo: tipoMovimiento })
        });

        if (!response.ok) throw new Error('Error al editar tipo de movimiento');
        await cargarTiposMovimiento();
      }
      
      await cargarListaOpciones();
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al editar ${tipo === 'empresa' ? 'la empresa' : 'el tipo de movimiento'}`);
    }
  };

  window.eliminarElemento = function(nombre, tipo) {
    state.elementoActual = { nombre, tipo };
    setText(elements.mensajeConfirmar, 
      `¿Estás seguro de que deseas eliminar ${tipo === 'empresa' ? 'la empresa' : 'el tipo de movimiento'} "${nombre}"?`);
    // No cerramos el modal de opciones, solo mostramos el de confirmación encima
    setDisplay(elements.modalConfirmar, 'flex');
  };

  function cerrarModalConfirmacion() {
    setDisplay(elements.modalConfirmar, 'none');
    state.elementoActual = null;
  }

  elements.btnCancelarEliminar?.addEventListener('click', cerrarModalConfirmacion);

  elements.btnConfirmarEliminar?.addEventListener('click', async () => {
    if (!state.elementoActual) return;

    try {
      if (state.elementoActual.tipo === 'empresa') {
        const response = await fetch('/api/empresas/' + encodeURIComponent(state.elementoActual.nombre), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(await response.text() || 'Error al eliminar empresa');
        }
        await cargarEmpresas();
      } else {
        const response = await fetch('/api/tipos_movimiento/' + encodeURIComponent(state.elementoActual.nombre), {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error(await response.text() || 'Error al eliminar tipo de movimiento');
        }
        await cargarTiposMovimiento();
      }
      
      // Solo cerramos el modal de confirmación y actualizamos la lista
      cerrarModalConfirmacion();
      await cargarListaOpciones();
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || `Error al eliminar ${state.elementoActual.tipo === 'empresa' ? 'la empresa' : 'el tipo de movimiento'}`);
      cerrarModalConfirmacion();
    }
  });

  elements.btnGuardarOpcion?.addEventListener('click', async () => {
    if (!elements.inputNuevaOpcion) return;
    const nuevoNombre = elements.inputNuevaOpcion.value.trim();
    if (!nuevoNombre) return;

    try {
      if (state.tipoActual === 'empresa') {
        const response = await fetch('/api/empresas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre })
        });

        if (!response.ok) throw new Error('Error al agregar empresa');
      } else if (state.tipoActual === 'tipo' && elements.selectTipoOpcion) {
        const tipoMovimiento = elements.selectTipoOpcion.value;
        const response = await fetch('/api/tipos_movimiento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: nuevoNombre, tipo: tipoMovimiento })
        });

        if (!response.ok) throw new Error('Error al agregar tipo de movimiento');

        if (tipoMovimiento === 'ingreso') {
          state.opcionesIngreso.push(nuevoNombre);
        } else {
          state.opcionesEgreso.push(nuevoNombre);
        }
        actualizarListasTipos();
      }
      
      setValue(elements.inputNuevaOpcion, '');
      await cargarListaOpciones();
      if (state.tipoActual === 'empresa') {
        await cargarEmpresas();
      } else {
        actualizarAutocompletado();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar: ' + error.message);
    }
  });

  // Autocompletado
  let awesompleteInstance = null;

  function actualizarAutocompletado() {
    if (!elements.tipoSelect || !elements.tiposMovimientosInput) return;
    const tipoSeleccionado = elements.tipoSelect.value;
    
    console.log('Actualizando autocompletado para tipo:', tipoSeleccionado);
    
    // Limpiar el input cuando se cambia el tipo
    elements.tiposMovimientosInput.value = '';
    
    // Si no hay tipo seleccionado, deshabilitar el autocompletado
    if (!tipoSeleccionado) {
      if (awesompleteInstance) {
        awesompleteInstance.destroy();
        awesompleteInstance = null;
      }
      elements.tiposMovimientosInput.disabled = true;
      return;
    }

    // Habilitar el input
    elements.tiposMovimientosInput.disabled = false;
    
    // Obtener las opciones según el tipo seleccionado
    const opciones = tipoSeleccionado === 'ingreso' ? state.opcionesIngreso : state.opcionesEgreso;
    console.log('Opciones disponibles:', opciones);
    
    // Ordenar las opciones alfabéticamente
    opciones.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));

    // Destruir la instancia anterior si existe
    if (awesompleteInstance) {
      awesompleteInstance.destroy();
    }

    // Crear nueva instancia de Awesomplete
    awesompleteInstance = new Awesomplete(elements.tiposMovimientosInput, {
      list: opciones,
      minChars: 0, // Mostrar todas las opciones al hacer clic
      maxItems: 1000, // Mostrar prácticamente todas las opciones
      autoFirst: true, // Seleccionar automáticamente el primer elemento
      filter: Awesomplete.FILTER_CONTAINS, // Filtrar si contiene el texto (no solo al inicio)
      sort: (a, b) => a.value.localeCompare(b.value, 'es', { sensitivity: 'base' }) // Ordenar alfabéticamente
    });

    // Mostrar todas las opciones al hacer clic en el input
    elements.tiposMovimientosInput.addEventListener('focus', function() {
      if (this.value === '') {
        awesompleteInstance.evaluate();
        awesompleteInstance.open();
      }
    });
  }

  elements.tipoSelect?.addEventListener('change', actualizarAutocompletado);

  // Inicializar el estado del input de tipos de movimiento
  if (elements.tiposMovimientosInput) {
    elements.tiposMovimientosInput.disabled = true;
  }

  // Manejo de movimientos múltiples
  elements.activarMultiples?.addEventListener('change', function() {
    if (elements.opcionesMultiples) {
      setDisplay(elements.opcionesMultiples, this.checked ? 'flex' : 'none');
      if (this.checked) actualizarFechasMultiples();
    }
  });

  function actualizarFechasMultiples() {
    if (!elements.inputFecha?.value || !elements.mesFinMultiple?.value || !elements.explicacionMultiples) return [];

    // Obtener la fecha de inicio y asegurarnos de que use la zona horaria local
    const [anioInicio, mesInicio, diaInicio] = elements.inputFecha.value.split('-').map(Number);
    const fechaInicio = new Date(anioInicio, mesInicio - 1, diaInicio, 12, 0, 0);
    
    const [anioFin, mesFin] = elements.mesFinMultiple.value.split('-').map(Number);
    const fechas = [];
    
    // Crear una nueva fecha para no modificar la original
    let fecha = new Date(fechaInicio);
    const diaOriginal = diaInicio; // Usamos el día que viene del input
    
    while (fecha.getFullYear() < anioFin || 
           (fecha.getFullYear() === anioFin && fecha.getMonth() <= mesFin - 1)) {
      // Crear nueva fecha para este mes manteniendo el día original
      const nuevaFecha = new Date(fecha.getFullYear(), fecha.getMonth(), diaOriginal, 12, 0, 0);
      
      // Asegurarse de que el día sea el correcto
      if (nuevaFecha.getDate() === diaOriginal) {
        // Formatear la fecha en YYYY-MM-DD manteniendo el día correcto
        const fechaFormateada = `${nuevaFecha.getFullYear()}-${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-${String(diaOriginal).padStart(2, '0')}`;
        fechas.push(fechaFormateada);
      }
      
      // Avanzar al siguiente mes
      fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1, 12, 0, 0);
    }
    
    // Formatear las fechas manualmente para mantener el día correcto
    const fechasFormateadas = fechas.map(f => {
      const [anio, mes, dia] = f.split('-').map(Number);
      return `${dia}/${mes}/${anio}`;
    });

    if (fechas.length > 0) {
      setText(elements.explicacionMultiples, 
        `Se crearán ${fechas.length} movimientos en las siguientes fechas: ${fechasFormateadas.join(', ')}`);
    } else {
      setText(elements.explicacionMultiples, '');
    }
    
    return fechas;
  }

  elements.inputFecha?.addEventListener('change', () => {
    // Actualizar mes y año automáticamente
    const fecha = new Date(elements.inputFecha.value);
    if (!isNaN(fecha.getTime())) {
      // Verificar que los elementos existan antes de actualizar sus valores
      if (elements.mesSelect) {
        elements.mesSelect.value = fecha.getMonth() + 1; // Mes es 0-based en JavaScript
      }
      if (elements.anoSelect) {
        elements.anoSelect.value = fecha.getFullYear();
      }
    }
    
    // Actualizar fechas múltiples si está activado
    if (elements.activarMultiples?.checked) actualizarFechasMultiples();
  });

  elements.mesFinMultiple?.addEventListener('change', () => {
    if (elements.activarMultiples?.checked) actualizarFechasMultiples();
  });

  // Manejo del formulario
  document.getElementById('formulario')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = {
      tipo: formData.get('tipo'),
      descripcion: formData.get('descripcion'),
      monto: parseFloat(formData.get('monto')),
      empresa: formData.get('empresa'),
      tipoMovimiento: formData.get('tiposmovimientos'),
      estado: 'Pendiente'
    };

    try {
      if (elements.activarMultiples?.checked) {
        // Obtener las fechas múltiples
        const fechas = actualizarFechasMultiples();
        
        // Crear cada movimiento
        for (const fechaISO of fechas) {
          const [anio, mes, dia] = fechaISO.split('-').map(Number);
          
          const nombreMes = new Date(anio, mes - 1, dia)
            .toLocaleDateString('es', { month: 'long' });
          const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
          
          const movimientoData = {
            ...data,
            fecha: fechaISO,
            mes: mesCapitalizado,
            año: anio
          };

          const response = await fetch('/api/movimientos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movimientoData)
          });

          if (!response.ok) throw new Error('Error al crear movimiento');
        }
        
        showNotification(`Se han creado ${fechas.length} movimientos correctamente`);
      } else {
        // Crear un solo movimiento
        const [anio, mes, dia] = formData.get('fecha').split('-').map(Number);
        const fechaObj = new Date(anio, mes - 1, dia);
        const nombreMes = fechaObj.toLocaleDateString('es', { month: 'long' });
        const mesCapitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
        
        const movimientoData = {
          ...data,
          fecha: formData.get('fecha'),
          mes: mesCapitalizado,
          año: anio
        };

        const response = await fetch('/api/movimientos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movimientoData)
        });

        if (!response.ok) throw new Error('Error al crear movimiento');
        showNotification('Movimiento creado correctamente');
      }

      // Limpiar el formulario
      this.reset();
      if (elements.activarMultiples) {
        elements.activarMultiples.checked = false;
        setDisplay(elements.opcionesMultiples, 'none');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error al crear el movimiento', 'error');
    }
  });

  // Cargar datos iniciales
  cargarEmpresas();
  cargarTiposMovimiento();

  // Agregar listener para el cambio de tipo
  elements.tipoSelect?.addEventListener('change', function() {
    console.log('Tipo seleccionado:', this.value);
    actualizarAutocompletado();
  });
});
