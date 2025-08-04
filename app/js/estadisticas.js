const leerDatos = window.storageAPI.leerDatos;

async function cargarEstadisticas() {
  const movimientos = await leerDatos() || [];

  const mesSeleccionado = document.getElementById("filtroMes")?.value || "Todos";
  const añoSeleccionado = document.getElementById("filtroAño")?.value || "Todos";

  let ingresos = 0;
  let egresos = 0;
  let cobrado = 0;
  let porCobrar = 0;
  let porPagar = 0;

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.monto);
    if (isNaN(monto)) return;

    const coincideMes = mesSeleccionado === "Todos" || mov.mes === mesSeleccionado;
    const coincideAño = añoSeleccionado === "Todos" || mov.año === añoSeleccionado;

    if (!coincideMes || !coincideAño) return;

    if (mov.tipo === "ingreso") {
      ingresos += monto;
      if (mov.estado === "Cobrado") cobrado += monto;
      else porCobrar += monto;
    } else if (mov.tipo === "egreso") {
      egresos += monto;
      if (mov.estado === "Pendiente") porPagar += monto;
    }
  });

  const disponible = ingresos - egresos;

  document.getElementById("total-ingresos").textContent = `S/ ${ingresos.toFixed(2)}`;
  document.getElementById("total-egresos").textContent = `S/ ${egresos.toFixed(2)}`;
  document.getElementById("dinero-disponible").textContent = `S/ ${disponible.toFixed(2)}`;
  document.getElementById("dinero-cobrado").textContent = `S/ ${cobrado.toFixed(2)}`;
  document.getElementById("dinero-por-cobrar").textContent = `S/ ${porCobrar.toFixed(2)}`;
  document.getElementById("dinero-por-pagar").textContent = `S/ ${porPagar.toFixed(2)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const filtroMes = document.getElementById("filtroMes");
  const filtroAño = document.getElementById("filtroAño");

  if (filtroMes) filtroMes.addEventListener("change", cargarEstadisticas);
  if (filtroAño) filtroAño.addEventListener("change", cargarEstadisticas);

  cargarEstadisticas();
});
