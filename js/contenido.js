/* Contenido de práctica: ruta de lecciones de IA, glosario y palabras comunes.
   Para añadir una lección basta con agregar un objeto a LECCIONES. */
const LECCIONES = [
  // ───────── Fundamentos ─────────
  { id: 'f1', cat: 'Fundamentos', titulo: '¿Qué es la inteligencia artificial?',
    texto: 'La inteligencia artificial es el campo que construye sistemas capaces de realizar tareas que normalmente requieren inteligencia humana: entender lenguaje, reconocer imágenes, tomar decisiones o crear contenido. No es magia ni conciencia; son programas que encuentran patrones en grandes cantidades de datos y los usan para producir respuestas útiles.',
    clave: 'La IA no "piensa" como una persona: detecta patrones en datos y los aplica a casos nuevos.' },
  { id: 'f2', cat: 'Fundamentos', titulo: 'Aprendizaje automático',
    texto: 'En la programación tradicional una persona escribe las reglas. En el aprendizaje automático, en cambio, le mostramos ejemplos al sistema y él descubre las reglas por su cuenta. Si quieres detectar correos no deseados, no describes cada truco posible: entregas miles de correos etiquetados y el modelo aprende a distinguirlos.',
    clave: 'Machine learning = aprender reglas a partir de ejemplos, en lugar de programarlas a mano.' },
  { id: 'f3', cat: 'Fundamentos', titulo: 'Los datos son el combustible',
    texto: 'Un modelo solo puede ser tan bueno como los datos con los que aprende. Si los ejemplos son pocos, están mal etiquetados o no representan la realidad, el resultado será pobre. Por eso gran parte del trabajo en inteligencia artificial consiste en reunir, limpiar y revisar datos antes de entrenar cualquier cosa.',
    clave: 'Datos malos producen modelos malos: la calidad de los datos pesa más que el tamaño del modelo.' },
  { id: 'f4', cat: 'Fundamentos', titulo: 'Redes neuronales',
    texto: 'Una red neuronal es una función matemática formada por capas de unidades simples llamadas neuronas. Cada neurona recibe números, los multiplica por unos pesos, los suma y decide cuánta señal pasar a la siguiente capa. Sola no hace casi nada; combinadas por millones pueden representar relaciones muy complejas.',
    clave: 'Una red neuronal son muchas operaciones simples encadenadas; su poder viene de la cantidad y de los pesos.' },
  { id: 'f5', cat: 'Fundamentos', titulo: 'Aprendizaje profundo',
    texto: 'Se habla de aprendizaje profundo cuando la red tiene muchas capas. Las primeras capas detectan rasgos sencillos, como bordes en una foto o letras en un texto, y las siguientes los combinan en ideas cada vez más abstractas. Esa jerarquía permite que el modelo aprenda sus propias representaciones sin que nadie las diseñe.',
    clave: 'Deep learning = redes con muchas capas que aprenden solas representaciones cada vez más abstractas.' },
  { id: 'f6', cat: 'Fundamentos', titulo: 'Tres formas de aprender',
    texto: 'En el aprendizaje supervisado el modelo recibe ejemplos con la respuesta correcta. En el no supervisado solo recibe datos y busca grupos o estructuras ocultas. En el aprendizaje por refuerzo un agente prueba acciones, recibe recompensas o castigos y poco a poco descubre qué estrategia le conviene más.',
    clave: 'Supervisado: con respuestas. No supervisado: sin respuestas. Por refuerzo: con recompensas.' },

  // ───────── Cómo aprende un modelo ─────────
  { id: 'e1', cat: 'Cómo aprende un modelo', titulo: 'Parámetros',
    texto: 'Los parámetros, también llamados pesos, son los números internos que un modelo ajusta mientras aprende. Un modelo pequeño tiene miles; los grandes modelos de lenguaje tienen miles de millones. Todo lo que el modelo "sabe" está guardado en esos números, no en una base de datos de frases que pueda consultar.',
    clave: 'El conocimiento de un modelo vive en sus pesos: números ajustados durante el entrenamiento.' },
  { id: 'e2', cat: 'Cómo aprende un modelo', titulo: 'La función de pérdida',
    texto: 'Para mejorar, un modelo necesita saber qué tan equivocado está. La función de pérdida convierte el error en un número: cuanto más alto, peor fue la predicción. Entrenar consiste en buscar los pesos que hacen ese número lo más pequeño posible sobre muchos ejemplos distintos.',
    clave: 'La pérdida mide el error; entrenar es minimizarla.' },
  { id: 'e3', cat: 'Cómo aprende un modelo', titulo: 'Descenso de gradiente',
    texto: 'Imagina que estás en una montaña con niebla y quieres llegar al valle. No ves el camino, pero puedes sentir hacia dónde baja el suelo y dar un paso en esa dirección. El descenso de gradiente hace lo mismo: calcula hacia dónde disminuye la pérdida y mueve un poco cada peso, una y otra vez.',
    clave: 'Descenso de gradiente: pequeños pasos repetidos en la dirección que reduce el error.' },
  { id: 'e4', cat: 'Cómo aprende un modelo', titulo: 'Retropropagación',
    texto: 'La retropropagación es el método que reparte la culpa del error entre todos los pesos de la red. Empieza en la salida, donde se mide la pérdida, y viaja hacia atrás capa por capa calculando cuánto contribuyó cada peso. Con esa información, el descenso de gradiente sabe cuánto corregir cada uno.',
    clave: 'Backpropagation calcula cuánto influyó cada peso en el error, de la salida hacia la entrada.' },
  { id: 'e5', cat: 'Cómo aprende un modelo', titulo: 'Sobreajuste',
    texto: 'Un modelo sobreajustado es como un estudiante que memoriza las respuestas del examen de práctica sin entender el tema: acierta en lo que ya vio y falla en lo nuevo. Para detectarlo se reserva una parte de los datos que el modelo nunca ve durante el entrenamiento y se evalúa con ella.',
    clave: 'Overfitting = memorizar en vez de generalizar. Se detecta evaluando con datos nunca vistos.' },
  { id: 'e6', cat: 'Cómo aprende un modelo', titulo: 'Entrenamiento e inferencia',
    texto: 'Un modelo tiene dos etapas de vida. En el entrenamiento se ajustan sus pesos con enormes cantidades de datos; es lento y costoso. En la inferencia los pesos ya están fijos y el modelo solo responde a lo que le pides. Cuando conversas con un asistente estás usando inferencia: no aprende de ti en ese momento.',
    clave: 'Entrenar = ajustar pesos (caro, una vez). Inferir = usar el modelo ya entrenado (cada consulta).' },

  // ───────── Modelos de lenguaje ─────────
  { id: 'l1', cat: 'Modelos de lenguaje', titulo: '¿Qué es un modelo de lenguaje?',
    texto: 'Un gran modelo de lenguaje es una red neuronal entrenada para una tarea muy simple: predecir qué viene después en un texto. Al practicar esa tarea con una cantidad inmensa de escritos, termina aprendiendo gramática, hechos, estilos y formas de razonar. Sus respuestas se generan palabra por palabra, no se copian de ningún sitio.',
    clave: 'Un LLM predice el siguiente fragmento de texto; de esa tarea simple surge una capacidad general.' },
  { id: 'l2', cat: 'Modelos de lenguaje', titulo: 'Tokens',
    texto: 'Los modelos no leen letras ni palabras completas, leen tokens: fragmentos de texto que pueden ser una palabra corta, una sílaba o un signo. En español, cien palabras suelen ocupar unos ciento cincuenta tokens. Los límites y los precios de los modelos se miden en tokens, así que conviene saber estimarlos.',
    clave: 'Token = unidad de texto que procesa el modelo. Límites y costos se cuentan en tokens.' },
  { id: 'l3', cat: 'Modelos de lenguaje', titulo: 'Embeddings',
    texto: 'Un embedding es una lista de números que representa el significado de un texto. Frases con sentido parecido quedan cerca entre sí en ese espacio numérico, aunque usen palabras distintas. Gracias a eso es posible buscar por significado y no solo por coincidencia exacta de términos.',
    clave: 'Embedding = el significado convertido en un vector; textos similares tienen vectores cercanos.' },
  { id: 'l4', cat: 'Modelos de lenguaje', titulo: 'El mecanismo de atención',
    texto: 'La atención permite que el modelo, al procesar cada token, mire los demás tokens y decida cuáles importan más. En la frase "el perro no cruzó la calle porque estaba cansado", la atención ayuda a relacionar "cansado" con "perro" y no con "calle". Así se capturan relaciones entre palabras lejanas.',
    clave: 'La atención pondera qué partes del texto son relevantes para entender cada token.' },
  { id: 'l5', cat: 'Modelos de lenguaje', titulo: 'La arquitectura transformer',
    texto: 'El transformer es la arquitectura detrás de casi todos los modelos de lenguaje actuales. Fue presentado en 2017 en el artículo "La atención es todo lo que necesitas". Su ventaja es que procesa todos los tokens en paralelo usando atención, lo que permite entrenar modelos enormes con mucha eficiencia.',
    clave: 'Transformer (2017): atención + procesamiento en paralelo; la base de los LLM modernos.' },
  { id: 'l6', cat: 'Modelos de lenguaje', titulo: 'Ventana de contexto',
    texto: 'La ventana de contexto es la cantidad máxima de tokens que el modelo puede considerar a la vez: tus instrucciones, los documentos que adjuntas, la conversación previa y su propia respuesta. Lo que queda fuera de la ventana simplemente no existe para él. Es su memoria de trabajo, no una memoria permanente.',
    clave: 'El contexto es la memoria de trabajo del modelo: lo que no cabe ahí, no lo ve.' },
  { id: 'l7', cat: 'Modelos de lenguaje', titulo: 'Temperatura',
    texto: 'Al generar cada token, el modelo calcula probabilidades para muchas opciones. La temperatura controla cuánto se arriesga al elegir. Con temperatura baja casi siempre toma la opción más probable y responde de forma estable; con temperatura alta explora alternativas, lo que da textos más variados pero menos predecibles.',
    clave: 'Temperatura baja = respuestas consistentes. Temperatura alta = más variedad y más riesgo.' },
  { id: 'l8', cat: 'Modelos de lenguaje', titulo: 'Modelos de difusión',
    texto: 'Los generadores de imágenes más conocidos usan difusión. Durante el entrenamiento se añade ruido a millones de fotos y el modelo aprende a quitarlo paso a paso. Para crear una imagen nueva se parte de ruido puro y se limpia gradualmente, guiando el proceso con la descripción que escribió el usuario.',
    clave: 'Difusión: aprender a quitar ruido; generar es partir de ruido y limpiarlo guiado por el texto.' },

  // ───────── Usar la IA ─────────
  { id: 'u1', cat: 'Usar la IA', titulo: 'El prompt',
    texto: 'El prompt es la instrucción que le das al modelo. Un buen prompt explica el objetivo, da el contexto necesario, indica el formato de salida y aclara para quién es el resultado. Piensa que le escribes a un colega brillante que acaba de llegar y no conoce tu proyecto: cuanto más claro seas, mejor trabajará.',
    clave: 'Buen prompt = objetivo + contexto + formato + audiencia. Claridad antes que trucos.' },
  { id: 'u2', cat: 'Usar la IA', titulo: 'Ejemplos en el prompt',
    texto: 'Mostrar es más eficaz que describir. Si incluyes en tu prompt dos o tres ejemplos de entrada con la salida que esperas, el modelo imita el patrón con mucha precisión. Esta técnica se conoce como aprendizaje con pocos ejemplos y no cambia los pesos del modelo: todo ocurre dentro del contexto.',
    clave: 'Few-shot: dar ejemplos en el prompt guía al modelo sin necesidad de reentrenarlo.' },
  { id: 'u3', cat: 'Usar la IA', titulo: 'Alucinaciones',
    texto: 'Una alucinación ocurre cuando el modelo afirma algo falso con total seguridad: una cita inventada, una fecha equivocada, una función que no existe. Sucede porque genera texto plausible, no porque consulte hechos. Para reducirlas, entrégale las fuentes, pídele que cite y verifica siempre los datos importantes.',
    clave: 'El modelo genera lo plausible, no lo verificado. Dale fuentes y comprueba lo importante.' },
  { id: 'u4', cat: 'Usar la IA', titulo: 'Generación aumentada con recuperación',
    texto: 'La técnica conocida como RAG combina un buscador con un modelo de lenguaje. Primero se recuperan los fragmentos de tus documentos más relacionados con la pregunta, normalmente usando embeddings, y luego se colocan en el contexto para que el modelo responda basándose en ellos. Así puede usar información privada o reciente.',
    clave: 'RAG = buscar primero, responder después con lo encontrado dentro del contexto.' },
  { id: 'u5', cat: 'Usar la IA', titulo: 'Ajuste fino',
    texto: 'El ajuste fino consiste en continuar el entrenamiento de un modelo ya existente con ejemplos propios, para especializarlo en un estilo o una tarea. Es más caro y lento que mejorar el prompt, así que conviene intentarlo solo cuando las instrucciones y los ejemplos en el contexto ya no alcanzan.',
    clave: 'Fine-tuning cambia los pesos para especializar; antes agota prompt, ejemplos y RAG.' },
  { id: 'u6', cat: 'Usar la IA', titulo: 'Agentes',
    texto: 'Un agente es un modelo de lenguaje que trabaja en un ciclo: piensa qué hacer, usa una herramienta, observa el resultado y decide el siguiente paso, hasta completar el objetivo. En lugar de entregar una sola respuesta, puede investigar, escribir código, ejecutarlo y corregir sus propios errores.',
    clave: 'Agente = modelo + herramientas + ciclo de pensar, actuar y observar.' },
  { id: 'u7', cat: 'Usar la IA', titulo: 'Herramientas y conectores',
    texto: 'Por sí solo, un modelo únicamente produce texto. Las herramientas le permiten actuar: buscar en la web, leer archivos, consultar una base de datos o enviar un mensaje. Protocolos abiertos como MCP definen una forma estándar de conectar modelos con servicios externos, de modo que una misma integración sirva para muchas aplicaciones.',
    clave: 'Las herramientas convierten texto en acción; MCP estandariza cómo se conectan.' },
  { id: 'u8', cat: 'Usar la IA', titulo: 'Razonar paso a paso',
    texto: 'Los modelos resuelven mejor los problemas difíciles cuando escriben su razonamiento antes de dar la respuesta final. Descomponer la tarea en pasos intermedios reduce errores de cálculo y de lógica. Muchos modelos actuales incluyen un modo de pensamiento extendido que hace esto de manera automática.',
    clave: 'Pensar antes de responder mejora los resultados en tareas complejas.' },

  // ───────── Criterio y responsabilidad ─────────
  { id: 'c1', cat: 'Criterio y responsabilidad', titulo: 'Sesgos',
    texto: 'Los modelos aprenden de textos e imágenes creados por personas, y con ellos heredan sus prejuicios. Un sistema entrenado con datos históricos puede repetir discriminaciones del pasado sin que nadie se lo pida. Detectar y corregir esos sesgos exige revisar los datos, medir los resultados por grupo y mantener supervisión humana.',
    clave: 'El modelo refleja sus datos, incluidos los prejuicios; hay que medirlos y corregirlos.' },
  { id: 'c2', cat: 'Criterio y responsabilidad', titulo: 'Evaluaciones',
    texto: 'No basta con que un modelo "parezca" bueno. Una evaluación es un conjunto de pruebas con criterios claros que permite medir su desempeño y compararlo después de cada cambio. Sin evaluaciones, mejorar un sistema de inteligencia artificial es adivinar; con ellas, cada ajuste se convierte en un experimento.',
    clave: 'Sin evals no sabes si mejoraste. Define pruebas y criterios antes de cambiar el sistema.' },
  { id: 'c3', cat: 'Criterio y responsabilidad', titulo: 'Privacidad',
    texto: 'Antes de pegar información en un asistente, pregúntate quién podría verla y cómo se va a usar. Datos personales, contraseñas, contratos o información de clientes requieren cuidado especial. Revisa las políticas del servicio, elimina lo que no sea necesario y, ante la duda, usa datos de ejemplo.',
    clave: 'Comparte solo lo necesario; los datos sensibles merecen revisión antes de enviarse.' },
  { id: 'c4', cat: 'Criterio y responsabilidad', titulo: 'Alineación y seguridad',
    texto: 'La alineación busca que los sistemas de inteligencia artificial persigan los objetivos que realmente queremos y no una versión literal o distorsionada de ellos. A medida que los modelos se vuelven más capaces y autónomos, garantizar que sean honestos, predecibles y corregibles se vuelve tan importante como hacerlos más potentes.',
    clave: 'Alinear = que el sistema haga lo que de verdad queremos, de forma honesta y corregible.' },
  { id: 'c5', cat: 'Criterio y responsabilidad', titulo: 'La persona al mando',
    texto: 'La inteligencia artificial es una herramienta extraordinaria para redactar, resumir, programar y analizar, pero la responsabilidad sigue siendo tuya. Revisa lo que produce, pide que explique sus decisiones y reserva para ti los juicios importantes. La mejor forma de usarla es como un colaborador rápido al que siempre supervisas.',
    clave: 'La IA acelera el trabajo; el criterio y la responsabilidad siguen siendo humanos.' },
];

/* Versión larga de cada lección (js/textos/*.js, unas 650 palabras). El texto breve queda como resumen. */
for (const l of LECCIONES) {
  const p = (typeof window !== 'undefined' && window.TEXTOS_LECCION || {})[l.id];
  if (p) { l.resumen = l.texto; l.texto = p.join(' '); }
}

/* Definiciones cortas: se encadenan al azar en la fuente "Glosario IA". */
const GLOSARIO = [
  'Token: fragmento de texto que el modelo procesa como una unidad.',
  'Prompt: instrucción o pregunta que se le entrega a un modelo.',
  'Inferencia: uso de un modelo ya entrenado para obtener una respuesta.',
  'Parámetro: número interno que el modelo ajusta durante el entrenamiento.',
  'Embedding: vector numérico que representa el significado de un texto.',
  'Contexto: todo el texto que el modelo puede ver en una sola consulta.',
  'Alucinación: afirmación falsa generada con apariencia de certeza.',
  'Temperatura: ajuste que regula la aleatoriedad de las respuestas.',
  'Transformer: arquitectura de red neuronal basada en atención.',
  'Atención: mecanismo que pondera la relevancia de cada token.',
  'Ajuste fino: entrenamiento adicional para especializar un modelo.',
  'Agente: modelo que usa herramientas en un ciclo hasta lograr un objetivo.',
  'Época: una pasada completa por todos los datos de entrenamiento.',
  'Lote: grupo de ejemplos que se procesan juntos en un paso.',
  'Gradiente: dirección en la que el error aumenta más rápido.',
  'Pérdida: número que mide qué tan equivocada fue una predicción.',
  'Sobreajuste: memorizar los datos de entrenamiento sin generalizar.',
  'Etiqueta: respuesta correcta asociada a un ejemplo de entrenamiento.',
  'Clasificación: tarea de asignar una categoría a cada entrada.',
  'Regresión: tarea de predecir un valor numérico continuo.',
  'Red neuronal: función formada por capas de unidades conectadas.',
  'Capa: conjunto de neuronas que transforma los datos en un paso.',
  'Peso: valor que indica la fuerza de una conexión entre neuronas.',
  'Sesgo: tendencia sistemática heredada de los datos de entrenamiento.',
  'Evaluación: conjunto de pruebas para medir el desempeño de un modelo.',
  'Multimodal: modelo capaz de trabajar con texto, imagen o audio.',
  'Difusión: técnica que genera imágenes eliminando ruido paso a paso.',
  'Recuperación: búsqueda de fragmentos relevantes antes de responder.',
  'Base vectorial: almacén que busca textos por cercanía de significado.',
  'Cuantización: reducir la precisión de los pesos para ahorrar memoria.',
  'Destilación: entrenar un modelo pequeño para imitar a uno grande.',
  'Aprendizaje por refuerzo: aprender mediante recompensas y castigos.',
  'Conjunto de validación: datos reservados para ajustar decisiones.',
  'Conjunto de prueba: datos nunca vistos para la evaluación final.',
  'Latencia: tiempo que tarda el modelo en comenzar a responder.',
  'Código abierto: modelo cuyos pesos se publican para uso libre.',
  'Alineación: lograr que un sistema persiga los objetivos deseados.',
  'Interpretabilidad: estudio de lo que ocurre dentro de un modelo.',
  'Salida estructurada: respuesta en un formato fijo, como JSON.',
  'Herramienta: función externa que un modelo puede decidir invocar.',
];

/* Palabras frecuentes del español (con acentos y ñ para practicarlos). */
const PALABRAS = ('de la que el en y a los se del las un por con no una su para es al lo como más pero sus le ya o ' +
  'este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde todo nos durante todos uno ' +
  'les ni contra otros ese eso ante ellos e esto mí antes algunos qué unos yo otro otras otra él tanto esa estos mucho ' +
  'quienes nada muchos cual poco ella estar estas algunas algo nosotros mi mis tú te ti tu tus ellas tiempo vida año ' +
  'día cosa hombre mujer parte mundo casa país lugar trabajo momento forma manera vez ciudad noche agua punto mano ' +
  'historia grupo problema ejemplo palabra número sistema razón idea cambio niño señor camino pregunta respuesta ' +
  'hacer poder decir tener ver dar saber querer llegar pasar deber poner parecer quedar creer hablar llevar dejar ' +
  'seguir encontrar llamar venir pensar salir volver tomar conocer vivir sentir tratar mirar contar empezar esperar ' +
  'buscar existir entrar trabajar escribir perder producir ocurrir entender pedir recibir recordar terminar permitir ' +
  'aparecer conseguir comenzar servir sacar necesitar mantener resultar leer caer cambiar presentar crear abrir ' +
  'considerar oír acabar convertir ganar formar traer partir morir aceptar realizar suponer comprender lograr explicar ' +
  'nuevo primero último grande bueno pequeño mismo mayor mejor claro largo fácil difícil rápido después ahora siempre ' +
  'nunca aquí allí bien mal casi además quizá todavía pronto mañana español teclado rápida canción corazón también ' +
  'máquina página música próximo según través atención información acción educación razón jamás inglés pingüino ' +
  'vergüenza año niña señal pequeña sueño montaña mañana compañero diseño').split(' ');
