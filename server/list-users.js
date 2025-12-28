// Quick script to list users in database
const prisma = require('./db');

async function listUsers() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                country: true
            }
        });

        if (users.length === 0) {
            console.log('No users found in database.');
            console.log('\nTo create a test user, register at: http://localhost:5173/register');
        } else {
            console.log('Found', users.length, 'user(s):');
            users.forEach(u => {
                console.log(`  - ${u.email} (${u.firstName} ${u.lastName}) - ${u.country}`);
            });
        }
    } catch (err) {
        console.error('Error querying database:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
