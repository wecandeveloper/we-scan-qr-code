const express = require('express');
const router = express.Router();

const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');

const paymentsCtlr = require('../controllers/payment.controller');

const routes = [
    {
        method: "post",
        path: "/",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: paymentsCtlr.payment
    },
    {
        method: "get",
        path: "/session/:sessionID",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: paymentsCtlr.getSession
    },
    {
        method: "post",
        path: "/session/:sessionID/success",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: paymentsCtlr.successUpdate
    },
    {
        method: "post",
        path: "/session/:sessionID/failed",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: paymentsCtlr.failedUpdate
    },
    {
        method: "get",
        path: "/history",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: paymentsCtlr.myHistory
    },
    {
        method: "get",
        path: "/AllHistory",
        middlewares: [
            authenticateUser,
            authorizeUser(['storeAdmin', 'superAdmin'])
        ],
        handler: paymentsCtlr.list
    },
    {
        method: "get",
        path: "/AllPaymentStoreHistory",
        middlewares: [
            authenticateUser,
            authorizeUser(['storeAdmin', 'superAdmin'])
        ],
        handler: paymentsCtlr.list
    },
    {
        method: "get",
        path: "/list/:paymentId",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer', 'storeAdmin', 'superAdmin'])
        ],
        handler: paymentsCtlr.show
    },
]

setupRoutes(router, routes);
module.exports = router; 