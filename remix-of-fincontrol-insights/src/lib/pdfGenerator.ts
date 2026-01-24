import { format } from 'date-fns';

interface ReportData {
  title: string;
  dateRange: { from: Date; to?: Date };
  stats: {
    income: number;
    expenses: number;
    net: number;
    savingsRate: number;
  };
  categoryData: Array<{ name: string; value: number; color: string }>;
  formatAmount: (value: number) => string;
  language: 'en' | 'es';
}

const translations = {
  en: {
    title: 'Financial Report',
    period: 'Report Period',
    summary: 'Financial Summary',
    income: 'Total Income',
    expenses: 'Total Expenses',
    netSavings: 'Net Savings',
    savingsRate: 'Savings Rate',
    categoryBreakdown: 'Expenses by Category',
    category: 'Category',
    amount: 'Amount',
    percentage: 'Percentage',
    generatedOn: 'Generated on',
    noData: 'No data available',
  },
  es: {
    title: 'Reporte Financiero',
    period: 'Período del Reporte',
    summary: 'Resumen Financiero',
    income: 'Ingresos Totales',
    expenses: 'Gastos Totales',
    netSavings: 'Ahorro Neto',
    savingsRate: 'Tasa de Ahorro',
    categoryBreakdown: 'Gastos por Categoría',
    category: 'Categoría',
    amount: 'Monto',
    percentage: 'Porcentaje',
    generatedOn: 'Generado el',
    noData: 'Sin datos disponibles',
  },
};

export const generatePDFReport = (data: ReportData): void => {
  const t = translations[data.language];
  const totalExpenses = data.categoryData.reduce((sum, c) => sum + c.value, 0);

  // Create HTML content for the PDF
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${t.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px;
      color: #1a1a1a;
      background: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .header h1 {
      font-size: 28px;
      color: #0f172a;
      margin-bottom: 8px;
    }
    .header .period {
      color: #64748b;
      font-size: 14px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }
    .stat-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .stat-card .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: 700;
    }
    .stat-card.income .value { color: #16a34a; }
    .stat-card.expense .value { color: #dc2626; }
    .stat-card.net .value { color: #0f172a; }
    .stat-card.rate .value { color: #7c3aed; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      font-size: 14px;
    }
    .category-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .category-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .amount { font-weight: 600; }
    .percentage { color: #64748b; }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${t.title}</h1>
    <p class="period">${t.period}: ${format(data.dateRange.from, 'PP')} - ${data.dateRange.to ? format(data.dateRange.to, 'PP') : format(new Date(), 'PP')}</p>
  </div>

  <div class="section">
    <h2 class="section-title">${t.summary}</h2>
    <div class="stats-grid">
      <div class="stat-card income">
        <p class="label">${t.income}</p>
        <p class="value">${data.formatAmount(data.stats.income)}</p>
      </div>
      <div class="stat-card expense">
        <p class="label">${t.expenses}</p>
        <p class="value">${data.formatAmount(data.stats.expenses)}</p>
      </div>
      <div class="stat-card net">
        <p class="label">${t.netSavings}</p>
        <p class="value">${data.formatAmount(data.stats.net)}</p>
      </div>
      <div class="stat-card rate">
        <p class="label">${t.savingsRate}</p>
        <p class="value">${data.stats.savingsRate.toFixed(1)}%</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">${t.categoryBreakdown}</h2>
    ${data.categoryData.length === 0 ? `<p>${t.noData}</p>` : `
    <table>
      <thead>
        <tr>
          <th>${t.category}</th>
          <th>${t.amount}</th>
          <th>${t.percentage}</th>
        </tr>
      </thead>
      <tbody>
        ${data.categoryData.map(cat => `
          <tr>
            <td>
              <div class="category-row">
                <span class="category-dot" style="background-color: ${cat.color}"></span>
                ${cat.name}
              </div>
            </td>
            <td class="amount">${data.formatAmount(cat.value)}</td>
            <td class="percentage">${totalExpenses > 0 ? ((cat.value / totalExpenses) * 100).toFixed(1) : 0}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    `}
  </div>

  <div class="footer">
    <p>${t.generatedOn} ${format(new Date(), 'PPpp')}</p>
  </div>
</body>
</html>
  `;

  // Open print dialog with the generated HTML
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};
