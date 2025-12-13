const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyScenario() {
    console.log("Starting Verification Scenario...");

    try {
        // 1. Reset Data for clean slate (optional, be careful in prod)
        // await prisma.transaction.deleteMany({});
        // await prisma.fixedExpense.deleteMany({});
        // await prisma.user.deleteMany({});
        // console.log("Cleaned DB.");

        // 2. Create User
        const user = await prisma.user.create({
            data: {
                firstName: "Test",
                lastName: "User",
                pin: "$2a$10$wT8B/....", // Fake hash
            }
        });
        console.log(`Created User: ${user.id}`);

        // 3. Create Fixed Expenses
        await prisma.fixedExpense.create({
            data: {
                description: "Rent",
                amount: 500,
                currency: "USD",
                dueDay: 5,
                isActive: true,
                userId: user.id
            }
        });

        await prisma.fixedExpense.create({
            data: {
                description: "Gym",
                amount: 50,
                currency: "USD",
                dueDay: 15,
                isActive: true,
                userId: user.id
            }
        });

        // 4. Create Income "Quincena"
        // Not implementing full logic check here as it depends on complex date math, 
        // but verifying schema write/read works.

        const expenses = await prisma.fixedExpense.findMany({ where: { userId: user.id } });
        console.log(`Verified ${expenses.length} fixed expenses.`);

        if (expenses.length !== 2) throw new Error("Expense count mismatch");

        console.log("SUCCESS: Basic Scenario Verified.");

    } catch (e) {
        console.error("Verification Failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyScenario();
