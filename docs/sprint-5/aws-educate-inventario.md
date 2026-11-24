# Inventario AWS Educate — spike X-01 (SBC-66)

Fecha: 2026-11-06  
Cuenta: AWS Educate estudiante (número **no** publicado)  
Usuario IAM: enmascarado  
Región: `us-east-2`  
Tipo: cuenta **estudiante estándar** (no lab Vocareum).

**PLAN_A_EC2** (respaldo PLAN_B_RENDER).

| Servicio | ¿Disponible? | Evidencia | Consecuencia |
|---|---|---|---|
| STS / identidad | **Sí** | `aws sts get-caller-identity` OK (cuenta y ARN omitidos del repo) | CLI usable |
| Textract | **No** (dato previo) | Educate: no disponible | OCR local |
| Titan Embed Text v2 | **Sí** ON_DEMAND | `amazon.titan-embed-text-v2:0` | US-04 |
| Bedrock generación TEXT | **Sí** ON_DEMAND | `amazon.nova-lite-v1:0` (+ perfil `us.amazon.nova-lite-v1:0` ACTIVE) | RAG Nova Lite o degradado extractivo |
| Perfiles de inferencia | **Sí** | Lista ACTIVE (Nova, Claude, Llama, …) | Cohere embed v4 solo con perfil; no se usa |
| S3 | **Sí** | Bucket de prueba creado, objeto subido y **todo borrado** | TK-04 puede usar S3 o volumen |
| Lightsail | No elegido | Sin rol IAM en la instancia (CLI) | Descartado frente a EC2 |
| EC2 | **Sí — PLAN_A** | Prueba manual: **t3.small**, Docker corre. RAM 2 GiB (spec). Costo USD/mes: **pendiente** | TK-04 publica aquí |
| Rol IAM en Lightsail | **No** | API sin instance profile | — |
| Rol IAM en EC2 | **Sí** | `--iam-instance-profile` | Bedrock sin keys en disco |
