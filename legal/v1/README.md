# Documentos legales (PDF)

Archivos servidos directamente en `http://<api-host>:3500/legal/v1/` y, en producción, vía proxy en:

`GET /api/legal_documents/file/:document_key`

| Archivo | Uso |
|---|---|
| `politica-tratamiento-datos.pdf` | Política de Tratamiento de Datos Personales |
| `consentimiento-tratamiento-datos.pdf` | Consentimiento para el Tratamiento de Datos |

Registro en BD: tabla `legal_documents` (seed `legal_documents_v1.js`).
