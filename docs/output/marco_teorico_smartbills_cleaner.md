# Marco teorico - SmartBills Cleaner

Fundamentos para una aplicacion inteligente de gestion, extraccion, validacion y consulta de facturas

## Nota de alcance

Este documento se elabora a partir del anteproyecto PMV-Proyecto-Integrador-SmartBillsCleaner.pdf y del estado actual del repositorio SmartBills Cleaner. El anteproyecto plantea una solucion inteligente orientada a OCR, vectorizacion, bases de datos vectoriales, busqueda semantica, consultas en lenguaje natural y respuestas con referencias documentales. El prototipo desarrollado hasta la fecha implementa un MVP local con autenticacion por roles, dashboard, carga de facturas, almacenamiento local simulado tipo S3, OCR simulado, edicion/validacion manual de campos, auditoria y persistencia en PostgreSQL mediante Prisma.

Por lo anterior, el marco teorico se formula como soporte de la vision completa del proyecto y, al mismo tiempo, reconoce la etapa incremental actual: primero se valida el flujo funcional de gestion documental y datos estructurados; despues se integran servicios reales de OCR, extraccion inteligente, embeddings y consulta conversacional.

## Introduccion

La gestion de facturas sigue siendo un proceso critico para organizaciones y usuarios que deben clasificar, revisar, auditar y consultar documentos financieros provenientes de multiples fuentes. Aunque muchas facturas llegan en formato PDF o imagen, su contenido no siempre esta disponible como datos estructurados. Esto obliga a realizar tareas manuales de lectura, transcripcion y verificacion de campos como proveedor, NIT, fecha, subtotal, impuestos y total. Estas actividades consumen tiempo, aumentan la probabilidad de error y retrasan procesos posteriores de control de gastos, auditoria, conciliacion y toma de decisiones.

SmartBills Cleaner se ubica en el campo de la automatizacion inteligente de documentos, tambien conocida como Intelligent Document Processing (IDP). Este campo combina reconocimiento optico de caracteres, comprension de documentos visualmente ricos, extraccion de entidades, reglas de validacion, intervencion humana y recuperacion semantica de informacion. Su objetivo no es solo digitalizar archivos, sino convertir documentos heterogeneos en informacion confiable, consultable y trazable.

La investigacion que sustenta este proyecto parte de una premisa practica: en facturas y recibos, el significado de un dato depende tanto del texto como de su ubicacion, de las etiquetas cercanas, del formato del documento y del contexto financiero. Por ello, los enfoques actuales superan la lectura lineal de texto y combinan OCR, modelos multimodales, embeddings y mecanismos de recuperacion aumentada para responder preguntas con base en evidencia documental.

## Relacion entre problema, MVP y fundamento teorico

| Elemento | Situacion en SmartBills | Soporte teorico |
|---|---|---|
| Problema del proyecto | Lectura manual, errores, baja trazabilidad y dificultad para consultar historicos de facturas. | IDP, OCR, KIE, auditoria y RAG. |
| MVP desarrollado | Login, roles, dashboard, carga, OCR simulado, edicion, filtros y auditoria. | Validacion incremental del flujo end to end antes de integrar IA real. |
| Siguiente etapa | OCR real, embeddings, base vectorial, busqueda semantica y respuestas con fuentes. | Textract/Document AI/Azure, LayoutLM, SBERT y RAG. |

## Gestion documental inteligente y automatizacion de facturas

La automatizacion de facturas pertenece a una familia de soluciones que buscan transformar documentos semi-estructurados en datos operativos. Una factura suele conservar cierta regularidad, por ejemplo campos de proveedor, fecha, impuestos y valor total, pero esos campos cambian de posicion, etiqueta, idioma, formato visual y calidad de imagen segun el emisor. Esta variabilidad explica por que las soluciones basadas unicamente en plantillas rigidas tienden a ser insuficientes cuando el sistema debe procesar documentos de distintos proveedores.

La literatura reciente confirma esta dificultad. Estudios sobre extraccion automatica en facturas resaltan que la diversidad de layouts y la escasez de datos anotados son retos centrales para la automatizacion financiera (Rana et al., 2025; Charabuddi, 2025). De forma similar, trabajos sobre extraccion de informacion de documentos empresariales describen la necesidad de integrar señales textuales, visuales y espaciales para aumentar la precision en recibos y facturas complejas (Yan et al., 2025).

Para SmartBills Cleaner, esta base teorica justifica una arquitectura que no se limite a almacenar archivos, sino que capture metadatos, estados de procesamiento, campos extraidos, confianza por campo y trazabilidad de acciones. El prototipo actual ya materializa esta idea con modelos de usuario, factura, campos de factura y auditoria, lo que permite preparar el sistema para reemplazar el OCR simulado por servicios reales sin redisenar el flujo principal.

## OCR y preprocesamiento de documentos

El Reconocimiento Optico de Caracteres (OCR) es la tecnica que permite convertir imagenes o documentos escaneados en texto procesable. En el contexto de facturas, el OCR es necesario cuando el documento llega como imagen, PDF escaneado o fotografia. Sin esta etapa, los sistemas no pueden extraer campos ni aplicar busquedas sobre el contenido. Sin embargo, la precision del OCR depende de factores como resolucion, inclinacion, contraste, ruido, orientacion del texto, compresion del archivo y calidad del escaneo.

Wang, Zhang y Yu (2026) proponen un proceso de reconocimiento de facturas basado en aprendizaje profundo que combina preprocesamiento de imagen, OCR y post-procesamiento. El estudio destaca operaciones como escalado, binarizacion, reduccion de ruido y correccion de inclinacion para mejorar la lectura antes de extraer datos. Este planteamiento respalda que SmartBills Cleaner incluya una fase de procesamiento documental previa a la validacion de campos.

Tambien existen servicios comerciales especializados. Amazon Textract ofrece AnalyzeExpense para analizar facturas y recibos y devolver estructuras JSON con campos de resumen y grupos de items (Amazon Web Services, 2026). Google Document AI dispone de un Invoice Parser que extrae datos como numero de factura, proveedor, monto, impuestos, fecha de factura y fecha de vencimiento en varios idiomas, incluido espanol (Google Cloud, 2026). Microsoft Document Intelligence, por su parte, incluye un modelo preconstruido para facturas, ordenes de compra y recibos, con extraccion de campos y line items (Microsoft, 2025).

Estas fuentes sustentan la decision del anteproyecto de considerar AWS Textract, Document AI o servicios equivalentes. En la etapa MVP, SmartBills Cleaner usa OCR simulado para validar la carga, persistencia, visualizacion y edicion. En una fase posterior, el contrato funcional puede conectarse a un proveedor real de OCR y mantener la misma experiencia de usuario.

## Extraccion de informacion en facturas y documentos semi-estructurados

Extraer informacion de una factura no equivale solamente a leer texto. El sistema debe identificar que fragmento corresponde a proveedor, NIT, fecha, subtotal, IVA, total u otros campos relevantes. La extraccion de informacion, por tanto, combina deteccion de texto, comprension de layout, clasificacion de entidades, reglas de negocio y validacion posterior.

El reto ha sido estudiado en benchmarks como SROIE, una competencia de ICDAR enfocada en OCR y extraccion de informacion clave en recibos escaneados. Huang et al. (2019) definieron tareas de localizacion de texto, reconocimiento OCR y extraccion de campos, con un conjunto de cerca de mil imagenes de recibos. Este tipo de benchmark es relevante para SmartBills porque muestra que el problema tiene valor comercial y dificultad tecnica reconocida en la comunidad de analisis documental.

Los modelos modernos incorporan informacion espacial. LayoutLM, propuesto por Microsoft Research, aprende conjuntamente texto y posicion en pagina para tareas de comprension de documentos como formularios y recibos (Xu et al., 2020). Esta linea de investigacion es clave porque en una factura el mismo numero puede representar precio unitario, impuesto, subtotal o total dependiendo de su ubicacion y de las etiquetas cercanas.

Estudios mas recientes profundizan en enfoques multimodales. DocExtractNet, basado en LayoutLMv3, integra mejoras de imagen, pistas de precision y fusion entre modalidades para extraer informacion en recibos, reportando mejoras de F1 en conjuntos como Finance-Receipts, FUNSD y CORD (Yan et al., 2025). Otros trabajos exploran extraccion sin plantillas mediante modelos vision-lenguaje y post-procesamiento heuristico, resaltando la importancia de transparencia y auditabilidad en dominios financieros (Rana et al., 2025).

## Validacion manual, confianza y trazabilidad

La automatizacion de facturas debe tratarse como un sistema de apoyo a la decision, no como una fuente infalible. Incluso cuando el OCR o el modelo de extraccion alcanzan buenos resultados, pueden presentarse errores por imagenes de baja calidad, formatos inusuales, campos ambiguos o documentos con multiples valores similares. Por eso, la literatura y los productos de mercado suelen combinar extraccion automatica con revision humana, puntajes de confianza y mecanismos de correccion.

El benchmark de AIMultiple sobre invoice OCR comparo proveedores como Amazon Textract, Google Document AI, Azure Document Intelligence y Rossum, y encontro que la calidad del documento afecta de manera importante la precision, especialmente en imagenes de menor contraste o con campos de detalle complejos (Dilmegani, 2025). Aunque este tipo de benchmark no reemplaza una evaluacion academica controlada, resulta util para justificar pruebas propias con facturas reales del dominio de uso.

En SmartBills Cleaner, este principio se refleja en el modulo de edicion y validacion manual de facturas. El usuario puede revisar proveedor, NIT, fecha, subtotal, IVA, total y campos detectados antes de considerar confiable la informacion. Ademas, la auditoria de acciones permite registrar eventos de carga, edicion y eliminacion, lo cual es importante en procesos administrativos donde se requiere trazabilidad.

Desde la perspectiva de experiencia de usuario, la validacion manual debe disenarse con visibilidad del estado del sistema, prevencion de errores, consistencia y control del usuario. Estos principios coinciden con las heuristicas de Nielsen, especialmente visibilidad del estado, control y libertad, prevencion de errores y ayuda para reconocer y recuperarse de errores (Nielsen, 1994/2005). En el proyecto, esto respalda la necesidad de mostrar estados como queued, processing, processed o error, avisos de campos con baja confianza y confirmaciones antes de acciones destructivas.

## Embeddings, busqueda semantica y bases vectoriales

El anteproyecto no se limita a extraer campos estructurados; tambien plantea la posibilidad de consultar facturas en lenguaje natural. Para ello se requiere transformar fragmentos de texto en representaciones numericas conocidas como embeddings. Un embedding captura propiedades semanticas del texto, de forma que fragmentos con significados parecidos queden cercanos en un espacio vectorial. Esto permite recuperar documentos o secciones relevantes aunque la consulta del usuario no use las mismas palabras que aparecen en la factura.

Sentence-BERT es una referencia importante porque propuso adaptar BERT con redes siamesas y tripletas para producir embeddings comparables mediante similitud coseno. Reimers y Gurevych (2019) muestran que este enfoque reduce drasticamente el costo de busqueda semantica frente a comparar pares de oraciones directamente con BERT. La idea es relevante para SmartBills porque una base historica de facturas puede crecer y requerir recuperacion eficiente.

En la arquitectura esperada, cada factura puede dividirse en campos y fragmentos textuales: encabezado, datos del proveedor, conceptos cobrados, impuestos, totales y observaciones. Esos fragmentos se vectorizan y se almacenan en una base vectorial o indice semantico. Cuando el usuario pregunta, por ejemplo, 'cuanto pague de energia el ultimo trimestre', la consulta tambien se convierte en embedding y se compara contra los fragmentos almacenados para recuperar evidencia relevante.

## Consultas en lenguaje natural y recuperacion aumentada

Los modelos de lenguaje pueden redactar respuestas comprensibles, pero en contextos documentales deben responder con base en fuentes verificables. La Recuperacion Aumentada por Generacion (RAG) combina un modelo generativo con un mecanismo de recuperacion externa. Lewis et al. (2020) mostraron que los modelos RAG pueden generar respuestas mas especificas y factuales al consultar memoria no parametrica recuperada desde un indice denso.

Para SmartBills Cleaner, RAG representa el fundamento teorico de las consultas conversacionales sobre facturas. El sistema no deberia responder solo desde el conocimiento general del modelo, sino desde los documentos cargados por el usuario. En terminos funcionales, esto exige un flujo de: OCR o extraccion del texto, segmentacion de contenido, generacion de embeddings, almacenamiento en indice vectorial, recuperacion de fragmentos pertinentes, generacion de respuesta y presentacion de referencias a la factura o pagina de origen.

La exigencia de referencias es especialmente importante en auditoria. Si el usuario pregunta por un valor, el sistema debe poder indicar de que factura proviene, que campo o fragmento lo respalda y si el dato fue extraido automaticamente o corregido por una persona. Esta trazabilidad reduce el riesgo de respuestas no verificables y alinea la solucion con necesidades administrativas reales.

## Arquitectura del sistema y desarrollo incremental

El anteproyecto plantea una arquitectura por capas: presentacion, servicios e inteligencia artificial. Aunque inicialmente se mencionaban tecnologias como Django y Next.js, el prototipo actual se implemento con React/Vite en frontend, Node.js/Express en backend, PostgreSQL y Prisma. Este cambio tecnologico no altera el fundamento conceptual: la separacion por capas sigue permitiendo independencia entre interfaz, reglas de negocio, persistencia y servicios de IA.

En el estado actual, la capa de presentacion permite login, dashboard, gestion de usuarios, carga, listado, edicion y auditoria. La capa de servicios expone endpoints para autenticacion, usuarios, facturas, dashboard y auditoria. La capa de datos conserva usuarios, roles, facturas, campos extraidos y logs. La capa de IA esta representada por un OCR simulado, lo que funciona como contrato temporal para validar la experiencia end to end antes de integrar AWS Textract, Google Document AI, Azure Document Intelligence u otro proveedor.

Este enfoque incremental es coherente con Scrum. La Guia Scrum define el trabajo mediante product backlog, sprint backlog e incremento, y resalta transparencia, inspeccion y adaptacion como pilares del marco (Schwaber y Sutherland, 2020). En SmartBills, la construccion de un MVP funcional local permite inspeccionar rapidamente el flujo principal, reducir riesgo tecnico y adaptar el backlog antes de invertir en integraciones cloud definitivas.

## Seguridad, roles y auditoria en documentos financieros

Las facturas contienen informacion sensible: datos de proveedores, identificadores tributarios, montos, historicos de consumo y patrones financieros. Por ello, un sistema de gestion de facturas debe contemplar autenticacion, autorizacion por roles, control de acceso y registro de acciones. Estos elementos no son accesorios tecnicos, sino condiciones de confianza para que usuarios y organizaciones adopten la herramienta.

El prototipo actual ya incorpora roles ADMIN, ANALYST y VIEWER, rutas protegidas con JWT y auditoria de acciones como login, creacion/actualizacion de usuarios, carga, edicion y eliminacion. Desde el marco teorico, esto se conecta con los principios de trazabilidad y gobernanza de datos en procesos administrativos. En fases posteriores conviene fortalecer refresh tokens, rate limiting, politicas de retencion, cifrado de archivos y controles de acceso sobre documentos segun propietario o unidad organizacional.

## Sintesis de soporte teorico para SmartBills Cleaner

El proyecto se sustenta en cuatro ideas principales. Primero, las facturas son documentos semi-estructurados cuya automatizacion requiere comprender texto, layout, calidad visual y reglas financieras. Segundo, el OCR es una etapa necesaria pero insuficiente: debe complementarse con extraccion de entidades, validacion, confianza por campo y revision humana. Tercero, los embeddings y RAG permiten evolucionar desde un repositorio de facturas hacia una herramienta consultable en lenguaje natural con evidencia documental. Cuarto, la arquitectura por capas y el desarrollo Scrum permiten construir el sistema de forma incremental, validando primero el MVP local y despues las integraciones inteligentes.

La version actual de SmartBills Cleaner ya soporta la primera parte de esta vision: autenticacion, roles, auditoria, carga, persistencia, dashboard, listado y edicion de facturas. El marco teorico respalda que las siguientes etapas se orienten a integrar OCR real, registrar confianza por campo desde el proveedor, almacenar fragmentos vectorizados, habilitar busqueda semantica y presentar respuestas con referencias exactas a los documentos fuente.

## Referencias

- Amazon Web Services. (2026). Analyzing Invoices and Receipts with Amazon Textract. https://docs.aws.amazon.com/textract/latest/dg/analyzing-document-expense.html
- Amazon Web Services. (2026). AnalyzeExpense - Amazon Textract API Reference. https://docs.aws.amazon.com/textract/latest/APIReference/API_AnalyzeExpense.html
- Charabuddi, R. R. (2025). Zero-Shot Invoice Information Extraction Using Foundation Models with Spatial Prompt Tuning. International Journal of Intelligent Systems and Applications in Engineering, 13(1s), 283. https://ijisae.org/index.php/IJISAE/article/view/7722
- Dilmegani, C. (2025). Invoice OCR Benchmark: Extraction Accuracy of LLMs vs OCRs. AIMultiple. https://research.aimultiple.com/invoice-parsing/
- Google Cloud. (2026). Document AI processors list: Invoice Parser and Expense Parser. https://docs.cloud.google.com/document-ai/docs/processors-list
- Google Cloud. (2025). Document AI overview. https://cloud.google.com/document-ai/docs/overview
- Huang, Z., Chen, K., He, J., Bai, X., Karatzas, D., Lu, S., & Jawahar, C. V. (2019). ICDAR2019 Competition on Scanned Receipt OCR and Information Extraction. Proceedings of ICDAR 2019. https://arxiv.org/abs/2103.10213
- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Kuttler, H., Lewis, M., Yih, W., Rocktaschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS 2020. https://papers.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html
- Microsoft. (2025). Document Intelligence invoice model. Microsoft Learn. https://learn.microsoft.com/azure/ai-services/document-intelligence/prebuilt/invoice
- Nielsen, J. (1994/2005). 10 Usability Heuristics for User Interface Design. Nielsen Norman Group. https://www.nngroup.com/articles/ten-usability-heuristics/
- Rana, M., Hanif, A., Islam, F., Mridha, S., Maliha, U. H., & Mumu, T. T. (2025). A Template-Free Approach to Invoice Digitization Leveraging SmolVLM and Heuristic Extraction. Journal of Information Systems Engineering and Management, 10(63s). https://jisem-journal.com/index.php/journal/article/view/14008
- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. EMNLP-IJCNLP 2019. https://arxiv.org/abs/1908.10084
- Schwaber, K., & Sutherland, J. (2020). The Scrum Guide. https://scrumguides.org/scrum-guide.html
- Wang, C., Zhang, J., & Yu, Y. (2026). Invoiveocr: deep learning based automatic invoice recognition process. Discover Artificial Intelligence, 6, 636. https://link.springer.com/article/10.1007/s44163-026-01140-3
- Xu, Y., Li, M., Cui, L., Huang, S., Wei, F., & Zhou, M. (2020). LayoutLM: Pre-training of Text and Layout for Document Image Understanding. KDD 2020. https://www.microsoft.com/en-us/research/publication/layoutlm-pre-training-of-text-and-layout-for-document-image-understanding/
- Yan, Z., Ye, Z., Ge, J., Qin, J., Liu, J., Cheng, Y., & Gurrin, C. (2025). DocExtractNet: A novel framework for enhanced information extraction from business documents. Information Processing & Management, 62(3), 104046. https://www.sciencedirect.com/science/article/pii/S0306457324004059
