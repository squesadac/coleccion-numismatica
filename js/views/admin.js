import * as store from '../data/store.js';
import { nombrePais } from '../data/countries.js';
import { TIPOS } from '../config.js';
import { html, numero, miniaturaDe, normalizar, aviso, listaPorTandas } from '../ui.js';

function filaItem(item, albumes) {
  const album = albumes.find((a) => a.id === item.albumId);
  return html`
    <tr>
      <td><img class="mini" src="${miniaturaDe(item)}" alt="" loading="lazy"></td>
      <td><a href="#/pieza/${item.id}">${item.denominacion || 'Sin denominación'}</a><br><small>${TIPOS[item.tipo] || ''}</small></td>
      <td>${nombrePais(item.pais)}</td>
      <td>${item.anio}</td>
      <td>${album ? html`${album.nombre}${item.pagina ? html`<br><small>pág. ${item.pagina}, #${item.posicion}</small>` : ''}` : html`<small>—</small>`}</td>
      <td class="derecha"><a class="boton chico" href="#/admin/pieza/${item.id}">Editar</a></td>
    </tr>`;
}

export async function render(principal) {
  const [items, albumes] = await Promise.all([store.listarItems(), store.listarAlbumes()]);
  const sinFoto = items.filter((i) => !i.fotos?.anverso).length;

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <div class="seccion-titulo">
        <div>
          <h1>Administrar la colección</h1>
          <p class="bajada">${numero.format(items.length)} piezas · ${numero.format(albumes.length)} álbumes${sinFoto ? ` · ${numero.format(sinFoto)} sin foto` : ''}</p>
        </div>
        <button class="boton enlace" id="salir">Cerrar sesión</button>
      </div>

      <div class="acciones-grandes">
        <a class="accion" href="#/admin/pieza/nueva">
          <span class="accion-icono" aria-hidden="true">＋</span>
          <strong>Agregar pieza</strong>
          <small>Fotos y datos de una moneda o billete</small>
        </a>
        <a class="accion" href="#/admin/album/nuevo">
          <span class="accion-icono" aria-hidden="true">▤</span>
          <strong>Nuevo álbum</strong>
          <small>Una carpeta de la colección física</small>
        </a>
      </div>

      <div class="seccion">
        <h2>Álbumes</h2>
        <ul class="lista-albumes">
          ${albumes.map((a) => html`
            <li style="--tapa:${a.color || '#1f3b2f'}">
              <span class="punto"></span>
              <a href="#/album/${a.id}">${a.nombre}</a>
              <small>${numero.format(items.filter((i) => i.albumId === a.id).length)} piezas · ${a.filas}×${a.columnas} por página</small>
              <a class="boton chico" href="#/admin/album/${a.id}">Editar</a>
            </li>`)}
        </ul>
      </div>

      <div class="seccion">
        <div class="seccion-titulo">
          <h2>Piezas</h2>
          <input type="search" id="buscar" placeholder="Buscar…" aria-label="Buscar piezas">
        </div>
        <div class="tabla-marco">
          <table class="tabla">
            <thead><tr><th></th><th>Denominación</th><th>País</th><th>Año</th><th>Álbum</th><th></th></tr></thead>
            <tbody id="filas"></tbody>
          </table>
        </div>
      </div>

      <div class="seccion">
        <h2>Respaldo</h2>
        <p class="bajada">Descargue una copia de toda la colección de vez en cuando y guárdela en un lugar seguro.</p>
        <div class="botones">
          <button class="boton" id="exportar">Descargar respaldo</button>
          <label class="boton">Restaurar respaldo<input type="file" id="importar" accept="application/json,.json" hidden></label>
          ${store.MODO === 'demo'
            ? html`<button class="boton" id="muestra">Volver a los datos de ejemplo</button>
                <button class="boton peligro" id="vaciar">Empezar con la colección vacía</button>`
            : ''}
        </div>
      </div>
    </section>`);

  const cuerpo = principal.querySelector('#filas');
  const ordenados = [...items].sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
  let detener = listaPorTandas(cuerpo, ordenados, (i) => filaItem(i, albumes), 80, cuerpo.closest(".tabla-marco"));

  let espera;
  principal.querySelector('#buscar').addEventListener('input', (e) => {
    clearTimeout(espera);
    espera = setTimeout(() => {
      const terminos = normalizar(e.target.value).split(/\s+/).filter(Boolean);
      const lista = ordenados.filter((i) => {
        const texto = normalizar([i.denominacion, i.anio, nombrePais(i.pais), i.catalogo].join(' '));
        return terminos.every((t) => texto.includes(t));
      });
      detener();
      detener = listaPorTandas(cuerpo, lista, (i) => filaItem(i, albumes), 80, cuerpo.closest(".tabla-marco"));
    }, 150);
  });

  principal.querySelector('#salir').addEventListener('click', async () => {
    await store.cerrarSesion();
    location.hash = '#/';
  });

  principal.querySelector('#exportar').addEventListener('click', async () => {
    const texto = await store.exportarTodo();
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    enlace.download = `coleccion-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
  });

  principal.querySelector('#importar').addEventListener('change', async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (!confirm('Esto reemplazará toda la colección actual por la del respaldo. ¿Continuar?')) return;
    try {
      await store.importarTodo(await archivo.text());
      aviso('Respaldo restaurado.');
      render(principal);
    } catch (err) {
      aviso(err.message || 'No se pudo leer el respaldo.', 'error');
    }
  });

  principal.querySelector('#muestra')?.addEventListener('click', async () => {
    if (!confirm('Se borrarán los cambios hechos en este navegador y se volverán a cargar las piezas de ejemplo. ¿Continuar?')) return;
    await store.restablecerMuestra();
    aviso('Datos de ejemplo restaurados.');
    render(principal);
  });

  principal.querySelector('#vaciar')?.addEventListener('click', async () => {
    if (!confirm('Se borrarán todas las piezas y álbumes de este navegador. ¿Continuar?')) return;
    await store.vaciarColeccion();
    aviso('La colección quedó vacía.');
    render(principal);
  });

  return () => {
    clearTimeout(espera);
    detener();
  };
}
