# All in One API

Backend Node/Express + Knex/MySQL para el marketplace All in One.

## Inicio rápido

```bash
npm install
cp .env.example .env   # configurar variables
npm start
```

## Despliegue en producción

Tras `git pull` en el servidor:

```bash
cd ~/software/all-in-one-api
npm install
npm run migrate:coupons    # tabla coupons + columnas shopping_car
npm run promote:admin -- tu@email.com   # opcional: promover admin
pm2 restart api
```

Verificar que la API responde y que el panel admin puede listar cupones.

Luego desplegar el frontend (`npm run build`) con `VUE_APP_API` apuntando a la API.

## Migraciones (BD legacy)

Si la BD existía antes de Knex **no uses** `npx knex migrate:latest` directo: fallará con `Table 'users' already exists`.

```bash
npm run migrate:prod
```

Equivale a:

```bash
npm run migrate:baseline   # marca migraciones antiguas como ya aplicadas
npm run migrate            # ejecuta solo las nuevas (idempotentes)
```

Para facturación (tablas `billing_settings` + `invoice_data`):

```bash
npm run migrate:billing
```

Scripts disponibles:
| Script | Descripción |
|--------|-------------|
| `npm run migrate:prod` | Baseline + migrate:latest (recomendado en servidor) |
| `npm run migrate` | Knex migrate:latest |
| `npm run migrate:baseline` | Marca migraciones históricas como aplicadas |
| `npm run migrate:billing` | Crea/verifica billing_settings e invoice_data |
| `npm run migrate:favorites` | Crea tabla user_favorites |
| `npm run migrate:coupons` | Crea tabla coupons + columnas en shopping_car + cupones demo |
| `npm run promote:admin` | Promueve un usuario a administrador (`-- email@...`) |

## Seguridad

- JWT en header `authorization`
- Rutas protegidas: shoppingcar, favorites, order_history
- Middleware: `app/middleware/auth.js`

## Variables de entorno clave

Ver `.env` para:
- `DB_*` — MySQL
- `JWT_SECRET_KEY`
- `PAYURLBTN`, `PAYTOKENBTN`, `PAYURLBTNCONFIRM`
- `PAYPHONE_STORE_ID` (Identificador de sucursal en Payphone Developer; obligatorio en Prepare)
- `PAYPHONE_RESPONSE_URL`, `FRONTEND_URL`
- `SENDMAILTOKEN`, `SENDMAIL_SENDER_EMAIL`, `SENDMAIL_SENDER_NAME`, `ADMIN_EMAILS`, `MAIL_BRAND_NAME` — Brevo (remitente debe estar validado en el panel)
- `ORDER_EMAIL_DEBUG=1` — logs de envío de correo (`0` para desactivar)
- `URLAPIFELECTRONICA`, `PATHCOMPROBANTE`, `PATHJASPER`

## Documentación de flujos

Ver también: [FLUJOS.md](../allinone/docs/FLUJOS.md) en el repo frontend.
