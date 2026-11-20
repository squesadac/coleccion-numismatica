// Configuración general del sitio. Cambie estos valores a su gusto.
export const CONFIG = {
  titulo: 'Colección Numismática',
  subtitulo: 'Monedas y billetes del mundo',
  // Nombre del coleccionista (aparece en la portada).
  coleccionista: 'Papá',

  // 'demo'     -> datos de ejemplo guardados solo en este navegador.
  // 'supabase' -> base de datos real (se configura más adelante).
  modo: 'supabase',

  // Estos dos valores son públicos por diseño: la seguridad la dan los
  // permisos definidos en supabase/schema.sql.
  supabase: {
    url: 'https://fatfzzkugiidpqcgiwnk.supabase.co',
    anonKey: 'sb_publishable_NctDFfSGpNJ6CdkK1WBjvQ_pjqVEJGG',
  },
};

export const TIPOS = {
  moneda: 'Moneda',
  billete: 'Billete',
};

export const METALES = [
  'Oro',
  'Plata',
  'Cobre',
  'Bronce',
  'Latón',
  'Níquel',
  'Cuproníquel',
  'Alpaca',
  'Aluminio',
  'Acero',
  'Zinc',
  'Bimetálica',
  'Papel',
  'Polímero',
  'Otro',
];

// Escala de conservación usada en el mundo hispano, con su equivalente en inglés.
export const ESTADOS = [
  { codigo: 'RC', nombre: 'Regular (RC · G)' },
  { codigo: 'BC', nombre: 'Bien conservada (BC · F)' },
  { codigo: 'MBC', nombre: 'Muy bien conservada (MBC · VF)' },
  { codigo: 'EBC', nombre: 'Excelente (EBC · XF)' },
  { codigo: 'SC-', nombre: 'Casi sin circular (SC- · AU)' },
  { codigo: 'SC', nombre: 'Sin circular (SC · UNC)' },
  { codigo: 'PROOF', nombre: 'Proof / Prueba' },
];

export function nombreEstado(codigo) {
  return ESTADOS.find((e) => e.codigo === codigo)?.nombre || codigo || '';
}
