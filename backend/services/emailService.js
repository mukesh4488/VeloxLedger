// /backend/services/emailService.js
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Create the transporter using your .env credentials
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendTransactionReceipt = async (customer, transaction, newBalance) => {
    try {
        // Safety check to prevent crashes if .env isn't set up yet
        if (!process.env.SMTP_PASS) {
            console.log('[Email Service] Skipped: SMTP_PASS not configured in .env');
            return;
        }

        const isPurchase = transaction.type === 'purchase';
        const actionText = isPurchase ? 'Purchase Logged' : 'Payment Received';
        const color = isPurchase ? '#dc3545' : '#28a745'; // Red for purchase (debt), Green for payment

        // Create a professional HTML template
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                <div style="background-color: ${color}; color: white; padding: 20px; text-align: center;">
                    <h2 style="margin: 0;">AI Khata System</h2>
                    <p style="margin: 5px 0 0 0;">Transaction Alert: ${actionText}</p>
                </div>
                <div style="padding: 20px;">
                    <p>Hello <strong>${customer.name}</strong>,</p>
                    <p>A new transaction has been recorded on your account.</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Transaction Type:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: capitalize;">${transaction.type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${transaction.amount.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Notes:</strong></td>
                            <td style="padding: 10px; border-bottom: 1px solid #eee;">${transaction.notes || 'None'}</td>
                        </tr>
                    </table>

                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center;">
                        <h3 style="margin: 0; color: #333;">Current Outstanding Balance</h3>
                        <p style="font-size: 24px; font-weight: bold; color: #0056b3; margin: 10px 0 0 0;">₹${newBalance.toFixed(2)}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 12px; margin-top: 20px; text-align: center;">
                        This is an automated message from the AI Khata System. Please do not reply.
                    </p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"AI Khata Admin" <${process.env.SMTP_USER}>`,
            to: customer.email,
            subject: `Receipt: ${actionText} for ₹${transaction.amount}`,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] Digital Receipt sent successfully to ${customer.email} (Message ID: ${info.messageId})`);

    } catch (error) {
        console.error('[Email Service Error] Failed to send receipt:', error.message);
    }
};

module.exports = { sendTransactionReceipt };