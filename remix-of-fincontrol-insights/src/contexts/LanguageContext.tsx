import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

// Comprehensive translations for the app
export const translations: Translations = {
  // Navigation
  'nav.home': { en: 'Home', es: 'Inicio' },
  'nav.dashboard': { en: 'Dashboard', es: 'Panel' },
  'nav.transactions': { en: 'Transactions', es: 'Transacciones' },
  'nav.categories': { en: 'Categories', es: 'Categorías' },
  'nav.budget': { en: 'Budget', es: 'Presupuesto' },
  'nav.goals': { en: 'Goals', es: 'Metas' },
  'nav.reports': { en: 'Reports', es: 'Reportes' },
  'nav.settings': { en: 'Settings', es: 'Configuración' },

  // Dashboard
  'dashboard.title': { en: 'Dashboard', es: 'Panel de Control' },
  'dashboard.subtitle': { en: 'Your financial overview at a glance', es: 'Tu resumen financiero de un vistazo' },
  'dashboard.balance': { en: 'Balance', es: 'Saldo' },
  'dashboard.currentBalance': { en: 'Current Balance', es: 'Saldo Actual' },
  'dashboard.totalIncome': { en: 'Total Income', es: 'Ingresos Totales' },
  'dashboard.totalExpenses': { en: 'Total Expenses', es: 'Gastos Totales' },
  'dashboard.savingsRate': { en: 'Savings Rate', es: 'Tasa de Ahorro' },
  'dashboard.recentTransactions': { en: 'Recent Transactions', es: 'Transacciones Recientes' },
  'dashboard.viewAll': { en: 'View All', es: 'Ver Todo' },
  'dashboard.expensesByCategory': { en: 'Expenses by Category', es: 'Gastos por Categoría' },
  'dashboard.balanceOverTime': { en: 'Balance Over Time', es: 'Balance a lo Largo del Tiempo' },
  'dashboard.incomeVsExpenses': { en: 'Income vs Expenses', es: 'Ingresos vs Gastos' },
  'dashboard.vsLastMonth': { en: 'vs last month', es: 'vs mes anterior' },
  'dashboard.fromLastMonth': { en: 'from last month', es: 'desde el mes pasado' },

  // Transactions
  'transactions.title': { en: 'Transactions', es: 'Transacciones' },
  'transactions.subtitle': { en: 'Manage and track all your transactions', es: 'Administra y rastrea todas tus transacciones' },
  'transactions.addTransaction': { en: 'Add Transaction', es: 'Agregar Transacción' },
  'transactions.addRecurring': { en: 'Add Recurring', es: 'Agregar Recurrente' },
  'transactions.recurring': { en: 'Recurring', es: 'Recurrentes' },
  'transactions.all': { en: 'All', es: 'Todas' },
  'transactions.income': { en: 'Income', es: 'Ingresos' },
  'transactions.expense': { en: 'Expense', es: 'Gasto' },
  'transactions.expenses': { en: 'Expenses', es: 'Gastos' },
  'transactions.allCategories': { en: 'All Categories', es: 'Todas las Categorías' },
  'transactions.noTransactions': { en: 'No transactions found', es: 'No se encontraron transacciones' },
  'transactions.date': { en: 'Date', es: 'Fecha' },
  'transactions.description': { en: 'Description', es: 'Descripción' },
  'transactions.category': { en: 'Category', es: 'Categoría' },
  'transactions.amount': { en: 'Amount', es: 'Monto' },
  'transactions.type': { en: 'Type', es: 'Tipo' },
  'transactions.frequency': { en: 'Frequency', es: 'Frecuencia' },
  'transactions.nextDate': { en: 'Next Date', es: 'Próxima Fecha' },
  'transactions.status': { en: 'Status', es: 'Estado' },
  'transactions.active': { en: 'Active', es: 'Activo' },
  'transactions.paused': { en: 'Paused', es: 'Pausado' },
  'transactions.net': { en: 'Net', es: 'Neto' },
  'transactions.split': { en: 'Split', es: 'Dividir' },
  'transactions.splitTransaction': { en: 'Split Transaction', es: 'Dividir Transacción' },
  'transactions.addSplit': { en: 'Add Split', es: 'Agregar División' },
  'transactions.removeSplit': { en: 'Remove', es: 'Eliminar' },
  'transactions.totalSplit': { en: 'Total Split', es: 'Total Dividido' },
  'transactions.remaining': { en: 'Remaining', es: 'Restante' },
  'transactions.updateTransaction': { en: 'Update Transaction', es: 'Actualizar Transacción' },
  'transactions.selectCategory': { en: 'Select category', es: 'Seleccionar categoría' },
  'transactions.currency': { en: 'Currency', es: 'Moneda' },
  'transactions.selectCurrency': { en: 'Select currency', es: 'Seleccionar moneda' },

  // Frequency labels
  'frequency.daily': { en: 'Daily', es: 'Diario' },
  'frequency.weekly': { en: 'Weekly', es: 'Semanal' },
  'frequency.biweekly': { en: 'Every 2 weeks', es: 'Cada 2 semanas' },
  'frequency.monthly': { en: 'Monthly', es: 'Mensual' },
  'frequency.yearly': { en: 'Yearly', es: 'Anual' },

  // Categories
  'categories.title': { en: 'Categories', es: 'Categorías' },
  'categories.subtitle': { en: 'Manage and view your expense categories', es: 'Administra y visualiza tus categorías de gastos' },
  'categories.addCategory': { en: 'Add Category', es: 'Agregar Categoría' },
  'categories.searchCategories': { en: 'Search categories...', es: 'Buscar categorías...' },
  'categories.spendingByCategory': { en: 'Spending by Category', es: 'Gastos por Categoría' },
  'categories.categorySummary': { en: 'Category Summary', es: 'Resumen de Categorías' },
  'categories.allCategories': { en: 'All Categories', es: 'Todas las Categorías' },
  'categories.totalExpenses': { en: 'Total Expenses', es: 'Gastos Totales' },
  'categories.noCategories': { en: 'No categories found', es: 'No se encontraron categorías' },
  'categories.tryDifferent': { en: 'Try a different search term', es: 'Intenta con un término diferente' },
  'categories.of': { en: 'of', es: 'de' },

  // Budget
  'budget.title': { en: 'Budget', es: 'Presupuesto' },
  'budget.subtitle': { en: 'Track your spending limits by category', es: 'Controla tus límites de gasto por categoría' },
  'budget.addBudget': { en: 'Add Budget', es: 'Agregar Presupuesto' },
  'budget.totalBudget': { en: 'Total Budget', es: 'Presupuesto Total' },
  'budget.totalSpent': { en: 'Total Spent', es: 'Total Gastado' },
  'budget.remaining': { en: 'Remaining', es: 'Restante' },
  'budget.monthlyOverview': { en: 'Monthly Budget Overview', es: 'Resumen Mensual de Presupuesto' },
  'budget.categoryBudgets': { en: 'Category Budgets', es: 'Presupuestos por Categoría' },
  'budget.spent': { en: 'spent', es: 'gastado' },
  'budget.left': { en: 'left', es: 'restante' },
  'budget.overBudget': { en: 'Over budget!', es: '¡Sobrepasado!' },
  'budget.ofSpent': { en: 'of', es: 'de' },
  'budget.remainingThisMonth': { en: 'You have {amount} remaining this month', es: 'Te quedan {amount} este mes' },
  'budget.rollover': { en: 'Rollover', es: 'Arrastre' },
  'budget.rolloverEnabled': { en: 'Rollover Enabled', es: 'Arrastre Habilitado' },
  'budget.rolloverDisabled': { en: 'Rollover Disabled', es: 'Arrastre Deshabilitado' },
  'budget.enableRollover': { en: 'Enable rollover for unused budget', es: 'Habilitar arrastre de presupuesto no usado' },
  'budget.rolloverAmount': { en: 'Rollover Amount', es: 'Monto Arrastrado' },
  'budget.createBudget': { en: 'Create Budget', es: 'Crear Presupuesto' },
  'budget.updateBudget': { en: 'Update Budget', es: 'Actualizar Presupuesto' },
  'budget.monthlyLimit': { en: 'Monthly Limit', es: 'Límite Mensual' },

  // Goals
  'goals.title': { en: 'Savings Goals', es: 'Metas de Ahorro' },
  'goals.subtitle': { en: 'Track progress towards your financial goals', es: 'Rastrea el progreso hacia tus metas financieras' },
  'goals.addGoal': { en: 'Add Goal', es: 'Agregar Meta' },
  'goals.totalTarget': { en: 'Total Target', es: 'Objetivo Total' },
  'goals.totalSaved': { en: 'Total Saved', es: 'Total Ahorrado' },
  'goals.goalsCompleted': { en: 'Goals Completed', es: 'Metas Completadas' },
  'goals.overallProgress': { en: 'Overall Progress', es: 'Progreso General' },
  'goals.yourGoals': { en: 'Your Goals', es: 'Tus Metas' },
  'goals.addFunds': { en: 'Add Funds', es: 'Agregar Fondos' },
  'goals.view': { en: 'View', es: 'Ver' },
  'goals.completed': { en: 'Completed!', es: '¡Completado!' },
  'goals.daysLeft': { en: 'days left', es: 'días restantes' },
  'goals.complete': { en: 'complete', es: 'completado' },
  'goals.savedOf': { en: 'saved of', es: 'ahorrado de' },
  'goals.remainingToReach': { en: 'remaining to reach all goals', es: 'restante para alcanzar todas las metas' },
  'goals.of': { en: 'of', es: 'de' },

  // Reports
  'reports.title': { en: 'Reports', es: 'Reportes' },
  'reports.subtitle': { en: 'Analyze your financial data and export reports', es: 'Analiza tus datos financieros y exporta reportes' },
  'reports.overview': { en: 'Overview', es: 'Resumen' },
  'reports.categories': { en: 'Categories', es: 'Categorías' },
  'reports.trends': { en: 'Trends', es: 'Tendencias' },
  'reports.netSavings': { en: 'Net Savings', es: 'Ahorro Neto' },
  'reports.categoryBreakdown': { en: 'Category Breakdown', es: 'Desglose por Categoría' },
  'reports.expensesForPeriod': { en: 'Expenses by category for the selected period', es: 'Gastos por categoría para el período seleccionado' },
  'reports.monthlyComparison': { en: 'Monthly Comparison', es: 'Comparación Mensual' },
  'reports.incomeVsExpenses': { en: 'Income vs Expenses over time', es: 'Ingresos vs Gastos a lo largo del tiempo' },
  'reports.showingTransactions': { en: 'Showing {count} transactions in selected period', es: 'Mostrando {count} transacciones en el período seleccionado' },
  'reports.exportTransactions': { en: 'Export Transactions', es: 'Exportar Transacciones' },
  'reports.export': { en: 'Export', es: 'Exportar' },
  'reports.transactions': { en: 'Transactions', es: 'Transacciones' },
  'reports.summaryReport': { en: 'Summary Report', es: 'Reporte Resumen' },
  'reports.exportPDF': { en: 'Export PDF', es: 'Exportar PDF' },
  'reports.generatePDF': { en: 'Generate PDF Report', es: 'Generar Reporte PDF' },
  'reports.totalIncome': { en: 'Total Income', es: 'Total de Ingresos' },
  'reports.totalExpenses': { en: 'Total Expenses', es: 'Total de Gastos' },
  'reports.netBalance': { en: 'Net Balance', es: 'Balance Neto' },
  'reports.savingsRate': { en: 'Savings Rate', es: 'Tasa de Ahorro' },
  'reports.spendingByCategory': { en: 'Spending by Category', es: 'Gastos por Categoría' },
  'reports.periodSummary': { en: 'Summary of the selected period', es: 'Resumen del período seleccionado' },
  'reports.balanceOverTime': { en: 'Balance Over Time', es: 'Balance a través del tiempo' },
  'reports.trackProgress': { en: 'Track your financial progress', es: 'Rastrea tu progreso financiero' },
  'reports.exportStarted': { en: 'Export Started', es: 'Exportación iniciada' },

  // Settings
  'settings.title': { en: 'Settings', es: 'Configuración' },
  'settings.subtitle': { en: 'Manage your account and app preferences', es: 'Administra tu cuenta y preferencias de la app' },
  'settings.profile': { en: 'Profile', es: 'Perfil' },
  'settings.personalInfo': { en: 'Your personal information', es: 'Tu información personal' },
  'settings.changePhoto': { en: 'Change Photo', es: 'Cambiar Foto' },
  'settings.firstName': { en: 'First Name', es: 'Nombre' },
  'settings.lastName': { en: 'Last Name', es: 'Apellido' },
  'settings.email': { en: 'Email', es: 'Correo Electrónico' },
  'settings.appearance': { en: 'Appearance', es: 'Apariencia' },
  'settings.customizeLook': { en: 'Customize how the app looks', es: 'Personaliza cómo se ve la app' },
  'settings.theme': { en: 'Theme', es: 'Tema' },
  'settings.selectTheme': { en: 'Select your preferred theme', es: 'Selecciona tu tema preferido' },
  'settings.light': { en: 'Light', es: 'Claro' },
  'settings.dark': { en: 'Dark', es: 'Oscuro' },
  'settings.system': { en: 'System', es: 'Sistema' },
  'settings.currency': { en: 'Currency', es: 'Moneda' },
  'settings.setCurrency': { en: 'Set your default currency', es: 'Establece tu moneda predeterminada' },
  'settings.language': { en: 'Language', es: 'Idioma' },
  'settings.setLanguage': { en: 'Set your preferred language', es: 'Establece tu idioma preferido' },
  'settings.notifications': { en: 'Notifications', es: 'Notificaciones' },
  'settings.configureNotifications': { en: 'Configure how you receive notifications', es: 'Configura cómo recibes notificaciones' },
  'settings.pushNotifications': { en: 'Browser Push Notifications', es: 'Notificaciones del Navegador' },
  'settings.pushDescription': { en: 'Receive instant notifications in your browser for critical alerts', es: 'Recibe notificaciones instantáneas en tu navegador para alertas críticas' },
  'settings.emailNotifications': { en: 'Email Notifications', es: 'Notificaciones por Correo' },
  'settings.emailDescription': { en: 'Receive notifications via email', es: 'Recibe notificaciones por correo electrónico' },
  'settings.soundSettings': { en: 'Notification Sounds', es: 'Sonidos de Notificación' },
  'settings.soundDescription': { en: 'Play sound effects when notifications appear', es: 'Reproducir sonidos cuando aparecen notificaciones' },
  'settings.volume': { en: 'Volume', es: 'Volumen' },
  'settings.testInfo': { en: 'Test Info', es: 'Probar Info' },
  'settings.testWarning': { en: 'Test Warning', es: 'Probar Alerta' },
  'settings.testSuccess': { en: 'Test Success', es: 'Probar Éxito' },
  'settings.alertTypes': { en: 'Alert Types', es: 'Tipos de Alerta' },
  'settings.budgetAlerts': { en: 'Budget Alerts', es: 'Alertas de Presupuesto' },
  'settings.budgetAlertsDescription': { en: 'Get notified when nearing budget limits', es: 'Recibe notificaciones cuando te acerques a los límites' },
  'settings.alertThreshold': { en: 'Alert threshold', es: 'Umbral de alerta' },
  'settings.alertWhenSpending': { en: 'Alert when spending reaches {threshold}% of budget', es: 'Alertar cuando el gasto alcance {threshold}% del presupuesto' },
  'settings.billReminders': { en: 'Bill Reminders', es: 'Recordatorios de Facturas' },
  'settings.billRemindersDescription': { en: 'Get reminded of upcoming bills', es: 'Recibe recordatorios de facturas próximas' },
  'settings.remindMe': { en: 'Remind me', es: 'Recordarme' },
  'settings.daysBefore': { en: 'days before', es: 'días antes' },
  'settings.goalUpdates': { en: 'Goal Updates', es: 'Actualizaciones de Metas' },
  'settings.goalUpdatesDescription': { en: 'Progress milestones and deadline reminders', es: 'Hitos de progreso y recordatorios de fecha límite' },
  'settings.weeklyReport': { en: 'Weekly Report', es: 'Reporte Semanal' },
  'settings.weeklyReportDescription': { en: 'Receive weekly spending summary', es: 'Recibe resumen semanal de gastos' },
  'settings.security': { en: 'Security', es: 'Seguridad' },
  'settings.securityDescription': { en: 'Manage your security settings', es: 'Administra tu configuración de seguridad' },
  'settings.password': { en: 'Password', es: 'Contraseña' },
  'settings.changePassword': { en: 'Change Password', es: 'Cambiar Contraseña' },
  'settings.twoFactor': { en: 'Two-Factor Authentication', es: 'Autenticación de Dos Factores' },
  'settings.twoFactorDescription': { en: 'Add an extra layer of security', es: 'Añade una capa extra de seguridad' },
  'settings.enable': { en: 'Enable', es: 'Habilitar' },
  'settings.saveSettings': { en: 'Save Settings', es: 'Guardar Configuración' },
  'settings.enabled': { en: 'Enabled', es: 'Habilitado' },
  'settings.blocked': { en: 'Blocked', es: 'Bloqueado' },
  'settings.notSet': { en: 'Not set', es: 'No establecido' },

  // Common actions
  'common.add': { en: 'Add', es: 'Agregar' },
  'common.edit': { en: 'Edit', es: 'Editar' },
  'common.delete': { en: 'Delete', es: 'Eliminar' },
  'common.save': { en: 'Save', es: 'Guardar' },
  'common.cancel': { en: 'Cancel', es: 'Cancelar' },
  'common.confirm': { en: 'Confirm', es: 'Confirmar' },
  'common.close': { en: 'Close', es: 'Cerrar' },
  'common.search': { en: 'Search', es: 'Buscar' },
  'common.filter': { en: 'Filter', es: 'Filtrar' },
  'common.export': { en: 'Export', es: 'Exportar' },
  'common.loading': { en: 'Loading...', es: 'Cargando...' },
  'common.noData': { en: 'No data available', es: 'Sin datos disponibles' },
  'common.error': { en: 'Error', es: 'Error' },
  'common.success': { en: 'Success', es: 'Éxito' },
  'common.warning': { en: 'Warning', es: 'Advertencia' },
  'common.info': { en: 'Information', es: 'Información' },

  // Form placeholders and labels
  'transactions.selectType': { en: 'Select type', es: 'Seleccionar tipo' },
  'transactions.descriptionPlaceholder': { en: 'What was this for?', es: '¿Para qué fue esto?' },
  'transactions.pickDate': { en: 'Pick a date', es: 'Seleccionar fecha' },
  'recurring.selectFrequency': { en: 'Select frequency', es: 'Seleccionar frecuencia' },
  'category.namePlaceholder': { en: 'e.g., Groceries', es: 'Ej., Supermercado' },
  'category.selectIcon': { en: 'Select an icon', es: 'Seleccionar ícono' },
  'category.selectColor': { en: 'Select a color', es: 'Seleccionar color' },
  'goals.namePlaceholder': { en: 'e.g., Emergency Fund', es: 'Ej., Fondo de Emergencia' },
  'goals.amountPlaceholder': { en: 'Add amount', es: 'Agregar monto' },
  'goals.notePlaceholder': { en: 'e.g., Monthly savings contribution', es: 'Ej., Contribución mensual de ahorro' },
  'common.additionalNotes': { en: 'Additional notes...', es: 'Notas adicionales...' },

  // Pro tip
  'proTip.title': { en: 'Pro Tip', es: 'Consejo Pro' },
  'proTip.message': { en: 'Set up recurring transactions to save time tracking your expenses.', es: 'Configura transacciones recurrentes para ahorrar tiempo rastreando tus gastos.' },

  // Empty states
  'empty.noTransactions': { en: 'No transactions yet', es: 'Sin transacciones aún' },
  'empty.noTransactionsDesc': { en: 'Start tracking your finances by adding your first transaction.', es: 'Comienza a rastrear tus finanzas agregando tu primera transacción.' },
  'empty.noGoals': { en: 'No goals yet', es: 'Sin metas aún' },
  'empty.noGoalsDesc': { en: 'Set your first savings goal and start building your future.', es: 'Establece tu primera meta de ahorro y comienza a construir tu futuro.' },
  'empty.noBudgets': { en: 'No budgets yet', es: 'Sin presupuestos aún' },
  'empty.noBudgetsDesc': { en: 'Create budgets to track your spending by category.', es: 'Crea presupuestos para rastrear tus gastos por categoría.' },
  'empty.noCategories': { en: 'No categories yet', es: 'Sin categorías aún' },
  'empty.noCategoriesDesc': { en: 'Add categories to organize your transactions.', es: 'Agrega categorías para organizar tus transacciones.' },
  'empty.noRecurring': { en: 'No recurring transactions', es: 'Sin transacciones recurrentes' },
  'empty.noRecurringDesc': { en: 'Create one to automate your regular bills and income', es: 'Crea una para automatizar tus facturas e ingresos regulares' },

  // Search
  'search.placeholder': { en: 'Search transactions...', es: 'Buscar transacciones...' },
  'search.global': { en: 'Search everything...', es: 'Buscar todo...' },
  'search.noResults': { en: 'No results found', es: 'No se encontraron resultados' },
  'search.transactions': { en: 'Transactions', es: 'Transacciones' },
  'search.categories': { en: 'Categories', es: 'Categorías' },
  'search.budgets': { en: 'Budgets', es: 'Presupuestos' },
  'search.goals': { en: 'Goals', es: 'Metas' },
  'search.pages': { en: 'Pages', es: 'Páginas' },

  // Calendar
  'calendar.title': { en: 'Bill Calendar', es: 'Calendario de Facturas' },
  'calendar.subtitle': { en: 'View your upcoming bills', es: 'Ve tus próximas facturas' },
  'calendar.today': { en: 'Today', es: 'Hoy' },
  'calendar.noBills': { en: 'No bills this month', es: 'Sin facturas este mes' },
  'calendar.dueToday': { en: 'Due Today', es: 'Vence Hoy' },
  'calendar.upcoming': { en: 'Upcoming', es: 'Próximas' },
  'calendar.overdue': { en: 'Overdue', es: 'Vencidas' },

  // Toasts
  'toast.transactionAdded': { en: 'Transaction Added', es: 'Transacción Agregada' },
  'toast.transactionUpdated': { en: 'Transaction Updated', es: 'Transacción Actualizada' },
  'toast.transactionDeleted': { en: 'Transaction Deleted', es: 'Transacción Eliminada' },
  'toast.budgetCreated': { en: 'Budget Created', es: 'Presupuesto Creado' },
  'toast.budgetUpdated': { en: 'Budget Updated', es: 'Presupuesto Actualizado' },
  'toast.budgetDeleted': { en: 'Budget Deleted', es: 'Presupuesto Eliminado' },
  'toast.goalCreated': { en: 'Goal Created', es: 'Meta Creada' },
  'toast.goalUpdated': { en: 'Goal Updated', es: 'Meta Actualizada' },
  'toast.fundsAdded': { en: 'Funds Added', es: 'Fondos Agregados' },
  'toast.categoryCreated': { en: 'Category Created', es: 'Categoría Creada' },
  'toast.categoryUpdated': { en: 'Category Updated', es: 'Categoría Actualizada' },
  'toast.categoryDeleted': { en: 'Category Deleted', es: 'Categoría Eliminada' },
  'toast.settingsSaved': { en: 'Settings saved', es: 'Configuración guardada' },
  'toast.exportComplete': { en: 'Export Complete', es: 'Exportación Completa' },
  'toast.pdfGenerated': { en: 'PDF Generated', es: 'PDF Generado' },
  'toast.recurringCreated': { en: 'Recurring Transaction Created', es: 'Transacción Recurrente Creada' },
  'toast.recurringUpdated': { en: 'Recurring Transaction Updated', es: 'Transacción Recurrente Actualizada' },
  'toast.recurringDeleted': { en: 'Recurring Transaction Deleted', es: 'Transacción Recurrente Eliminada' },
  'toast.paused': { en: 'Paused', es: 'Pausado' },
  'toast.resumed': { en: 'Resumed', es: 'Reanudado' },
  'toast.goalDeleted': { en: 'Goal Deleted', es: 'Meta Eliminada' },

  // Goal Detail
  'goalDetail.backToGoals': { en: 'Back to Goals', es: 'Volver a Metas' },
  'goalDetail.goalNotFound': { en: 'Goal not found', es: 'Meta no encontrada' },
  'goalDetail.deadline': { en: 'Deadline', es: 'Fecha Límite' },
  'goalDetail.addFunds': { en: 'Add Funds', es: 'Agregar Fondos' },
  'goalDetail.edit': { en: 'Edit', es: 'Editar' },
  'goalDetail.delete': { en: 'Delete', es: 'Eliminar' },
  'goalDetail.ofTarget': { en: 'of {target} target', es: 'de {target} objetivo' },
  'goalDetail.daysLeft': { en: '{days} days left', es: '{days} días restantes' },
  'goalDetail.daysRemaining': { en: '{days} days remaining', es: '{days} días restantes' },
  'goalDetail.complete': { en: '{percent}% complete', es: '{percent}% completado' },
  'goalDetail.remaining': { en: '{amount} remaining', es: '{amount} restante' },
  'goalDetail.created': { en: 'Created', es: 'Creado' },
  'goalDetail.totalContributions': { en: 'Total Contributions', es: 'Total de Contribuciones' },
  'goalDetail.contributionHistory': { en: 'Contribution History', es: 'Historial de Contribuciones' },
  'goalDetail.noContributions': { en: 'No contributions yet. Add funds to start tracking!', es: 'Sin contribuciones aún. ¡Agrega fondos para empezar a rastrear!' },
  'goalDetail.runningTotal': { en: 'Running Total', es: 'Total Acumulado' },
  'goalDetail.note': { en: 'Note', es: 'Nota' },
  'goalDetail.editGoal': { en: 'Edit Goal', es: 'Editar Meta' },
  'goalDetail.addFundsTo': { en: 'Add Funds to {name}', es: 'Agregar Fondos a {name}' },
  'goalDetail.deleteGoal': { en: 'Delete Goal', es: 'Eliminar Meta' },
  'goalDetail.deleteConfirmation': { en: 'Are you sure you want to delete "{name}"? This will remove all contribution history. This action cannot be undone.', es: '¿Estás seguro de que quieres eliminar "{name}"? Esto eliminará todo el historial de contribuciones. Esta acción no se puede deshacer.' },

  // Transactions page specific
  'transactions.newTransaction': { en: 'New Transaction', es: 'Nueva Transacción' },
  'transactions.newRecurring': { en: 'New Recurring Transaction', es: 'Nueva Transacción Recurrente' },
  'transactions.recurringTransactions': { en: 'Recurring Transactions', es: 'Transacciones Recurrentes' },
  'transactions.editTransaction': { en: 'Edit Transaction', es: 'Editar Transacción' },
  'transactions.editRecurring': { en: 'Edit Recurring Transaction', es: 'Editar Transacción Recurrente' },
  'transactions.deleteTransaction': { en: 'Delete Transaction', es: 'Eliminar Transacción' },
  'transactions.deleteRecurring': { en: 'Delete Recurring Transaction', es: 'Eliminar Transacción Recurrente' },
  'transactions.deleteConfirmation': { en: 'Are you sure you want to delete this transaction? This action cannot be undone.', es: '¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.' },
  'transactions.deleteRecurringConfirmation': { en: 'Are you sure you want to delete "{name}"? This will stop all future occurrences.', es: '¿Estás seguro de que quieres eliminar "{name}"? Esto detendrá todas las ocurrencias futuras.' },
  'transactions.willRepeat': { en: '{name} will repeat {frequency}.', es: '{name} se repetirá {frequency}.' },
  'transactions.hasBeenPaused': { en: '{name} has been paused.', es: '{name} ha sido pausado.' },
  'transactions.hasBeenResumed': { en: '{name} has been resumed.', es: '{name} ha sido reanudado.' },
  'transactions.incomeOf': { en: 'Income of {amount} added.', es: 'Ingreso de {amount} agregado.' },
  'transactions.expenseOf': { en: 'Expense of {amount} added.', es: 'Gasto de {amount} agregado.' },
  'transactions.hasBeenUpdated': { en: 'The transaction has been updated.', es: 'La transacción ha sido actualizada.' },
  'transactions.hasBeenRemoved': { en: 'The transaction has been removed.', es: 'La transacción ha sido eliminada.' },
  'transactions.recurringHasBeenUpdated': { en: 'The recurring transaction has been updated.', es: 'La transacción recurrente ha sido actualizada.' },
  'transactions.recurringHasBeenRemoved': { en: 'The recurring transaction has been removed.', es: 'La transacción recurrente ha sido eliminada.' },
  'transactions.pause': { en: 'Pause', es: 'Pausar' },
  'transactions.resume': { en: 'Resume', es: 'Reanudar' },

  // Dual Currency
  'currency.bcvRate': { en: 'BCV Rate', es: 'Tasa BCV' },
  'currency.incomeUSD': { en: 'Income USD', es: 'Ingresos USD' },
  'currency.incomeVES': { en: 'Income VES', es: 'Ingresos VES' },
  'currency.expensesUSD': { en: 'Expenses USD', es: 'Gastos USD' },
  'currency.expensesVES': { en: 'Expenses VES', es: 'Gastos VES' },
  'currency.equivalent': { en: 'Equivalent to', es: 'Equivalente a' },
  'currency.estimatedVES': { en: 'Estimated in Bolivars', es: 'Estimado en Bolívares' },
  'currency.noCategory': { en: 'Uncategorized', es: 'Sin Categoría' },

  // Error messages
  'error.transactionCreate': { en: 'Could not create transaction', es: 'No se pudo crear la transacción' },
  'error.transactionUpdate': { en: 'Could not update transaction', es: 'No se pudo actualizar la transacción' },
  'error.transactionDelete': { en: 'Could not delete transaction', es: 'No se pudo eliminar la transacción' },
  'error.loadProfile': { en: 'Failed to load profile', es: 'Error al cargar perfil' },
  'error.invalidCredentials': { en: 'Invalid credentials', es: 'Credenciales inválidas' },

  // Notifications
  'notifications.pushEnabled': { en: 'Push notifications enabled', es: 'Notificaciones push habilitadas' },
  'notifications.pushEnabledDesc': { en: 'You will now receive browser notifications for important alerts.', es: 'Ahora recibirás notificaciones del navegador para alertas importantes.' },
  'notifications.permissionDenied': { en: 'Permission denied', es: 'Permiso denegado' },
  'notifications.permissionDeniedDesc': { en: 'Please enable notifications in your browser settings.', es: 'Por favor habilita las notificaciones en la configuración de tu navegador.' },

  // Budget errors
  'error.categoryNotFound': { en: 'Category not found', es: 'Categoría no encontrada' },
  'error.budgetCreate': { en: 'Could not create budget', es: 'No se pudo crear el presupuesto' },
  'error.budgetUpdate': { en: 'Could not update budget', es: 'No se pudo actualizar el presupuesto' },
  'error.budgetDelete': { en: 'Could not delete budget', es: 'No se pudo eliminar el presupuesto' },

  // Goals errors  
  'error.goalCreate': { en: 'Could not create goal', es: 'No se pudo crear la meta' },
  'error.goalUpdate': { en: 'Could not update goal', es: 'No se pudo actualizar la meta' },
  'error.goalDelete': { en: 'Could not delete goal', es: 'No se pudo eliminar la meta' },
  'error.fundsAdd': { en: 'Could not add funds', es: 'No se pudo agregar fondos' },

  // Category errors  
  'error.categoryCreate': { en: 'Could not create category', es: 'No se pudo crear la categoría' },
  'error.categoryUpdate': { en: 'Could not update category', es: 'No se pudo actualizar la categoría' },
  'error.categoryDelete': { en: 'Could not delete category', es: 'No se pudo eliminar la categoría' },

  // Reports
  'reports.noExpensesInPeriod': { en: 'No expenses in the selected period', es: 'No hay gastos en el período seleccionado' },
  'reports.exportingFormat': { en: 'Exporting report in {format} format...', es: 'Exportando reporte en formato {format}...' },

  // Settings additional
  'settings.saved': { en: 'Settings saved', es: 'Configuración guardada' },
  'settings.saveFailed': { en: 'Could not save settings', es: 'No se pudo guardar la configuración' },
  'settings.profileDescription': { en: 'Your personal information', es: 'Tu información personal' },

  // Auth
  'auth.logout': { en: 'Log out', es: 'Cerrar Sesión' },
  'auth.login': { en: 'Sign In', es: 'Iniciar Sesión' },
  'auth.register': { en: 'Sign Up', es: 'Registrarse' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    let text = translation[language] || translation.en || key;

    // Replace parameters like {amount}, {count}, etc.
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(`{${param}}`, String(value));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
