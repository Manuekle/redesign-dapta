// Records the command palette (⌘K) finds through GET /buscar?q=… — the same shape blindem's SearchController returns.
export const records = [
  { kind: 'agent', title: 'Carla', detail: 'Agente de voz · activo', href: '#agentes-voz' },
  { kind: 'text-agent', title: 'Soporte WhatsApp', detail: 'Agente de texto · borrador', href: '#agentes-texto' },
  { kind: 'conversation', title: 'Quiero crear un nuevo agente de voz para mi empresa', detail: 'Dapti · 29/08/2026', href: '#dapti' },
  { kind: 'video', title: 'Bienvenida a Dapta Academy', detail: 'Primeros pasos · 0:46', href: '#academy' },
  { kind: 'video', title: 'Crea tu primer agente de voz con IA en Dapta', detail: 'Agentes de voz · 5:24', href: '#academy' },
  { kind: 'video', title: 'Cómo editar el prompt de tu agente en Dapta', detail: 'Agentes de voz · 6:17', href: '#academy' },
  { kind: 'video', title: 'Crea tu primer agente de texto en Dapta', detail: 'Agentes de texto · 4:04', href: '#academy' },
];

const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const search = query => {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return records.filter(record => normalize(`${record.title} ${record.detail}`).includes(q)).slice(0, 6);
};
