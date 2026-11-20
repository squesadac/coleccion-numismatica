// Datos de ejemplo para ver el sitio funcionando antes de cargar la colección real.

function rng(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MONEDAS = [
  { pais: 'CR', album: 'cr', n: 28, unidad: ['céntimos', 'colones'], valores: [[5, 0], [10, 0], [25, 0], [50, 0], [1, 1], [2, 1], [5, 1], [10, 1], [25, 1], [50, 1], [100, 1], [500, 1]], anios: [1917, 2017], metales: ['Cuproníquel', 'Latón', 'Acero', 'Aluminio', 'Plata', 'Bronce'] },
  { pais: 'MX', album: 'la', n: 9, unidad: ['centavos', 'pesos'], valores: [[10, 0], [20, 0], [50, 0], [1, 1], [5, 1], [10, 1], [20, 1]], anios: [1905, 2010], metales: ['Bronce', 'Plata', 'Cuproníquel', 'Bimetálica'] },
  { pais: 'GT', album: 'la', n: 4, unidad: ['centavos', 'quetzal'], valores: [[5, 0], [10, 0], [25, 0], [1, 1]], anios: [1949, 2012], metales: ['Cuproníquel', 'Latón'] },
  { pais: 'PA', album: 'la', n: 4, unidad: ['centésimos', 'balboa'], valores: [[1, 0], [5, 0], [10, 0], [1, 1]], anios: [1904, 2011], metales: ['Cobre', 'Cuproníquel', 'Plata'] },
  { pais: 'NI', album: 'la', n: 3, unidad: ['centavos', 'córdobas'], valores: [[5, 0], [25, 0], [1, 1], [5, 1]], anios: [1912, 2007], metales: ['Cuproníquel', 'Acero', 'Latón'] },
  { pais: 'CO', album: 'la', n: 4, unidad: ['centavos', 'pesos'], valores: [[50, 0], [1, 1], [100, 1], [500, 1]], anios: [1940, 2012], metales: ['Cuproníquel', 'Bimetálica', 'Bronce'] },
  { pais: 'AR', album: 'la', n: 4, unidad: ['centavos', 'pesos'], valores: [[10, 0], [25, 0], [1, 1], [2, 1]], anios: [1890, 2011], metales: ['Bronce', 'Bimetálica', 'Níquel'] },
  { pais: 'PE', album: 'la', n: 3, unidad: ['céntimos', 'soles'], valores: [[10, 0], [50, 0], [1, 1], [5, 1]], anios: [1923, 2015], metales: ['Latón', 'Plata', 'Bimetálica'] },
  { pais: 'H-EC', album: 'la', n: 2, unidad: ['cents', 'dollar'], valores: [[25, 0], [1, 1]], anios: [1981, 2008], metales: ['Cuproníquel', 'Aluminio'] },
  { pais: 'US', album: 'la', n: 7, unidad: ['cents', 'dollar'], valores: [[1, 0], [5, 0], [10, 0], [25, 0], [50, 0], [1, 1]], anios: [1890, 2000], metales: ['Cobre', 'Níquel', 'Plata', 'Cuproníquel'] },
  { pais: 'ES', album: 'eu', n: 6, unidad: ['céntimos', 'pesetas'], valores: [[50, 0], [1, 1], [5, 1], [25, 1], [100, 1]], anios: [1870, 2001], metales: ['Plata', 'Cuproníquel', 'Aluminio', 'Latón'] },
  { pais: 'FR', album: 'eu', n: 5, unidad: ['centimes', 'francs'], valores: [[10, 0], [20, 0], [1, 1], [5, 1], [10, 1]], anios: [1898, 2000], metales: ['Bronce', 'Níquel', 'Plata', 'Bimetálica'] },
  { pais: 'DE', album: 'eu', n: 5, unidad: ['pfennig', 'mark'], valores: [[10, 0], [50, 0], [1, 1], [2, 1], [5, 1]], anios: [1950, 2001], metales: ['Latón', 'Cuproníquel', 'Plata'] },
  { pais: 'H-DR', album: 'eu', n: 2, unidad: ['pfennig', 'mark'], valores: [[10, 0], [1, 1], [3, 1]], anios: [1875, 1918], metales: ['Plata', 'Cuproníquel'] },
  { pais: 'GB', album: 'eu', n: 5, unidad: ['pence', 'pound'], valores: [[1, 0], [10, 0], [50, 0], [1, 1]], anios: [1902, 2015], metales: ['Bronce', 'Cuproníquel', 'Latón', 'Plata'] },
  { pais: 'IT', album: 'eu', n: 3, unidad: ['centesimi', 'lire'], valores: [[50, 1], [100, 1], [500, 1]], anios: [1951, 2001], metales: ['Acero', 'Bimetálica', 'Plata'] },
  { pais: 'H-SU', album: 'eu', n: 4, unidad: ['kopeks', 'rublo'], valores: [[1, 0], [15, 0], [20, 0], [1, 1]], anios: [1924, 1991], metales: ['Bronce', 'Cuproníquel', 'Latón'] },
  { pais: 'NL', album: 'eu', n: 2, unidad: ['cent', 'gulden'], valores: [[10, 0], [1, 1]], anios: [1948, 2001], metales: ['Níquel', 'Plata'] },
  { pais: 'PT', album: 'eu', n: 2, unidad: ['centavos', 'escudos'], valores: [[50, 0], [25, 1]], anios: [1930, 2001], metales: ['Bronce', 'Cuproníquel'] },
  { pais: 'JP', album: 'mu', n: 5, unidad: ['sen', 'yenes'], valores: [[1, 1], [5, 1], [10, 1], [100, 1], [500, 1]], anios: [1949, 2018], metales: ['Aluminio', 'Latón', 'Bronce', 'Cuproníquel'] },
  { pais: 'CN', album: 'mu', n: 3, unidad: ['fen', 'yuan'], valores: [[1, 0], [5, 0], [1, 1]], anios: [1955, 2012], metales: ['Aluminio', 'Níquel', 'Acero'] },
  { pais: 'IN', album: 'mu', n: 3, unidad: ['paise', 'rupias'], valores: [[25, 0], [1, 1], [10, 1]], anios: [1950, 2015], metales: ['Acero', 'Cuproníquel', 'Bimetálica'] },
  { pais: 'H-BI', album: 'mu', n: 2, unidad: ['annas', 'rupia'], valores: [[1, 0], [1, 1]], anios: [1890, 1946], metales: ['Plata', 'Cobre'] },
  { pais: 'ZA', album: 'mu', n: 3, unidad: ['cents', 'rand'], valores: [[10, 0], [1, 1], [5, 1]], anios: [1965, 2010], metales: ['Bronce', 'Níquel', 'Oro'] },
  { pais: 'EG', album: 'mu', n: 2, unidad: ['piastras', 'libra'], valores: [[10, 0], [1, 1]], anios: [1935, 2010], metales: ['Cuproníquel', 'Bimetálica'] },
  { pais: 'AU', album: 'mu', n: 4, unidad: ['cents', 'dollar'], valores: [[5, 0], [20, 0], [50, 0], [1, 1]], anios: [1966, 2016], metales: ['Cuproníquel', 'Latón'] },
  { pais: 'NZ', album: 'mu', n: 2, unidad: ['cents', 'dollar'], valores: [[10, 0], [1, 1]], anios: [1967, 2010], metales: ['Cuproníquel', 'Latón'] },
  { pais: 'TR', album: 'mu', n: 2, unidad: ['kuruş', 'lira'], valores: [[25, 0], [1, 1]], anios: [1959, 2010], metales: ['Acero', 'Bimetálica'] },
];

const BILLETES = [
  { pais: 'CR', album: 'bcr', n: 14, unidad: 'colones', valores: [5, 10, 20, 50, 100, 500, 1000, 2000, 5000, 10000, 20000, 50000], anios: [1958, 2019], metales: ['Papel', 'Polímero'] },
  { pais: 'MX', album: 'bm', n: 3, unidad: 'pesos', valores: [20, 50, 100, 500], anios: [1960, 2018], metales: ['Papel', 'Polímero'] },
  { pais: 'NI', album: 'bm', n: 2, unidad: 'córdobas', valores: [10, 20, 100], anios: [1985, 2015], metales: ['Papel', 'Polímero'] },
  { pais: 'US', album: 'bm', n: 3, unidad: 'dólares', valores: [1, 2, 5, 20], anios: [1935, 2013], metales: ['Papel'] },
  { pais: 'ES', album: 'bm', n: 2, unidad: 'pesetas', valores: [100, 1000, 5000], anios: [1953, 1992], metales: ['Papel'] },
  { pais: 'GB', album: 'bm', n: 2, unidad: 'libras', valores: [1, 5, 10], anios: [1960, 2016], metales: ['Papel', 'Polímero'] },
  { pais: 'JP', album: 'bm', n: 2, unidad: 'yenes', valores: [1000, 5000], anios: [1963, 2004], metales: ['Papel'] },
  { pais: 'H-SU', album: 'bm', n: 2, unidad: 'rublos', valores: [1, 3, 10], anios: [1961, 1991], metales: ['Papel'] },
  { pais: 'H-ZR', album: 'bm', n: 1, unidad: 'zaïres', valores: [5, 50], anios: [1980, 1993], metales: ['Papel'] },
  { pais: 'AU', album: 'bm', n: 2, unidad: 'dólares', valores: [5, 10, 20], anios: [1992, 2016], metales: ['Polímero'] },
  { pais: 'ZW', album: 'bm', n: 1, unidad: 'dólares', valores: [100000000000000], anios: [2008, 2008], metales: ['Papel'] },
  { pais: 'VE', album: 'bm', n: 2, unidad: 'bolívares', valores: [10, 100, 1000], anios: [1990, 2018], metales: ['Papel'] },
];

const HISTORIAS = [
  'Me la regaló mi padre cuando era niño; fue la primera pieza de la colección.',
  'Comprada en una feria numismática en San José. El vendedor juraba que era la última que tenía.',
  'La traje de un viaje. La recibí como vuelto en un mercado y la guardé de inmediato.',
  'Intercambiada con un amigo coleccionista por dos monedas repetidas.',
  'Estaba en una caja de monedas viejas de la abuela.',
  'Encontrada en un frasco de monedas sueltas. ¡Nadie sabía lo que tenía!',
];

export const ALBUMES_MUESTRA = [
  { id: 'cr', nombre: 'Costa Rica', descripcion: 'Monedas costarricenses desde la época de la República.', tipo: 'moneda', filas: 4, columnas: 5, paginas: 2, color: '#1f4d3a', orden: 1 },
  { id: 'la', nombre: 'América', descripcion: 'Monedas del resto del continente americano.', tipo: 'moneda', filas: 4, columnas: 5, paginas: 3, color: '#7a2e2e', orden: 2 },
  { id: 'eu', nombre: 'Europa', descripcion: 'Pesetas, francos, marcos, liras y más, de antes del euro.', tipo: 'moneda', filas: 4, columnas: 5, paginas: 2, color: '#24395e', orden: 3 },
  { id: 'mu', nombre: 'Asia, África y Oceanía', descripcion: 'Monedas de lugares lejanos.', tipo: 'moneda', filas: 4, columnas: 5, paginas: 2, color: '#5b4421', orden: 4 },
  { id: 'bcr', nombre: 'Billetes de Costa Rica', descripcion: 'Billetes del Banco Central de Costa Rica.', tipo: 'billete', filas: 3, columnas: 1, paginas: 5, color: '#3d2a52', orden: 5 },
  { id: 'bm', nombre: 'Billetes del mundo', descripcion: 'Billetes de todos los rincones del planeta.', tipo: 'billete', filas: 3, columnas: 1, paginas: 8, color: '#2c4a4f', orden: 6 },
];

function formatoNumero(n) {
  return new Intl.NumberFormat('es-CR').format(n);
}

const SINGULAR = {
  colones: 'colón', céntimos: 'céntimo', centavos: 'centavo', pesos: 'peso', pesetas: 'peseta', dólares: 'dólar',
  rublos: 'rublo', libras: 'libra', yenes: 'yen', soles: 'sol', córdobas: 'córdoba', bolívares: 'bolívar',
  zaïres: 'zaïre', rupias: 'rupia', piastras: 'piastra', francs: 'franc', cents: 'cent', pence: 'penny',
  kopeks: 'kopek',
};

function denominacion(valor, unidad) {
  return `${formatoNumero(valor)} ${valor === 1 ? SINGULAR[unidad] || unidad : unidad}`;
}

export function generarMuestra() {
  const azar = rng(19480);
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const entre = (a, b) => a + Math.floor(azar() * (b - a + 1));

  const items = [];
  const posicionPorAlbum = {};
  const capacidad = Object.fromEntries(ALBUMES_MUESTRA.map((a) => [a.id, a.filas * a.columnas]));
  let contador = 0;
  const base = Date.UTC(2026, 0, 1);

  const agregar = (tipo, spec, denominacion, metal) => {
    contador += 1;
    const pos = posicionPorAlbum[spec.album] || 0;
    posicionPorAlbum[spec.album] = pos + 1;
    const anio = entre(spec.anios[0], spec.anios[1]);
    const esPlata = metal === 'Plata' || metal === 'Oro';
    items.push({
      id: `m${String(contador).padStart(4, '0')}`,
      muestra: true,
      tipo,
      pais: spec.pais,
      denominacion,
      anio: String(anio),
      metal,
      estado: elegir(['BC', 'MBC', 'MBC', 'EBC', 'EBC', 'SC-', 'SC']),
      catalogo: tipo === 'moneda' ? `KM# ${entre(1, 250)}` : `P-${entre(1, 280)}`,
      descripcion: esPlata ? 'Pieza de metal precioso, muy apreciada.' : '',
      historia: azar() < 0.12 ? elegir(HISTORIAS) : '',
      albumId: spec.album,
      pagina: Math.floor(pos / capacidad[spec.album]) + 1,
      posicion: (pos % capacidad[spec.album]) + 1,
      fotos: {},
      privado: {
        precioCompra: azar() < 0.5 ? entre(1, 40) * 500 : null,
        valorEstimado: entre(1, 80) * (esPlata ? 5000 : 1000),
        ubicacion: '',
      },
      creado: new Date(base + contador * 36e5 * 7).toISOString(),
    });
  };

  for (const spec of MONEDAS) {
    for (let i = 0; i < spec.n; i++) {
      const [valor, idx] = elegir(spec.valores);
      agregar('moneda', spec, denominacion(valor, spec.unidad[idx]), elegir(spec.metales));
    }
  }
  for (const spec of BILLETES) {
    for (let i = 0; i < spec.n; i++) {
      agregar('billete', spec, denominacion(elegir(spec.valores), spec.unidad), elegir(spec.metales));
    }
  }

  return { albumes: ALBUMES_MUESTRA.map((a) => ({ ...a })), items };
}
