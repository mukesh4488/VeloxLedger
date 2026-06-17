// /backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    type: {
        type: String,
        enum: ['purchase', 'payment'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);