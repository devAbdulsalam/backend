const  mongoose = require("mongoose");
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    userId:{
        type : String,
        require: true
    },
    phone:{
        type : String,
        require: true
    },    
    amount:{
        type : String,
        require: true
    },
    balance:{
        type : Number,
        require: true
    },
    credit:{
        type : String,
        require: true
    },
    debit:{
        type : String,
        require: true
    },
    narration:{
        type : String,
        require: true
    },
}, {timestamps : true});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;