/**
 * Seed Script - Generate 60 realistic transactions over 3 months
 * Run: node prisma/seed-transactions.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Find test user
    const user = await prisma.user.findUnique({
        where: { email: 'test@test.com' }
    });

    if (!user) {
        console.error('User test@test.com not found!');
        process.exit(1);
    }

    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.id})`);

    // Get or create tags
    const tagNames = ['Salario', 'Comida', 'Transporte', 'Entretenimiento', 'Servicios', 'Ahorro', 'Freelance', 'Compras', 'Salud', 'Educación'];
    const tags = {};

    for (const name of tagNames) {
        let tag = await prisma.tag.findFirst({
            where: { name, userId: user.id }
        });
        if (!tag) {
            tag = await prisma.tag.create({
                data: { name, userId: user.id, color: getRandomColor() }
            });
        }
        tags[name] = tag;
    }

    console.log(`Tags ready: ${Object.keys(tags).join(', ')}`);

    // Generate transactions for October, November, December 2024
    const transactions = [];
    const months = [
        { year: 2024, month: 10 }, // October
        { year: 2024, month: 11 }, // November
        { year: 2024, month: 12 }, // December
    ];

    for (const { year, month } of months) {
        // === INCOME ===
        // Salary (2 payments per month - quincena)
        transactions.push({
            type: 'INCOME',
            amount: 1500,
            currency: 'USD',
            description: 'Salario Quincena 1',
            date: new Date(year, month - 1, 15, 10, 0),
            tags: [tags['Salario']],
        });
        transactions.push({
            type: 'INCOME',
            amount: 1500,
            currency: 'USD',
            description: 'Salario Quincena 2',
            date: new Date(year, month - 1, 30, 10, 0),
            tags: [tags['Salario']],
        });

        // Freelance income (random)
        if (Math.random() > 0.4) {
            transactions.push({
                type: 'INCOME',
                amount: randomBetween(200, 800),
                currency: 'USD',
                description: 'Proyecto Freelance',
                date: new Date(year, month - 1, randomBetween(1, 28), 14, 0),
                tags: [tags['Freelance']],
            });
        }

        // === EXPENSES ===
        // Food expenses (8-10 per month)
        const foodCount = randomBetween(8, 10);
        for (let i = 0; i < foodCount; i++) {
            transactions.push({
                type: 'EXPENSE',
                amount: randomBetween(15, 80),
                currency: 'USD',
                description: randomChoice(['Supermercado', 'Restaurante', 'Delivery', 'Café', 'Almuerzo', 'Mercado']),
                date: new Date(year, month - 1, randomBetween(1, 28), randomBetween(8, 20), 0),
                tags: [tags['Comida']],
            });
        }

        // Transport (3-4 per month)
        const transportCount = randomBetween(3, 4);
        for (let i = 0; i < transportCount; i++) {
            transactions.push({
                type: 'EXPENSE',
                amount: randomBetween(10, 50),
                currency: 'USD',
                description: randomChoice(['Gasolina', 'Uber', 'Estacionamiento', 'Taxi', 'Bus']),
                date: new Date(year, month - 1, randomBetween(1, 28), randomBetween(7, 19), 0),
                tags: [tags['Transporte']],
            });
        }

        // Services (utilities, subscriptions)
        transactions.push({
            type: 'EXPENSE',
            amount: randomBetween(50, 120),
            currency: 'USD',
            description: 'Internet + Electricidad',
            date: new Date(year, month - 1, 5, 9, 0),
            tags: [tags['Servicios']],
        });
        transactions.push({
            type: 'EXPENSE',
            amount: 15.99,
            currency: 'USD',
            description: 'Netflix',
            date: new Date(year, month - 1, 10, 9, 0),
            tags: [tags['Entretenimiento']],
        });
        transactions.push({
            type: 'EXPENSE',
            amount: 10.99,
            currency: 'USD',
            description: 'Spotify',
            date: new Date(year, month - 1, 12, 9, 0),
            tags: [tags['Entretenimiento']],
        });

        // Shopping (1-2 per month)
        if (Math.random() > 0.3) {
            transactions.push({
                type: 'EXPENSE',
                amount: randomBetween(50, 200),
                currency: 'USD',
                description: randomChoice(['Amazon', 'Ropa', 'Electrónicos', 'Hogar']),
                date: new Date(year, month - 1, randomBetween(1, 28), 15, 0),
                tags: [tags['Compras']],
            });
        }

        // Health (occasional)
        if (Math.random() > 0.5) {
            transactions.push({
                type: 'EXPENSE',
                amount: randomBetween(30, 100),
                currency: 'USD',
                description: randomChoice(['Farmacia', 'Médico', 'Gym']),
                date: new Date(year, month - 1, randomBetween(1, 28), 11, 0),
                tags: [tags['Salud']],
            });
        }

        // Savings transfer
        transactions.push({
            type: 'EXPENSE',
            amount: randomBetween(100, 300),
            currency: 'USD',
            description: 'Transferencia a Ahorro',
            date: new Date(year, month - 1, 16, 10, 0),
            tags: [tags['Ahorro']],
        });
    }

    // Insert all transactions
    console.log(`\nInserting ${transactions.length} transactions...`);

    let count = 0;
    for (const tx of transactions) {
        await prisma.transaction.create({
            data: {
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                description: tx.description,
                date: tx.date,
                userId: user.id,
                tags: {
                    connect: tx.tags.map(t => ({ id: t.id }))
                }
            }
        });
        count++;
        process.stdout.write(`\rInserted: ${count}/${transactions.length}`);
    }

    console.log('\n\n✅ Seed complete!');
    console.log(`Total transactions created: ${count}`);

    // Summary
    const summary = await prisma.transaction.groupBy({
        by: ['type'],
        where: { userId: user.id, deletedAt: null },
        _sum: { amount: true },
        _count: true
    });

    console.log('\nSummary:');
    for (const s of summary) {
        console.log(`  ${s.type}: ${s._count} transactions, $${s._sum.amount?.toFixed(2) || 0}`);
    }
}

// Helpers
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomColor() {
    const colors = ['#db0f79', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];
    return randomChoice(colors);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
