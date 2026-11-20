// Capa de datos. Todas las vistas usan estas funciones, así que cambiar de
// "modo demo" (navegador) a Supabase (base de datos real) solo afecta este archivo.

import { generarMuestra } from './sample.js';

const CLAVE = 'coleccion-demo-v1';
const CLAVE_SESION = 'coleccion-demo-sesion';

let estado = null; // { albumes, items }
const oyentes = new Set();

function leerLocal(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribirLocal(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
    return true;
  } catch (e) {
    if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
      throw new Error('El navegador se quedó sin espacio para el modo demo. Borre algunas fotos o restablezca los datos de ejemplo.');
    }
    return false;
  }
}

function cargar() {
  if (estado) return estado;
  const guardado = leerLocal(CLAVE);
  if (guardado) {
    try {
      estado = JSON.parse(guardado);
    } catch {
      estado = null;
    }
  }
  if (!estado || !Array.isArray(estado.items)) {
    estado = generarMuestra();
  }
  return estado;
}

function guardar() {
  escribirLocal(CLAVE, JSON.stringify(estado));
  oyentes.forEach((fn) => fn());
}

function nuevoId(prefijo) {
  return `${prefijo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** Quita los campos privados cuando quien mira no es administrador. */
function vistaPublica(item) {
  if (sesionActiva()) return item;
  const { privado, ...resto } = item;
  return resto;
}

// ---------- Lectura ----------

export async function listarItems() {
  return cargar().items.map(vistaPublica);
}

export async function obtenerItem(id) {
  const item = cargar().items.find((i) => i.id === id);
  return item ? vistaPublica(item) : null;
}

export async function listarAlbumes() {
  return [...cargar().albumes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export async function obtenerAlbum(id) {
  return cargar().albumes.find((a) => a.id === id) || null;
}

// ---------- Escritura (solo administrador) ----------

function exigirSesion() {
  if (!sesionActiva()) throw new Error('Debe iniciar sesión para hacer cambios.');
}

export async function guardarItem(datos) {
  exigirSesion();
  const datosEstado = cargar();
  const ahora = new Date().toISOString();
  if (datos.id) {
    const idx = datosEstado.items.findIndex((i) => i.id === datos.id);
    if (idx === -1) throw new Error('El artículo ya no existe.');
    datosEstado.items[idx] = { ...datosEstado.items[idx], ...datos, actualizado: ahora };
    guardar();
    return datosEstado.items[idx];
  }
  const item = { ...datos, id: nuevoId('i'), creado: ahora };
  datosEstado.items.push(item);
  try {
    guardar();
  } catch (e) {
    datosEstado.items.pop();
    throw e;
  }
  return item;
}

export async function eliminarItem(id) {
  exigirSesion();
  const datosEstado = cargar();
  datosEstado.items = datosEstado.items.filter((i) => i.id !== id);
  guardar();
}

export async function guardarAlbum(datos) {
  exigirSesion();
  const datosEstado = cargar();
  if (datos.id) {
    const idx = datosEstado.albumes.findIndex((a) => a.id === datos.id);
    if (idx === -1) throw new Error('El álbum ya no existe.');
    datosEstado.albumes[idx] = { ...datosEstado.albumes[idx], ...datos };
    guardar();
    return datosEstado.albumes[idx];
  }
  const orden = Math.max(0, ...datosEstado.albumes.map((a) => a.orden ?? 0)) + 1;
  const album = { ...datos, id: nuevoId('a'), orden };
  datosEstado.albumes.push(album);
  guardar();
  return album;
}

export async function eliminarAlbum(id) {
  exigirSesion();
  const datosEstado = cargar();
  datosEstado.albumes = datosEstado.albumes.filter((a) => a.id !== id);
  datosEstado.items.forEach((i) => {
    if (i.albumId === id) {
      i.albumId = '';
      i.pagina = null;
      i.posicion = null;
    }
  });
  guardar();
}

/**
 * Convierte una foto (ya comprimida) en una URL guardable.
 * En modo demo se guarda dentro del navegador; con Supabase se subirá al almacenamiento.
 */
export async function subirFoto(blob) {
  exigirSesion();
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error('No se pudo leer la foto.'));
    lector.readAsDataURL(blob);
  });
}

// ---------- Respaldo ----------

export async function exportarTodo() {
  exigirSesion();
  return JSON.stringify(cargar(), null, 2);
}

export async function importarTodo(texto) {
  exigirSesion();
  const datos = JSON.parse(texto);
  if (!Array.isArray(datos.items) || !Array.isArray(datos.albumes)) {
    throw new Error('El archivo no parece ser un respaldo de la colección.');
  }
  const anterior = estado;
  estado = datos;
  try {
    guardar();
  } catch (e) {
    estado = anterior;
    throw e;
  }
}

export async function restablecerMuestra() {
  exigirSesion();
  estado = generarMuestra();
  guardar();
}

export async function vaciarColeccion() {
  exigirSesion();
  estado = { albumes: [], items: [] };
  guardar();
}

// ---------- Sesión ----------

export function sesionActiva() {
  return leerLocal(CLAVE_SESION) === '1';
}

export async function iniciarSesion() {
  // En modo demo no hay contraseña. Con Supabase se pedirá correo y contraseña.
  escribirLocal(CLAVE_SESION, '1');
  oyentes.forEach((fn) => fn());
}

export async function cerrarSesion() {
  try {
    localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin almacenamiento */
  }
  oyentes.forEach((fn) => fn());
}

export function alCambiar(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}


