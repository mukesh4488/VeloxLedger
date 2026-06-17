// /backend/models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    // The faceEncoding array will store the 128-dimensional face data from Python
    faceEncoding: {
        type: [Number],
        required: true 
    },
    balance: {
        type: Number,
        default: 0 // Positive means they owe money (credit), negative means they overpaid
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);