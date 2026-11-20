// Vista de carpeta: páginas con bolsillos, como el álbum físico.
import { listarItems, obtenerAlbum, sesionActiva } from '../data/store.js';
import { nombrePais } from '../data/countries.js';
import { html, numero, miniaturaDe, tituloItem, parametros, vacio } from '../ui.js';

function paginaHtml(album, numeroPagina, porPosicion) {
  const total = album.filas * album.columnas;
  const bolsillos = [];
  for (let pos = 1; pos <= total; pos++) {
    const item = porPosicion.get(`${numeroPagina}-${pos}`);
    bolsillos.push(
      item
        ? html`<a class="bolsillo lleno" href="#/pieza/${item.id}" title="${tituloItem(item)} · ${nombrePais(item.pais)}">
            <img src="${miniaturaDe(item)}" alt="${tituloItem(item)}" loading="lazy">
            <span class="bolsillo-etiqueta">${item.denominacion}<br><small>${nombrePais(item.pais)} ${item.anio}</small></span>
          </a>`
        : html`<div class="bolsillo" aria-hidden="true"></div>`
    );
  }
  return html`
    <div class="hoja">
      <div class="hoja-bolsillos ${album.tipo === 'billete' ? 'billetes' : ''}" style="--columnas:${album.columnas}">
        ${bolsillos}
      </div>
      <div class="hoja-numero">Página ${numeroPagina}</div>
    </div>`;
}

export async function render(principal, { params, consulta }) {
  const [id] = params;
  const [album, todos] = await Promise.all([obtenerAlbum(id), listarItems()]);
  if (!album) {
    principal.innerHTML = String(html`<section class="contenedor">${vacio('Álbum no encontrado', 'Puede que haya sido eliminado.', html`<a class="boton" href="#/albumes">Ver álbumes</a>`)}</section>`);
    return;
  }

  const items = todos.filter((i) => i.albumId === album.id);
  const porPosicion = new Map();
  const sinUbicar = [];
  for (const i of items) {
    if (i.pagina && i.posicion && !porPosicion.has(`${i.pagina}-${i.posicion}`)) porPosicion.set(`${i.pagina}-${i.posicion}`, i);
    else sinUbicar.push(i);
  }
  const maxPagina = Math.max(1, album.paginas || 1, ...items.map((i) => i.pagina || 0));

  const angosto = () => window.matchMedia('(max-width: 820px)').matches;
  let pagina = Math.min(maxPagina, Math.max(1, parseInt(parametros(consulta).p, 10) || 1));

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <nav class="migas"><a href="#/albumes">Álbumes</a> / <span>${album.nombre}</span></nav>
      <div class="seccion-titulo">
        <div>
          <h1>${album.nombre}</h1>
          <p class="bajada">${album.descripcion || ''} ${numero.format(items.length)} piezas.</p>
        </div>
        <div class="botones">
          <a class="boton" href="#/catalogo?album=${album.id}">Ver como lista</a>
          ${sesionActiva() ? html`<a class="boton" href="#/admin/album/${album.id}">Editar álbum</a>` : ''}
        </div>
      </div>

      <div class="carpeta" style="--tapa:${album.color || '#1f3b2f'}">
        <div class="carpeta-paginas" id="paginas"></div>
      </div>

      <div class="paginador">
        <button class="boton" id="anterior" aria-label="Página anterior">← Anterior</button>
        <span id="indicador" aria-live="polite"></span>
        <button class="boton" id="siguiente" aria-label="Página siguiente">Siguiente →</button>
      </div>

      ${sinUbicar.length
        ? html`<div class="seccion">
            <h2>Piezas de este álbum sin página asignada</h2>
            <div class="rejilla compacta">${sinUbicar.map((i) => html`<a class="bolsillo lleno suelto" href="#/pieza/${i.id}"><img src="${miniaturaDe(i)}" alt="${tituloItem(i)}" loading="lazy"></a>`)}</div>
          </div>`
        : ''}
    </section>`);

  const contenedor = principal.querySelector('#paginas');
  const indicador = principal.querySelector('#indicador');
  const botonAnterior = principal.querySelector('#anterior');
  const botonSiguiente = principal.querySelector('#siguiente');

  function pintar() {
    const doble = !angosto();
    // En pantalla ancha se muestran dos páginas (izquierda impar, derecha par).
    if (doble && pagina % 2 === 0) pagina -= 1;
    const paginas = doble ? [pagina, pagina + 1].filter((p) => p <= maxPagina) : [pagina];
    contenedor.classList.toggle('doble', doble);
    contenedor.innerHTML = paginas.map((p) => String(paginaHtml(album, p, porPosicion))).join('');
    indicador.textContent = paginas.length > 1 ? `Páginas ${paginas[0]}–${paginas[1]} de ${maxPagina}` : `Página ${paginas[0]} de ${maxPagina}`;
    botonAnterior.disabled = pagina <= 1;
    botonSiguiente.disabled = paginas[paginas.length - 1] >= maxPagina;
    history.replaceState(null, '', `#/album/${encodeURIComponent(album.id)}?p=${pagina}`);
  }

  function mover(direccion) {
    const paso = angosto() ? 1 : 2;
    const nueva = pagina + direccion * paso;
    if (nueva < 1 || nueva > maxPagina) return;
    pagina = nueva;
    contenedor.classList.remove('pasar-adelante', 'pasar-atras');
    void contenedor.offsetWidth;
    contenedor.classList.add(direccion > 0 ? 'pasar-adelante' : 'pasar-atras');
    pintar();
  }

  botonAnterior.addEventListener('click', () => mover(-1));
  botonSiguiente.addEventListener('click', () => mover(1));

  const teclas = (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') mover(-1);
    if (e.key === 'ArrowRight') mover(1);
  };
  document.addEventListener('keydown', teclas);

  // Deslizar con el dedo en el celular.
  let inicioX = null;
  const tocar = (e) => (inicioX = e.touches[0].clientX);
  const soltar = (e) => {
    if (inicioX === null) return;
    const dx = e.changedTouches[0].clientX - inicioX;
    if (Math.abs(dx) > 60) mover(dx < 0 ? 1 : -1);
    inicioX = null;
  };
  contenedor.addEventListener('touchstart', tocar, { passive: true });
  contenedor.addEventListener('touchend', soltar);

  // Solo se vuelve a pintar si cambia entre una y dos páginas
  // (en el celular, "resize" se dispara al hacer scroll).
  let eraAngosto = angosto();
  const alRedimensionar = () => {
    if (angosto() !== eraAngosto) {
      eraAngosto = angosto();
      pintar();
    }
  };
  window.addEventListener('resize', alRedimensionar);

  pintar();

  return () => {
    document.removeEventListener('keydown', teclas);
    window.removeEventListener('resize', alRedimensionar);
  };
}
