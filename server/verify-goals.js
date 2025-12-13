const axios = require('axios');
const prisma = require('./db');
const bcrypt = require('bcryptjs');

const API_URL = 'http://localhost:3000/api';

async function runVerification() {
    console.log("Starting Goals Verification...");

    // 1. Create a Test User
    const testEmail = `test_goals_${Date.now()}`;
    const pin = "1234";
    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await prisma.user.create({
        data: {
            firstName: "Goal",
            lastName: "Tester",
            pin: hashedPin
        }
    });

    console.log(`Created User: ${user.id}`);
    const headers = { 'x-user-id': user.id };

    try {
        // 2. Create a Goal
        // Cost: 1000, Monthly: 200 -> Should be 5 months
        console.log("Creating Goal...");
        const goalPayload = {
            title: "MacBook Pro",
            totalCost: 1000,
            monthlyAmount: 200,
            description: "New laptop",
            currency: "USD",
            startDate: new Date().toISOString()
        };

        const createRes = await axios.post(`${API_URL}/goals`, goalPayload, { headers });
        const goal = createRes.data;

        console.log("Goal Created:", goal.id);
        console.log("Duration Months:", goal.durationMonths);
        console.log("Progress Entries:", goal.progress.length);

        if (goal.durationMonths !== 5 || goal.progress.length !== 5) {
            console.error("FAILED: Duration or Progress entries mismatch.");
            return;
        }

        // 3. Toggle a Month
        const firstMonth = goal.progress[0];
        console.log("Toggling Month 1:", firstMonth.id);

        const toggleRes = await axios.patch(`${API_URL}/goals/${goal.id}/toggle-month`, {
            monthId: firstMonth.id,
            isCompleted: true
        }, { headers });

        console.log("Month Toggled. New State:", toggleRes.data.isCompleted);

        // 4. Verify Saved Amount Update (Check via DB or GET request)
        const getRes = await axios.get(`${API_URL}/goals`, { headers });
        const myGoals = getRes.data;
        const savedAmount = myGoals.find(g => g.id === goal.id).savedAmount;

        console.log("Saved Amount in Goal:", savedAmount);
        if (savedAmount !== 200) {
            console.error("FAILED: Saved Amount should be 200");
        } else {
            console.log("SUCCESS: Saved Amount verified.");
        }

    } catch (error) {
        console.error("Verification Error:", error.response ? error.response.data : error.message);
    } finally {
        // Clean up
        await prisma.goal.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        console.log("Cleanup complete.");
    }
}

runVerification();
