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
        goals: "Objetivos", // Future use
        tags: "Categorías",
        profile: "Perfil"
    },
    dashboard: {
        balance: "Balance Total",
        recentTransactions: "Movimientos Recientes",
        viewAll: "Ver todos",
        quickAdd: "Agregar Rápido",
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
        usd: "USD",
        ves: "VES"
    }
};

export const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
};
