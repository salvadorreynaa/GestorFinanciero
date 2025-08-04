// script.js limpio y funcional usando backend con base de datos (Render)

document.addEventListener('DOMContentLoaded', () => {
  // Manejo de movimientos múltiples
  const activarMultiples = document.getElementById('activar-multiples');
  const opcionesMultiples = document.getElementById('opciones-multiples');
  const explicacionMultiples = document.getElementById('explicacion-multiples');
  const inputFecha = document.getElementById('fecha');
  const mesFinMultiple = document.getElementById('mes-fin-multiple');

  // Mostrar/ocultar opciones múltiples
  activarMultiples?.addEventListener('change', function() {
    if (opcionesMultiples) {
      opcionesMultiples.style.display = this.checked ? 'flex' : 'none';
    }
  });

  // Actualizar fechas cuando cambien los inputs
  function actualizarFechasMultiples() {
    if (!inputFecha?.value || !mesFinMultiple?.value || !explicacionMultiples) return;

    const fechaInicio = new Date(inputFecha.value);
    const [anioFin, mesFin] = mesFinMultiple.value.split('-').map(Number);
    const fechas = [];
    
    let fecha = new Date(fechaInicio);
    while (fecha.getFullYear() < anioFin || 
           (fecha.getFullYear() === anioFin && fecha.getMonth() < mesFin - 1)) {
      fechas.push(fecha.toLocaleDateString());
      fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, fecha.getDate());
    }

    if (fechas.length > 0) {
      explicacionMultiples.textContent = `Se crearán ${fechas.length} movimientos en las siguientes fechas: ${fechas.join(', ')}`;
    } else {
      explicacionMultiples.textContent = '';
    }
  }

  // Event listeners para actualizar fechas
  inputFecha?.addEventListener('change', () => {
    if (activarMultiples?.checked) actualizarFechasMultiples();
  });

  mesFinMultiple?.addEventListener('change', () => {
    if (activarMultiples?.checked) actualizarFechasMultiples();
  });
});
