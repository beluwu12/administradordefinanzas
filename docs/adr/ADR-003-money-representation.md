# ADR-003: Money Representation

## Status
Approved

## Context
El código actual usa `parseFloat(amount)` para procesar montos, lo cual introduce errores de precisión de punto flotante (ej. `0.1 + 0.2 !== 0.3`).

## Decision

### Base de Datos (Prisma/PostgreSQL)
- Usar tipo `Decimal` en Prisma
- Mapear a `NUMERIC(19,4)` en PostgreSQL
- 19 dígitos totales, 4 decimales (soporta hasta ~999 trillones)
- Exchange rates: `NUMERIC(19,6)` para mayor precisión

```prisma
model Transaction {
  amount       Decimal  @db.Decimal(19, 4)
  exchangeRate Decimal? @db.Decimal(19, 6)
}
```

### Backend (Node.js)
- Usar `decimal.js` para operaciones aritméticas
- **NUNCA** usar `parseFloat()` para dinero
- API acepta montos como string (ej. `"10.99"`)
- Validar formato y rango antes de procesar

```javascript
const { parseMoney } = require('./utils/money');
const amount = parseMoney(req.body.amount); // Retorna Decimal
```

### Frontend
- Formatear con `Intl.NumberFormat` para display
- Enviar montos como string al API
- No hacer aritmética de dinero en frontend

## Consequences

### Positivas
- Precisión garantizada en operaciones financieras
- Auditoría exacta de balances
- Exportación/importación sin pérdida de datos

### Negativas
- Requiere migración de schema
- Código ligeramente más verboso
