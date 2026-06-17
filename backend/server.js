// /backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// CLOUDINARY IMPORTS
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

dotenv.config();

// CONFIGURE CLOUDINARY
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// TELL MULTER TO UPLOAD TO CLOUDINARY
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'khata_faces',
        format: async (req, file) => 'jpg',
        public_id: (req, file) => `${req.body.name.trim().replace(/\s+/g, '_')}_face_1`,
    },
});
const upload = multer({ storage: storage });

// Services & Models
const { sendTransactionReceipt } = require('./services/emailService');
const { startCronJobs } = require('./services/cronService');
const Customer = require('./models/Customer');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);
    socket.on('disconnect', () => console.log(`[WebSocket] Client disconnected: ${socket.id}`));
});

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[Database] Successfully connected to MongoDB Atlas'))
    .catch((err) => {
        console.error('[Database Fatal Error] Connection failed:', err.message);
        process.exit(1);
    });

// ==========================================
// API ROUTES
// ==========================================

app.get('/api/health', (req, res) => res.status(200).json({ success: true, message: 'Node.js Backend is operational.' }));

app.post('/api/auth/customer', async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required.' });

        const customer = await Customer.findOne({ phone: phone }).select('-faceEncoding');
        if (!customer) return res.status(404).json({ success: false, message: 'No account found with this phone number.' });

        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error processing login request.' });
    }
});

app.get('/api/ai-enforce/customers', async (req, res) => {
    try {
        const customers = await Customer.find().select('name faceEncoding');
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'AI database fetch failed.' });
    }
});

app.get('/api/customers', async (req, res) => {
    try {
        const customers = await Customer.find().select('-faceEncoding').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Database error fetching customers.' });
    }
});

app.get('/api/customers/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id).select('-faceEncoding');
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching customer profile.' });
    }
});

app.post('/api/customers/register', upload.single('faceImage'), async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, message: 'No face image uploaded.' });
        }

        const newCustomer = new Customer({
            name: name,
            phone: phone,
            email: email,
            balance: 0,
            faceEncoding: [], 
            imageUrl: req.file.path
        });
        
        const savedCustomer = await newCustomer.save();
        res.status(201).json({ success: true, data: savedCustomer, message: 'Customer and photo saved to cloud successfully.' });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: 'Failed to register customer.' });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { name, phone, email, faceEncoding } = req.body;
        if (!name || !phone || !email || !faceEncoding) return res.status(400).json({ success: false, message: 'Missing fields.' });
        
        const newCustomer = new Customer({ name, phone, email, faceEncoding });
        await newCustomer.save();
        res.status(201).json({ success: true, data: newCustomer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create customer.' });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id, 
            { name, phone, email }, 
            { new: true, runValidators: true }
        ).select('-faceEncoding');

        if (!updatedCustomer) return res.status(404).json({ success: false, message: 'Customer not found.' });
        res.status(200).json({ success: true, data: updatedCustomer, message: 'Profile updated successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update customer details.' });
    }
});

app.get('/api/customers/:id/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({ customerId: req.params.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching transaction history.' });
    }
});

app.post('/api/scans', async (req, res) => {
    try {
        const { customerName } = req.body;
        
        if (!customerName) {
            return res.status(400).json({ success: false, message: 'Missing customerName in payload.' });
        }

        const customer = await Customer.findOne({ 
            name: { $regex: new RegExp('^' + customerName.trim() + '$', 'i') } 
        }).select('-faceEncoding');
        
        if (customer) {
            console.log(`[Edge Camera] Face recognized: ${customer.name}. Updating React UI...`);
            io.emit('new_scan', { customer: customer, scannedAt: Math.floor(Date.now() / 1000) });
            res.status(200).json({ success: true, message: 'Alert broadcasted to dashboard.' });
        } else {
            console.log(`[Edge Camera] User "${customerName}" not found in database.`);
            res.status(404).json({ success: false, message: 'Customer profile not found.' });
        }
    } catch (error) {
        console.error('[Webhook Error]', error);
        res.status(500).json({ success: false, message: 'Failed to process scan webhook.' });
    }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const { customerId, type, amount, notes } = req.body;
        if (!customerId || !type || !amount) {
            return res.status(400).json({ success: false, message: 'Missing transaction details.' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) return res.status(404).json({ success: false, message: 'Customer not found.' });

        const newTransaction = new Transaction({ customerId, type, amount, notes });
        await newTransaction.save();

        if (type === 'purchase') {
            customer.balance += Number(amount);
        } else if (type === 'payment') {
            customer.balance -= Number(amount);
        }
        await customer.save();

        sendTransactionReceipt(customer, newTransaction, customer.balance);
        
        res.status(201).json({ 
            success: true, 
            message: 'Transaction logged and email sent.',
            newBalance: customer.balance,
            transaction: newTransaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to log transaction.' });
    }
});

startCronJobs();

const startServer = async () => {
    try {
        server.listen(PORT, () => console.log(`[Server] Operational and listening on port ${PORT}`));
    } catch (error) {
        console.error(`[Server Fatal Error]: ${error.message}`);
        process.exit(1);
    }
};

startServer();