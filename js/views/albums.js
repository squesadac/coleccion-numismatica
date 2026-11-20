import { listarItems, listarAlbumes, sesionActiva } from '../data/store.js';
import { html, numero, vacio, miniaturaDe } from '../ui.js';

export function portadaAlbum(album, items) {
  const propios = items.filter((i) => i.albumId === album.id);
  const muestra = propios.slice(0, 3);
  return html`
    <a class="album-tapa" href="#/album/${album.id}" style="--tapa:${album.color || '#1f3b2f'}">
      <div class="album-lomo" aria-hidden="true"></div>
      <div class="album-cuerpo">
        <span class="album-etiqueta">${album.tipo === 'billete' ? 'Billetes' : 'Monedas'}</span>
        <h3>${album.nombre}</h3>
        <p>${numero.format(propios.length)} ${propios.length === 1 ? 'pieza' : 'piezas'}</p>
        <div class="album-vista ${album.tipo === 'billete' ? 'billetes' : ''}" aria-hidden="true">
          ${muestra.map((i) => html`<img src="${miniaturaDe(i)}" alt="" loading="lazy">`)}
        </div>
      </div>
    </a>`;
}

export async function render(principal) {
  const [items, albumes] = await Promise.all([listarItems(), listarAlbumes()]);
  const sinAlbum = items.filter((i) => !albumes.some((a) => a.id === i.albumId)).length;

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <div class="seccion-titulo">
        <div>
          <h1>Álbumes</h1>
          <p class="bajada">Cada álbum reproduce una carpeta de la colección física. Ábralo y pase las páginas.</p>
        </div>
        ${sesionActiva() ? html`<a class="boton" href="#/admin/album/nuevo">+ Nuevo álbum</a>` : ''}
      </div>
      ${albumes.length
        ? html`<div class="estante">${albumes.map((a) => portadaAlbum(a, items))}</div>`
        : vacio('Aún no hay álbumes', 'Los álbumes agrupan las piezas como en las carpetas físicas.')}
      ${sinAlbum ? html`<p class="nota">${numero.format(sinAlbum)} piezas aún no están en ningún álbum. <a href="#/catalogo?album=ninguno">Verlas</a></p>` : ''}
    </section>`);
}
