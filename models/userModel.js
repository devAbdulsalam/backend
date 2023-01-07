const validator = require("validator");
const bcrypt = require("bcryptjs");
const  mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name:{
        type : String,
        require: true
    },
    image:{
        type : String,
        require: true
    },
    email:{
        type : String,
        require: true,
        unique: true
    },
    address:{
        type : String,
        require: true
    },
    phone:{
        type : String,
        require: true,
        unique: true
    },
    password:{
        type : String,
        require: true
    }
});

// static signup method
userSchema.statics.signup = async function(name, phone,  password) {
    if (!name) {
        throw Error('Name is required')
    }
    if (!password) {
        throw Error('Password is required')
    }
    if (!phone ) {
        throw Error('Phone Number is required')
    }
        // //Validator
    if(!validator.isStrongPassword(password)){
        throw Error('Input a strong password')
    }

   const phoneexists = await this.findOne({ phone })

  if (phoneexists) {
    throw Error('Phone Number already Exists')
  }

  // const emailexists = await this.findOne({ email })

  // if (emailexists) {
  //   throw Error('Email Address already Exists')
  // }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  const user = await this.create({ name, phone, password : hash})
  return user
}

// static login method
userSchema.statics.login = async function(phone, password) {

  if (!phone  && !password) {
    throw Error('All fields must be filled')
  }

  let user = await this.findOne({phone})

  if (!user) {
    throw Error('user does not  exixt')
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw Error('Incorrect password')
  }

  return user
}


// static forgot password method
userSchema.statics.fgtpswd = async function(email) {

  if (!email) {
    throw Error('Email is required')
  }

  let user = await this.findOne({ email})

  if (!user) {
    throw Error('User does not  exist!!')
  }

  return user
}

// //change password
userSchema.statics.changepsw = async function(id, password, confirmPassword) {
   let user = await this.findOne({_id: id})

  if (!user) {
    throw Error('User does not  exist!!')
  }
  if (password !== confirmPassword) {
    throw Error('passwords does not  match!!')
  }

  if(!validator.isStrongPassword(password)){
        throw Error('Input a strong password')
    }

  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  

  return hash
}

module.exports = mongoose.model('User', userSchema);