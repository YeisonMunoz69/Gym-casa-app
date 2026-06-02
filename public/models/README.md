# Guía de Modelos ML — Frontend
## v2/public/models/

Estos archivos contienen los modelos de IA/ML pre-entrenados que el frontend consume en tiempo real.
Todos se ejecutan **100% en el browser** — sin servidor ML, sin API externa.

---

## Inventario

```
models/
├── weight_lstm/                    ← Modelo 1: LSTM (TF.js)
│   ├── model.json                  ← Topología de la red neuronal
│   ├── group1-shard1of1.bin        ← Pesos (20 KB)
│   └── scaler_config.json          ← Parámetros de normalización
├── muscle_thresholds_config.json   ← Modelo 2: Umbrales de descuido
├── fatigue_decay_config.json       ← Modelo 3: Fatiga ATL (Banister)
└── one_rm_config.json              ← Modelo 4: Regresión 1RM
```

---

## Modelo 1 — LSTM Predictor de Peso y Reps

**Archivos**: `weight_lstm/model.json` + `group1-shard1of1.bin` + `scaler_config.json`  
**Hook**: `useWeightSuggestion.ts`  
**Componente**: `WeightSuggestionChip.tsx`  
**Servicio**: `ai.lstm.service.ts`

### ¿Qué hace?
Predice el peso (kg) y las repeticiones del siguiente set basándose en los 8 sets anteriores del mismo ejercicio.

### ¿Cómo se usa?
```typescript
const { suggestedWeight, suggestedReps, status } = useWeightSuggestion(exerciseName, sets)
// suggestedWeight = 65.0  (redondeado a 0.5 kg)
// suggestedReps   = 8     (entero, mínimo 1)
```

### Métricas
- MAE peso: **9.88 kg** | R²: **0.909**
- MAE reps: **1.05 reps** | R²: **0.713**
- Parámetros: **5,170** | Tamaño .bin: **20 KB**

### Entrenamiento
- Script: `ml/colab_lstm_fitness.py`
- Dataset: joep89/weightlifting (721 sesiones)
- Arquitectura: LSTM(32) → Dropout(0.15) → Dense(16) → Dense(2)
- Épocas: 52 (con EarlyStopping)

---

## Modelo 2 — Músculo Descuidado

**Archivo**: `muscle_thresholds_config.json`  
**Hook**: `useNeglectedMuscles.ts`  
**Componente**: `NeglectedMusclesView.tsx`

### ¿Qué hace?
Detecta músculos que llevan más días sin entrenar que su umbral estadístico calibrado (percentil P75 del historial).

### Estructura del JSON
```json
{
  "muscle_groups": {
    "chest": {
      "neglect_days": 4.5,        // Umbral P75
      "calibrated": true           // ¿Datos confiables?
    }
  },
  "global_defaults": {
    "neglect_days": 5             // Fallback si no está calibrado
  }
}
```

### Filtros de confiabilidad (aplicados en el hook)
- `calibrated == false` → excluido
- `threshold > 45 días` → excluido (datos ruidosos)
- Resultado: 5-6 músculos monitoreados confiablemente

### Entrenamiento
- Script: `ml/colab_muscle_thresholds.py`
- Método: Análisis estadístico (percentiles)
- 8 músculos calibrados, 7 sin datos suficientes

---

## Modelo 3 — Fatiga ATL (Banister)

**Archivo**: `fatigue_decay_config.json`  
**Hook**: `useMuscleRecovery.ts`  
**Componente**: `RecoveryBodyMap.tsx`

### ¿Qué hace?
Calcula un score continuo de fatiga (0-100) por grupo muscular usando decaimiento exponencial.

### Fórmula
```
fatiga(hoy) = Σ [volumen_sesión × exp(-días_transcurridos / τ)]
score = min(100, fatiga / max_atl_p95 × 100)
```

### Estructura del JSON
```json
{
  "score_thresholds": {
    "exhausted_above": 39.3,     // ≥ este score → exhausto (rojo)
    "recovering_above": 9.2      // ≥ este score → recuperando (amarillo)
  },
  "muscle_groups": {
    "chest": {
      "tau_days": 0.63,           // Constante de decaimiento
      "max_atl_p95": 56.41,       // Normalización a 0-100
      "calibrated": true
    }
  }
}
```

### Entrenamiento
- Script: `ml/colab_fatigue_decay.py`
- τ calibrado por músculo minimizando MSE(ATL_norm vs gap_real_norm)
- Rango de τ: [0.5, 7.0] días

---

## Modelo 4 — Regresión 1RM

**Archivo**: `one_rm_config.json`  
**Hook**: `useOneRM.ts`  
**Componente**: `OneRMCard.tsx`

### ¿Qué hace?
Estima el 1 Rep Max (peso máximo una vez) con coeficientes calibrados por grupo muscular.

### Fórmula
```
1RM = coef_a × peso_kg + coef_b × reps + intercept
```

### Estructura del JSON
```json
{
  "global_model": {
    "coef_a": 1.2687,
    "coef_b": 3.45902,
    "intercept": -31.32876
  },
  "by_muscle_group": {
    "chest": {
      "coef_a": 1.23071,
      "coef_b": 2.51445,
      "intercept": -20.44072,
      "calibrated": true
    }
  }
}
```

### Entrenamiento
- Script: `ml/colab_one_rm_regression.py`
- Target: consenso de Epley + Brzycki + Lander + O'Conner
- R² global: **0.9946** | MAE: **3.64 kg**

---

## Notas para despliegue

1. Estos archivos son **estáticos** — se sirven desde `/models/` en Vercel
2. El `vercel.json` reescribe todas las rutas a `index.html` EXCEPTO archivos estáticos
3. Los `.json` y `.bin` se cachean por el browser y el CDN de Vercel
4. El Modelo 1 (LSTM) carga ~20 KB de pesos binarios — primera carga ~200ms
5. Los Modelos 2-4 cargan JSONs pequeños (3-6 KB) — negligible
