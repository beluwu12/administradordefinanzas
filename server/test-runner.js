const { spawn } = require('child_process');
const path = require('path');

const scripts = [
    'verify-goals.js',
    'verify-scenario.js'
];

async function runScript(scriptName) {
    return new Promise((resolve, reject) => {
        console.log(`\n> Running ${scriptName}...`);
        console.log('-----------------------------------');

        const proc = spawn('node', [path.join(__dirname, scriptName)], {
            stdio: 'inherit',
            shell: true
        });

        proc.on('close', (code) => {
            console.log('-----------------------------------');
            if (code === 0) {
                console.log(`✅ ${scriptName} passed.\n`);
                resolve();
            } else {
                console.error(`❌ ${scriptName} failed with code ${code}.\n`);
                reject(new Error(`${scriptName} failed`));
            }
        });
    });
}

async function runAll() {
    console.log("🚀 Starting Automated Test Suite");
    console.log("===================================");

    let passed = 0;
    let failed = 0;

    for (const script of scripts) {
        try {
            await runScript(script);
            passed++;
        } catch (e) {
            failed++;
        }
    }

    console.log("===================================");
    console.log(`Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) process.exit(1);
}

runAll();
