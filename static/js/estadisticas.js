async function cargarEstadisticas() {
  try {
    const mes = document.getElementById("filtroMes")?.value;
    const año = document.getElementById("filtroAño")?.value;
    let url = '/api/estadisticas';
    if (mes && año && mes !== "Todos" && año !== "Todos") {
      url += `?mes=${encodeURIComponent(mes)}&año=${encodeURIComponent(año)}`;
    }
    let res = await fetch(url);
    if (!res.ok) throw new Error('Error en el servidor');
    let stats = await res.json();
    document.getElementById("total-ingresos").textContent = `S/ ${(stats.ingresos || 0).toFixed(2)}`;
    document.getElementById("total-egresos").textContent = `S/ ${(stats.egresos || 0).toFixed(2)}`;
    document.getElementById("dinero-disponible").textContent = `S/ ${(stats.disponible || 0).toFixed(2)}`;
    document.getElementById("dinero-cobrado").textContent = `S/ ${(stats.cobrado || 0).toFixed(2)}`;
    document.getElementById("dinero-por-cobrar").textContent = `S/ ${(stats.porCobrar || 0).toFixed(2)}`;
    document.getElementById("dinero-por-pagar").textContent = `S/ ${(stats.porPagar || 0).toFixed(2)}`;
  } catch (err) {
    document.getElementById("total-ingresos").textContent = 'Error';
    document.getElementById("total-egresos").textContent = 'Error';
    document.getElementById("dinero-disponible").textContent = 'Error';
    document.getElementById("dinero-cobrado").textContent = 'Error';
    document.getElementById("dinero-por-cobrar").textContent = 'Error';
    document.getElementById("dinero-por-pagar").textContent = 'Error';
    alert('No se pudieron cargar las estadísticas. Revisa la base de datos o contacta al administrador.');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const filtroMes = document.getElementById("filtroMes");
  const filtroAño = document.getElementById("filtroAño");

  if (filtroMes) filtroMes.addEventListener("change", cargarEstadisticas);
  if (filtroAño) filtroAño.addEventListener("change", cargarEstadisticas);

  cargarEstadisticas();
});
