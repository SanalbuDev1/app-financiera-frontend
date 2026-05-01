# App Financiera — Contexto para GitHub Copilot

> Leer este archivo al inicio de cada sesión para retomar el trabajo donde se dejó.

---

## Stack tecnológico

| Tecnología | Versión / Detalle |
|---|---|
| Angular | 21 — standalone components, signals |
| Rendering | SSR habilitado |
| Estilos | SCSS puro, sin librerías UI externas |
| Auth | JWT propio (NO Azure AD) |
| Backend | Java Spring Boot (pendiente) — actualmente mocks |
| Roles | `ADMIN` \| `USER` |

---

## Arquitectura: Hexagonal

```
Dominio  →  Aplicación  →  Infraestructura  ←→  Features (UI)
```

- **Dominio**: modelos puros + interfaces (ports). Sin dependencias de Angular.
- **Aplicación**: use cases + estado global. Solo depende del dominio.
- **Infraestructura**: adaptadores concretos (mock/Java), guards, tokens DI.
- **Features**: componentes Angular standalone. Consumen use cases.

---

## Estructura de archivos completa

```
src/app/
├── core/
│   └── auth/
│       ├── domain/
│       │   ├── models/
│       │   │   ├── user.model.ts            interface User { id, email, name, role, token }
│       │   │   └── user-role.model.ts       enum UserRole { ADMIN = 'ADMIN', USER = 'USER' }
│       │   └── ports/
│       │       └── auth.port.ts             interfaces: LoginCredentials, RegisterCredentials, AuthPort
│       │                                    AuthPort: login(), register(), logout()
│       ├── application/
│       │   ├── services/
│       │   │   └── auth-state.service.ts    providedIn: 'root'
│       │   │                                signals: currentUser, isAuthenticated, userRole
│       │   │                                métodos: setCurrentUser(), clearCurrentUser()
│       │   └── use-cases/
│       │       ├── login.use-case.ts        Injectable() — provisto en login.routes.ts
│       │       └── register.use-case.ts     Injectable() — provisto en register.routes.ts
│       └── infrastructure/
│           ├── tokens/
│           │   └── auth.token.ts            InjectionToken<AuthPort>('AUTH_PORT')
│           ├── adapters/
│           │   └── mock-auth.adapter.ts     implements AuthPort
│           │                                MOCK_USERS array en memoria
│           │                                login(): busca por email+password, delay 600ms
│           │                                register(): valida email único, asigna UserRole.USER siempre
│           │                                logout(): pendiente implementar
│           └── guards/
│               ├── auth.guard.ts            CanActivateFn → redirige /login si !isAuthenticated()
│               └── role.guard.ts            roleGuard(role: UserRole): CanActivateFn
│                                            → redirige /dashboard si rol no coincide
├── features/
│   ├── login/
│   │   ├── login.component.ts               Reactive forms, signals, RouterLink
│   │   ├── login.component.html             Form + hint de credenciales demo
│   │   ├── login.component.scss             SCSS puro, gradiente azul oscuro
│   │   └── login.routes.ts                  providers: [LoginUseCase]
│   ├── register/
│   │   ├── register.component.ts            Reactive forms + validador cross-field passwordMatch
│   │   ├── register.component.html          4 campos: name, email, password, confirmPassword
│   │   ├── register.component.scss          Mismo diseño que login
│   │   └── register.routes.ts               providers: [RegisterUseCase]
│   ├── dashboard/
│   │   └── dashboard.component.ts           STUB — pendiente desarrollar
│   └── admin/
│       └── admin.component.ts               STUB — pendiente desarrollar
├── app.routes.ts                            Ver sección Rutas abajo
├── app.config.ts                            Ver sección DI abajo
├── app.html                                 Solo contiene: <router-outlet />
└── app.ts                                   AppComponent estándar con RouterOutlet
```

---

## Rutas (`app.routes.ts`)

```typescript
/login      → loginRoutes      (lazy, público)
/register   → registerRoutes   (lazy, público)
/dashboard  → DashboardComponent (lazy, canActivate: [authGuard])
/admin      → AdminComponent     (lazy, canActivate: [authGuard])  ← falta agregar roleGuard
''          → redirectTo: 'login'
'**'        → redirectTo: 'login'
```

> **PENDIENTE**: agregar `roleGuard(UserRole.ADMIN)` en la ruta `/admin`

---

## Inyección de dependencias (`app.config.ts`)

```typescript
providers: [
  provideBrowserGlobalErrorListeners(),
  provideRouter(routes),
  provideClientHydration(withEventReplay()),
  { provide: AUTH_PORT, useClass: MockAuthAdapter },  // ← swap a JavaAuthAdapter cuando esté listo
]
```

---

## Credenciales mock (MockAuthAdapter)

| Email | Password | Rol | Redirige a |
|---|---|---|---|
| admin@financiera.com | admin123 | ADMIN | /admin |
| user@financiera.com | user123 | USER | /dashboard |
| Nuevo registro | cualquiera | USER | /dashboard |

---

## Estado del token (situación actual)

- El token es un string falso hardcodeado: `'mock-jwt-admin-token'`
- Vive únicamente en memoria RAM (Angular signal)
- **Se pierde al refrescar el navegador (F5)** → el usuario vuelve al login
- NO hay persistencia en `localStorage` todavía

---

## Flujo de autenticación

```
[LoginComponent]
    └─ onSubmit()
        └─ LoginUseCase.execute(credentials)
            ├─ AUTH_PORT.login(credentials)       ← MockAuthAdapter / futuro JavaAuthAdapter
            └─ AuthStateService.setCurrentUser()  ← signal actualizado
                └─ Router.navigate(['/admin' | '/dashboard'])

[Guard — authGuard]
    └─ authState.isAuthenticated()  → true: deja pasar / false: redirige /login

[Guard — roleGuard(UserRole.ADMIN)]
    └─ authState.userRole() === ADMIN  → true: deja pasar / false: redirige /dashboard
```

---

## Convenciones del proyecto

1. **Use cases** → `@Injectable()` sin `providedIn`. Se proveen en el archivo de rutas de cada feature.
2. **AuthStateService** → `providedIn: 'root'` (estado global, singleton).
3. **Ports** → siempre interfaces TypeScript puras en `domain/ports/`.
4. **Adaptadores** → implementan el port, viven en `infrastructure/adapters/`.
5. **Para cambiar de mock a Java** → solo cambiar `useClass` en `app.config.ts`.
6. **Estilos** → SCSS puro, gradiente `#0f172a → #1e293b → #0c2340`, azul primario `#3b82f6`.

---

## Próximos pasos (en orden de prioridad)

- [ ] **1. Persistencia de sesión** — guardar/leer token en `localStorage` para sobrevivir F5
- [ ] **2. Logout** — limpiar `AuthStateService` + `localStorage` + navegar a `/login`
- [ ] **3. roleGuard en /admin** — agregar `canActivate: [authGuard, roleGuard(UserRole.ADMIN)]`
- [ ] **4. Dashboard completo** — layout con navbar, info del usuario, accesos rápidos
- [ ] **5. Admin completo** — gestión de usuarios, tabla con roles
- [ ] **6. JavaAuthAdapter** — implementar `AuthPort` con `HttpClient` → `POST /api/auth/login`
- [ ] **7. Interceptor HTTP** — adjuntar JWT en headers de todas las peticiones autenticadas

---

## Comando para iniciar

```bash
cd c:\Estudio2026\finanzas\app-financiera
npm start
# → http://localhost:4200  (redirige automáticamente a /login)
```
