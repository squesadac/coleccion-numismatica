// Datos reales en Supabase: base de datos (piezas y álbumes), inicio de sesión y fotos.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/+esm';
import { CONFIG } from '../config.js';

const BUCKET = 'fotos';
const sb = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);

let esAdmin = false;
let cacheItems = null; // Promise<item[]>
let cacheAlbumes = null; // Promise<album[]>
const oyentes = new Set();

function notificar() {
  oyentes.forEach((fn) => fn());
}

function invalidar() {
  cacheItems = null;
  cacheAlbumes = null;
}

function traducir(error) {
  const msg = String(error?.message || error || '');
  console.error('Supabase:', error);
  if (/row-level security|permission denied|not authorized|JWT/i.test(msg)) {
    return new Error('No tiene permiso para hacer este cambio. Vuelva a iniciar sesión.');
  }
  if (/Failed to fetch|NetworkError|network/i.test(msg)) {
    return new Error('No hay conexión con la base de datos. Revise el internet e intente de nuevo.');
  }
  return new Error(`Error de la base de datos: ${msg}`);
}

// ---------- Sesión ----------

async function revisarAdmin(sesion) {
  const antes = esAdmin;
  esAdmin = false;
  if (sesion?.user) {
    const { data, error } = await sb.from('administradores').select('email').limit(1);
    esAdmin = !error && Array.isArray(data) && data.length > 0;
  }
  if (antes !== esAdmin) invalidar();
}

export async function iniciar() {
  try {
    const { data } = await sb.auth.getSession();
    await revisarAdmin(data.session);
  } catch (e) {
    console.error(e);
  }
  sb.auth.onAuthStateChange((evento, sesion) => {
    if (evento === 'INITIAL_SESSION') return;
    // Supabase recomienda no llamar a la base de datos dentro de este aviso directamente.
    setTimeout(() => revisarAdmin(sesion).then(notificar), 0);
  });
}

export function sesionActiva() {
  return esAdmin;
}

export async function iniciarSesion(credenciales = {}) {
  const { correo, clave } = credenciales;
  const { data, error } = await sb.auth.signInWithPassword({ email: String(correo || '').trim(), password: clave || '' });
  if (error) {
    if (/invalid login|invalid credentials/i.test(error.message)) throw new Error('Correo o contraseña incorrectos.');
    if (/email not confirmed/i.test(error.message)) throw new Error('El correo aún no está confirmado en Supabase.');
    throw traducir(error);
  }
  await revisarAdmin(data.session);
  if (!esAdmin) {
    await sb.auth.signOut();
    throw new Error('Esta cuenta no tiene permiso para administrar la colección.');
  }
  notificar();
}

export async function cerrarSesion() {
  await sb.auth.signOut();
  esAdmin = false;
  invalidar();
  notificar();
}

export function alCambiar(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

// ---------- Conversión entre la base de datos y la aplicación ----------

function deFilaPieza(f) {
  return {
    id: f.id,
    tipo: f.tipo,
    pais: f.pais,
    denominacion: f.denominacion,
    anio: f.anio || '',
    metal: f.metal || '',
    estado: f.estado || '',
    catalogo: f.catalogo || '',
    descripcion: f.descripcion || '',
    historia: f.historia || '',
    albumId: f.album_id || '',
    pagina: f.pagina,
    posicion: f.posicion,
    fotos: f.fotos || {},
    creado: f.creado,
    actualizado: f.actualizado,
  };
}

function aFilaPieza(i) {
  return {
    tipo: i.tipo || 'moneda',
    pais: i.pais,
    denominacion: i.denominacion,
    anio: i.anio || '',
    metal: i.metal || '',
    estado: i.estado || '',
    catalogo: i.catalogo || '',
    descripcion: i.descripcion || '',
    historia: i.historia || '',
    album_id: i.albumId || null,
    pagina: i.albumId ? i.pagina ?? null : null,
    posicion: i.albumId ? i.posicion ?? null : null,
    fotos: i.fotos || {},
  };
}

function deFilaPrivado(f) {
  return {
    precioCompra: f?.precio_compra ?? null,
    valorEstimado: f?.valor_estimado ?? null,
    ubicacion: f?.ubicacion || '',
  };
}

function aFilaAlbum(a) {
  return {
    nombre: a.nombre,
    descripcion: a.descripcion || '',
    tipo: a.tipo || 'moneda',
    filas: a.filas,
    columnas: a.columnas,
    paginas: a.paginas || 1,
    color: a.color,
    ...(a.orden !== undefined ? { orden: a.orden } : {}),
  };
}

/** Supabase entrega como máximo 1000 filas por consulta: se piden por bloques. */
async function traerTodo(tabla, orden) {
  const tam = 1000;
  const filas = [];
  for (let desde = 0; ; desde += tam) {
    const { data, error } = await sb.from(tabla).select('*').order(orden).range(desde, desde + tam - 1);
    if (error) throw traducir(error);
    filas.push(...data);
    if (data.length < tam) break;
  }
  return filas;
}

// ---------- Lectura ----------

export function listarItems() {
  if (!cacheItems) {
    cacheItems = (async () => {
      const [piezas, privados] = await Promise.all([
        traerTodo('piezas', 'id'),
        esAdmin ? traerTodo('piezas_privado', 'pieza_id') : Promise.resolve([]),
      ]);
      const porId = new Map(privados.map((p) => [p.pieza_id, p]));
      return piezas.map((f) => {
        const item = deFilaPieza(f);
        if (esAdmin) item.privado = deFilaPrivado(porId.get(f.id));
        return item;
      });
    })().catch((e) => {
      cacheItems = null;
      throw e;
    });
  }
  return cacheItems.then((lista) => lista.slice());
}

export async function obtenerItem(id) {
  if (cacheItems) return (await listarItems()).find((i) => i.id === id) || null;
  const { data, error } = await sb.from('piezas').select('*').eq('id', id).maybeSingle();
  if (error) throw traducir(error);
  if (!data) return null;
  const item = deFilaPieza(data);
  if (esAdmin) {
    const { data: p } = await sb.from('piezas_privado').select('*').eq('pieza_id', id).maybeSingle();
    item.privado = deFilaPrivado(p);
  }
  return item;
}

export function listarAlbumes() {
  if (!cacheAlbumes) {
    cacheAlbumes = traerTodo('albumes', 'orden').catch((e) => {
      cacheAlbumes = null;
      throw e;
    });
  }
  return cacheAlbumes.then((lista) => lista.map((a) => ({ ...a })));
}

export async function obtenerAlbum(id) {
  return (await listarAlbumes()).find((a) => a.id === id) || null;
}

// ---------- Fotos ----------

function rutaDeFoto(url) {
  const marca = `/object/public/${BUCKET}/`;
  const i = typeof url === 'string' ? url.indexOf(marca) : -1;
  return i === -1 ? null : decodeURIComponent(url.slice(i + marca.length));
}

async function borrarFotos(urls) {
  const rutas = urls.map(rutaDeFoto).filter(Boolean);
  if (!rutas.length) return;
  const { error } = await sb.storage.from(BUCKET).remove(rutas);
  if (error) console.warn('No se pudieron borrar fotos viejas:', error);
}

export async function subirFoto(blob) {
  if (!esAdmin) throw new Error('Debe iniciar sesión para subir fotos.');
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  const ruta = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(ruta, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
  if (error) throw traducir(error);
  return sb.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

// ---------- Escritura ----------

function exigirAdmin() {
  if (!esAdmin) throw new Error('Debe iniciar sesión para hacer cambios.');
}

export async function guardarItem(datos) {
  exigirAdmin();
  const fila = aFilaPieza(datos);
  let guardada;
  let fotosViejas = [];

  if (datos.id) {
    const { data: anterior } = await sb.from('piezas').select('fotos').eq('id', datos.id).maybeSingle();
    const nuevas = new Set(Object.values(fila.fotos));
    fotosViejas = Object.values(anterior?.fotos || {}).filter((u) => !nuevas.has(u));
    const { data, error } = await sb.from('piezas').update({ ...fila, actualizado: new Date().toISOString() }).eq('id', datos.id).select().single();
    if (error) throw traducir(error);
    guardada = data;
  } else {
    const { data, error } = await sb.from('piezas').insert(fila).select().single();
    if (error) throw traducir(error);
    guardada = data;
  }

  const p = datos.privado || {};
  const { error: errorPrivado } = await sb.from('piezas_privado').upsert({
    pieza_id: guardada.id,
    precio_compra: p.precioCompra ?? null,
    valor_estimado: p.valorEstimado ?? null,
    ubicacion: p.ubicacion || '',
  });
  if (errorPrivado) throw traducir(errorPrivado);

  invalidar();
  if (fotosViejas.length) borrarFotos(fotosViejas);
  return { ...deFilaPieza(guardada), privado: deFilaPrivado({ precio_compra: p.precioCompra, valor_estimado: p.valorEstimado, ubicacion: p.ubicacion }) };
}

export async function eliminarItem(id) {
  exigirAdmin();
  const { data: anterior } = await sb.from('piezas').select('fotos').eq('id', id).maybeSingle();
  const { error } = await sb.from('piezas').delete().eq('id', id);
  if (error) throw traducir(error);
  invalidar();
  borrarFotos(Object.values(anterior?.fotos || {}));
}

export async function guardarAlbum(datos) {
  exigirAdmin();
  let resultado;
  if (datos.id) {
    const { orden, ...resto } = aFilaAlbum(datos);
    resultado = await sb.from('albumes').update(resto).eq('id', datos.id).select().single();
  } else {
    const albumes = await listarAlbumes();
    const orden = Math.max(0, ...albumes.map((a) => a.orden ?? 0)) + 1;
    resultado = await sb.from('albumes').insert({ ...aFilaAlbum(datos), orden }).select().single();
  }
  if (resultado.error) throw traducir(resultado.error);
  invalidar();
  return resultado.data;
}

export async function eliminarAlbum(id) {
  exigirAdmin();
  const { error: e1 } = await sb.from('piezas').update({ pagina: null, posicion: null }).eq('album_id', id);
  if (e1) throw traducir(e1);
  const { error: e2 } = await sb.from('albumes').delete().eq('id', id);
  if (e2) throw traducir(e2);
  invalidar();
}

// ---------- Respaldo ----------

export async function exportarTodo() {
  exigirAdmin();
  const [albumes, items] = await Promise.all([listarAlbumes(), listarItems()]);
  return JSON.stringify({ version: 1, fecha: new Date().toISOString(), albumes, items }, null, 2);
}

export async function importarTodo(texto) {
  exigirAdmin();
  const datos = JSON.parse(texto);
  if (!Array.isArray(datos.items) || !Array.isArray(datos.albumes)) {
    throw new Error('El archivo no parece ser un respaldo de la colección.');
  }
  const enBloques = async (tabla, filas) => {
    for (let i = 0; i < filas.length; i += 500) {
      const { error } = await sb.from(tabla).upsert(filas.slice(i, i + 500));
      if (error) throw traducir(error);
    }
  };
  await enBloques('albumes', datos.albumes.map((a) => ({ id: a.id, ...aFilaAlbum(a), orden: a.orden ?? 0 })));
  await enBloques('piezas', datos.items.map((i) => ({ id: i.id, ...aFilaPieza(i), ...(i.creado ? { creado: i.creado } : {}) })));
  await enBloques(
    'piezas_privado',
    datos.items.filter((i) => i.privado).map((i) => ({
      pieza_id: i.id,
      precio_compra: i.privado.precioCompra ?? null,
      valor_estimado: i.privado.valorEstimado ?? null,
      ubicacion: i.privado.ubicacion || '',
    }))
  );
  invalidar();
}

export async function restablecerMuestra() {
  throw new Error('Los datos de ejemplo solo existen en el modo de prueba.');
}

export async function vaciarColeccion() {
  throw new Error('Esta opción solo existe en el modo de prueba.');
}
