// /backend/services/cronService.js
const cron = require('node-cron');
const Customer = require('../models/Customer');

const startCronJobs = () => {
    console.log('[Cron Service] Background debt collection initialized.');

    // For testing: Runs every 1 minute. 
    // For production (9 AM daily), change '* * * * *' to '0 9 * * *'
    cron.schedule('* * * * *', async () => {
        console.log('\n[Cron] Running scheduled debt check...');
        try {
            // Find all customers who owe money (balance > 0)
            const debtors = await Customer.find({ balance: { $gt: 0 } });
            
            if (debtors.length === 0) {
                console.log('[Cron] No outstanding debts found.');
                return;
            }

            console.log(`[Cron] Found ${debtors.length} customers with outstanding balances.`);
            
            debtors.forEach(customer => {
                // Here is where you will eventually plug in WhatsApp or SMS APIs.
                // For now, we simulate the automated push:
                console.log(`➡️ [Automated Reminder Sent] to ${customer.name} (Phone: ${customer.phone}) for ₹${customer.balance}`);
            });

        } catch (error) {
            console.error('[Cron Error] Failed to process debt checks:', error);
        }
    });
};

module.exports = { startCronJobs };