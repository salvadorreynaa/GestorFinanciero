async function cargarEstadisticas() {
  try {
    const mes = document.getElementById("filtroMes")?.value || '';
    const año = document.getElementById("filtroAño")?.value || '';
    const baseUrl = window.location.origin;
    let url = `${baseUrl}/api/estadisticas`;
    if ((mes && mes !== "Todos") || (año && año !== "Todos")) {
      url += `?mes=${encodeURIComponent(mes)}&año=${encodeURIComponent(año)}`;
    }
    console.log('Consultando estadísticas:', url);
    let res = await fetch(url);
    if (!res.ok) throw new Error('Error en el servidor');
    let stats = await res.json();
    console.log('Estadísticas recibidas:', stats);
    const elements = {
      totalIngresos: document.getElementById("total-ingresos"),
      totalEgresos: document.getElementById("total-egresos"),
      dineroDisponible: document.getElementById("dinero-disponible"),
      dineroCobrado: document.getElementById("dinero-cobrado"),
      dineroPorCobrar: document.getElementById("dinero-por-cobrar"),
      dineroPorPagar: document.getElementById("dinero-por-pagar")
    };

    if (elements.totalIngresos) elements.totalIngresos.textContent = `S/ ${(stats.ingresos || 0).toFixed(2)}`;
    if (elements.totalEgresos) elements.totalEgresos.textContent = `S/ ${(stats.egresos || 0).toFixed(2)}`;
    if (elements.dineroDisponible) elements.dineroDisponible.textContent = `S/ ${(stats.disponible || 0).toFixed(2)}`;
    if (elements.dineroCobrado) elements.dineroCobrado.textContent = `S/ ${(stats.cobrado || 0).toFixed(2)}`;
    if (elements.dineroPorCobrar) elements.dineroPorCobrar.textContent = `S/ ${(stats.porCobrar || 0).toFixed(2)}`;
    if (elements.dineroPorPagar) elements.dineroPorPagar.textContent = `S/ ${(stats.porPagar || 0).toFixed(2)}`;
  } catch (err) {
    console.error('Error al cargar estadísticas:', err);
    const elementos = {
      "total-ingresos": "0.00",
      "total-egresos": "0.00",
      "dinero-disponible": "0.00",
      "dinero-cobrado": "0.00",
      "dinero-por-cobrar": "0.00",
      "dinero-por-pagar": "0.00"
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
      const elemento = document.getElementById(id);
      if (elemento) elemento.textContent = `S/ ${valor}`;
    }
    
    alert('No se pudieron cargar las estadísticas. Los valores se han establecido en 0.00');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const filtroMes = document.getElementById("filtroMes");
  const filtroAño = document.getElementById("filtroAño");

  if (filtroMes) filtroMes.addEventListener("change", cargarEstadisticas);
  if (filtroAño) filtroAño.addEventListener("change", cargarEstadisticas);

  cargarEstadisticas();
});
