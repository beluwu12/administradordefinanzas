const express = require('express');
const cors = require('cors');
const prisma = require('./db');

const app = express();
// const prisma = new PrismaClient(); // Removed
const PORT = process.env.PORT || 3000;

const userRoutes = require('./routes/users');
const transactionRoutes = require('./routes/transactions');
const tagRoutes = require('./routes/tags');
const fixedExpenseRoutes = require('./routes/fixedExpenses');

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/fixed-expenses', fixedExpenseRoutes);
app.use('/api/insight', require('./routes/insight'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/exchange-rate', require('./routes/exchangeRate'));

// Scheduler for BCV Rate (Every 8 hours)
const cron = require('node-cron');
const { updateExchangeRate } = require('./services/bcvScraper');

// Schedule: At minute 0 past hour 8, 16, and 0.
cron.schedule('0 8,16,0 * * *', async () => {
  console.log("Running scheduled BCV rate update...");
  await updateExchangeRate();
});

// Run once on startup (non-blocking)
updateExchangeRate();
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Personal Finance API is running' });
});

// Routes will go here

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
