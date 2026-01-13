/**
 * VaultFi Demo Traces Sender
 * Sends pre-built transactions to the Dukt backend for demo purposes
 * 
 * Usage: node send-demo-traces.js
 */

const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:3001';
const DELAY_MS = 500; // Delay between transactions (simulates real-time)

async function sendDemoTraces() {
    // Load transaction data
    const dataPath = path.join(__dirname, '../../dev-fixture/data/vaultfi-demo-transactions.json');

    if (!fs.existsSync(dataPath)) {
        console.error('❌ Demo data file not found:', dataPath);
        console.log('   Make sure dev-fixture/data/vaultfi-demo-transactions.json exists');
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const transactions = data.transactions;

    console.log('🚀 VaultFi Demo Trace Sender');
    console.log('=============================');
    console.log(`   Backend: ${BACKEND_URL}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Delay: ${DELAY_MS}ms between each\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const statusIcon = tx.status === 'revert' ? '❌' : '✅';

        try {
            const response = await fetch(`${BACKEND_URL}/api/internal/ingest/flow`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tx)
            });

            if (response.ok) {
                console.log(`${statusIcon} [${i + 1}/${transactions.length}] ${tx.entryFunction}() - ${tx.stepCount} steps`);
                successCount++;
            } else {
                const error = await response.json();
                console.log(`⚠️  [${i + 1}/${transactions.length}] Failed: ${error.message}`);
                errorCount++;
            }
        } catch (error) {
            console.log(`⚠️  [${i + 1}/${transactions.length}] Network error: ${error.message}`);
            errorCount++;
        }

        // Wait before sending next transaction
        if (i < transactions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
    }

    console.log('\n=============================');
    console.log(`✅ Sent: ${successCount} | ❌ Failed: ${errorCount}`);
    console.log('Open http://localhost:3001 → Executions to view');
}

// Run the sender
sendDemoTraces().catch(console.error);
