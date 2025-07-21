async function cargarEstadisticas() {
  try {
    let res = await fetch('/api/estadisticas');
    if (!res.ok) throw new Error('Error en el servidor');
    let stats = await res.json();
    document.getElementById("total-ingresos").textContent = `S/ ${stats.ingresos.toFixed(2)}`;
    document.getElementById("total-egresos").textContent = `S/ ${stats.egresos.toFixed(2)}`;
    document.getElementById("dinero-disponible").textContent = `S/ ${stats.disponible.toFixed(2)}`;
    document.getElementById("dinero-cobrado").textContent = `S/ ${stats.cobrado.toFixed(2)}`;
    document.getElementById("dinero-por-cobrar").textContent = `S/ ${stats.porCobrar.toFixed(2)}`;
    document.getElementById("dinero-por-pagar").textContent = `S/ ${stats.porPagar.toFixed(2)}`;
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
