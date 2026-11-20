// Capa de datos. Todas las vistas usan estas funciones; según CONFIG.modo
// se usa el modo demo (navegador) o la base de datos real (Supabase).
import { CONFIG } from '../config.js';

export const MODO = CONFIG.modo === 'supabase' ? 'supabase' : 'demo';

let impl;
try {
  impl = MODO === 'supabase' ? await import('./store-supabase.js') : await import('./store-demo.js');
  if (impl.iniciar) await impl.iniciar();
} catch (error) {
  const principal = document.getElementById('principal');
  if (principal) {
    principal.innerHTML =
      '<section class="contenedor vacio"><h2>No se pudo cargar la colección</h2><p>Revise la conexión a internet y recargue la página.</p></section>';
  }
  throw error;
}

export const listarItems = (...a) => impl.listarItems(...a);
export const obtenerItem = (...a) => impl.obtenerItem(...a);
export const listarAlbumes = (...a) => impl.listarAlbumes(...a);
export const obtenerAlbum = (...a) => impl.obtenerAlbum(...a);
export const guardarItem = (...a) => impl.guardarItem(...a);
export const eliminarItem = (...a) => impl.eliminarItem(...a);
export const guardarAlbum = (...a) => impl.guardarAlbum(...a);
export const eliminarAlbum = (...a) => impl.eliminarAlbum(...a);
export const subirFoto = (...a) => impl.subirFoto(...a);
export const exportarTodo = (...a) => impl.exportarTodo(...a);
export const importarTodo = (...a) => impl.importarTodo(...a);
export const restablecerMuestra = (...a) => impl.restablecerMuestra(...a);
export const vaciarColeccion = (...a) => impl.vaciarColeccion(...a);
export const sesionActiva = () => impl.sesionActiva();
export const iniciarSesion = (...a) => impl.iniciarSesion(...a);
export const cerrarSesion = (...a) => impl.cerrarSesion(...a);
export const alCambiar = (fn) => impl.alCambiar(fn);
