// Punto de entrada: navegación entre páginas (rutas con "#/...").
import { CONFIG } from './config.js';
import * as store from './data/store.js';
import { esc } from './ui.js';

const RUTAS = [
  { patron: /^\/?$/, vista: () => import('./views/home.js') },
  { patron: /^\/catalogo$/, vista: () => import('./views/catalog.js') },
  { patron: /^\/albumes$/, vista: () => import('./views/albums.js') },
  { patron: /^\/album\/([^/]+)$/, vista: () => import('./views/album.js') },
  { patron: /^\/pieza\/([^/]+)$/, vista: () => import('./views/item.js') },
  { patron: /^\/mapa$/, vista: () => import('./views/map.js') },
  { patron: /^\/admin$/, vista: () => import('./views/admin.js'), admin: true },
  { patron: /^\/admin\/pieza\/([^/]+)$/, vista: () => import('./views/item-form.js'), admin: true },
  { patron: /^\/admin\/album\/([^/]+)$/, vista: () => import('./views/album-form.js'), admin: true },
];

const principal = document.getElementById('principal');
let limpiarVista = null;
let numeroNavegacion = 0;

function rutaActual() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [ruta, consulta = ''] = hash.split('?');
  return { ruta, consulta };
}

function marcarMenu(ruta) {
  document.querySelectorAll('[data-menu]').forEach((enlace) => {
    const seccion = enlace.dataset.menu;
    const activo =
      (seccion === 'inicio' && ruta === '/') ||
      (seccion === 'catalogo' && (ruta.startsWith('/catalogo') || ruta.startsWith('/pieza'))) ||
      (seccion === 'albumes' && ruta.startsWith('/album')) ||
      (seccion === 'mapa' && ruta.startsWith('/mapa')) ||
      (seccion === 'admin' && ruta.startsWith('/admin'));
    enlace.classList.toggle('activo', activo);
    if (activo) enlace.setAttribute('aria-current', 'page');
    else enlace.removeAttribute('aria-current');
  });
}

function pintarEstadoSesion() {
  const franja = document.getElementById('franja-demo');
  const enSesion = store.sesionActiva();
  franja.hidden = !(enSesion && store.MODO === 'demo');
  document.getElementById('enlace-admin').textContent = enSesion ? 'Administrar' : 'Entrar';
}

async function navegar() {
  const actual = ++numeroNavegacion;
  const { ruta, consulta } = rutaActual();
  marcarMenu(ruta);
  pintarEstadoSesion();

  if (typeof limpiarVista === 'function') limpiarVista();
  limpiarVista = null;

  let coincidencia = null;
  let definicion = null;
  for (const r of RUTAS) {
    coincidencia = ruta.match(r.patron);
    if (coincidencia) {
      definicion = r;
      break;
    }
  }

  if (!definicion) {
    principal.innerHTML = `<section class="contenedor vacio"><h2>Página no encontrada</h2><p><a href="#/">Volver al inicio</a></p></section>`;
    return;
  }

  try {
    const modulo = await (definicion.admin && !store.sesionActiva() ? import('./views/login.js') : definicion.vista());
    if (actual !== numeroNavegacion) return; // el usuario ya navegó a otra página
    principal.innerHTML = '';
    const resultado = await modulo.render(principal, {
      params: coincidencia.slice(1).map(decodeURIComponent),
      consulta,
      ruta,
    });
    if (actual !== numeroNavegacion) {
      if (typeof resultado === 'function') resultado();
      return;
    }
    limpiarVista = resultado;
    principal.focus({ preventScroll: true });
  } catch (error) {
    console.error(error);
    principal.innerHTML = `<section class="contenedor vacio"><h2>Algo salió mal</h2><p>${esc(error.message)}</p><p><a href="#/">Volver al inicio</a></p></section>`;
  }
}

function iniciar() {
  document.title = CONFIG.titulo;
  document.getElementById('titulo-sitio').textContent = CONFIG.titulo;
  document.getElementById('anio-pie').textContent = new Date().getFullYear();

  window.addEventListener('hashchange', () => {
    const { ruta } = rutaActual();
    // Solo se vuelve arriba al cambiar de página, no al cambiar filtros.
    if (ruta !== window.__rutaAnterior) window.scrollTo(0, 0);
    window.__rutaAnterior = ruta;
    navegar();
  });
  window.__rutaAnterior = rutaActual().ruta;

  store.alCambiar(pintarEstadoSesion);
  navegar();
}

iniciar();
