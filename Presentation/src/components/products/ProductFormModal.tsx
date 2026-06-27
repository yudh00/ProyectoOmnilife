import { useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

interface Category {
  idcategoria: number;
  nombrecategoria: string;
}

interface ProductoCompleto {
  idproducto: number;
  nombreproducto: string;
  descripcionproducto: string | null;
  imagenproducto: string | null;
  costocompraproducto: string;
  precioventaproducto: string;
  estadoproducto: number;
  cantidadinventarioproducto: number;
  inventariominimoproducto: number;
  idcategoria: number | null;
}

interface Props {
  isOpen: boolean;
  productId?: number | null;  // null/undefined = crear, número = editar
  onClose: () => void;
  onSaved: () => void;
}

const ESTADOS = [
  { id: 1, label: 'Disponible' },
  { id: 2, label: 'Agotado' },
  { id: 3, label: 'Descontinuado' },
];

const EMPTY = {
  nombre: '',
  descripcion: '',
  costoCompra: '',
  precioVenta: '',
  idEstado: '1',
  cantidad: '0',
  minimo: '0',
  idCategoria: '',
};

export default function ProductFormModal({ isOpen, productId, onClose, onSaved }: Props) {
  const isEdit = !!productId;

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<typeof EMPTY>>({});
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [retornoCantidad, setRetornoCantidad] = useState('');
  const [retornoError, setRetornoError] = useState<string | null>(null);
  const [retornoExito, setRetornoExito] = useState<string | null>(null);
  const [retornando, setRetornando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(EMPTY);
    setErrors({});
    setImageFile(null);
    setImagePreview(null);
    setServerError(null);
    setRetornoCantidad('');
    setRetornoError(null);
    setRetornoExito(null);

    // Cargar categorías
    fetch(`${API_BASE_URL}/ventas/categorias`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setCategorias(d.data); })
      .catch(() => {});

    // Si es edición, cargar datos del producto
    if (isEdit && productId) {
      setLoadingData(true);
      fetch(`${API_BASE_URL}/productos/${productId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok && d.data) {
            const p: ProductoCompleto = d.data;
            setForm({
              nombre: p.nombreproducto ?? '',
              descripcion: p.descripcionproducto ?? '',
              costoCompra: p.costocompraproducto ?? '',
              precioVenta: p.precioventaproducto ?? '',
              idEstado: String(p.estadoproducto ?? 1),
              cantidad: String(p.cantidadinventarioproducto ?? 0),
              minimo: String(p.inventariominimoproducto ?? 0),
              idCategoria: p.idcategoria ? String(p.idcategoria) : '',
            });
            if (p.imagenproducto) {
              setImagePreview(`http://localhost:5173${p.imagenproducto}`);
            }
          }
        })
        .catch(() => setServerError('No se pudieron cargar los datos del producto'))
        .finally(() => setLoadingData(false));
    }
  }, [isOpen, productId]);

  if (!isOpen) return null;

  function set(field: keyof typeof EMPTY, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const e: Partial<typeof EMPTY> = {};
    if (!form.nombre.trim())                         e.nombre = 'Requerido';
    if (!form.costoCompra || +form.costoCompra <= 0) e.costoCompra = 'Debe ser mayor a 0';
    if (!form.precioVenta || +form.precioVenta <= 0) e.precioVenta = 'Debe ser mayor a 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);

    const body = new FormData();
    body.append('nombre', form.nombre.trim());
    body.append('descripcion', form.descripcion.trim());
    body.append('costoCompra', form.costoCompra);
    body.append('precioVenta', form.precioVenta);
    body.append('idEstado', form.idEstado);
    body.append('cantidad', form.cantidad);
    body.append('minimo', form.minimo);
    if (form.idCategoria) body.append('idCategoria', form.idCategoria);
    if (imageFile) body.append('imagen', imageFile);

    const url = isEdit ? `${API_BASE_URL}/productos/${productId}` : `${API_BASE_URL}/productos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, body });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error al guardar');
      onSaved();
      onClose();
    } catch (err: any) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800 text-lg">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-xl transition-colors"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {loadingData ? (
            <div className="py-12 flex justify-center">
              <span className="w-6 h-6 border-2 border-purple-300 border-t-purple-700 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Imagen */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Imagen del producto</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-purple-400 transition-colors overflow-hidden flex items-center justify-center bg-gray-50"
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">Cambiar imagen</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 text-sm">
                      <div className="text-3xl mb-1">📷</div>
                      <span>Haz clic para subir imagen</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                />
              </div>

              {/* Nombre */}
              <Field
                label="Nombre del producto"
                value={form.nombre}
                error={errors.nombre}
                onChange={(v) => set('nombre', v)}
              />

              {/* Descripción */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => set('descripcion', e.target.value)}
                  rows={2}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-purple-400 focus:ring-purple-200 resize-none"
                />
              </div>

              {/* Precios */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Costo de compra (₡)"
                  type="number"
                  value={form.costoCompra}
                  error={errors.costoCompra}
                  onChange={(v) => set('costoCompra', v)}
                />
                <Field
                  label="Precio de venta (₡)"
                  type="number"
                  value={form.precioVenta}
                  error={errors.precioVenta}
                  onChange={(v) => set('precioVenta', v)}
                />
              </div>

              {/* Inventario */}
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Cantidad en inventario"
                  type="number"
                  value={form.cantidad}
                  onChange={(v) => set('cantidad', v)}
                />
                <Field
                  label="Stock mínimo"
                  type="number"
                  value={form.minimo}
                  onChange={(v) => set('minimo', v)}
                />
              </div>

              {/* Estado y Categoría */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Estado</label>
                  <select
                    value={form.idEstado}
                    onChange={(e) => set('idEstado', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-purple-400 focus:ring-purple-200"
                  >
                    {ESTADOS.map((e) => (
                      <option key={e.id} value={e.id}>{e.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500">Categoría</label>
                  <select
                    value={form.idCategoria}
                    onChange={(e) => set('idCategoria', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:border-purple-400 focus:ring-purple-200"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => (
                      <option key={c.idcategoria} value={c.idcategoria}>
                        {c.nombrecategoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {serverError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}

              {/* Retorno de cantidad — solo en modo edición */}
              {isEdit && (
                <div className="border border-orange-200 bg-orange-50 rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-orange-800">Retornar cantidad al proveedor</h3>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Ingresá la cantidad a retirar. No puede superar el stock actual ({form.cantidad} u.) ni ser negativa.
                    </p>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="1"
                        max={Number(form.cantidad)}
                        step="1"
                        placeholder="Cantidad a retornar"
                        value={retornoCantidad}
                        onChange={(e) => { setRetornoCantidad(e.target.value); setRetornoError(null); setRetornoExito(null); }}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
                          retornoError ? 'border-red-400 focus:ring-red-200' : 'border-orange-300 focus:border-orange-400 focus:ring-orange-200'
                        }`}
                      />
                      {retornoError && <p className="text-xs text-red-500 mt-1">{retornoError}</p>}
                      {retornoExito && <p className="text-xs text-green-600 mt-1 font-semibold">{retornoExito}</p>}
                    </div>
                    <button
                      type="button"
                      disabled={retornando || !retornoCantidad}
                      onClick={async () => {
                        const cant = parseInt(retornoCantidad, 10);
                        const stockActual = parseInt(form.cantidad, 10);
                        if (!cant || cant <= 0) { setRetornoError('La cantidad debe ser mayor a 0'); return; }
                        if (cant > stockActual) { setRetornoError(`No puede superar el stock actual (${stockActual})`); return; }
                        setRetornando(true);
                        setRetornoError(null);
                        setRetornoExito(null);
                        try {
                          const res = await fetch(`${API_BASE_URL}/ventas/inventario/${productId}/retorno`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ cantidad: cant }),
                          });
                          const data = await res.json();
                          if (!res.ok || !data.ok) throw new Error(data.error || 'Error al retornar');
                          setRetornoExito(`✓ ${cant} unidad(es) retirada(s). Nuevo stock: ${data.data.nuevoStock}`);
                          setForm(prev => ({ ...prev, cantidad: String(data.data.nuevoStock) }));
                          setRetornoCantidad('');
                        } catch (err: any) {
                          setRetornoError(err.message);
                        } finally {
                          setRetornando(false);
                        }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {retornando ? 'Retornando...' : 'Retornar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingData}
            className="px-5 py-2 bg-purple-700 text-white rounded-xl text-sm font-semibold hover:bg-purple-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : isEdit ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, error, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; error?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <input
        type={type}
        value={value}
        min={type === 'number' ? '0' : undefined}
        step={type === 'number' ? 'any' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-red-400 focus:ring-red-300'
            : 'border-gray-200 focus:border-purple-400 focus:ring-purple-200'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
