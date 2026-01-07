const prisma = require('./db');

async function debug() {
    // Get all users
    const users = await prisma.user.findMany({
        select: { id: true, email: true }
    });
    console.log('=== USERS ===');
    users.forEach(u => console.log(`${u.id}: ${u.email}`));

    // Get transaction counts per user
    const txByUser = await prisma.transaction.groupBy({
        by: ['userId', 'type'],
        where: { deletedAt: null },
        _count: true,
        _sum: { amount: true }
    });
    console.log('\n=== TRANSACTIONS BY USER ===');
    console.log(JSON.stringify(txByUser, null, 2));

    // Check December 2025 transactions for jeremito18
    const user = users.find(u => u.email === 'jeremito18@gmail.com');
    if (user) {
        const decTx = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                deletedAt: null,
                date: {
                    gte: new Date('2025-12-01'),
                    lte: new Date('2025-12-31T23:59:59.999Z')
                }
            },
            select: { id: true, amount: true, type: true, description: true, date: true }
        });
        console.log(`\n=== DEC 2025 TX FOR ${user.email} (${decTx.length} total) ===`);
        let income = 0, expense = 0;
        decTx.forEach(t => {
            const amt = Math.abs(parseFloat(t.amount));
            if (t.type === 'INCOME') income += amt;
            else expense += amt;
            console.log(`${t.type}: $${t.amount} - ${t.description?.substring(0, 30)}`);
        });
        console.log(`\nTOTALS: Income=$${income}, Expense=$${expense}, Balance=$${income - expense}`);
    }

    await prisma.$disconnect();
}

debug().catch(e => { console.error(e); process.exit(1); });
