const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'test@test.com' },
        update: {},
        create: {
            email: 'test@test.com',
            password: hashedPassword,
            firstName: 'Jeremy',
            lastName: 'Test',
            defaultCurrency: 'USD',
            country: 'VE',
            dualCurrencyEnabled: true,
        },
    });

    console.log(`✅ User created: ${user.email}`);

    // Create tags
    const tags = await Promise.all([
        prisma.tag.upsert({ where: { name_userId: { name: 'Comida', userId: user.id } }, update: {}, create: { name: 'Comida', color: '#ef4444', userId: user.id } }),
        prisma.tag.upsert({ where: { name_userId: { name: 'Transporte', userId: user.id } }, update: {}, create: { name: 'Transporte', color: '#3b82f6', userId: user.id } }),
        prisma.tag.upsert({ where: { name_userId: { name: 'Entretenimiento', userId: user.id } }, update: {}, create: { name: 'Entretenimiento', color: '#8b5cf6', userId: user.id } }),
        prisma.tag.upsert({ where: { name_userId: { name: 'Salario', userId: user.id } }, update: {}, create: { name: 'Salario', color: '#22c55e', userId: user.id } }),
        prisma.tag.upsert({ where: { name_userId: { name: 'Freelance', userId: user.id } }, update: {}, create: { name: 'Freelance', color: '#06b6d4', userId: user.id } }),
    ]);

    console.log(`✅ ${tags.length} tags created`);

    // Create sample transactions (last 30 days)
    const now = new Date();
    const transactions = [];
    for (let i = 0; i < 15; i++) {
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(now);
        date.setDate(date.getDate() - daysAgo);
        const isIncome = Math.random() > 0.65;

        transactions.push({
            amount: parseFloat((isIncome ? (500 + Math.random() * 1500) : (10 + Math.random() * 200)).toFixed(2)),
            currency: Math.random() > 0.3 ? 'USD' : 'VES',
            type: isIncome ? 'INCOME' : 'EXPENSE',
            description: isIncome
                ? ['Salario quincenal', 'Pago freelance', 'Transferencia recibida'][Math.floor(Math.random() * 3)]
                : ['Mercado', 'Gasolina', 'Cena fuera', 'Netflix', 'Uber', 'Farmacia'][Math.floor(Math.random() * 6)],
            date,
            userId: user.id,
        });
    }

    for (const tx of transactions) {
        const created = await prisma.transaction.create({ data: tx });
        // Connect a random tag
        const randomTag = tags[Math.floor(Math.random() * tags.length)];
        await prisma.transaction.update({
            where: { id: created.id },
            data: { tags: { connect: { id: randomTag.id } } },
        });
    }

    console.log(`✅ ${transactions.length} transactions created`);

    // Create fixed expenses
    const fixedExpenses = await Promise.all([
        prisma.fixedExpense.create({ data: { amount: 500, currency: 'USD', description: 'Alquiler', dueDay: 1, userId: user.id } }),
        prisma.fixedExpense.create({ data: { amount: 50, currency: 'USD', description: 'Internet', dueDay: 15, userId: user.id } }),
        prisma.fixedExpense.create({ data: { amount: 12, currency: 'USD', description: 'Spotify', dueDay: 20, userId: user.id } }),
    ]);

    console.log(`✅ ${fixedExpenses.length} fixed expenses created`);

    // Create an exchange rate
    await prisma.exchangeRate.create({
        data: { source: 'BCV', pair: 'USD/VES', rate: 89.35 },
    });

    console.log('✅ Exchange rate created');

    // Create a goal
    await prisma.goal.create({
        data: {
            title: 'MacBook Pro',
            description: 'Laptop nueva para trabajo',
            totalCost: 2000,
            currency: 'USD',
            durationMonths: 6,
            monthlyAmount: 333.34,
            savedAmount: 666.68,
            tag: 'Tecnología',
            userId: user.id,
            progress: {
                create: [
                    { monthIndex: 1, target: 333.34, isQ1Paid: true, isQ2Paid: true },
                    { monthIndex: 2, target: 333.34, isQ1Paid: true, isQ2Paid: false },
                    { monthIndex: 3, target: 333.34 },
                    { monthIndex: 4, target: 333.34 },
                    { monthIndex: 5, target: 333.34 },
                    { monthIndex: 6, target: 333.30 },
                ],
            },
        },
    });

    console.log('✅ Goal created');
    console.log('\n🎉 Seed completed! Login with: test@test.com / test123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
