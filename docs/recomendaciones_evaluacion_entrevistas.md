# Recomendaciones para evaluar entrevistas y preparar análisis

## Enfoque recomendado

La mejor forma de evaluar entrevistas para luego construir tablas, métricas y hallazgos es combinar dos niveles:

1. **Nivel cuantitativo**
   Sirve para medir percepción general mediante escalas de 1 a 5.

2. **Nivel cualitativo**
   Sirve para registrar frases, problemas, necesidades y oportunidades detectadas.

## Sistema recomendado de evaluación

### 1. Variables cuantificables

Conviene medir al menos estas dimensiones con escala Likert `1 a 5`:

- Utilidad percibida del sistema
- Facilidad de uso esperada
- Confianza al corregir información
- Valor de las consultas en lenguaje natural
- Claridad general de la interfaz

Esto permite luego calcular:

- promedio por participante,
- promedio por tipo de usuario,
- promedio por dimensión,
- comparación entre usuario novato y avanzado.

### 2. Variables cualitativas

Cada respuesta abierta debería poder etiquetarse con alguno de estos campos:

- `tema`
- `subtema`
- `pain_point`
- `feature_request`
- `priority`
- `quote_relevant`

Esto facilita:

- crear el diagrama de afinidad,
- contar cuántas veces aparece un problema,
- agrupar necesidades por perfil,
- seleccionar citas relevantes para el informe.

## Estructura más útil para Excel

La estructura más potente para análisis posterior es:

- una hoja de `Participantes`,
- una hoja de `Respuestas` en formato largo,
- una hoja de `Evaluación`,
- una hoja de `Afinidad`.

El formato largo significa:

- **una respuesta por fila**
- **un participante por muchas filas**

Esa es la mejor opción para:

- tablas dinámicas,
- filtros,
- segmentación,
- conteos por tema,
- cruces por perfil,
- gráficos.

## Qué más es recomendable

Además del Excel y el XML, es recomendable:

- usar códigos de pregunta estables como `C1`, `U1`, `N1`,
- mantener un identificador único por participante,
- marcar si una respuesta es problema, necesidad o oportunidad,
- guardar una frase textual destacada por entrevista,
- registrar el nivel de experiencia del usuario,
- clasificar el impacto del hallazgo como `Bajo`, `Medio` o `Alto`.

## Operaciones y tablas sugeridas después

Cuando ya tengas las 4 entrevistas, las primeras tablas útiles serían:

1. **Promedio por dimensión**
   Ejemplo: utilidad, facilidad, confianza.

2. **Frecuencia de problemas**
   Conteo de pain points por tema.

3. **Cruce por tipo de usuario**
   Novato vs avanzado.

4. **Top necesidades**
   Conteo de feature requests más repetidos.

5. **Mapa de afinidad**
   Hallazgos agrupados por usabilidad, confianza, búsqueda, automatización y seguridad.

## Recomendación final

Si la meta es que después puedas analizar bien la información, lo más importante no es solo hacer buenas preguntas, sino **capturar las respuestas de forma estructurada**. Por eso, la mejor combinación para tu caso es:

- `Excel` para análisis y tablas,
- `XML` como respaldo estructurado,
- y una codificación simple de hallazgos para afinidad y user personas.
