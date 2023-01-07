const User = require('../models/userModel')
const Wallet = require('../models/walletModel')
const Transaction = require('../models/transactionModel')
const jwt = require('jsonwebtoken')
const speakeasy = require('speakeasy');
const bcrypt = require("bcryptjs");
const accountSid = process.env.ACCOUNT_SID
const auth_token = process.env.AUTH_TOKEN
const twilio = require("twilio")(accountSid, auth_token);

const createToken = (_id) => {
  return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' })
}


// // // // // // User Wallet
const wallet = async (req, res) => {
    const {phone} = req.body
    try {
        let user = await User.findOne({phone})
        if (!user) {
            throw Error('user does not  exist!!')
        }
        let wallet = await Wallet.findOne({phone})
        if (!wallet) {
            throw Error('wallet does not  exist!!')
        }
        // // // verify the token
        // const verify = jwt.verify(token, process.env.SECRET)
        // if(!verify){
        //    throw Error("verification failed");
        // }
        if(user && wallet){
            res.status(200).json({user, wallet, message: "wallet found successfully"})
        }
    } catch (error) {
            res.status(404).json({error: error.message})
        }
}

// // // // // // create transaction pin
const createPin = async (req, res) => {
    const {id : userId, pin, token} = req.body
    try {
        let wallet = await Wallet.findOne({userId})

        if (!wallet) {
            throw Error('wallet does not  exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("verification failed")
        }
        
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(pin, salt)
        if(wallet){
            wallet.pin = hash
        };
        wallet = await wallet.save()

        res.status(200).json({wallet, pin, message: "transaction pin created successfully"})
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}
// // // // // // send funds to user
const sendMoney = async (req, res) => {
    const {id : userId, phone, amount, pin, token, narration} = req.body
    try {
        let sender = await User.findOne({userId})
        let senderwlt = await Wallet.findOne({userId})
        let senderTrans = await Transaction.findOne({userId})
        let receiver = await User.findOne({phone})
        let recvwlt = await Wallet.findOne({userId})
        let recvTrans = await Transaction.findOne({phone})
        let date = new Date().getTime().toString()
        
        if(!sender) {
            throw Error('wallet does not  exist!!')
        }
        if(!receiver) {
            throw Error('Account Number does not exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("verification failed")
        }
        const match =  bcrypt.compare(pin, senderwlt.pin)
        if (!match) {
            throw Error('Incorrect pin')
        }
        if(senderwlt && receiver && match){
            if(senderwlt.balance < amount){
                throw Error('Insufficient balance')
            }else if(senderwlt.balance >= amount){
            senderwlt.balance = senderwlt.balance - amount
            recvwlt.balance = recvwlt.balance + amount
        };
            senderTrans = new Transaction({serId:sender.userId, amount , balance:senderwlt.balance, debit: receiver?.name, date, narration})
            recvTrans = new Transaction({serId:sender.userId, amount, banlance: recvwlt.balance , credit: sender?.name, date, narration})
            senderwlt = await senderwlt.save()
            recvwlt = await recvwlt.save()
            recvTrans = await recvTrans.save()
            recvTrans = await senderTrans.save()
            res.status(200).json({senderTrans, amount, recvTrans, message: "found sent successfully"})          
        };
    } catch (error) {
            res.status(404).json({error: error.message})
        }
}

// // // // // // recieve funds to user
const  receiveMoney = async (req, res) => {
    const {id : userId, phone, amount} = req.body
    try {
        let wallet = await Wallet.findOne({userId})
        let receiver = await Wallet.findOne({phone})
        
        if (!wallet) {
            throw Error('wallet does not  exist!!')
        }
        if (!receiver) {
            throw Error('Account Number does not exist!!')
        }
        if(receiver){
           let credit = new Transaction({phone, amount,  debit:wallet.userId})
           let debit = new Transaction({userId, amount, credit: receiver.userId})
            receiver.balance = receiver.balance + amount
            receiver = await receiver.save()
            credit = credit.save()
            debit = debit.save()
            res.status(200).json({credit, debit, receiver, message: "fund received successfully"})
        };
    } catch (error) {
            res.status(404).json({error: error.message})
        }
}
    
// // // // // // send OTP token
const sendOtp = async (req, res) => {
    const {id, token} = req.body
    try {
        let user = await User.findOne({_id :id})

        if (!user) {
            throw Error('user does not  exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("verification failed")
        }
        
    
    // Generate the OTP secret in base32 format
    const secret = speakeasy.generateSecret({ length: 20 });
    console.log(secret)
        // // Create the OTP token
        const OTP = speakeasy.totp({
            secret: secret.base32,
            encoding: 'base32'
        });

        // // send the OTP token to the user
       const sendmessage = await twilio.messages.create({
            from:"+17655133822",
            to: user.phone,
            body:`This is your ${OTP} token, valid for 5 minutes`,
        })
        if(sendmessage){
            // user = await User.findOneAndCreate({userId: id},{secret:secret});
            // user = await user.save()
            res.status(200).json({OTP, secret, message: "Password reset link sent successfully"})
        }
        if(!sendmessage) {
           throw Error(error);
        }
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}

// // // // // // Verify OTP token
const verifyOtp = async (req, res) => {
    const {id, token, otp, secret} = req.body
    try {
        let user = await User.findOne({_id :id})

        if (!user) {
            throw Error('user does not  exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("user not verified failed")
        }
        // Verify an OTP token
        const verified = await speakeasy.totp.verify({
           secret: secret.base32,
           encoding: 'base32',
           token: otp,
           window: 4
        }); 
        

        if(!verified){
           throw Error('verification failed')
        }

        if(verified){
            res.status(200).json({verified, message: "Verification successfully"})
        }

    } catch (error) {
        res.status(404).json({error: error.message})
    }
}

// // // // // // Change Pin
const changePin = async (req, res) => {
    const {id, token} = req.body
    try {
        let user = await User.findOne({_id :id})

        if (!user) {
            throw Error('user does not  exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("verification failed")
        }

        // Verify an OTP token
        const verified = speakeasy.totp.verify({
           secret: secret.base32,
           encoding: 'base32',
           token: 'ENTER TOKEN HERE',
           window: 2  // Allow for a 2-step window of time for the token to be verified
        }); 

        if(!verified){
           throw Error("OTP verification failed")
        }

        if(verified){
            res.status(200).json({verified, message: "Verification successfully"})
        }

    } catch (error) {
        res.status(404).json({error: error.message})
}
}



module.exports = {
    wallet,
    createPin,
    sendMoney,
    receiveMoney,
    sendOtp,
    verifyOtp,
    changePin,
}