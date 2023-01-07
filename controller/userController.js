const User = require('../models/userModel')
const Wallet = require('../models/walletModel')
const Transaction = require('../models/transactionModel')
const jwt = require('jsonwebtoken')
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const createToken = (_id) => {
  return jwt.sign({_id}, process.env.SECRET, { expiresIn: '3d' })
}
// email config

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.EMAIL,
        pass:process.env.PASSWORD
    }
}) 


// // login user
const loginUser = async (req, res) => {
    const {phone, password} = req.body
    try {
        // retrieve user and wallet and transaction history
        const user = await User.login(phone, password)
        const wallet = await Wallet.findOne({ userId: user._id});
        const transaction = await Transaction.findOne({ userId: user._id});
        // create a token
        const token = createToken(user._id)
    
        res.status(200).json({user, wallet, transaction, token, message : "Log in successfully"})
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}

// // signinUser
const signinUser = async (req, res) => {
    const {name, phone,  password} = req.body
    try {
        const user = await User.signup(name, phone, password)
        // create new wallet and transaction history for user
         const wallet = await Wallet.create({ userId: user._id, balance : "0", phone });
         const transaction = await Transaction.create({ userId: user._id });
         // create a token
        const token = createToken(user._id)

        res.status(200).json({user, token, wallet, transaction, message: "Account created successfully"})
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}


// update User
const updateProfile = async (req, res) => {
    const {id, name, phone, address, email} = req.body
    
    try{
        let user = await User.findOne({_id :id})
        if(!user){
            throw Error('user does not exist!!')
        }
        if(user){
            user.name = name || req.body.name || user.name
            user.phone = phone || req.body.phone || user.phone
            user.address = address ||req.body.address || user.address
            user.email = email || req.body.email || user.email
        }
        let wallet = await Wallet.findOneAndUpdate({userId: id},{phone:phone});
         user = await user.save()
        res.status(200).json({user, wallet, message: 'user Profile updated successfully'})
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}



// user profile pic
const updateImage =  async (req, res) => {
  const {name, phone, email, address} = JSON.parse(req.body.user)
  console.log(name, phone, email, address)
  try {
    const image = req.files.image
      const fileName =  new Date().getTime().toString() + path.extname(image.name);
      const savePath = path.join(__dirname, "public", "uploads", fileName);
      await image.mv(savePath)
      let user = await User.findOne({_id :id})
      if(!user){
            throw Error('user does not exist!!')
        }
        if(user){
            user.name = name || req.body.name || user.name
            user.phone = phone || req.bodyphone || user.phone
            user.address = address ||req.body.address || user.address
            user.email = email || req.body.email || user.email
            user.image = fileName
        }
      user = await user.save()
      res.status(200).json({ message : "image upload Successfully"})
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}

// // forget Password
const forgetPassword = async (req, res) => {
    const {email} = req.body
    try {
        const user = await User.fgtpswd(email)
        // create a token
        const token = createToken(user._id)
        const link = `http://localhost:3000/resetpassword/${user._id}/${token}`;

        const mailoption = {
            from: 'ammuftau74@gmail.com', // sender address
            to: email, // receivers address
            subject: "Email for Password Reset", // Subject line
            text: `This Link is valid for 2 Minutes ${link}`, // plain text body
            html: `<p>This Link is valid for 2 Minutes ${link}</p>`, 
        } 
        
        transporter.sendMail(mailoption, (error, info) => {
            if(error){
                // console.log(error, "error");
                res.status(401).json({error: error})
            }else{
                // console.log(info.response, "success");
                res.status(200).json({token, info, message: "Password reset link sent successfully"})
            }
        })
    } catch (error) {
        res.status(404).json({error: error})
    }
}

// // reset Password
const resetPassword = async (req, res) => {
    const {id, token} = req.params
    try {
        let user = await User.find({_id :id})

        if (!user) {
            throw Error('User does not  exist!!')
        }
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)

        if(!verify){
           throw Error("verification failed")
        }
        res.status(200).json({user, verify, token, message : "Password Reset Successfully"})

    } catch (error) {
        res.status(401).json({error : error, message : "Something went wrong"})
    }
}

// // change Password
const changePassword = async (req, res) => {
    const {id, token, password, confirmPassword} = req.body
    try {
        // // verify the token
        const verify =  jwt.verify(token, process.env.SECRET)
        if(!verify){
            return res.status(401).json({error: "verification failed"}) 
        }
        if(verify){

            const newpassword = await User.changepsw(id, password, confirmPassword)
            
            let user = await User.findByIdAndUpdate({_id:id},{password:newpassword});
            
            user = await user.save()
            res.status(200).json({user, message: "Password Changed Successfully"})

        }else{
            res.status(401).json({status:401, message:"user not exist"})
        }
    } catch (error) {
        res.status(404).json({error: error.message})
    }
}




module.exports = {
    signinUser,
    loginUser,
    updateProfile,
    updateImage,
    forgetPassword,
    resetPassword,
    changePassword,
}