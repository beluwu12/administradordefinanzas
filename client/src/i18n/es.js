export const texts = {
    app: {
        name: "Administrador de Finanzas",
        welcome: "Hola",
        logout: "Cerrar Sesión",
        loading: "Cargando..."
    },
    nav: {
        dashboard: "Inicio",
        transactions: "Movimientos",
        budget: "Presupuesto",
        goals: "Objetivos",
        tags: "Categorías",
        profile: "Perfil"
    },
    dashboard: {
        balance: "Balance Total",
        recentTransactions: "Movimientos Recientes",
        viewAll: "Ver todos",
        quickAdd: "Agregar transacción",
        summary30Days: "Resumen 30 Días",
        income: "Ingresos",
        expense: "Gastos",
        netSavings: "Ahorro Neto",
        topExpenses: "Top Gastos"
    },
    transactions: {
        title: "Transacciones",
        addTitle: "Nueva Transacción",
        editTitle: "Editar Transacción",
        income: "Ingreso",
        expense: "Gasto",
        amount: "Monto",
        description: "Descripción",
        descriptionPlaceholder: "Ej. Compra de supermercado",
        date: "Fecha y Hora",
        category: "Categoría (Opcional)",
        save: "Guardar",
        cancel: "Cancelar",
        delete: "Eliminar",
        confirmDelete: "¿Estás seguro de eliminar esta transacción?",
        source: "Origen (Opcional)",
        exchangeRate: "Tasa de Cambio",
        filters: {
            all: "Todos",
            income: "Ingresos",
            expense: "Gastos"
        }
    },
    budget: {
        title: "Presupuesto Mensual",
        fixedExpenses: "Gastos Fijos",
        addFixed: "Nuevo Gasto Fijo",
        target: "Meta",
        collected: "Recaudado",
        remaining: "Faltante",
        quincenaTitle: "Meta Quincenal",
        quincenaDesc: "Objetivo: 50% de gastos fijos",
        progress: "Progreso",
        insightTitle: "Análisis Mensual",
        incomeAvg: "Ingreso Promedio (30d)",
        fixedTotal: "Total Fijo",
        disposable: "Ingreso Disponible Est.",
        day: "Día"
    },
    tags: {
        title: "Categorías",
        addTitle: "Nueva Categoría",
        name: "Nombre",
        color: "Color",
        create: "Crear",
        noTags: "No hay categorías creadas"
    },
    common: {
        error: "Ha ocurrido un error",
        success: "Operación exitosa",
        seeAll: "Ver todos",
        usd: "USD",
        ves: "VES"
    }
};

// Locale mapping for Intl.NumberFormat
const CURRENCY_LOCALES = {
    USD: 'en-US',
    VES: 'es-VE',
    COP: 'es-CO',
    CLP: 'es-CL',
    MXN: 'es-MX',
    ARS: 'es-AR'
};

/**
 * Format currency using Intl.NumberFormat
 * Handles locale-specific formatting (e.g., CLP has no decimals)
 */
export const formatCurrency = (amount, currency = 'USD', customLocale = null) => {
    const absAmount = Math.abs(amount || 0);
    const locale = customLocale || CURRENCY_LOCALES[currency] || 'es-VE';

    // CLP and COP typically don't use decimal places
    const noDecimalCurrencies = ['CLP'];
    const fractionDigits = noDecimalCurrencies.includes(currency) ? 0 : 2;

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(absAmount);
    } catch (e) {
        // Fallback for unsupported currencies
        return `${currency} ${absAmount.toLocaleString('es-VE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
};

/**
 * Format number without currency symbol
 */
export const formatNumber = (amount, decimals = 2) => {
    return Math.abs(amount || 0).toLocaleString('es-VE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

