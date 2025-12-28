# ADR-002: API Response Envelope

## Status
Approved

## Context
El interceptor de axios aplana `response.data.data`, destruyendo metadata como `pagination`. Necesitamos un contrato estable.

## Decision

### Envelope Estándar
Todas las respuestas exitosas siguen este formato:

```json
{
  "success": true,
  "data": <payload>,
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "message": "Operación exitosa"
}
```

- `success`: siempre presente, boolean
- `data`: siempre presente, contiene el payload principal
- `pagination`: opcional, solo en endpoints de listado
- `message`: opcional, para feedback al usuario

### Envelope de Error
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Descripción legible para usuario"
}
```

### Cliente (Frontend)
- **NO** hacer unwrap automático en interceptor
- Proveer helpers explícitos:
  - `unwrapData(response)` → extrae `data`
  - `unwrapPaginated(response)` → retorna `{ data, pagination }`

## Consequences

### Positivas
- Paginación nunca se pierde
- Contratos predecibles
- Helpers explícitos mejoran legibilidad

### Negativas
- Requiere actualizar consumidores existentes
