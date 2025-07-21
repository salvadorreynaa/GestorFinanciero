// Opciones de especialidad
const opcionesEspecialidad = [
  'Planos', 'Certificados', 'Estructuras', 'Fierro', 'Cemento', 
  'Agregados', 'Letreros Luminosos', 'Letreros 3D', 'Baner', 
  'Vinil', 'Volantes', 'Flyers', 'Otro'
];

let contactoEditandoId = null;

// Cargar contactos y mostrarlos en la lista
async function cargarContactos() {
  let res = await fetch('/api/contactos');
  let contactos = await res.json();
  const lista = document.getElementById("lista-contactos");
  const filtroEspecialidad = document.getElementById("filtro-especialidad")?.value || "";
  const busquedaNombre = document.getElementById("busqueda-nombre")?.value.toLowerCase() || "";

  lista.innerHTML = "";

  contactos
    .filter(c =>
      (filtroEspecialidad === "" || c.especialidad === filtroEspecialidad) &&
      (busquedaNombre === "" || c.nombre.toLowerCase().includes(busquedaNombre))
    )
    .forEach((c) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="contacto-header">
          <span class="contacto-nombre">${c.nombre}</span>
          <span class="contacto-especialidad">${c.especialidad}</span>
        </div>
        <div class="contacto-info">
          <span><b>Empresa:</b> ${c.empresa || "-"}</span>
          <span><b>Celular:</b> ${c.celular}</span>
          <span><b>Email:</b> ${c.email || "-"}</span>
          <span><b>Dirección:</b> ${c.direccion || "-"}</span>
        </div>
        ${c.descripcion ? `<div class="contacto-descripcion">${c.descripcion}</div>` : ""}
        <div class="contacto-botones">
          <button class="contacto-boton-editar" onclick="editarContacto(${c.id})">Editar</button>
          <button class="contacto-boton-eliminar" onclick="eliminarContacto(${c.id})">Eliminar</button>
        </div>
      `;
      lista.appendChild(li);
    });
}

// Validaciones
function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function esCelularValido(celular) {
  return /^\d{7,}$/.test(celular);
}

// Guardar o editar un contacto
const formulario = document.getElementById("formulario");
formulario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nombre = formulario.nombre.value.trim();
  const empresa = formulario.empresa.value.trim();
  const celular = formulario.celular.value.trim();
  const email = formulario.email.value.trim();
  const direccion = formulario.direccion.value.trim();
  const especialidad = formulario.especialidad.value.trim();
  const descripcion = formulario.descripcion.value.trim();

  if (!nombre || !esCelularValido(celular) || (email && !esEmailValido(email))) {
    alert("Datos inválidos");
    return;
  }

  const contacto = { nombre, empresa, celular, email, direccion, especialidad, descripcion };

  if (contactoEditandoId) {
    await fetch(`/api/contactos/${contactoEditandoId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacto)
    });
    contactoEditandoId = null;
  } else {
    await fetch('/api/contactos', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contacto)
    });
  }
  formulario.reset();
  cargarContactos();
});

// Editar contacto
window.editarContacto = async function(id) {
  let res = await fetch(`/api/contactos/${id}`);
  let c = await res.json();
  formulario.nombre.value = c.nombre;
  formulario.empresa.value = c.empresa;
  formulario.celular.value = c.celular;
  formulario.email.value = c.email;
  formulario.direccion.value = c.direccion;
  formulario.especialidad.value = c.especialidad;
  formulario.descripcion.value = c.descripcion;
  contactoEditandoId = id;
};

// Eliminar contacto
window.eliminarContacto = async function(id) {
  if (confirm("¿Eliminar contacto?")) {
    await fetch(`/api/contactos/${id}`, { method: "DELETE" });
    cargarContactos();
  }
};

document.addEventListener("DOMContentLoaded", cargarContactos);
