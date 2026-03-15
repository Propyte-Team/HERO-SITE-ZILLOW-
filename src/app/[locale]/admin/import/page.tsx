'use client';

import { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];

interface ParsedRow {
  raw: Record<string, string>;
  property: PropertyInsert | null;
  error: string | null;
  rowIndex: number;
}

// Column mapping: CSV header → DB field
const COLUMN_MAP: Record<string, keyof PropertyInsert> = {
  'nombre': 'name',
  'name': 'name',
  'slug': 'slug',
  'precio': 'price_mxn',
  'price': 'price_mxn',
  'precio_mxn': 'price_mxn',
  'ciudad': 'city',
  'city': 'city',
  'zona': 'zone',
  'zone': 'zone',
  'direccion': 'address',
  'address': 'address',
  'recamaras': 'bedrooms',
  'bedrooms': 'bedrooms',
  'banos': 'bathrooms',
  'bathrooms': 'bathrooms',
  'area': 'area_m2',
  'area_m2': 'area_m2',
  'tipo': 'property_type',
  'type': 'property_type',
  'property_type': 'property_type',
  'etapa': 'stage',
  'stage': 'stage',
  'desarrollador_id': 'developer_id',
  'developer_id': 'developer_id',
  'descripcion_es': 'description_es',
  'description_es': 'description_es',
  'descripcion_en': 'description_en',
  'description_en': 'description_en',
  'roi_proyectado': 'roi_projected',
  'roi_projected': 'roi_projected',
  'renta_mensual': 'roi_rental_monthly',
  'roi_rental_monthly': 'roi_rental_monthly',
  'apreciacion': 'roi_appreciation',
  'roi_appreciation': 'roi_appreciation',
  'enganche_min': 'financing_down_payment_min',
  'tasa_interes': 'financing_interest_rate',
  'amenidades': 'amenities',
  'amenities': 'amenities',
  'imagenes': 'images',
  'images': 'images',
  'tour_virtual': 'virtual_tour_url',
  'virtual_tour_url': 'virtual_tour_url',
  'video': 'video_url',
  'video_url': 'video_url',
  'lat': 'lat',
  'lng': 'lng',
  'latitud': 'lat',
  'longitud': 'lng',
};

const STAGE_MAP: Record<string, string> = {
  'preventa': 'preventa',
  'presale': 'preventa',
  'construccion': 'construccion',
  'construcción': 'construccion',
  'construction': 'construccion',
  'entrega inmediata': 'entrega_inmediata',
  'entrega_inmediata': 'entrega_inmediata',
  'ready': 'entrega_inmediata',
};

const TYPE_MAP: Record<string, string> = {
  'departamento': 'departamento',
  'depto': 'departamento',
  'apartment': 'departamento',
  'penthouse': 'penthouse',
  'casa': 'casa',
  'house': 'casa',
  'terreno': 'terreno',
  'land': 'terreno',
  'macrolote': 'macrolote',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
}

function mapRow(raw: Record<string, string>, rowIndex: number): ParsedRow {
  const mapped: Partial<PropertyInsert> = {};

  for (const [csvKey, value] of Object.entries(raw)) {
    const dbField = COLUMN_MAP[csvKey];
    if (!dbField || !value) continue;

    switch (dbField) {
      case 'price_mxn':
      case 'roi_rental_monthly':
        mapped[dbField] = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
        break;
      case 'bedrooms':
      case 'bathrooms':
      case 'financing_down_payment_min':
        (mapped as Record<string, number>)[dbField] = parseInt(value, 10) || 0;
        break;
      case 'area_m2':
      case 'roi_projected':
      case 'roi_appreciation':
      case 'financing_interest_rate':
      case 'lat':
      case 'lng':
        (mapped as Record<string, number>)[dbField] = parseFloat(value) || 0;
        break;
      case 'stage':
        (mapped as Record<string, string>)[dbField] = STAGE_MAP[value.toLowerCase()] || value;
        break;
      case 'property_type':
        (mapped as Record<string, string>)[dbField] = TYPE_MAP[value.toLowerCase()] || value;
        break;
      case 'amenities':
      case 'images':
        (mapped as Record<string, string[]>)[dbField] = value.split('|').map(s => s.trim()).filter(Boolean);
        break;
      default:
        (mapped as Record<string, string>)[dbField] = value;
    }
  }

  // Validations
  if (!mapped.name) return { raw, property: null, error: 'Falta nombre', rowIndex };
  if (!mapped.price_mxn) return { raw, property: null, error: 'Falta precio', rowIndex };
  if (!mapped.city) return { raw, property: null, error: 'Falta ciudad', rowIndex };
  if (!mapped.area_m2) return { raw, property: null, error: 'Falta área', rowIndex };

  // Defaults
  if (!mapped.slug) mapped.slug = slugify(mapped.name);
  if (!mapped.zone) mapped.zone = mapped.city;
  if (!mapped.state) mapped.state = 'Quintana Roo';
  if (!mapped.property_type) mapped.property_type = 'departamento';
  if (!mapped.stage) mapped.stage = 'preventa';
  if (!mapped.currency) mapped.currency = 'MXN';

  return { raw, property: mapped as PropertyInsert, error: null, rowIndex };
}

export default function AdminImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const mapped = rows.map((row, i) => mapRow(row, i + 2)); // +2 for header + 0-index
      setParsed(mapped);
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f);
    }
  }, [handleFile]);

  async function handleImport() {
    const valid = parsed.filter(r => r.property !== null);
    if (valid.length === 0) return;

    setImporting(true);
    const supabase = createClient();

    // Make slugs unique by appending index if needed
    const properties = valid.map((r, i) => ({
      ...r.property!,
      slug: `${r.property!.slug}-${Date.now()}-${i}`,
    }));

    const { data, error } = await supabase.from('properties').insert(properties).select();

    setResult({
      success: data?.length || 0,
      errors: valid.length - (data?.length || 0),
    });
    setImporting(false);
  }

  const validCount = parsed.filter(r => r.property).length;
  const errorCount = parsed.filter(r => r.error).length;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[#2C2C2C] mb-2">Importar propiedades</h1>
      <p className="text-sm text-gray-500 mb-6">Carga masiva de propiedades desde archivo CSV</p>

      {/* Drop zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 hover:border-[#00B4C8] rounded-xl p-12 text-center transition-colors cursor-pointer"
          onClick={() => document.getElementById('csv-input')?.click()}
        >
          <Upload size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-[#2C2C2C]">Arrastra tu archivo CSV aquí</p>
          <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
          <input
            id="csv-input"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Template download */}
      <div className="mt-4 p-4 bg-[#F4F6F8] rounded-xl">
        <div className="flex items-start gap-3">
          <FileSpreadsheet size={20} className="text-[#00B4C8] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#2C2C2C]">Formato del CSV</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Columnas requeridas: <code className="bg-white px-1 rounded">nombre, precio, ciudad, area</code><br />
              Opcionales: <code className="bg-white px-1 rounded">zona, tipo, etapa, recamaras, banos, roi_proyectado, amenidades, imagenes, tour_virtual, video</code><br />
              Amenidades e imágenes separadas por <code className="bg-white px-1 rounded">|</code> (pipe)
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {file && parsed.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-[#2C2C2C]">{file.name}</span>
              <span className="text-xs text-gray-400">{parsed.length} filas</span>
              {validCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                  <CheckCircle size={12} /> {validCount} válidas
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-semibold">
                  <AlertCircle size={12} /> {errorCount} errores
                </span>
              )}
            </div>
            <button onClick={() => { setFile(null); setParsed([]); setResult(null); }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>

          {/* Preview table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#F4F6F8]">
                <tr className="text-left text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Precio</th>
                  <th className="px-3 py-2">Ciudad</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Área</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parsed.slice(0, 50).map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-red-50/50' : ''}>
                    <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <span className="text-red-500 font-medium">{row.error}</span>
                      ) : (
                        <CheckCircle size={14} className="text-green-500" />
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.property?.name || row.raw.nombre || row.raw.name || '—'}</td>
                    <td className="px-3 py-2">{row.property?.price_mxn?.toLocaleString('es-MX') || '—'}</td>
                    <td className="px-3 py-2">{row.property?.city || '—'}</td>
                    <td className="px-3 py-2">{row.property?.property_type || '—'}</td>
                    <td className="px-3 py-2">{row.property?.area_m2 || '—'} m²</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Import button */}
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="mt-4 flex items-center gap-2 px-6 py-3 bg-[#00B4C8] hover:bg-[#009AB0] disabled:bg-gray-300 text-white font-bold rounded-lg transition-colors"
            >
              {importing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Importar {validCount} propiedades
                </>
              )}
            </button>
          )}

          {/* Result */}
          {result && (
            <div className={`mt-4 p-4 rounded-xl ${result.errors > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-600" />
                <span className="font-semibold text-[#2C2C2C]">
                  {result.success} propiedades importadas exitosamente
                </span>
              </div>
              {result.errors > 0 && (
                <p className="text-sm text-yellow-600 mt-1">{result.errors} filas con errores fueron omitidas</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
