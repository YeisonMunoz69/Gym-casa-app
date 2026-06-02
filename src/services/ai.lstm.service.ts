/* ============================================================
   ai.lstm.service.ts — Inferencia LSTM para predicción de peso y reps
   v2.0.0: multi-output — Dense(2) → predice [peso_kg, reps]
   Carga el modelo TF.js una sola vez (singleton) y ejecuta
   predicciones normalizadas con MinMaxScaler.
   Aplica patch Keras 3 → TF.js v4 al cargar el model.json.

   CAMBIO v2.0.0:
   - ScalerConfig.y_min / y_max ahora son arrays de 2: [peso, reps]
   - predictNextWeight() eliminado → predictNext() retorna {weightKg, reps}
   - denormalizeOutput() separado en denormalizeWeight() y denormalizeReps()
   ============================================================ */
import * as tf from '@tensorflow/tfjs'

export type SetDataPoint = {
  weightKg: number
  reps: number
  position: number
}

// v2.0: el modelo retorna 2 valores — peso y reps
export type LstmPrediction = {
  weightKg: number
  reps: number
}

type ScalerConfig = {
  // v2.0: y_min/y_max son arrays de 2 — [peso_min, reps_min] y [peso_max, reps_max]
  // v1.0 tenía scalars; el servicio detecta automáticamente el formato para compatibilidad
  y_min: number | number[]
  y_max: number | number[]
  X_min: number[]
  X_max: number[]
  window_size: number
  n_features: number
  n_outputs?: number      // 2 en v2.0, ausente o 1 en v1.0
  mae_kg: number
  mae_reps?: number
  model_version?: string
}

type LstmModelState = {
  model: tf.LayersModel | null
  scaler: ScalerConfig | null
  ready: boolean
}

const state: LstmModelState = { model: null, scaler: null, ready: false }

const MODEL_URL  = '/models/weight_lstm/model.json'
const SCALER_URL = '/models/weight_lstm/scaler_config.json'

async function fetchScalerConfig(): Promise<ScalerConfig> {
  const response = await fetch(SCALER_URL)
  if (!response.ok) throw new Error('No se pudo cargar scaler_config.json')
  return response.json() as Promise<ScalerConfig>
}

/** Convierte campos Keras 2.21 / Keras 3 al formato que entiende TF.js 4.
 *  Mutates `layer` in place. */
function patchLayerConfig(layer: Record<string, unknown>): void {
  // Eliminar campos de metadatos que TF.js no entiende y que Keras 2.21 añade
  delete layer.module
  delete layer.registered_name
  delete layer.build_config

  const config = layer.config as Record<string, unknown>
  if (!config) return

  // batch_input_shape → batchInputShape (TF.js 4 usa camelCase)
  if ('batch_input_shape' in config && !('batchInputShape' in config)) {
    config.batchInputShape = config.batch_input_shape
    delete config.batch_input_shape
  }

  // batch_shape → batchInputShape (Keras 3 variant)
  if ('batch_shape' in config && !('batchInputShape' in config)) {
    config.batchInputShape = config.batch_shape
    delete config.batch_shape
  }

  // dtype objeto (Keras 3) → string
  if (config.dtype && typeof config.dtype === 'object') {
    const dtypeObj = config.dtype as { config?: { name?: string } }
    config.dtype = dtypeObj.config?.name ?? 'float32'
  }

  // Limpiar inicializadores: eliminar `module` y `registered_name` anidados
  for (const key of Object.keys(config)) {
    const value = config[key]
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>
      delete obj.module
      delete obj.registered_name
    }
  }
}

function patchModelTopology(topology: unknown): void {
  const t = topology as { model_config?: { config?: { layers?: Record<string, unknown>[] } } }
  const layers = t.model_config?.config?.layers
  if (!layers) return
  for (const layer of layers) patchLayerConfig(layer)
}

async function loadPatchedModel(): Promise<tf.LayersModel> {
  const modelResponse = await fetch(MODEL_URL)
  if (!modelResponse.ok) throw new Error(`Modelo no encontrado: ${MODEL_URL}`)
  const modelJson = (await modelResponse.json()) as {
    modelTopology: unknown
    weightsManifest: Array<{ paths: string[]; weights: tf.io.WeightsManifestEntry[] }>
  }

  patchModelTopology(modelJson.modelTopology)

  const baseUrl     = MODEL_URL.substring(0, MODEL_URL.lastIndexOf('/'))
  const weightPath  = modelJson.weightsManifest[0].paths[0]
  const weightsResponse = await fetch(`${baseUrl}/${weightPath}`)
  if (!weightsResponse.ok) throw new Error(`Pesos no encontrados: ${weightPath}`)
  const weightData = await weightsResponse.arrayBuffer()

  return tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: modelJson.modelTopology as object,
      weightSpecs:   modelJson.weightsManifest[0].weights,
      weightData,
    }),
  )
}

export async function loadLstmModel(): Promise<void> {
  if (state.ready) return
  const [model, scaler] = await Promise.all([loadPatchedModel(), fetchScalerConfig()])
  state.model  = model
  state.scaler = scaler
  state.ready  = true
}

function normalizeSequence(points: SetDataPoint[], scaler: ScalerConfig): number[] {
  const flat = points.flatMap((p) => [p.weightKg, p.reps, p.position])
  return flat.map((val, i) => {
    const min = scaler.X_min[i]
    const max = scaler.X_max[i]
    return (val - min) / (max - min + 1e-8)
  })
}

/** Obtiene y_min[idx] manejando tanto el formato v1 (scalar) como v2 (array). */
function getYBound(bound: number | number[], idx: number): number {
  return Array.isArray(bound) ? bound[idx] : bound
}

/** Desnormaliza el peso (output 0 del modelo). */
function denormalizeWeight(normalized: number, scaler: ScalerConfig): number {
  const min = getYBound(scaler.y_min, 0)
  const max = getYBound(scaler.y_max, 0)
  const raw = normalized * (max - min) + min
  return Math.round(raw * 2) / 2   // redondear a 0.5 kg
}

/** Desnormaliza las reps (output 1 del modelo). */
function denormalizeReps(normalized: number, scaler: ScalerConfig): number {
  const min = getYBound(scaler.y_min, 1)
  const max = getYBound(scaler.y_max, 1)
  const raw = normalized * (max - min) + min
  return Math.max(1, Math.round(raw))  // redondear a entero, mínimo 1
}

/**
 * Ejecuta la inferencia del LSTM y retorna {weightKg, reps}.
 * Compatible con modelos v1 (1 output) y v2 (2 outputs).
 * v1: reps se retorna como null.
 */
export function predictNext(points: SetDataPoint[]): LstmPrediction | null {
  if (!state.ready || !state.model || !state.scaler) return null

  const { window_size, n_features, n_outputs } = state.scaler
  if (points.length < window_size) return null

  const window     = points.slice(-window_size)
  const normalized = normalizeSequence(window, state.scaler)

  return tf.tidy(() => {
    const inputTensor = tf.tensor(normalized, [1, window_size, n_features])
    const output      = state.model!.predict(inputTensor) as tf.Tensor
    const raw         = output.dataSync()

    const weightKg = denormalizeWeight(raw[0], state.scaler!)

    // v2.0: modelo multi-output tiene raw[1] = reps normalizado
    // v1.0: solo hay raw[0] — reps se estima como null
    const isMultiOutput = (n_outputs ?? 1) >= 2
    const reps = isMultiOutput ? denormalizeReps(raw[1], state.scaler!) : null

    return { weightKg, reps: reps ?? 0 }
  })
}

export function isModelReady(): boolean {
  return state.ready
}

export function getModelVersion(): string {
  return state.scaler?.model_version ?? '1.0.0'
}

export function getModelMAE(): { weight: number; reps: number | null } {
  return {
    weight: state.scaler?.mae_kg ?? 0,
    reps:   state.scaler?.mae_reps ?? null,
  }
}
