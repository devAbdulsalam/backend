const express = require('express');
const router = express.Router()
const requireAuth = require('../middleware/requireAuth')
const { signinUser, loginUser, updateProfile, forgetPassword, resetPassword, changePassword} = require('../controller/userController')

// // get user
router.post('/login', loginUser)


// //new user
router.post('/signup', signinUser)


// //forgetPassword
router.post('/forget-password', forgetPassword)

// //resetPassword
router.get('/reset-password/:id/:token', resetPassword)


// //change Password
router.post('/change-password', changePassword)


// Authenticate user
router.use(requireAuth)

// //new user
router.post('/update', updateProfile)


module.exports = router