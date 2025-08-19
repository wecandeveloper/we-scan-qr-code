const express = require('express');
const router = express.Router();

const orderCtlr = require('../controllers/order.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const {changeOrderValidationShcema, orderValidationSchema} = require('../validators/order.validator');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            checkSchema(orderValidationSchema)
        ],
        handler: orderCtlr.create,
    },
    {
        method: 'put',
        path: '/cancel/:guestId/:orderId',
        middlewares: [
            checkSchema(changeOrderValidationShcema)
        ],
        handler: orderCtlr.cancelOrder,
    },
    {
        method: 'put',
        path: '/changeStatus/:orderId',
        middlewares: [
            authenticateUser,
            authorizeUser(['restaurantAdmin']),
            checkSchema(changeOrderValidationShcema)
        ],
        handler: orderCtlr.changeStatus,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [],
        handler: orderCtlr.listAllOrders,
    },
    {
        method: 'get',
        path: '/listRestaurantOrders',
        middlewares: [
            authenticateUser,
            authorizeUser(['restaurantAdmin'])
        ],
        handler: orderCtlr.listRestaurantOrders,
    },
    {
        method: 'get',
        path: '/myOrders/:guestId',
        middlewares: [],
        handler: orderCtlr.getMyOrders,
    },
    {
        method: 'get',
        path: '/show/:orderId',
        middlewares: [],
        handler: orderCtlr.show,
    },
    {
        method: 'delete',
        path: '/delete/:orderId',
        middlewares: [
            authenticateUser,
            authorizeUser(['restaurantAdmin'])
        ],
        handler: orderCtlr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router; 