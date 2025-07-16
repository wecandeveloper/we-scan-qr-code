const express = require('express');
const router = express.Router();

const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
// const { checkSchema } = require('express-validator');
// const categoryValidationSchema = require('../validators/product.validator');
// const upload = require('../services/cloudinaryService/cloudinary.multer');
const cartCtlr = require('../controllers/cart.controller');

const routes = [
    {
        method: "post",
        path: "/create",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.create
    },
    {
        method: "get",
        path: "/myCart",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.myCart
    },
    {
        method: "delete",
        path: "/emptyCart",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.emptyCart
    },
    {
        method: "put",
        path: "/incQty/:productId",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.incQty
    },
    {
        method: "put",
        path: "/decQty/:productId",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.decQty
    },
    {
        method: "delete",
        path: "/removeLineItem/:productId",
        middlewares: [
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: cartCtlr.removeLineItem
    },
]

setupRoutes(router, routes);
module.exports = router; 