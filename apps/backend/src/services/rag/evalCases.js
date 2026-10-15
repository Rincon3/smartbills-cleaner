export const RAG_EVAL_CASES = [
  {
    id: "enel-energia",
    question: "Cuanto pague de energia electrica con Enel?",
    relevantCodes: ["DEMO-VEC-05"],
    groundTruth: "El total de energia Enel es 380.800 [Factura DEMO-VEC-05, pág. 2]."
  },
  {
    id: "aguas-nit",
    question: "Cual es el NIT de Aguas de la Sabana?",
    relevantCodes: ["DEMO-VEC-01", "S-FS13928501", "S-FS13928501-1", "S-FS13928501-2"],
    groundTruth: "El NIT de Aguas de la Sabana es 823.004.006-8 [Factura DEMO-VEC-01, pág. 1]."
  },
  {
    id: "papeleria",
    question: "Hay alguna factura de papeleria o utiles de oficina?",
    relevantCodes: ["DEMO-VEC-03"],
    groundTruth: "Sí, Papeleria Mundial por utiles de oficina, total 249.900 [Factura DEMO-VEC-03, pág. 1]."
  },
  {
    id: "claro-plan",
    question: "Cuanto cuesta el plan de telefonia de Claro?",
    relevantCodes: ["DEMO-VEC-02"],
    groundTruth: "El total del plan Claro es 105.910 [Factura DEMO-VEC-02, pág. 2]."
  },
  {
    id: "sin-evidencia",
    question: "Cual es el canon de arriendo de un local en Madrid?",
    relevantCodes: [],
    groundTruth: "No encontré evidencia verificable en las facturas indexadas para responder esa pregunta."
  }
];
