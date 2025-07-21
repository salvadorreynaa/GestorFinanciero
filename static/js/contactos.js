const leerContactos = window.contactosAPI.leerContactos;
const guardarContactos = window.contactosAPI.escribirContactos;

// Opciones de especialidad (puedes agregar más)
const opcionesEspecialidad = [
  'Planos', 'Certificados', 'Estructuras', 'Fierro', 'Cemento', 
  'Agregados', 'Letreros Luminosos', 'Letreros 3D', 'Baner', 
  'Vinil', 'Volantes', 'Flyers', 'Otro'
];

let contactoEditandoId = null; // <-- NUEVO: para saber si estamos editando

// Cargar contactos y mostrarlos en la lista
async function cargarContactos() {
  let contactos = await leerContactos() || [];
  const lista = document.getElementById("lista-contactos");
  const filtroEspecialidad = document.getElementById("filtro-especialidad")?.value || "";
  const busquedaNombre = document.getElementById("busqueda-nombre")?.value.toLowerCase() || "";

  lista.innerHTML = "";

  // Filtrado por especialidad y nombre
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
document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const empresa = document.getElementById("empresa").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const email = document.getElementById("email").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const especialidad = document.getElementById("especialidad").value;
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!nombre || !celular || !especialidad) {
    alert("Por favor, completa los campos obligatorios.");
    return;
  }
  if (email && !esEmailValido(email)) {
    mostrarToastContactos("Por favor, ingresa un email válido.");
    return;
  }
  if (!esCelularValido(celular)) {
    mostrarToastContactos("Por favor, ingresa un celular válido (solo números, mínimo 7 dígitos).");
    return;
  }

  function mostrarToastContactos(mensaje) {
    const toast = document.getElementById("toast-contactos");
    toast.textContent = mensaje;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2200);
  }

  let contactos = await leerContactos() || [];

  if (contactoEditandoId) {
    // Editar contacto existente
    const index = contactos.findIndex(c => Number(c.id) === Number(contactoEditandoId));
    if (index !== -1) {
      contactos[index] = {
        ...contactos[index],
        nombre, empresa, celular, email, direccion, especialidad, descripcion
      };
    }
    contactoEditandoId = null;
  } else {
    // Nuevo contacto
    const id = Date.now();
    contactos.push({ id, nombre, empresa, celular, email, direccion, especialidad, descripcion });
  }

  await guardarContactos(contactos);
  e.target.reset();
  cargarContactos();
  mostrarToastContactoExito("✅ Contacto guardado correctamente."); // <-- Aquí va el toast
  
  // Asegura que los inputs estén habilitados y enfocados
  document.querySelectorAll("#formulario input, #formulario select, #formulario textarea").forEach(el => {
    el.disabled = false;
    el.readOnly = false;
  });
  document.getElementById("nombre").focus();
});

// Eliminar contacto
function mostrarConfirmacion(mensaje) {
  return new Promise(resolve => {
    const modal = document.getElementById("modal-confirmacion");
    const msg = document.getElementById("modal-confirmacion-mensaje");
    const btnSi = document.getElementById("modal-confirmacion-si");
    const btnNo = document.getElementById("modal-confirmacion-no");

    msg.textContent = mensaje;
    modal.style.display = "flex";

    function cerrar(res) {
      modal.style.display = "none";
      btnSi.removeEventListener("click", onSi);
      btnNo.removeEventListener("click", onNo);
      resolve(res);
    }
    function onSi() { cerrar(true); }
    function onNo() { cerrar(false); }

    btnSi.addEventListener("click", onSi);
    btnNo.addEventListener("click", onNo);
  });
}

async function eliminarContacto(id) {
  const confirmado = await mostrarConfirmacion("¿Eliminar este contacto?");
  if (!confirmado) return;

  let contactos = await leerContactos() || [];
  const index = contactos.findIndex(c => Number(c.id) === Number(id));
  if (index === -1) return;
  contactos.splice(index, 1);
  await guardarContactos(contactos);
  cargarContactos();

  // Asegura que los inputs estén habilitados y enfocados
  document.querySelectorAll("#formulario input, #formulario select, #formulario textarea").forEach(el => {
    el.disabled = false;
    el.readOnly = false;
  });
  document.getElementById("nombre").focus();
}
window.eliminarContacto = eliminarContacto;


// Editar contacto
window.editarContacto = async function(id) {
  let contactos = await leerContactos() || [];
  const contacto = contactos.find(c => Number(c.id) === Number(id));
  if (!contacto) return;

  document.getElementById("edit-nombre").value = contacto.nombre;
  document.getElementById("edit-empresa").value = contacto.empresa;
  document.getElementById("edit-celular").value = contacto.celular;
  document.getElementById("edit-email").value = contacto.email;
  document.getElementById("edit-direccion").value = contacto.direccion;
  document.getElementById("edit-especialidad").value = contacto.especialidad;
  document.getElementById("edit-descripcion").value = contacto.descripcion;
  document.getElementById("edit-id").value = contacto.id;

  document.getElementById("modal-editar-contacto").style.display = "flex";
};

document.getElementById("form-editar-contacto").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("edit-id").value;
  const nombre = document.getElementById("edit-nombre").value.trim();
  const empresa = document.getElementById("edit-empresa").value.trim();
  const celular = document.getElementById("edit-celular").value.trim();
  const email = document.getElementById("edit-email").value.trim();
  const direccion = document.getElementById("edit-direccion").value.trim();
  const especialidad = document.getElementById("edit-especialidad").value;
  const descripcion = document.getElementById("edit-descripcion").value.trim();

  // Validaciones (puedes usar las mismas funciones que ya tienes)
  if (!nombre || !celular || !especialidad) {
    mostrarToastContactos("Por favor, completa los campos obligatorios.");
    return;
  }
  if (email && !esEmailValido(email)) {
    mostrarToastContactos("Por favor, ingresa un email válido.");
    return;
  }
  if (!esCelularValido(celular)) {
    mostrarToastContactos("Por favor, ingresa un celular válido (solo números, mínimo 7 dígitos).");
    return;
  }

  let contactos = await leerContactos() || [];
  const index = contactos.findIndex(c => Number(c.id) === Number(id));
  if (index === -1) return;

  contactos[index] = {
    ...contactos[index],
    nombre, empresa, celular, email, direccion, especialidad, descripcion
  };

  await guardarContactos(contactos);
  cargarContactos();
  document.getElementById("modal-editar-contacto").style.display = "none";
});

document.getElementById("btn-cerrar-modal-contacto").addEventListener("click", () => {
  document.getElementById("modal-editar-contacto").style.display = "none";
});




// Filtros
document.getElementById("filtro-especialidad").addEventListener("change", cargarContactos);
document.getElementById("busqueda-nombre").addEventListener("input", cargarContactos);

// Inicializar lista al cargar la página
document.addEventListener("DOMContentLoaded", cargarContactos);

function mostrarToastContactoExito(mensaje) {
  const toast = document.getElementById("toast-contactos-exito");
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}
