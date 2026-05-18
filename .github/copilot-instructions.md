# Copilot Instructions — App Financiera (Frontend Angular)

## Stack

- **Angular 21** — standalone components, signals, computed(), SSR habilitado
- **Estilos** — SCSS puro con CSS custom properties (temas claro/oscuro), sin librerías UI externas
- **Auth** — JWT propio (NO Azure AD). Persistencia en `localStorage` (SSR-safe)
- **Backend** — Java Spring Boot + WebFlux en `http://localhost:9000` (dev) / Azure Container Apps (prod)
- **Adaptador activo** — `JavaAuthAdapter` (swap a `MockAuthAdapter` cambiando `useClass` en `app.config.ts`)
- **PWA** — `@angular/service-worker` habilitado en producción
- **Roles** — `ADMIN` | `USER`
- **Deploy** — Azure Static Web Apps (CSR) + GitHub Actions CI/CD
- **Repo** — `SanalbuDev1/app-financiera-frontend` (rama `master`)

---

## Arquitectura Hexagonal

```
Dominio  →  Aplicación  →  Infraestructura  ←→  Features (UI)
```

| Capa | Responsabilidad | Ubicación |
|---|---|---|
| **Domain** | Modelos puros + interfaces (ports). Sin dependencias de Angular | `core/auth/domain/` |
| **Application** | Use cases + estado global (signals). Solo depende del dominio | `core/auth/application/` |
| **Infrastructure** | Adaptadores concretos, guards, tokens DI | `core/auth/infrastructure/` |
| **Features** | Componentes Angular standalone. Consumen use cases | `features/` |

---

## Estructura de archivos

```
src/app/
├── core/
│   ├── auth/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── user.model.ts          interface User { id, email, name, role, token }
│   │   │   │   └── user-role.model.ts     enum UserRole { ADMIN = 'ADMIN', USER = 'USER' }
│   │   │   └── ports/
│   │   │       └── auth.port.ts           LoginCredentials, RegisterCredentials, AuthPort
│   │   │                                  AuthPort: login(), register(), logout()
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   └── auth-state.service.ts  providedIn: 'root'
│   │   │   │                              signals: currentUser, isAuthenticated, userRole
│   │   │   │                              Persiste en localStorage (SSR-safe)
│   │   │   └── use-cases/
│   │   │       ├── login.use-case.ts      @Injectable() — provisto en login.routes.ts
│   │   │       └── register.use-case.ts   @Injectable() — provisto en register.routes.ts
│   │   └── infrastructure/
│   │       ├── tokens/
│   │       │   └── auth.token.ts          InjectionToken<AuthPort>('AUTH_PORT')
│   │       ├── adapters/
│   │       │   ├── mock-auth.adapter.ts   implements AuthPort (desarrollo local)
│   │       │   └── java-auth.adapter.ts   implements AuthPort (backend real)
│   │       └── guards/
│   │           ├── auth.guard.ts          CanActivateFn → redirige /login si !isAuthenticated
│   │           └── role.guard.ts          roleGuard(role: UserRole): CanActivateFn
│   ├── finances/
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── transaction.model.ts   Transaction, TransactionType, TransactionCategory,
│   │   │   │   │                          CATEGORY_ICONS, getCategoryIcon()
│   │   │   │   │                          ⚠ icon NO se guarda en BD, se deriva de category
│   │   │   │   ├── summary.model.ts       FinancialSummary
│   │   │   │   └── budget.model.ts        Budget
│   │   │   └── ports/
│   │   │       └── transaction.port.ts    TransactionPort, TransactionFilter,
│   │   │                                  PaginatedResponse<T>, CreateTransactionDto, UpdateTransactionDto
│   │   │                                  Métodos: getAll(), getAllNoPagination(), getSummary(), create(), update(), delete()
│   │   ├── application/
│   │   │   ├── services/
│   │   │   │   └── transaction-state.service.ts  providedIn: 'root'
│   │   │   │                              signals: transactions, totalElements, totalPages,
│   │   │   │                              currentPage, summary, loading, error
│   │   │   │                              computed: hasData
│   │   │   └── use-cases/
│   │   │       ├── list-transactions.use-case.ts    @Injectable() — provisto en dashboard.routes.ts
│   │   │       ├── create-transaction.use-case.ts   @Injectable() — provisto en dashboard.routes.ts
│   │   │       ├── update-transaction.use-case.ts   @Injectable() — provisto en dashboard.routes.ts
│   │   │       ├── delete-transaction.use-case.ts   @Injectable() — provisto en dashboard.routes.ts
│   │   │       └── get-summary.use-case.ts          @Injectable() — provisto en dashboard.routes.ts
│   │   └── infrastructure/
│   │       ├── tokens/
│   │       │   └── transaction.token.ts   InjectionToken<TransactionPort>('TRANSACTION_PORT')
│   │       └── adapters/
│   │           ├── mock-transaction.adapter.ts  implements TransactionPort (32 tx mock, delay 400ms)
│   │           └── java-transaction.adapter.ts  implements TransactionPort (HttpClient → /api/transactions)
│   └── debts/
│       ├── domain/
│       │   ├── models/
│       │   │   └── debt.model.ts          Debt, DebtScheduleItem, DebtPayment, DebtSummary, DebtDetail
│       │   │                              CreateDebtRequest, UpdateDebtRequest, RegisterPaymentRequest
│       │   │                              DEBT_TYPES[], DEBT_FREQUENCIES[], getDebtTypeIcon(), calculateInstallment()
│       │   └── ports/
│       │       └── debt.port.ts           DebtPort: getAll(), getDetail(), getSummary(), create(), update(), delete(),
│       │                                  registerPayment(), getSchedule()
│       ├── application/
│       │   ├── services/
│       │   │   └── debt-state.service.ts  providedIn: 'root'
│       │   │                              signals: debts, summary, currentDetail, loading, error
│       │   │                              computed: hasData
│       │   └── use-cases/
│       │       ├── list-debts.use-case.ts           @Injectable() — provisto en debts.routes.ts
│       │       ├── get-debt-detail.use-case.ts      @Injectable() — provisto en debts.routes.ts
│       │       ├── get-debt-summary.use-case.ts     @Injectable() — provisto en debts.routes.ts
│       │       ├── create-debt.use-case.ts          @Injectable() — provisto en debts.routes.ts
│       │       ├── update-debt.use-case.ts          @Injectable() — provisto en debts.routes.ts
│       │       ├── delete-debt.use-case.ts          @Injectable() — provisto en debts.routes.ts
│       │       └── register-payment.use-case.ts     @Injectable() — provisto en debts.routes.ts
│       └── infrastructure/
│           ├── tokens/
│           │   └── debt.token.ts          InjectionToken<DebtPort>('DEBT_PORT')
│           └── adapters/
│               └── java-debt.adapter.ts   implements DebtPort (HttpClient → /api/debts)
├── features/
│   ├── login/
│   │   ├── login.component.ts             Reactive forms, signals, RouterLink
│   │   ├── login.component.html
│   │   ├── login.component.scss
│   │   └── login.routes.ts                providers: [LoginUseCase]
│   ├── register/
│   │   ├── register.component.ts          Reactive forms + validador cross-field passwordMatch
│   │   ├── register.component.html        4 campos: name, email, password, confirmPassword
│   │   ├── register.component.scss
│   │   └── register.routes.ts             providers: [RegisterUseCase]
│   ├── dashboard/
│   │   ├── dashboard.component.ts         Dashboard financiero completo (ver sección abajo)
│   │   ├── dashboard.component.html
│   │   ├── dashboard.component.scss       Tema dual con CSS custom properties
│   │   ├── dashboard.routes.ts            dashboardRoutes (loadChildren)
│   │   ├── income-modal/
│   │   │   ├── income-modal.component.ts  Modal de ingreso/edición (@Input transaction, ReactiveFormsModule)
│   │   │   ├── income-modal.component.html
│   │   │   └── income-modal.component.scss
│   │   └── expense-modal/
│   │       ├── expense-modal.component.ts Modal de gasto/edición (@Input transaction, ReactiveFormsModule)
│   │       ├── expense-modal.component.html
│   │       └── expense-modal.component.scss
│   ├── debts/
│   │   ├── debts-shell.component.ts       Shell con sidebar + router-outlet (tema claro/oscuro, nav items)
│   │   ├── debts-shell.component.html
│   │   ├── debts-shell.component.scss     CSS custom properties (misma paleta que dashboard)
│   │   ├── debts.routes.ts               debtsRoutes — shell con children: list + detail
│   │   ├── debt-list/
│   │   │   ├── debt-list.component.ts     Lista de deudas: summary cards, filtros, grid de tarjetas, FAB
│   │   │   ├── debt-list.component.html
│   │   │   └── debt-list.component.scss
│   │   ├── debt-detail/
│   │   │   ├── debt-detail.component.ts   Detalle: hero card, tabla amortización, edición inline, confirmación eliminar
│   │   │   ├── debt-detail.component.html
│   │   │   └── debt-detail.component.scss
│   │   ├── create-debt-modal/
│   │   │   ├── create-debt-modal.component.ts  10 campos + preview cuota en tiempo real (fórmula francesa)
│   │   │   ├── create-debt-modal.component.html
│   │   │   └── create-debt-modal.component.scss
│   │   └── register-payment-modal/
│   │       ├── register-payment-modal.component.ts  Regular/Extra, @Input debtId, nextInstallment
│   │       ├── register-payment-modal.component.html
│   │       └── register-payment-modal.component.scss
│   └── admin/
│       └── admin.component.ts             STUB — pendiente desarrollar
├── app.routes.ts
├── app.config.ts
├── app.config.server.ts
├── app.routes.server.ts                    RenderMode.Client (CSR para Azure SWA)
├── app.html                               Solo contiene: <router-outlet />
└── app.ts

src/environments/
├── environment.ts                         apiUrl: http://localhost:9000 (dev)
└── environment.prod.ts                    apiUrl: https://finanzas-app.wittywave-bcfc6077.eastus.azurecontainerapps.io (prod)

public/
└── staticwebapp.config.json               SPA fallback + security headers

.github/workflows/
└── deploy-frontend.yml                    CI/CD → Azure Static Web Apps
```

---

## Rutas (`app.routes.ts`)

```
/login      → loginRoutes            (loadChildren, público)
/register   → registerRoutes         (loadChildren, público)
/dashboard  → dashboardRoutes        (loadChildren, canActivate: [authGuard])
/debts      → debtsRoutes            (loadChildren, canActivate: [authGuard])  shell + children
/debts/:id  → DebtDetailComponent    (child de debtsRoutes)
/admin      → AdminComponent         (loadComponent, canActivate: [authGuard])  ← pendiente: agregar roleGuard
''          → redirectTo: 'login'
'**'        → redirectTo: 'login'
```

---

## Inyección de dependencias (`app.config.ts`)

```typescript
providers: [
  provideBrowserGlobalErrorListeners(),
  provideRouter(routes),
  provideClientHydration(withEventReplay()),
  provideHttpClient(withFetch()),
  { provide: AUTH_PORT, useClass: JavaAuthAdapter },                  // swap a MockAuthAdapter para dev sin backend
  { provide: TRANSACTION_PORT, useClass: JavaTransactionAdapter },    // swap a MockTransactionAdapter para dev sin backend
  { provide: DEBT_PORT, useClass: JavaDebtAdapter },                  // adaptador de deudas
  provideServiceWorker('ngsw-worker.js', {
    enabled: !isDevMode(),
    registrationStrategy: 'registerWhenStable:30000',
  }),
]
```

---

## Convenciones — SIEMPRE respetar

1. **Use cases** → `@Injectable()` sin `providedIn`. Se proveen en el archivo de rutas de cada feature.
2. **AuthStateService** → `providedIn: 'root'` (singleton global).
3. **Ports** → siempre interfaces TypeScript puras en `domain/ports/`. Sin dependencias de Angular.
4. **Adaptadores** → implementan el port, viven en `infrastructure/adapters/`.
5. **Componentes** → siempre standalone. Nunca NgModules.
6. **Estado** → usar signals de Angular (`signal()`, `computed()`). Nunca RxJS BehaviorSubject para estado.
7. **Formularios** → Reactive Forms (`FormBuilder`, `Validators`). Nunca template-driven.
8. **Para cambiar de mock a Java** → solo cambiar `useClass` en `app.config.ts`. No tocar use cases ni components.
9. **Documentación y logs** → toda clase e inyectable debe tener JSDoc en la clase y en cada método. Usar `console.log('[ClassName] methodName()')` para trazabilidad en desarrollo. Errores con `console.warn()`.
10. **Colores** → siempre usar CSS custom properties (`var(--nombre)`). Nunca colores hardcodeados en componentes.
11. **Layout** → sidebar sticky (`position: sticky; top: 0; height: 100vh`), topbar sticky (`position: sticky; top: 0`).
12. **Modales** → se abren/cierran con signals booleanos. Emiten `saved` y `closed` events. Usan CSS vars del tema.

---

## Sistema de temas (Claro / Oscuro)

El tema se controla con la clase `.dark` en `.dashboard-shell`. Todas las pantallas **deben** usar CSS custom properties para colores, nunca valores hardcodeados.

### Cómo funciona

```html
<div class="dashboard-shell" [class.dark]="isDarkTheme()">
```

- `isDarkTheme` es un `signal<boolean>` en `DashboardComponent`
- Se alterna con `toggleTheme()` desde el sidebar footer
- El sidebar siempre usa colores oscuros (`--bg-sidebar: #0D1B2A`)

### Variables CSS — Tema claro (default)

```scss
.dashboard-shell {
  --bg-main:         #F5F7FA;
  --bg-card:         #FFFFFF;
  --bg-sidebar:      #0D1B2A;
  --border:          #E2E8F0;
  --shadow-card:     0 1px 4px rgba(27, 38, 59, 0.07);

  --text-primary:    #1B263B;
  --text-secondary:  #64748B;
  --text-muted:      #94A3B8;

  --btn-bg:          #FFFFFF;
  --btn-border:      #E2E8F0;
  --btn-hover:       #F1F5F9;

  --color-blue:      #3B82F6;
  --color-green:     #10B981;
  --color-red:       #EF4444;
  --color-yellow:    #F59E0B;
  --color-purple:    #8B5CF6;
  --color-teal:      #06B6D4;
}
```

### Variables CSS — Tema oscuro (override)

```scss
.dashboard-shell.dark {
  --bg-main:         #0D1B2A;
  --bg-card:         #1B263B;
  --border:          rgba(255, 255, 255, 0.08);
  --shadow-card:     0 2px 8px rgba(0, 0, 0, 0.35);

  --text-primary:    #F5F7FA;
  --text-secondary:  #94A3B8;
  --text-muted:      #64748B;

  --btn-bg:          rgba(255, 255, 255, 0.07);
  --btn-border:      rgba(255, 255, 255, 0.1);
  --btn-hover:       rgba(255, 255, 255, 0.14);
}
```

### Regla para nuevos componentes/pantallas

- **Siempre** usar `var(--bg-card)`, `var(--text-primary)`, `var(--border)`, etc.
- **Nunca** usar colores como `#FFFFFF`, `#1B263B`, `#F5F7FA` directamente en SCSS
- Los modales heredan las variables del `dashboard-shell` padre
- Para inputs: `background: var(--btn-bg); border: 1px solid var(--btn-border); color: var(--text-primary);`
- Para focus: `border-color: var(--color-blue);` (o `--color-red` para gastos)
- Los colores de acento (`--color-blue`, `--color-green`, `--color-red`, etc.) NO cambian entre temas

---

## Dashboard — Estructura completa

### Layout

```
.dashboard-shell (flex row)
├── .sidebar (220px, sticky, siempre oscuro)
│   ├── Brand: logo SVG + "App" (gradiente) + "FINANCIERA" (blanco)
│   ├── Nav: Inicio, Ingresos, Gastos, Presupuestos, Reportes
│   └── Footer: toggle tema (☀️/🌙) + logout
├── .dashboard (flex: 1, scroll principal)
│   ├── .topbar (sticky, hamburguesa + saludo + logout móvil)
│   ├── .month-selector (botones Enero–mes actual, recarga summary + donut + categorías)
│   ├── .summary-cards (grid auto-fit: balance, ingresos, gastos, ahorro)
│   ├── .mid-row (grid: gráfico barras 6 meses + donut chart gastos por categoría)
│   ├── .bottom-row (grid: transacciones paginadas + gastos por categoría)
│   └── .fab (botón flotante "+" abajo-derecha)
├── <app-income-modal> (condicional @if isIncomeModalOpen)
└── <app-expense-modal> (condicional @if isExpenseModalOpen)
```

### Signals del Dashboard

| Signal | Tipo | Descripción |
|---|---|---|
| `summary` | `signal<FinancialSummary>` | Balance, ingresos, gastos, ahorro, meta |
| `transactions` | `signal<Transaction[]>` | Transacciones de la página actual |
| `filterDateFrom` | `signal<string>` | Filtro fecha desde |
| `filterDateTo` | `signal<string>` | Filtro fecha hasta |
| `txPage` | `signal<number>` | Página actual transacciones |
| `isDarkTheme` | `signal<boolean>` | Tema claro/oscuro |
| `isSidebarOpen` | `signal<boolean>` | Sidebar móvil |
| `isIncomeModalOpen` | `signal<boolean>` | Modal ingreso |
| `isExpenseModalOpen` | `signal<boolean>` | Modal gasto |
| `editingTransaction` | `signal<Transaction \| null>` | Transacción en edición (null = crear) |
| `selectedMonth` | `signal<number>` | Mes seleccionado (0-based, default: mes actual) |
| `selectedYear` | `signal<number>` | Año seleccionado (default: año actual) |

### Computed del Dashboard

| Computed | Retorna |
|---|---|
| `monthlyChart` | Ingresos vs gastos de los últimos 6 meses (desde allTransactions) |
| `topCategories` | Top 5 categorías de gasto del mes seleccionado (desde allTransactions) |
| `monthlyExpenseTotal` | Total gastado en el mes seleccionado (para porcentajes en topCategories) |
| `donutSegments` | Segmentos SVG del donut chart (path, color, label, icon, total, pct) |
| `monthButtons` | Botones de meses disponibles: enero → mes actual |
| `txTotalPages` | Total de páginas (`Math.ceil(filtered / 15)`) |
| `paginatedTransactions` | Transacciones de la página actual (server-side) |

### Modales

| Modal | Selector | Categorías | Acento | Botón |
|---|---|---|---|---|
| **IncomeModal** | `app-income-modal` | Salario, Freelance, Inversión, Ahorros, Otro | `--color-blue` | `.btn--primary` (azul) |
| **ExpenseModal** | `app-expense-modal` | Comida, Transporte, Cuentas, Ocio, Salud, Educación, Compras, Otro | `--color-red` | `.btn--danger` (rojo) |

Ambos reciben `@Input() transaction` (null = crear, Transaction = editar).
Ambos emiten: `(saved)="onXxxSaved($event)"` y `(closed)="onXxxModalClosed()"`.

---

## Logo

- Archivo: `public/logo.svg`
- Diseño: 3 barras ascendentes (gris/verde/azul) + línea de tendencia con flecha
- Se usa en el sidebar brand: `<img src="logo.svg">`

---

## Credenciales mock

| Email | Password | Rol | Redirige a |
|---|---|---|---|
| admin@financiera.com | admin123 | ADMIN | /admin |
| user@financiera.com | user123 | USER | /dashboard |
| Nuevo registro | cualquiera | USER | /dashboard |

---

## Flujo de autenticación

```
[LoginComponent]
    └─ onSubmit()
        └─ LoginUseCase.execute(credentials)
            ├─ AUTH_PORT.login(credentials)          ← JavaAuthAdapter / MockAuthAdapter
            └─ AuthStateService.setCurrentUser()     ← signal + localStorage
                └─ Router.navigate(['/admin' | '/dashboard'])
```

### Estado del token

- Token JWT real del backend (o mock hardcodeado con `MockAuthAdapter`)
- Persistido en `localStorage` (SSR-safe con `isPlatformBrowser`)
- `AuthStateService.clearCurrentUser()` limpia signal + localStorage
- Al refrescar (F5), `AuthStateService` lee `localStorage` y restaura sesión

---

## Contrato con el backend

### Auth
```
POST /api/auth/login
  body:    { email, password }
  200 OK:  { id, email, name, role: 'ADMIN'|'USER', token }
  401:     credenciales inválidas

POST /api/auth/register
  body:    { email, password, name }
  201:     { id, email, name, role: 'USER', token }
  409:     email ya existe
```

### Transacciones
```
GET /api/transactions?from=&to=&type=&page=0&size=15
  200 OK:  { content: Transaction[], totalElements, totalPages, page, size }

GET /api/transactions/summary?month=4&year=2026
  200 OK:  { totalBalance, monthlyIncome, monthlyExpenses, monthlySavings, savingsGoal }

POST /api/transactions
  body:    { description, amount, category, type: 'income'|'expense', transactionDate, notes? }
  201:     Transaction creada

PUT /api/transactions/:id
  body:    { description, amount, category, type, transactionDate, notes? }
  200 OK:  Transaction actualizada
  404:     no encontrada

DELETE /api/transactions/:id
  204:     eliminada
  404:     no encontrada
```

### Nota: `transactionDate` vs `date`
- Al **enviar** (POST/PUT request): el campo se llama **`transactionDate`**
- Al **recibir** (todas las responses): el campo llega como **`date`** (el backend usa `@JsonProperty("date")`)

### Valores válidos para enums
- **`type`**: `income`, `expense`
- **`category`**: `food`, `transport`, `entertainment`, `health`, `education`, `shopping`, `bills`, `salary`, `freelance`, `investment`, `savings`, `other`

### Tabla SQL — transactions
```sql
CREATE TABLE IF NOT EXISTS transactions (
    id                VARCHAR(36)    PRIMARY KEY,
    user_id           VARCHAR(36)    NOT NULL REFERENCES users(id),
    description       VARCHAR(255)   NOT NULL,
    amount            DECIMAL(12,2)  NOT NULL CHECK (amount > 0),
    category          VARCHAR(50)    NOT NULL,
    type              VARCHAR(10)    NOT NULL CHECK (type IN ('income', 'expense')),
    transaction_date  DATE           NOT NULL,
    notes             VARCHAR(500),
    created_at        TIMESTAMP      DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions (type);
```

### Deudas
```
GET  /api/debts                      200: Debt[]
GET  /api/debts?status=active        200: Debt[] (filtrado)
GET  /api/debts/summary              200: DebtSummary
GET  /api/debts/{id}                 200: DebtDetail { debt, schedule[] }
POST /api/debts                      body: CreateDebtRequest → 201: Debt
PUT  /api/debts/{id}                 body: { creditor, description, notes? } → 200: Debt
DELETE /api/debts/{id}               204

POST /api/debts/{id}/payments        body: RegisterPaymentRequest → 201: DebtPayment
GET  /api/debts/{id}/schedule        200: DebtScheduleItem[]
```

#### Tipos válidos para deudas
- **`debtTypeId`**: `debt-type-credit-card`, `debt-type-bank-loan`, `debt-type-vehicle`, `debt-type-mortgage`, `debt-type-informal`, `debt-type-other`
- **`frequencyId`**: `freq-monthly`, `freq-biweekly`
- **`interestRateType`**: `monthly`, `annual`
- **`status`**: `active`, `paid_off`, `defaulted`
- **`paymentType`**: `regular`, `extra`
- **`extraPaymentStrategy`**: `reduce_installment`, `reduce_term`
- **Nota**: Para pagos `regular`, el backend ignora `totalAmount` y usa el monto del cronograma; enviar igual para pasar `@NotNull`.

---

## Despliegue — Azure Static Web Apps

### URLs

| Entorno | URL |
|---|---|
| **Frontend (prod)** | `https://jolly-cliff-02e08840f.7.azurestaticapps.net` |
| **Backend (prod)** | `https://finanzas-app.wittywave-bcfc6077.eastus.azurecontainerapps.io` |
| **Frontend (dev)** | `http://localhost:4200` (ng serve) |
| **Backend (dev)** | `http://localhost:9000` |

### Infraestructura Azure

| Recurso | Nombre | Resource Group |
|---|---|---|
| Static Web App | `finanzas-frontend` | `rg-finanzas` |
| Container App (backend) | `finanzas-app` | `rg-finanzas` |

### CI/CD — GitHub Actions

- **Archivo:** `.github/workflows/deploy-frontend.yml`
- **Trigger:** push a `master` o PR contra `master`
- **Pasos:** checkout → setup Node 20 → `npm ci` → `ng build --configuration production` → renombrar `index.csr.html` → `index.html` → deploy con `Azure/static-web-apps-deploy@v1`
- **Secret requerido:** `AZURE_STATIC_WEB_APPS_API_TOKEN`

### Cómo obtener el secret

```bash
az staticwebapp secrets list --name finanzas-frontend --resource-group rg-finanzas --query "properties.apiKey" -o tsv
```

Luego configurar en GitHub: **Settings → Secrets and variables → Actions → `AZURE_STATIC_WEB_APPS_API_TOKEN`**

### Environments Angular

| Archivo | `apiUrl` | Usado en |
|---|---|---|
| `src/environments/environment.ts` | `http://localhost:9000` | `ng serve` (dev) |
| `src/environments/environment.prod.ts` | URL backend Azure | `ng build --configuration production` |

- `angular.json` tiene `fileReplacements` en config `production` para swapear `environment.ts` → `environment.prod.ts`
- Los adaptadores (`JavaAuthAdapter`, `JavaTransactionAdapter`) usan `environment.apiUrl` como base URL

### staticwebapp.config.json

- Ubicación: `public/staticwebapp.config.json` (se copia al output en build)
- SPA fallback: todas las rutas redirigen a `index.html` (excepto assets estáticos)
- Headers de seguridad: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

### Nota sobre SSR vs CSR

- `angular.json` usa `"outputMode": "static"` en producción (genera HTML estático client-side)
- `app.routes.server.ts` usa `RenderMode.Client` (sin prerendering)
- Azure Static Web Apps solo sirve archivos estáticos — no soporta el servidor Node.js de SSR
- SSR con `ng serve` sigue funcionando en desarrollo local
- Para SSR en producción, sería necesario migrar a Azure App Service o Azure Container Apps

---

## Próximos pasos

- [ ] **1. roleGuard en /admin** — `canActivate: [authGuard, roleGuard(UserRole.ADMIN)]`
- [ ] **2. Admin completo** — gestión de usuarios, tabla con roles
- [ ] **3. Conectar presupuestos a backend real** — actualmente no hay endpoint de presupuestos
- [ ] **4. Mock adapter para deudas** — `MockDebtAdapter` para desarrollo sin backend
- [x] JavaAuthAdapter implementado
- [x] Persistencia de sesión (localStorage + SSR-safe)
- [x] Logout funcional
- [x] Dashboard completo con sidebar, cards, gráficos, transacciones
- [x] Income modal + Expense modal
- [x] Sistema de temas claro/oscuro con CSS custom properties
- [x] PWA con Service Worker
- [x] Filtro de fechas + paginación en transacciones
- [x] CRUD completo de transacciones (crear, editar, eliminar) conectado a backend real
- [x] UpdateTransactionUseCase + PUT /api/transactions/:id
- [x] Modales con modo edición (@Input transaction)
- [x] Botones editar/eliminar en cada fila de transacción
- [x] Gráfico de barras conectado a datos reales (allTransactions)
- [x] Sección "Gastos por categoría" reemplazó presupuestos mock
- [x] Summary cards con íconos
- [x] Interceptor HTTP — adjunta JWT en headers de todas las peticiones autenticadas
- [x] Deploy a Azure Static Web Apps con CI/CD (GitHub Actions)
- [x] Environments Angular (dev/prod) con `fileReplacements`
- [x] Módulo completo de Deudas (hexagonal: domain, application, infrastructure, features)
- [x] JavaDebtAdapter implementado (GET/POST/PUT/DELETE /api/debts + /api/debts/{id}/payments)
- [x] DebtStateService con signals (debts, summary, currentDetail, loading, error)
- [x] DebtListComponent — summary cards, filtros por estado, grid de tarjetas, FAB
- [x] DebtDetailComponent — hero card, barra de progreso, tabla de amortización, acciones
- [x] CreateDebtModalComponent — 10 campos + preview cuota en tiempo real (fórmula francesa)
- [x] RegisterPaymentModalComponent — tipo regular/extra, estrategia de abono
- [x] Edición y eliminación de deudas (modales inline en DebtDetailComponent)
- [x] Ítem "Deudas 🏦" en el sidebar del Dashboard y del DebtShell
- [x] Adaptadores usan `environment.apiUrl` (no más localhost hardcodeado)
- [x] `staticwebapp.config.json` para SPA fallback routing

---

## Regla de auto-actualización

> **IMPORTANTE:** Cada vez que se realice un cambio estructural en el proyecto, Copilot **DEBE** actualizar este archivo (`copilot-instructions.md`) para reflejar el estado actual. Esto incluye:

1. **Nuevos archivos o carpetas** → Actualizar el árbol en "Estructura de archivos".
2. **Nuevas rutas** → Actualizar la sección "Rutas (`app.routes.ts`)".
3. **Nuevos modelos, ports o adaptadores** → Documentarlos en la capa correspondiente (Domain / Application / Infrastructure).
4. **Nuevos componentes o features** → Agregar su sección con layout, signals, computed y convenciones relevantes.
5. **Nuevos providers o tokens DI** → Actualizar la sección "Inyección de dependencias (`app.config.ts`)".
6. **Nuevas variables CSS** → Documentarlas en "Sistema de temas".
7. **Nuevos endpoints del backend** → Actualizar "Contrato con el backend".
8. **Tareas completadas o nuevas** → Mover ítems a `[x]` o agregar nuevos `[ ]` en "Próximos pasos".
9. **Cambios en convenciones** → Actualizar la sección "Convenciones — SIEMPRE respetar".

### Cuándo actualizar

- Al **crear** un nuevo componente, servicio, use case, adaptador, guard, interceptor o modelo.
- Al **modificar** rutas, providers, contratos de API o estructura de carpetas.
- Al **eliminar** archivos o funcionalidades.
- Al **completar** un ítem de "Próximos pasos".

### Formato

- Mantener el mismo estilo Markdown y tablas existentes.
- Ser conciso: una línea por archivo nuevo, una fila por ruta/signal/endpoint nuevo.
- No duplicar información que ya esté documentada en otro lugar del archivo.
