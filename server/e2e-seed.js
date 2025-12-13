/**
 * Comprehensive E2E Test Seed Script
 * Creates test user, tags, transactions, fixed expenses, and goals
 * Simulates 30 days of activity
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Comprehensive E2E Test Seed...\n');

    // Clean existing data
    console.log('🧹 Cleaning existing data...');
    await prisma.goalMonth.deleteMany({});
    await prisma.goal.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.fixedExpense.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Database cleaned\n');

    // PHASE 1: Create User
    console.log('👤 PHASE 1: Creating user "test ultimo"...');
    const hashedPin = await bcrypt.hash('1234', 10);
    const user = await prisma.user.create({
        data: {
            firstName: 'test',
            lastName: 'ultimo',
            pin: hashedPin
        }
    });
    console.log(`✅ User created: ${user.firstName} ${user.lastName} (ID: ${user.id})\n`);

    // PHASE 2: Create Tags
    console.log('🏷️  PHASE 2: Creating 5 tags...');
    const tagData = [
        { name: 'Quincena', color: 'blue' },
        { name: 'Comida', color: 'red' },
        { name: 'Transporte', color: 'green' },
        { name: 'Entretenimiento', color: 'purple' },
        { name: 'Servicios', color: 'yellow' }
    ];

    const tags = {};
    for (const t of tagData) {
        const tag = await prisma.tag.create({
            data: { ...t, userId: user.id }
        });
        tags[t.name] = tag;
        console.log(`  ✅ Tag: ${tag.name} (${tag.color})`);
    }
    console.log('');

    // PHASE 3: Create Fixed Expenses (2 USD, 1 VES)
    console.log('💳 PHASE 3: Creating fixed expenses...');
    const fixedExpenses = [
        { description: 'Internet', amount: 50, currency: 'USD', dueDay: 15 },
        { description: 'Netflix', amount: 15, currency: 'USD', dueDay: 5 },
        { description: 'Teléfono', amount: 500, currency: 'VES', dueDay: 10 }
    ];

    for (const fe of fixedExpenses) {
        await prisma.fixedExpense.create({
            data: { ...fe, userId: user.id }
        });
        console.log(`  ✅ Fixed: ${fe.description} - ${fe.amount} ${fe.currency} (Day ${fe.dueDay})`);
    }
    console.log('');

    // PHASE 4: Create Income Transactions
    console.log('💰 PHASE 4: Creating income transactions...');
    const incomes = [
        { amount: 1000, currency: 'USD', description: 'Salario Quincena 1', tagName: 'Quincena', daysAgo: 15 },
        { amount: 1000, currency: 'USD', description: 'Salario Quincena 2', tagName: 'Quincena', daysAgo: 1 },
        { amount: 5000, currency: 'VES', description: 'Freelance', tagName: null, daysAgo: 10 },
        { amount: 200, currency: 'USD', description: 'Bonus', tagName: null, daysAgo: 5 }
    ];

    for (const inc of incomes) {
        const date = new Date();
        date.setDate(date.getDate() - inc.daysAgo);

        await prisma.transaction.create({
            data: {
                amount: inc.amount,
                currency: inc.currency,
                type: 'INCOME',
                description: inc.description,
                date: date,
                userId: user.id,
                tags: inc.tagName ? { connect: [{ id: tags[inc.tagName].id }] } : undefined
            }
        });
        console.log(`  ✅ Income: ${inc.amount} ${inc.currency} - "${inc.description}" (${inc.daysAgo}d ago)`);
    }
    console.log('');

    // PHASE 5: Create Expense Transactions
    console.log('🛒 PHASE 5: Creating expense transactions...');
    const expenses = [
        { amount: 150, currency: 'USD', description: 'Supermercado', tagName: 'Comida', daysAgo: 12 },
        { amount: 30, currency: 'USD', description: 'Gasolina', tagName: 'Transporte', daysAgo: 8 },
        { amount: 50, currency: 'USD', description: 'Cine', tagName: 'Entretenimiento', daysAgo: 6 },
        { amount: 1000, currency: 'VES', description: 'Almuerzo', tagName: 'Comida', daysAgo: 4 },
        { amount: 65, currency: 'USD', description: 'Pago Internet', tagName: 'Servicios', daysAgo: 2 }
    ];

    for (const exp of expenses) {
        const date = new Date();
        date.setDate(date.getDate() - exp.daysAgo);

        await prisma.transaction.create({
            data: {
                amount: exp.amount,
                currency: exp.currency,
                type: 'EXPENSE',
                description: exp.description,
                date: date,
                userId: user.id,
                tags: exp.tagName ? { connect: [{ id: tags[exp.tagName].id }] } : undefined
            }
        });
        console.log(`  ✅ Expense: ${exp.amount} ${exp.currency} - "${exp.description}" (${exp.daysAgo}d ago)`);
    }
    console.log('');

    // PHASE 6: Create Goal with Quincena tracking
    console.log('🎯 PHASE 6: Creating goal "Laptop Gaming"...');
    const monthlyAmount = 1200 / 6; // $200/month
    const goal = await prisma.goal.create({
        data: {
            title: 'Laptop Gaming',
            description: 'ASUS ROG Strix para desarrollo y gaming',
            totalCost: 1200,
            monthlyAmount: monthlyAmount,
            currency: 'USD',
            durationMonths: 6,
            startDate: new Date(),
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 6)),
            userId: user.id,
            progress: {
                create: Array.from({ length: 6 }, (_, i) => ({
                    monthIndex: i + 1,
                    target: monthlyAmount,
                    isQ1Paid: i === 0, // First month Q1 already paid
                    isQ2Paid: false
                }))
            }
        },
        include: { progress: true }
    });

    // Update savedAmount for the paid quincena
    await prisma.goal.update({
        where: { id: goal.id },
        data: { savedAmount: monthlyAmount / 2 } // Half month paid
    });

    console.log(`  ✅ Goal: ${goal.title} - $${goal.totalCost} in ${goal.durationMonths} months`);
    console.log(`  ✅ First Quincena marked as paid ($${monthlyAmount / 2} saved)`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');

    const totalIncomeUSD = incomes.filter(i => i.currency === 'USD').reduce((s, i) => s + i.amount, 0);
    const totalIncomeVES = incomes.filter(i => i.currency === 'VES').reduce((s, i) => s + i.amount, 0);
    const totalExpenseUSD = expenses.filter(e => e.currency === 'USD').reduce((s, e) => s + e.amount, 0);
    const totalExpenseVES = expenses.filter(e => e.currency === 'VES').reduce((s, e) => s + e.amount, 0);

    console.log(`  User: test ultimo`);
    console.log(`  Tags: ${tagData.length}`);
    console.log(`  Fixed Expenses: ${fixedExpenses.length}`);
    console.log(`  Transactions: ${incomes.length + expenses.length}`);
    console.log(`  Goals: 1`);
    console.log('');
    console.log(`  💵 USD Balance: $${totalIncomeUSD - totalExpenseUSD}`);
    console.log(`  💴 VES Balance: Bs.${totalIncomeVES - totalExpenseVES}`);
    console.log('');
    console.log('🎉 E2E Test Data Seeded Successfully!');
    console.log('═══════════════════════════════════════════════════════');
}

main()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
