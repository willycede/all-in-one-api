# All in One API

Backend Node/Express + Knex/MySQL para el marketplace All in One.

## Inicio rápido

```bash
npm install
cp .env.example .env   # configurar variables
npm start
```

## Migraciones (BD legacy)

Si la BD existía antes de Knex:

```bash
npm run migrate:baseline
npm run migrate:favorites
```

Scripts disponibles:
| Script | Descripción |
|--------|-------------|
| `npm run migrate` | Knex migrate:latest |
| `npm run migrate:baseline` | Marca migraciones históricas como aplicadas |
| `npm run migrate:favorites` | Crea tabla user_favorites |
| `npm run migrate:coupons` | Crea tabla coupons + columnas en shopping_car + cupones demo |

## Seguridad

- JWT en header `authorization`
- Rutas protegidas: shoppingcar, favorites, order_history
- Middleware: `app/middleware/auth.js`

## Variables de entorno clave

Ver `.env` para:
- `DB_*` — MySQL
- `JWT_SECRET_KEY`
- `PAYURLBTN`, `PAYTOKENBTN`, `PAYURLBTNCONFIRM`
- `PAYPHONE_RESPONSE_URL`, `FRONTEND_URL`
- `URLAPIFELECTRONICA`, `PATHCOMPROBANTE`, `PATHJASPER`

## Documentación de flujos

Ver también: [FLUJOS.md](../allinone/docs/FLUJOS.md) en el repo frontend.
