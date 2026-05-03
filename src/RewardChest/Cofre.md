# Guía de Integración: Componente Gamificado `RewardChest` (Lootbox Mítica)

Este documento detalla la estructura, dependencias y lógicas internas del componente `<RewardChest />`. Está diseñado para que cualquier desarrollador o Agente de IA pueda migrar este componente de manera eficiente a otro proyecto React/Next.js/Vite, manteniendo intactas sus complejas interacciones de gamificación y físicas.

---

## 1. Dependencias Requeridas
Para que el motor de físicas de rebote y las partículas funcionen, el proyecto destino **debe** tener instaladas estas dos dependencias:

```bash
npm install framer-motion lucide-react
```
* **`framer-motion`**: Maneja las animaciones de "Spring" (resorte), las interpolaciones de arrays (temblor), y el desmontaje de componentes (`AnimatePresence`).
* **`lucide-react`**: Proporciona los iconos vectoriales minimalistas como `Sparkles` y `Star` para las partículas flotantes.

---

## 2. Archivos a Migrar
Para trasladar este componente, debes copiar la carpeta completa `RewardChest` manteniendo su estructura aislada.

```text
src/
 └─ components/
     └─ RewardChest/
         ├─ RewardChest.tsx          # Contiene la lógica, estados, framer-motion y el SVG puro.
         └─ RewardChest.module.css   # Estilos modulados, glow effects, gradients y layouts absolutos.
```

---

## 3. Explicación de la Lógica Interna (Para adaptar en otros contextos)

### A. Lógica Creciente y Suspenso (Game Design)
* **Variable `clicks` y `maxClicks`**: El cofre no se abre por tiempo, sino por interacción. El estado internamente cuenta hasta llegar a `maxClicks` (por defecto `5`). Al llegar a este número, se activa la bandera booleana `isOpened = true`, lo cual desencadena el desmontaje del cofre y el montaje de la tarjeta de recompensa utilizando `<AnimatePresence mode="wait">`.
* **Escalado Dinámico**: Por cada clic, el cofre altera directamente tres valores en tiempo real usando matemáticas simples multiplicadas por los clics:
  * `shakeIntensity = clicks * 4` (Aumenta la violencia del terremoto visual en los ejes X e Y).
  * `scale = 1 + clicks * 0.08` (El cofre se infla progresivamente simulando presión).
  * `drop-shadow` CSS (Aumenta el radio de expansión de luz dorada a medida que está a punto de explotar).

### B. Feedback Háptico (Vibración Nativa)
Incluye una validación defensiva `typeof navigator !== 'undefined' && navigator.vibrate`. 
* **Toques normales:** Vibra de forma ascendente: `50 + clicks * 20` ms.
* **Toque final (Explosión):** Emite un patrón asíncrono largo y complejo: `[100, 50, 200, 50, 400]`.
* **Regla de oro:** Si vas a testear esto, usa un dispositivo real móvil o las DevTools simuladas de Chrome, ya que los monitores de escritorio ignoran nativamente la API de vibración.

### C. SVG Puro y Performance
El cofre (`<TreasureChestSVG />`) no es una imagen externa `.png`, `.webp` ni un `.lottie`. Es un componente funcional que retorna un `<svg>`.
* **Ventaja:** Cero llamadas de red (Network Requests). Renderizado instantáneo.
* **Técnica empleada:** Uso de `<defs>` para gradientes (`linearGradient`) y filtros nativos SVG (`feGaussianBlur`) para inyectar brillos emisivos en el renderizado sin sobrecargar el hardware (GPU-friendly).

---

## 4. Reglas de Programación e Implementación (Best Practices)

Cuando vayas a consumir este componente en el proyecto nuevo, **sigue estas reglas obligatorias**:

1. **Gestión de Estado Externa (Renderizado Condicional):**
   El componente por sí solo asume un rol de *Overlay* (pantalla completa, bloqueante, con `fixed` y `z-index: 9999`). Por ende, el componente Padre **debe** montar y desmontar el nodo condicionalmente en el DOM (Render Conditional).
   
2. **Bloqueo del Scroll:**
   Aunque el cofre toma pantalla completa, es buena práctica bloquear el body cuando el cofre esté activo para evitar que el usuario scrollee la pantalla de fondo. Esto se hace en un `useEffect` en el componente padre.

3. **Inyección de Props Customizadas:**
   Usa la interfaz predefinida para inyectar la recompensa real obtenida desde la Base de Datos o API.

### Código Boilerplate Ideal (Para el Nuevo Proyecto)

Aquí tienes la plantilla exacta de cómo integrarlo en tu nueva App:

```tsx
import React, { useState, useEffect } from 'react';
import { RewardChest } from '@/components/RewardChest/RewardChest'; // Ajusta la ruta

export default function RecompensasPage() {
  const [chestVisible, setChestVisible] = useState(false);

  // Ejemplo de objeto que podrías traer de una API
  const lootData = {
    image: '💎', // Puede ser un emoji o la ruta de un activo: "/assets/sword.png"
    name: 'Espada de Cristal',
    rarity: 'ÉPICA',
    amount: 1
  };

  // Regla: Prevenir scroll del body mientras el cofre está abierto
  useEffect(() => {
    if (chestVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }; // Cleanup
  }, [chestVisible]);

  // Regla: Lógica a ejecutar después del cierre
  const handleChestClosed = () => {
    setChestVisible(false);
    // Acá puedes disparar el update del inventario del usuario en el Backend (Ej: mutation.mutate())
    // o ejecutar un sonido secundario u otra animación posterior.
  };

  return (
    <div className="game-screen">
      <h1>Misiones Diarias</h1>
      
      <button onClick={() => setChestVisible(true)}>
        Reclamar de recompensa de nivel
      </button>

      {/* Renderizado defensivo y bloqueante */}
      {chestVisible && (
        <RewardChest
          rewardImage={lootData.image}
          rewardName={lootData.name}
          rarity={lootData.rarity}
          onClose={handleChestClosed}
        />
      )}
    </div>
  );
}
```

---

## 5. Posibles Escenarios de Customización (Extensibilidad)

* **Sustituir el ícono de recompensa por una Imágen HTML:** 
  Actualmente, si pasas un emoji `rewardImage="💎"`, se renderizará el emoji. Si pasas un elemento de imagen válido por react (`rewardImage={<img src="/mi-gema.png" alt="gema" />}`), necesitarás ir y **modificar ligeramente el tipado del Props** en el archivo `.tsx` de `rewardImage?: string;` a `rewardImage?: React.ReactNode;`.
* **Sonidos Sincronizados:**
  Si deseas agregar bibliotecas de sonido (`use-sound` o `new Audio()`), el lugar correcto para ejecutarlos es dentro de la función `handleTap`, condicionando los sonidos menores para clicks normales, y un Audio contundente (*Ta-Daa!*) dentro del bloque `if (clicks + 1 === maxClicks)`.