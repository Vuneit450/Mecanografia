# Diseño de Mecanografía IA

## 1. Investigación: qué hacen las apps de referencia

| App | Qué la distingue | Qué tomamos |
|---|---|---|
| **Monkeytype** | Referencia en pruebas limpias y configurables: modos tiempo / palabras / cita / zen, cursor suave, cursor de ritmo (*pace caret*), consistencia, gráfica por segundo, temas | Barra de configuración en pastillas, modos por tiempo y por palabras, cursor fantasma, consistencia, gráfica de la prueba, reinicio con `Tab`, modo enfoque |
| **Keybr** | Más tutor que test: mide cada tecla y genera práctica cargada hacia las letras débiles | Estadística por tecla y fuente «Puntos débiles» con texto generado según tus fallos |
| **TypeRacer** | Carreras con textos reales; no deja avanzar si hay error | Modo estricto (no avanza hasta acertar) |
| **TypingClub / Typing.com** | Curso guiado por lecciones con progreso | Ruta de lecciones con avance y marcas de completado |
| **10FastFingers** | Test de 1 minuto con palabras frecuentes | Fuente «Palabras» en español |
| **TypeLit / Entertrained** | Teclear libros y textos propios, guardando el avance | «Mis textos» con memoria de posición |

Tendencias incorporadas: análisis por combinaciones de dos letras (bigramas) y no solo por tecla, repaso inmediato de las palabras falladas, racha y meta diaria, calendario de actividad, muerte súbita, exportación abierta de datos.

Lo propio de esta app: **el contenido enseña IA**. Las lecciones forman un temario ordenado (fundamentos → cómo aprende un modelo → modelos de lenguaje → uso práctico → criterio) y cada una muestra su idea clave al terminar.

## 2. Estructura

Aplicación estática de una sola página, sin dependencias ni compilación (funciona abriendo `index.html`).

```
index.html          Esqueleto de las seis vistas
css/estilos.css     Tres temas mediante variables CSS
js/contenido.js     Lecciones de IA, glosario y palabras (datos)
js/almacen.js       Persistencia (IndexedDB + localStorage) y exportación
js/motor.js         Lógica de la prueba, sin DOM
js/analisis.js      Agregación de pulsaciones y puntos débiles
js/graficas.js      Gráfica de líneas en SVG
js/app.js           Interfaz y navegación
```

### Vistas y acciones

1. **Practicar**: elegir texto (lecciones, glosario, palabras, mis textos, puntos débiles), duración (tiempo, palabras, completo), tratamiento de errores (estricto, libre, muerte súbita) y qué incluir (acentos, mayúsculas, puntuación). Durante la prueba: ppm, precisión y tiempo en vivo; aviso de «tocaba X y escribiste Y». Al terminar: ppm, precisión, ppm en bruto, consistencia, gráfica por segundo, teclas falladas, idea clave y repaso de palabras falladas.
2. **Lecciones**: temario por bloques con avance, mejor marca y veces completada.
3. **Mis textos**: crear, cargar archivo, editar, eliminar, practicar, volver al inicio.
4. **Análisis**: resumen, recomendaciones, teclas y combinaciones débiles, mapa de calor (fallos o lentitud), confusiones, palabras, dedos, evolución y calendario. Filtro por últimas 10 / 30 / todas.
5. **Historial**: tabla de pruebas, eliminar, exportar JSON y CSV, importar, borrar todo.
6. **Ajustes**: tema, tamaño, cursor fantasma, sonido, modo enfoque, meta diaria.

## 3. Modelo de datos

**Sesión** (IndexedDB `mecanografia` → `sesiones`):

| Campo | Significado |
|---|---|
| `id`, `fecha` | Identificador y fecha ISO |
| `fuente`, `titulo`, `leccionId`, `textoId` | Qué se escribió |
| `medida`, `limite`, `modoError`, `opciones` | Formato de la prueba |
| `duracionMs`, `ppm`, `bruto`, `precision`, `consistencia` | Métricas |
| `caracteres`, `correctas`, `errores`, `completada`, `fallida` | Conteos y estado |
| `serie` | Por segundo: ppm acumuladas, ritmo bruto, errores |
| `teclas` | Cada pulsación: `[posición, esperado, tecleado, ms, acierto]` |

`localStorage`: `meca.ajustes`, `meca.textos` (textos propios) y `meca.progreso` (lecciones completadas y posición en cada texto).

## 4. Fórmulas

- **PPM** = caracteres correctos ÷ 5 ÷ minutos. **PPM en bruto** = todas las pulsaciones ÷ 5 ÷ minutos.
- **Precisión** = pulsaciones acertadas ÷ pulsaciones totales.
- **Consistencia** = 100 × (1 − desviación ÷ media) del ritmo por segundo, suavizado con ventana de 3 s.
- **Fallo de una tecla** = veces que hubo al menos un error en esa posición ÷ veces que tocó escribirla.
- **Tiempo de una tecla** = milisegundos desde la pulsación anterior, solo en transiciones limpias y menores de 2 s (se descartan pausas).
- **Debilidad** = % de fallo + 30 × exceso de lentitud relativo a tu mediana. Se listan teclas con 8 o más intentos y combinaciones con 5 o más.
- **Práctica de puntos débiles**: cada palabra del banco pesa según las teclas y combinaciones débiles que contiene (y más si la fallaste antes); se sortea con ese peso.

## 5. Decisiones

- **Sin servidor**: privacidad total y cero mantenimiento; a cambio los datos no se sincronizan entre dispositivos (se resuelve con exportar/importar JSON).
- **Entrada por `textarea` oculto y eventos `input`**: soporta teclas muertas (´ + a → á) y teclados de móvil. Pegar está bloqueado.
- **Pruebas interrumpidas** con 10 o más pulsaciones se guardan marcadas como incompletas: sus pulsaciones alimentan el análisis, pero no cuentan para récords.

## 6. Ampliaciones posibles

Sincronización en la nube, modo código, lecciones generadas por IA a partir de un tema, más distribuciones de teclado en el mapa de calor, PWA sin conexión.
