import { listarItems, listarAlbumes } from '../data/store.js';
import { CONTINENTES, nombrePais, continenteDe, compararTexto } from '../data/countries.js';
import { TIPOS, METALES } from '../config.js';
import { html, numero, tarjetaItem, vacio, parametros, construirRuta, normalizar, listaPorTandas } from '../ui.js';

const ORDENES = {
  recientes: 'Agregadas recientemente',
  pais: 'País (A–Z)',
  antiguas: 'Año: más antiguas primero',
  nuevas: 'Año: más nuevas primero',
};

function anioNumero(item) {
  const m = String(item.anio || '').match(/\d{3,4}/);
  return m ? parseInt(m[0], 10) : null;
}

function opciones(mapa, seleccion, etiquetaTodos) {
  return html`<option value="">${etiquetaTodos}</option>${Object.entries(mapa).map(
    ([valor, texto]) => html`<option value="${valor}" ${valor === seleccion ? 'selected' : ''}>${texto}</option>`
  )}`;
}

export async function render(principal, { consulta }) {
  const [items, albumes] = await Promise.all([listarItems(), listarAlbumes()]);
  const filtros = { q: '', tipo: '', continente: '', pais: '', metal: '', album: '', orden: 'recientes', ...parametros(consulta) };

  // Índice de búsqueda: un texto sin tildes por pieza.
  const indice = new Map(
    items.map((i) => [
      i.id,
      normalizar([i.denominacion, i.anio, nombrePais(i.pais), i.metal, i.catalogo, i.descripcion, i.historia].join(' ')),
    ])
  );

  const conteoPais = new Map();
  items.forEach((i) => conteoPais.set(i.pais, (conteoPais.get(i.pais) || 0) + 1));
  const metalesPresentes = METALES.filter((m) => items.some((i) => i.metal === m));
  const continentesPresentes = Object.fromEntries(
    Object.entries(CONTINENTES).filter(([c]) => [...conteoPais.keys()].some((p) => continenteDe(p) === c))
  );

  principal.innerHTML = String(html`
    <section class="contenedor seccion">
      <div class="seccion-titulo">
        <div>
          <h1>Catálogo</h1>
          <p class="bajada" id="conteo" aria-live="polite"></p>
        </div>
      </div>

      <form class="filtros" id="filtros" role="search" onsubmit="return false">
        <label class="filtro-busqueda">
          <span class="sr">Buscar</span>
          <input type="search" name="q" value="${filtros.q}" placeholder="Buscar por país, año, denominación, KM#…" autocomplete="off">
        </label>
        <label><span>Tipo</span><select name="tipo">${opciones(TIPOS, filtros.tipo, 'Todos')}</select></label>
        <label><span>Región</span><select name="continente">${opciones(continentesPresentes, filtros.continente, 'Todas')}</select></label>
        <label><span>País</span><select name="pais" id="filtro-pais"></select></label>
        <label><span>Metal</span><select name="metal">${opciones(Object.fromEntries(metalesPresentes.map((m) => [m, m])), filtros.metal, 'Todos')}</select></label>
        <label><span>Álbum</span><select name="album">${opciones(
          { ...Object.fromEntries(albumes.map((a) => [a.id, a.nombre])), ninguno: 'Sin álbum' },
          filtros.album,
          'Todos'
        )}</select></label>
        <label><span>Orden</span><select name="orden">${Object.entries(ORDENES).map(
          ([v, t]) => html`<option value="${v}" ${v === filtros.orden ? 'selected' : ''}>${t}</option>`
        )}</select></label>
        <button type="button" class="boton enlace" id="limpiar">Limpiar filtros</button>
      </form>

      <div class="rejilla" id="resultados"></div>
    </section>`);

  const formulario = principal.querySelector('#filtros');
  const selectPais = principal.querySelector('#filtro-pais');
  const resultados = principal.querySelector('#resultados');
  const conteo = principal.querySelector('#conteo');
  let detenerLista = null;

  function pintarPaises() {
    const paises = [...conteoPais.keys()]
      .filter((p) => !filtros.continente || continenteDe(p) === filtros.continente)
      .sort((a, b) => compararTexto(nombrePais(a), nombrePais(b)));
    if (filtros.pais && !paises.includes(filtros.pais)) filtros.pais = '';
    selectPais.innerHTML = String(html`<option value="">Todos</option>${paises.map(
      (p) => html`<option value="${p}" ${p === filtros.pais ? 'selected' : ''}>${nombrePais(p)} (${conteoPais.get(p)})</option>`
    )}`);
  }

  function filtrar() {
    const terminos = normalizar(filtros.q).split(/\s+/).filter(Boolean);
    let lista = items.filter((i) => {
      if (filtros.tipo && i.tipo !== filtros.tipo) return false;
      if (filtros.pais && i.pais !== filtros.pais) return false;
      if (filtros.continente && continenteDe(i.pais) !== filtros.continente) return false;
      if (filtros.metal && i.metal !== filtros.metal) return false;
      if (filtros.album === 'ninguno' && albumes.some((a) => a.id === i.albumId)) return false;
      if (filtros.album && filtros.album !== 'ninguno' && i.albumId !== filtros.album) return false;
      if (terminos.length) {
        const texto = indice.get(i.id);
        if (!terminos.every((t) => texto.includes(t))) return false;
      }
      return true;
    });

    const porAnio = (dir) => (a, b) => {
      const x = anioNumero(a);
      const y = anioNumero(b);
      if (x === null) return 1;
      if (y === null) return -1;
      return dir * (x - y);
    };
    if (filtros.orden === 'pais') lista.sort((a, b) => compararTexto(nombrePais(a.pais), nombrePais(b.pais)) || porAnio(1)(a, b));
    else if (filtros.orden === 'antiguas') lista.sort(porAnio(1));
    else if (filtros.orden === 'nuevas') lista.sort(porAnio(-1));
    else lista.sort((a, b) => String(b.creado).localeCompare(String(a.creado)));
    return lista;
  }

  function pintar() {
    const lista = filtrar();
    conteo.textContent = lista.length === items.length
      ? `${numero.format(items.length)} piezas en la colección`
      : `${numero.format(lista.length)} de ${numero.format(items.length)} piezas`;
    const { orden, ...resto } = filtros;
    history.replaceState(null, '', '#' + construirRuta('/catalogo', { ...resto, orden: orden === 'recientes' ? '' : orden }));
    if (detenerLista) detenerLista();
    detenerLista = null;
    if (!lista.length) {
      resultados.innerHTML = String(vacio('Sin resultados', 'Pruebe con otra búsqueda o quite algunos filtros.'));
      return;
    }
    detenerLista = listaPorTandas(resultados, lista, tarjetaItem);
  }

  let espera = null;
  formulario.addEventListener('input', (e) => {
    const campo = e.target;
    if (!campo.name) return;
    filtros[campo.name] = campo.value;
    if (campo.name === 'continente') pintarPaises();
    clearTimeout(espera);
    espera = setTimeout(pintar, campo.name === 'q' ? 180 : 0);
  });

  principal.querySelector('#limpiar').addEventListener('click', () => {
    Object.assign(filtros, { q: '', tipo: '', continente: '', pais: '', metal: '', album: '', orden: 'recientes' });
    formulario.reset();
    formulario.querySelectorAll('select').forEach((s) => (s.selectedIndex = 0));
    formulario.querySelector('[name=q]').value = '';
    pintarPaises();
    pintar();
  });

  pintarPaises();
  pintar();

  return () => {
    clearTimeout(espera);
    if (detenerLista) detenerLista();
  };
}
