// /backend/services/whatsappService.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const sendWhatsAppReceipt = async (customer, transaction, newBalance) => {
    try {
        if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
            console.log('[WhatsApp Service] Skipped: WHATSAPP_TOKEN or WHATSAPP_PHONE_ID missing in .env');
            return;
        }

        // Format number securely
        let formattedPhone = customer.phone.replace(/\D/g, ''); 
        if (formattedPhone.length === 10) {
            formattedPhone = '91' + formattedPhone; 
        }

        // Exact payload schema for default Meta Sandbox template ('hello_world')
        const messagePayload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
                name: "hello_world", 
                language: { code: "en_US" }
            }
        };

        // Updated API path to v25.0 to align directly with Meta console
        const response = await axios.post(
            `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
            messagePayload,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`[WhatsApp Service] Alert sent successfully to ${formattedPhone} (Msg ID: ${response.data.messages[0].id})`);

    } catch (error) {
        console.error('[WhatsApp Service Error] Failed to send message:', error.response ? error.response.data : error.message);
    }
};

module.exports = { sendWhatsAppReceipt };