import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import ejercicios from 'ejercicios.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Mensaje de prueba 
app.get("/", (req, res) => {
  res.json({ message: "API Fitcron funcionando" });
});

// Se obtiene todos los ejercicios de la pagina
app.get("/exercises", async (req, res) => {
  try {
    // Descargar el HTML de la página de ejercicios
    const { data } = await axios.get("https://fitcron.com/exercises");
    const $ = cheerio.load(data);

    const categories = {};

    // Se buscan los ejercicios individualmente
    $(".view-item").each((i, el) => {
      const name = $(el).attr("data-name")?.trim();
      const type = $(el).attr("data-exercise-type")?.trim();
      const mainMuscle = $(el).attr("data-main-muscle")?.trim();
      const difficulty = $(el).attr("data-difficulty")?.trim();
      const muscles = $(el).attr("data-involved-muscles")?.split(",").map(m => m.trim());
      const equipment = $(el).attr("data-equipment")?.trim();
      const image = $(el).find(".item-image img").attr("src");
      const link = $(el).find("a").attr("href");

      // Categoría principal (por músculo principal)
      const category = mainMuscle || "Otros";

      // Crear estructura
      const exercise = {
        name,
        type,
        mainMuscle,
        difficulty,
        muscles,
        equipment,
        image,
        link,
      };

      // Agrupar por categoría
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(exercise);
    });

    // Convertir el objeto en array [{ category, exercises }]
    const result = Object.entries(categories).map(([category, exercises]) => ({
      category,
      exercises,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error al obtener datos de Fitcron:", error.message);
    res.status(500).json({ error: "Error al obtener los ejercicios" });
  }
});

// Mensaje de prueba (para confirmar correcto funcionamiento)
app.listen(PORT, () => console.log(`API Fitcron corriendo en puerto ${PORT}`));



