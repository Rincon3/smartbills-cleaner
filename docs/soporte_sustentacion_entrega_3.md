# Soporte de sustentacion - Entrega 3

## 1. Lectura ejecutiva para la exposicion

La tercera entrega pide evidenciar madurez en la gestion agil y una primera version funcional desplegada localmente. Con base en el backlog `SBC_ProductBacklog_v2.xlsx` y en la implementacion actual del repositorio, la mejor narrativa para sustentar el avance es esta:

- El proyecto ya cuenta con un MVP funcional local.
- El MVP cubre de forma clara el cierre de varias historias de `Release 1`.
- Tambien incorpora un adelanto funcional de `Release 2`, especialmente en carga y validacion de facturas.
- Algunas capacidades del backlog estan implementadas de forma simulada y deben presentarse como tal, no como integraciones finales con AWS/Textract/S3.

## 2. Lo que si puedes sustentar con evidencia real

### US-01 - Inicio de sesion

Estado sugerido: `Cumplida parcialmente frente al backlog, pero funcional en el MVP`

Evidencia:

- El endpoint `POST /api/auth/login` valida email y contrasena y retorna un token junto con la informacion del usuario: [apps/backend/src/routes/authRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/authRoutes.js:11)
- El middleware protege rutas autenticadas mediante JWT: [apps/backend/src/middleware/auth.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/middleware/auth.js:4)
- La aplicacion tiene login y rutas protegidas en frontend: [apps/frontend/src/App.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/App.jsx:15)

Matiz importante:

- El backlog pide `access + refresh token`, expiracion de 1 hora y rate limiting.
- La implementacion actual retorna un solo token y no muestra refresh flow ni rate limiting. El token expira a `12h`: [apps/backend/src/utils/tokens.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/utils/tokens.js:4)

Como decirlo:

`La autenticacion ya esta operativa en entorno local y soporta acceso seguro con JWT y control de rutas. Para esta fase se implemento el flujo base funcional; como mejora pendiente quedan refresh token y endurecimiento adicional de seguridad.`

### US-02 - Gestion de usuarios por roles

Estado sugerido: `Mayormente cumplida`

Evidencia:

- Prisma define roles `ADMIN`, `ANALYST`, `VIEWER`: [apps/backend/prisma/schema.prisma](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/prisma/schema.prisma:10)
- El backend expone listado, creacion y actualizacion de usuarios: [apps/backend/src/routes/userRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/userRoutes.js:9)
- El acceso a `/api/users` queda restringido a `ADMIN` desde el servidor principal: [apps/backend/src/server.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/server.js:26)
- El frontend tiene modulo de gestion de usuarios visible solo para `ADMIN`: [apps/frontend/src/pages/UsersPage.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/pages/UsersPage.jsx:15)

Matiz importante:

- No se ve validacion explicita de email unico con manejo de error controlado.
- El hash de contrasena se hace con costo `10`, mientras el backlog pide `12`: [apps/backend/src/routes/userRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/userRoutes.js:31)

### TK-05 - Auditoria

Estado sugerido: `Cumplida a nivel MVP`

Evidencia:

- Existe modelo `AuditLog` en la base de datos: [apps/backend/prisma/schema.prisma](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/prisma/schema.prisma:44)
- Se registran eventos de login, creacion/actualizacion de usuarios, upload, edicion y eliminacion: [apps/backend/src/routes/authRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/authRoutes.js:32), [apps/backend/src/routes/userRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/userRoutes.js:37), [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:139)
- Existe consulta de auditoria para administrador y pagina en frontend para visualizarla: [apps/backend/src/routes/auditRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/auditRoutes.js:6), [apps/frontend/src/pages/AuditPage.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/pages/AuditPage.jsx:6)

Matiz importante:

- No se evidencia aun la politica de retencion de 90 dias.

### US-03 - Layout base y navegacion protegida

Estado sugerido: `Cumplida`

Evidencia:

- El frontend define rutas para dashboard, facturas, carga, usuarios, auditoria y configuracion: [apps/frontend/src/App.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/App.jsx:15)
- Las rutas internas cuelgan de `ProtectedRoute`, lo que soporta la proteccion de navegacion: [apps/frontend/src/App.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/App.jsx:18)

### US-04 - Dashboard con KPIs

Estado sugerido: `Cumplida para MVP`

Evidencia:

- El backend genera resumen con KPIs y ultimas facturas: [apps/backend/src/routes/dashboardRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/dashboardRoutes.js:6)
- El frontend consume esos datos y renderiza KPIs, grafica y tabla de ultimas facturas: [apps/frontend/src/pages/DashboardPage.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/pages/DashboardPage.jsx:17)

Matiz importante:

- Parte de la visualizacion analitica e insights sigue siendo simulada en frontend cuando no hay suficiente historico.

### US-05 - Carga de factura

Estado sugerido: `Cumplida parcialmente, implementada en modo simulado`

Evidencia:

- El backend recibe archivos PDF, PNG, JPG y TIFF por `POST /api/invoices/upload`: [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:109)
- El frontend tiene drag and drop y selector de archivo: [apps/frontend/src/pages/UploadPage.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/pages/UploadPage.jsx:45)

Matiz importante:

- El backlog pide almacenamiento real en S3, progreso visible, maximo 20MB y estado `PROCESSING`.
- La implementacion guarda en disco local con `SIMULATED_S3`, no muestra barra de progreso y normalmente crea la factura ya procesada o en error: [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:125)

Como decirlo:

`Para la tercera entrega se materializo el flujo funcional de carga documental en entorno local. La integracion cloud definitiva con S3 se reemplazo temporalmente por almacenamiento local simulado para poder validar el flujo end to end.`

### US-06 - Extraccion OCR

Estado sugerido: `Cumplida parcialmente, simulada`

Evidencia:

- Existe un servicio que simula la extraccion de proveedor, NIT, fecha, subtotal, IVA y total, ademas del porcentaje de confianza por campo: [apps/backend/src/utils/fakeOcr.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/utils/fakeOcr.js:9)
- El flujo de carga persiste esos campos y la confianza OCR en la base de datos: [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:116)

Matiz importante:

- No existe integracion real con AWS Textract.
- No hay polling ni worker asincrono real.
- Debe presentarse como `OCR simulado` para validar el flujo funcional del MVP.

### US-07 - Validacion manual de OCR

Estado sugerido: `Cumplida a nivel MVP`

Evidencia:

- El frontend permite editar proveedor, NIT, fecha, subtotal, IVA, total, estado y los campos detectados: [apps/frontend/src/components/InvoiceEditor.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/components/InvoiceEditor.jsx:13)
- El backend actualiza la factura y recalcula la confianza promedio: [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:154)

Matiz importante:

- No se ve un marcador explicito `auto-detectado vs editado manualmente`, como lo pide el backlog.

### US-08 - Listado, filtros y eliminacion

Estado sugerido: `Cumplida parcialmente`

Evidencia:

- El backend soporta filtros por estado, proveedor y rango de fechas: [apps/backend/src/routes/invoiceRoutes.js](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/backend/src/routes/invoiceRoutes.js:66)
- El frontend muestra listado, aplica filtros y permite eliminar: [apps/frontend/src/pages/InvoicesPage.jsx](/Users/miguelrinconclavijo/Desktop/study/Maestria%20en%20desarrollo%20IA/trabajo%20de%20grado%20maestria/smartbills/apps/frontend/src/pages/InvoicesPage.jsx:73)

Matiz importante:

- El backlog pide paginacion, busqueda en tiempo real, confirmacion antes de eliminar, exportacion CSV y ordenamiento por columna.
- En la implementacion actual no se observa paginacion, confirmacion, exportacion CSV ni ordenamiento.

## 3. Conclusion honesta frente al backlog

Si lo presentas con rigor, el estado mas defendible es:

- `Release 1`: mayoritariamente implementado a nivel MVP funcional local.
- `Release 2`: iniciado y parcialmente materializado mediante flujos simulados de carga, OCR y validacion.
- `Primera version funcional local`: si, claramente sustentable.
- `Cumplimiento completo de todos los criterios de aceptacion de la fase`: no conviene afirmarlo en terminos absolutos.

La tesis correcta para la entrega es:

`El proyecto ya consolida una primera version funcional local que valida el flujo principal de autenticacion, gestion de usuarios, auditoria, dashboard, carga documental, extraccion de datos y validacion manual. Las integraciones avanzadas con servicios cloud y algunos criterios de endurecimiento tecnico permanecen como trabajo de las siguientes iteraciones.`

## 4. Guion sugerido de demo

Orden recomendado de demo:

1. Mostrar backlog actualizado y ubicar que la tercera entrega cae en semana 9, es decir, transicion entre cierre de `Release 1` e inicio de `Release 2`.
2. Mostrar version funcional local levantada en Docker o local.
3. Iniciar sesion con usuario seed.
4. Entrar a dashboard y evidenciar KPIs.
5. Ir a usuarios y mostrar gestion por roles.
6. Ir a auditoria y mostrar trazabilidad de eventos.
7. Subir una factura.
8. Mostrar extraccion OCR simulada con porcentajes de confianza.
9. Ir al listado de facturas, filtrar, editar una factura y guardar.
10. Mostrar nuevamente auditoria para evidenciar el registro de acciones.

## 5. Evidencias que debes llevar aparte del codigo

Estas evidencias no las encontre en el repositorio y son importantes para cumplir la rubric:

- `Product Backlog` actualizado con estado real de cada historia.
- `Release Plan` ajustado al avance real.
- Evidencia de `Sprint Planning`.
- Evidencia de `Sprint Review`.
- Evidencia de `Sprint Retrospective`.
- `Definition of Done` usada para validar las historias de esta fase.
- Evidencia de validacion de criterios de aceptacion, aunque sea en matriz simple.

Si no tienes esas piezas, la recomendacion es no improvisarlas en la presentacion. Mejor decir:

`El backlog y release plan ya fueron recalibrados con base en el avance real del MVP, y las ceremonias se soportan con actas/capturas del equipo.`

## 6. Ajuste recomendado al backlog para que sea coherente

Para que no haya choque entre lo planeado y lo ejecutado, conviene manejar estos estados:

- `US-01`: completada con observaciones.
- `US-02`: completada con observaciones.
- `TK-05`: completada.
- `US-03`: completada.
- `US-04`: completada.
- `US-05`: en progreso avanzado o completada en entorno simulado.
- `US-06`: en progreso avanzado o prototipo funcional.
- `US-07`: completada para MVP.
- `US-08`: en progreso.
- `TK-07`: pendiente o no iniciada formalmente.

## 7. Frases utiles para la sustentacion

- `La prioridad de esta entrega fue consolidar un flujo funcional extremo a extremo en entorno local.`
- `Decidimos implementar primero la validacion del flujo de negocio con servicios simulados para reducir riesgo tecnico y habilitar pruebas tempranas.`
- `Lo que hoy mostramos no es solo interfaz: ya existe persistencia, control de acceso por roles, trazabilidad por auditoria y operaciones CRUD sobre facturas.`
- `Las integraciones cloud definitivas y los criterios de industrializacion quedan planificados para las siguientes iteraciones del release.`

## 8. Verificacion tecnica realizada

Se verifico compilacion del proyecto con:

- `npm run build`

Resultado:

- backend compila correctamente.
- frontend genera build de produccion correctamente.

Esto respalda que el proyecto puede presentarse como una base funcional desplegable en entorno local.
