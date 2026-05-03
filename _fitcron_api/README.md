# 🏋️‍♂️ Fitcron Exercises API

API en **Node.js** que obtiene automáticamente todos los ejercicios del sitio [fitcron.com](https://fitcron.com/exercises) y los devuelve en formato **JSON**, organizados por categoría (Abdomen, Espalda, Piernas, etc).

---

## 🚀 Tecnologías utilizadas

- **Node.js** – entorno de ejecución de JavaScript del lado del servidor  
- **Express.js** – framework para crear el servidor y rutas HTTP  
- **Axios** – realiza las solicitudes HTTP al sitio de Fitcron  
- **Cheerio** – analiza el HTML y permite hacer scraping (como jQuery en Node)  

---

## ⚙️ Funcionamiento

1. La API accede a `https://fitcron.com/exercises`.
2. Usa **Cheerio** para recorrer cada bloque `<div class="view-item">`.
3. Extrae los siguientes datos de cada ejercicio:
   - 🏷️ **Nombre**
   - 🧠 **Tipo de ejercicio** (Fuerza, Cardio, etc.)
   - 💪 **Músculo principal**
   - 📊 **Dificultad**
   - 🧩 **Músculos involucrados**
   - 🏋️‍♀️ **Equipamiento**
   - 🖼️ **Imagen o GIF**
   - 🔗 **Enlace al ejercicio original**
4. Organiza los ejercicios por categoría (por ejemplo, “Abdomen” o “Pectorales”).
5. Devuelve todo como JSON.

---

## 📄 Ejemplo de respuesta

```json
{
  "Abdomen": [
    {
      "name": "Crunch Superior Concentrado Elevado",
      "type": "Fuerza",
      "mainMuscle": "Abdomen",
      "difficulty": "3",
      "involvedMuscles": "Abdomen, Oblicuos",
      "equipment": "Banco Plano",
      "image": "https://fitcron.com/wp-content/uploads/2024/05/43321301-Crunch-Hold_Waist_720.gif",
      "link": "https://fitcron.com/exercise/crunch-superior-concentrado-elevado/"
    }
  ]
}
