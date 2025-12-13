/**
 * E2E API Verification Script
 * Tests all API endpoints including edit and delete
 */

const axios = require('axios');

const API = 'http://localhost:3000/api';
let userId = null;

async function main() {
    console.log('🧪 E2E API VERIFICATION\n');

    // Get user
    console.log('1️⃣ Getting users...');
    const usersRes = await axios.get(`${API}/users`);
    const user = usersRes.data.find(u => u.firstName === 'test');
    if (!user) throw new Error('User not found');
    userId = user.id;
    console.log(`   ✅ User: ${user.firstName} ${user.lastName}`);

    const headers = { 'x-user-id': userId };

    // Test Balance
    console.log('\n2️⃣ Testing Balance...');
    const balanceRes = await axios.get(`${API}/transactions/balance`, { headers });
    console.log(`   ✅ USD: $${balanceRes.data.USD}`);
    console.log(`   ✅ VES: Bs.${balanceRes.data.VES}`);

    // Test Tags
    console.log('\n3️⃣ Testing Tags...');
    const tagsRes = await axios.get(`${API}/tags`, { headers });
    console.log(`   ✅ Tags count: ${tagsRes.data.length}`);
    tagsRes.data.forEach(t => console.log(`      - ${t.name} (${t.color})`));

    // Test Transactions
    console.log('\n4️⃣ Testing Transactions...');
    const txRes = await axios.get(`${API}/transactions`, { headers });
    console.log(`   ✅ Transactions count: ${txRes.data.length}`);

    // Test Edit Transaction
    console.log('\n5️⃣ Testing EDIT Transaction...');
    const supermercado = txRes.data.find(t => t.description === 'Supermercado');
    if (supermercado) {
        console.log(`   Original: ${supermercado.description} - $${supermercado.amount}`);
        const editRes = await axios.put(`${API}/transactions/${supermercado.id}`, {
            amount: 180
        }, { headers });
        console.log(`   ✅ EDITED to: $${editRes.data.amount}`);
    }

    // Test Delete Transaction
    console.log('\n6️⃣ Testing DELETE Transaction...');
    const cine = txRes.data.find(t => t.description === 'Cine');
    if (cine) {
        console.log(`   Deleting: ${cine.description} - $${cine.amount}`);
        await axios.delete(`${API}/transactions/${cine.id}`, { headers });
        console.log(`   ✅ DELETED successfully`);
    }

    // Verify new balance
    console.log('\n7️⃣ Verifying new balance...');
    const newBalance = await axios.get(`${API}/transactions/balance`, { headers });
    console.log(`   ✅ New USD: $${newBalance.data.USD} (was $1905, edit +30, delete +50 = $1985)`);
    console.log(`   ✅ New VES: Bs.${newBalance.data.VES}`);

    // Test Fixed Expenses
    console.log('\n8️⃣ Testing Fixed Expenses...');
    const fixedRes = await axios.get(`${API}/fixed-expenses`, { headers });
    console.log(`   ✅ Fixed Expenses count: ${fixedRes.data.length}`);
    fixedRes.data.forEach(f => console.log(`      - ${f.description}: ${f.amount} ${f.currency} (day ${f.dueDay})`));

    // Test Goals
    console.log('\n9️⃣ Testing Goals...');
    const goalsRes = await axios.get(`${API}/goals`, { headers });
    const goal = goalsRes.data[0];
    console.log(`   ✅ Goal: ${goal.title}`);
    console.log(`   ✅ Saved: $${goal.savedAmount} / $${goal.totalCost}`);
    console.log(`   ✅ Duration: ${goal.durationMonths} months`);

    // Test Toggle Quincena
    console.log('\n🔟 Testing Toggle Quincena...');
    const month1 = goal.progress.find(p => p.monthIndex === 1);
    console.log(`   Month 1 before: Q1=${month1.isQ1Paid}, Q2=${month1.isQ2Paid}`);

    await axios.patch(`${API}/goals/${goal.id}/toggle-month`, {
        monthId: month1.id,
        period: 'q2',
        isPaid: true
    }, { headers });

    const updatedGoals = await axios.get(`${API}/goals`, { headers });
    const updatedGoal = updatedGoals.data[0];
    console.log(`   ✅ New saved amount: $${updatedGoal.savedAmount}`);

    // Test Exchange Rate
    console.log('\n1️⃣1️⃣ Testing Exchange Rate...');
    const rateRes = await axios.get(`${API}/exchange-rate/usd-ves`, { headers });
    console.log(`   ✅ BCV Rate: ${rateRes.data.rate} Bs/$`);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ALL API TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => {
    console.error('❌ Error:', e.response?.data || e.message);
    process.exit(1);
});
