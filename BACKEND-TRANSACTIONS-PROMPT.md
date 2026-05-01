# Prompt para Backend — Implementar Módulo de Transacciones

## Contexto

Tenemos un frontend Angular 21 ya conectado y listo esperando estos endpoints. La autenticación JWT (login/register) **ya está implementada** en el backend. Solo falta el módulo de **transacciones**.

- **Stack backend**: Java 17+ / Spring Boot 3.x / WebFlux (reactivo)
- **Base URL**: `http://localhost:9000`
- **El frontend envía**: `Authorization: Bearer <token>` en todas las peticiones a `/api/transactions/**`
- **El backend debe extraer** el `user_id` del JWT (claim `id`) para filtrar/asociar transacciones

---

## Modelo de Base de Datos

El backend usa **tablas maestras normalizadas** para categorías y tipos. La API resuelve los JOINs internamente — el frontend **solo envía y recibe strings** (ej. `"food"`, `"income"`), nunca IDs de FK.

### Tabla `transaction_types`

```sql
CREATE TABLE IF NOT EXISTS transaction_types (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(20) UNIQUE NOT NULL,
    description VARCHAR(100)
);

INSERT INTO transaction_types (id, name, description) VALUES
('type-income',  'income',  'Ingreso'),
('type-expense', 'expense', 'Gasto');
```

### Tabla `categories`

```sql
CREATE TABLE IF NOT EXISTS categories (
    id          VARCHAR(36) PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(100),
    icon        VARCHAR(10),
    active      BOOLEAN DEFAULT TRUE
);

INSERT INTO categories (id, name, description, icon, active) VALUES
('cat-food',          'food',          'Alimentación',    '🍽️', TRUE),
('cat-transport',     'transport',     'Transporte',      '🚌', TRUE),
('cat-housing',       'housing',       'Vivienda',        '🏠', TRUE),
('cat-entertainment', 'entertainment', 'Entretenimiento', '🎬', TRUE),
('cat-health',        'health',        'Salud',           '🏥', TRUE),
('cat-education',     'education',     'Educación',       '📚', TRUE),
('cat-shopping',      'shopping',      'Compras',         '🛍️', TRUE),
('cat-utilities',     'utilities',     'Servicios',       '⚡', TRUE),
('cat-salary',        'salary',        'Salario',         '💰', TRUE),
('cat-investment',    'investment',    'Inversión',       '📈', TRUE),
('cat-freelance',     'freelance',     'Freelance',       '💻', TRUE),
('cat-other',         'other',         'Otro',            '📦', TRUE);
```

### Tabla `transactions`

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id                VARCHAR(36)    PRIMARY KEY,
    user_id           VARCHAR(36)    NOT NULL REFERENCES users(id),
    description       VARCHAR(255)   NOT NULL,
    amount            DECIMAL(12,2)  NOT NULL CHECK (amount > 0),
    category_id       VARCHAR(36)    NOT NULL REFERENCES categories(id),
    type_id           VARCHAR(36)    NOT NULL REFERENCES transaction_types(id),
    transaction_date  DATE           NOT NULL,
    notes             VARCHAR(500),
    created_at        TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions (type_id);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions (category_id);
```

### Relación entre categorías y tipos

| Categoría | Tipo válido |
|---|---|
| `food`, `transport`, `housing`, `entertainment`, `health`, `education`, `shopping`, `utilities` | expense |
| `salary`, `freelance`, `investment` | income |
| `other` | income / expense |

---

## Endpoints a implementar

### 1. GET /api/transactions

Listado paginado con filtros opcionales. **Requiere JWT válido**.

```
GET /api/transactions?from=2026-04-01&to=2026-04-30&type=income&category=salary&page=0&size=15

Response 200:
{
  "content": [
    {
      "id": "uuid-string",
      "description": "Salario mensual",
      "amount": 3500.00,
      "category": "salary",          ← JOIN con categories.name
      "type": "income",              ← JOIN con transaction_types.name
      "date": "2026-04-01",          ← campo transaction_date mapeado como "date"
      "notes": "Pago quincenal",
      "createdAt": "2026-04-01T09:00:00"
    }
  ],
  "totalElements": 45,
  "totalPages": 3,
  "page": 0,
  "size": 15
}
```

**Reglas:**
- Filtrar siempre por `user_id` del JWT
- Todos los query params son **opcionales**
- `page` es **0-indexed**
- Ordenar por `transaction_date DESC`
- `from` y `to` filtran por `transaction_date` (inclusive)
- `type` filtra por `transaction_types.name` (`income` o `expense`)
- `category` filtra por `categories.name`
- Los campos `category` y `type` en el response son **strings** resueltos por JOIN (nunca IDs)
- El campo `transaction_date` se serializa como `"date"` en el JSON response

### 2. GET /api/transactions/summary

Resumen financiero del mes. **Requiere JWT válido**.

```
GET /api/transactions/summary?month=4&year=2026

Response 200:
{
  "totalBalance": 12500.00,
  "monthlyIncome": 4500.00,
  "monthlyExpenses": 2800.00,
  "monthlySavings": 1700.00,
  "savingsGoal": 3000.00
}
```

**Cálculos:**
- `totalBalance` = suma histórica de todos los ingresos - todos los gastos del usuario
- `monthlyIncome` = suma de transacciones type=income del mes/año indicado
- `monthlyExpenses` = suma de transacciones type=expense del mes/año indicado
- `monthlySavings` = monthlyIncome - monthlyExpenses
- `savingsGoal` = valor configurable por usuario (default 3000)

### 3. POST /api/transactions

Crear transacción. **Requiere JWT válido**.

```
POST /api/transactions
Authorization: Bearer <token>
Content-Type: application/json

Request body:
{
  "description": "Compra supermercado",
  "amount": 85.50,
  "category": "food",
  "type": "expense",
  "transactionDate": "2026-04-21",
  "notes": "Compra semanal"          ← opcional, puede ser null
}

Response 201:
{
  "id": "generated-uuid",
  "description": "Compra supermercado",
  "amount": 85.50,
  "category": "food",
  "type": "expense",
  "date": "2026-04-21",
  "notes": "Compra semanal",
  "createdAt": "2026-04-21T10:30:00"
}
```

**Reglas:**
- Asociar `user_id` desde el JWT (no viene en el body)
- Resolver `category` → `category_id` buscando en tabla `categories` por `name`
- Resolver `type` → `type_id` buscando en tabla `transaction_types` por `name`
- Generar `id` (UUID) y `created_at` automáticamente
- Validar: `amount > 0`, `description` no vacía, `category` debe existir en tabla maestra, `type` debe existir
- **Nota**: el campo llega como `transactionDate` en el request pero sale como `date` en el response

### 4. DELETE /api/transactions/{id}

Eliminar transacción. **Requiere JWT válido**.

```
Response 204: eliminada exitosamente (sin body)
Response 404: transacción no encontrada
```

- Solo el dueño (`user_id` del JWT) puede eliminar sus transacciones
- Si el `id` no existe o pertenece a otro usuario → 404

---

## Seguridad

- Endpoints `/api/auth/**` → públicos (ya implementados)
- **Todos los endpoints `/api/transactions/**`** → requieren JWT válido
- El JWT contiene los claims:
  ```json
  {
    "sub": "user@financiera.com",
    "id": "user-uuid",
    "name": "Usuario",
    "role": "USER",
    "iat": ...,
    "exp": ...
  }
  ```
- Extraer `user_id` del claim `id` del JWT
- CORS habilitado para `http://localhost:4200`

---

## Datos seed (para desarrollo)

Insertar ~30 transacciones variadas para el usuario `user@financiera.com` (role USER) en **abril 2026**.

Mezcla de:
- **Ingresos**: salary, freelance, investment, other
- **Gastos**: food, transport, housing, entertainment, health, education, shopping, utilities, other

Ejemplo:
```sql
-- Asumiendo que user_id de user@financiera.com es 'user-uuid'
INSERT INTO transactions (id, user_id, description, amount, category_id, type_id, transaction_date, notes) VALUES
('tx-01', 'user-uuid', 'Salario mensual',      4500.00, 'cat-salary',        'type-income',  '2026-04-01', 'Pago quincenal'),
('tx-02', 'user-uuid', 'Arriendo',             1200.00, 'cat-housing',       'type-expense', '2026-04-02', NULL),
('tx-03', 'user-uuid', 'Mercado semanal',       320.00, 'cat-food',          'type-expense', '2026-04-03', NULL),
('tx-04', 'user-uuid', 'Uber',                   45.00, 'cat-transport',     'type-expense', '2026-04-03', NULL),
('tx-05', 'user-uuid', 'Netflix',                45.00, 'cat-entertainment', 'type-expense', '2026-04-04', NULL),
('tx-06', 'user-uuid', 'Freelance diseño',      800.00, 'cat-freelance',     'type-income',  '2026-04-05', 'Proyecto web'),
('tx-07', 'user-uuid', 'Gasolina',              120.00, 'cat-transport',     'type-expense', '2026-04-05', NULL),
('tx-08', 'user-uuid', 'Luz eléctrica',          85.00, 'cat-utilities',     'type-expense', '2026-04-10', NULL),
('tx-09', 'user-uuid', 'Agua',                   35.00, 'cat-utilities',     'type-expense', '2026-04-11', NULL),
('tx-10', 'user-uuid', 'Internet',               65.00, 'cat-utilities',     'type-expense', '2026-04-11', NULL),
('tx-11', 'user-uuid', 'Dividendos',            350.00, 'cat-investment',    'type-income',  '2026-04-10', 'Rendimiento mensual'),
('tx-12', 'user-uuid', 'Seguro salud',          200.00, 'cat-health',        'type-expense', '2026-04-15', NULL),
('tx-13', 'user-uuid', 'Ropa',                  180.00, 'cat-shopping',      'type-expense', '2026-04-12', NULL),
('tx-14', 'user-uuid', 'Curso online',          120.00, 'cat-education',     'type-expense', '2026-04-14', 'Udemy Angular');
-- ... agregar hasta ~30 transacciones variadas
```

---

## Endpoints opcionales (no bloquean la integración, implementar después)

```
GET /api/transactions/monthly-chart?months=6
  → Para gráfico de barras ingresos vs gastos por mes
  Response 200: [{ "month": "Abr", "income": 4500, "expense": 2800 }, ...]

GET /api/budgets
POST /api/budgets
PUT  /api/budgets/{id}
DELETE /api/budgets/{id}
  → CRUD de presupuestos por categoría
```

---

## Resumen de lo que ya funciona en el frontend

- ✅ Login/Register con JWT → `Authorization: Bearer` se adjunta automáticamente vía interceptor
- ✅ Dashboard llama `GET /api/transactions` y `GET /api/transactions/summary` en `ngOnInit()`
- ✅ Modales de ingreso/gasto llaman `POST /api/transactions` vía `CreateTransactionUseCase`
- ✅ Paginación server-side (page 0-indexed al backend, 1-indexed en UI)
- ✅ Filtros por fecha (from/to) enviados como query params
- ✅ Categorías alineadas con tabla maestra (12 categorías)
- ✅ roleGuard protege `/admin` solo para `ADMIN`

**El frontend está listo. Solo falta implementar estos 4 endpoints en el backend.**
