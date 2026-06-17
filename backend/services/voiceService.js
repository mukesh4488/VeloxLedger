// /backend/services/voiceService.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const triggerVoiceAgent = async (customer, transactionAmount, transactionType, newBalance) => {
    try {
        if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
            console.log('[Voice AI] Skipped: Missing API Key or Agent ID in .env');
            return null;
        }

        // Pass all data variables clearly so the LLM doesn't guess the math
        const payload = {
            agent_id: process.env.RETELL_AGENT_ID,
            retell_llm_dynamic_variables: {
                customer_name: customer.name,
                transaction_type: transactionType === 'payment' ? 'payment received' : 'new purchase credit',
                transaction_amount: transactionAmount.toString(),
                current_balance: newBalance.toString()
            }
        };

        const response = await axios.post(
            'https://api.retellai.com/v2/create-web-call',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`\n==================================================`);
        console.log(`[Voice AI Service] Web Call Registered for ${customer.name}!`);
        console.log(`[Type]: ${transactionType} | [Amount]: ₹${transactionAmount}`);
        console.log(`[Access Token Generated]: Ready for Frontend Connection`);
        console.log(`==================================================\n`);

        return response.data.access_token;

    } catch (error) {
        console.error('[Voice AI Service Error] Failed to register web call:', error.response ? error.response.data : error.message);
        return null;
    }
};

module.exports = { triggerVoiceAgent };