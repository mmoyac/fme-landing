'use client';

// Autocompletar de la dirección de delivery con Mapbox (change add-delivery-por-comuna).
// La comuna se toma del contexto `place` de la sugerencia elegida. El backend vuelve a verificarla al crear el pedido.
// Sin token de Mapbox, el campo funciona como texto libre.
import { useEffect, useRef, useState } from 'react';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
const PROXIMIDAD = '-70.876,-33.285'; // Lampa: prioriza sugerencias cercanas

export interface DireccionElegida {
  direccion: string; // calle y número (sin comuna)
  comuna: string | null;
}

interface Sugerencia {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string }[];
}

function aElegida(s: Sugerencia): DireccionElegida {
  const comuna = s.context?.find(c => c.id.startsWith('place.'))?.text ?? null;
  const direccion = s.address ? `${s.text} ${s.address}` : s.text;
  return { direccion, comuna };
}

interface Props {
  valor: string;
  etiqueta: string;
  onEscribir: (texto: string) => void;      // texto libre: la dirección deja de estar verificada
  onElegir: (d: DireccionElegida) => void;  // sugerencia elegida
}

export default function DireccionMapbox({ valor, etiqueta, onEscribir, onElegir }: Props) {
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  function buscar(texto: string) {
    if (temporizador.current) clearTimeout(temporizador.current);
    if (!TOKEN || texto.trim().length < 4) {
      setSugerencias([]);
      return;
    }
    temporizador.current = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(texto)}.json`
          + `?access_token=${TOKEN}&country=cl&types=address&limit=5&language=es&proximity=${PROXIMIDAD}`;
        const r = await fetch(url);
        if (!r.ok) return;
        const data = await r.json();
        setSugerencias(data.features || []);
        setAbierto(true);
      } catch {
        setSugerencias([]);
      }
    }, 300);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">{etiqueta}</label>
      <input
        type="text"
        required
        minLength={5}
        value={valor}
        autoComplete="off"
        onChange={(e) => { onEscribir(e.target.value); buscar(e.target.value); }}
        onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder={TOKEN ? 'Escribe calle y número y elige de la lista' : 'Calle, Número, Depto/Casa'}
        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
      />
      {abierto && sugerencias.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-64 overflow-auto">
          {sugerencias.map(s => (
            <li key={s.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onElegir(aElegida(s)); setAbierto(false); setSugerencias([]); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700"
              >
                {s.place_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
