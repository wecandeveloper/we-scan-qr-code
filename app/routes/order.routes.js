const express = require('express');
const router = express.Router();

const orderCtlr = require('../controllers/order.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');

const routes = [
    {
        method: 'post',
        path: '/create/:paymentId',
        middlewares: [
            authenticateUser,
        ],
        handler: orderCtlr.create,
    },
    {
        method: 'put',
        path: '/cancel/:orderId',
        middlewares: [
            authenticateUser,
            authorizeUser(['customer', 'superAdmin', 'storeAdmin'])
        ],
        handler: orderCtlr.cancelOrder,
    },
    {
        method: 'put',
        path: '/changeStatus/:orderId',
        middlewares: [
            authenticateUser,
            authorizeUser(['superAdmin', 'storeAdmin'])
        ],
        handler: orderCtlr.changeStatus,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [
            authenticateUser,
        ],
        handler: orderCtlr.listOrders,
    },
    {
        method: 'get',
        path: '/myOrders',
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: orderCtlr.getMyOrders,
    },
        {
        method: 'get',
        path: '/show/:orderId',
        middlewares: [
            authenticateUser,
            authorizeUser(['customer', 'storeAdmin', 'superAdmin'])
        ],
        handler: orderCtlr.show,
    },
]

setupRoutes(router, routes);
module.exports = router; 