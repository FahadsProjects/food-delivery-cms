# Food Delivery CMS API

Production-ready serverless CMS API for food delivery apps. Deployed as a single Lambda function, integrating with API Gateway and DynamoDB provisioned via Terraform.

## Project Structure

```
src/
  handlers/     # Lambda handlers per route
  services/     # DynamoDB, response, validation
  types/        # TypeScript types
  index.ts      # Entry point & routing
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CONTENT_TABLE_NAME` | DynamoDB table name (required) |
| `ENVIRONMENT` | Environment label, e.g. `production`, `staging` (default: `production`) |

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/config?app=` | Public | Fetch published config by app |
| POST | `/admin/config` | Admin | Create config item |
| PUT | `/admin/config/{key}` | Admin | Update config item |
| DELETE | `/admin/config/{key}` | Admin | Delete config item |

### GET /config

- **Query:** `app=customer|driver|restaurant|admin`
- **Headers:** `Cache-Control: public, max-age=300`
- Returns nested JSON grouped by screen.

### Admin Endpoints

- Require JWT with `role === "admin"` in `requestContext.authorizer.claims`
- **POST:** Body `{ app, screen, key, value, type }`
- **PUT:** Path `{key}`, Query `app`, `screen`, Body `{ value, type }`
- **DELETE:** Path `{key}`, Query `app`, `screen`

## Validation

- **key, screen:** `/^[a-z0-9_]+$/`
- **value:** Max 10KB
- **type:** `text` | `image` | `json`

## DynamoDB Schema

- **pk:** `APP#<app>`
- **sk:** `ENV#<environment>#SCREEN#<screen>#KEY#<key>`
- **Filter:** `status = "published"`

## Scripts

```bash
npm run build   # Bundle to dist/index.js
npm run dev     # Type-check + watch build
npm run lint    # ESLint
```

## Deployment

1. Build: `npm run build`
2. Deploy `dist/index.js` as Lambda handler (Node.js 20+)
3. Wire API Gateway routes to the same Lambda
4. Set `CONTENT_TABLE_NAME` and `ENVIRONMENT` in Lambda config
