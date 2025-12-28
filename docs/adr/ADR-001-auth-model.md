# ADR-001: Authentication Model

## Status
Approved

## Context
La aplicación requiere autenticación persistente con refresh silencioso. Los tokens JWT tradicionales en localStorage son vulnerables a XSS.

## Decision

### Access Token
- JWT con expiración de 15 minutos
- Almacenado en `localStorage` como `finance_token`
- Enviado en header `Authorization: Bearer <token>`

### Refresh Token
- JWT con expiración de 7 días
- Almacenado **SOLO** en cookie httpOnly (nunca en localStorage)
- Configuración cookie:
  - `httpOnly: true`
  - `secure: true` (producción)
  - `sameSite: 'strict'`
- Rotación obligatoria: cada refresh genera nuevo token

### Session Management
- Tabla `Session` en DB almacena hash SHA-256 del refresh token
- Detección de reuso: si token revocado se usa → invalidar todas las sesiones del usuario
- Logout revoca sesión actual en DB

## Consequences

### Positivas
- XSS no puede robar refresh token (httpOnly)
- Rotación detecta tokens comprometidos
- Sesiones rastreables para auditoría

### Negativas
- Complejidad adicional en backend
- Requiere CSRF protection para endpoints cookie-based
