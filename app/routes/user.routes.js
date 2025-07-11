const express = require('express');
const router = express.Router();
const {
    registerValidationSchema,
    loginValidationSchema,
    updateUserValidationSchema
} = require('../validators/user.validator');
const userCtlr = require('../controllers/user.controller');
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util'); // Import the utility
const { checkSchema } = require('express-validator');
// Define your routes in an array
const routes = [
    {
        method: 'post',
        path: '/register',
        middlewares: [checkSchema(registerValidationSchema)],
        handler: userCtlr.register
    },
    {
        method: 'post',
        path: '/login',
        middlewares: [checkSchema(loginValidationSchema)],
        handler: userCtlr.login
    },
    {
        method: 'get',
        path: '/account',
        middlewares: [authenticateUser, authorizeUser(["customer", "storeAdmin", "superAdmin"])],
        handler: userCtlr.account
    },
    {
        method: 'put',
        path: '/update',
        middlewares: [authenticateUser, checkSchema(updateUserValidationSchema)],
        handler: userCtlr.updateUser
    },
    {
        method: 'post',
        path: '/send-phone-otp',
        middlewares: [],
        handler: userCtlr.sendPhoneOtp
    },
    {
        method: 'post',
        path: '/verify-phone-otp',
        middlewares: [],
        handler: userCtlr.verifyPhoneOtp
    },
    {
        method: 'post',
        path: '/send-mail-otp',
        middlewares: [],
        handler: userCtlr.sendMailOtp
    },
    {
        method: 'post',
        path: '/verify-mail-otp',
        middlewares: [],
        handler: userCtlr.verifyMailOtp
    },
    // {
    //     method: 'get',
    //     path: '/users-list',
    //     middlewares: [authenticateUser, authorizeUser(['ad'])],
    //     handler: userCtlr.getUsersList
    // },
    // {
    //     method: 'get',
    //     path: '/one-user',
    //     middlewares: [authenticateUser, authorizeUser(['ad'])],
    //     handler: userCtlr.getOneUser
    // },
    // {
    //     method: 'put',
    //     path: '/approve-user',
    //     middlewares: [authenticateUser, authorizeUser(['ad'])],
    //     handler: userCtlr.approveUser
    // },
    // {
    //     method: 'put',
    //     path: '/reject-user',
    //     middlewares: [authenticateUser, authorizeUser(['ad'])],
    //     handler: userCtlr.rejectUser
    // }
];

// Use the utility to set up the routes
setupRoutes(router, routes);

module.exports = router;