const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    console.log("Cleaning up Test Users...");
    try {
        const deleted = await prisma.user.deleteMany({
            where: {
                firstName: "Test",
            }
        });
        console.log(`Deleted ${deleted.count} test users.`);
    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
