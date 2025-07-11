const express = require('express');
const router = express.Router();

const productCtlr = require('../controllers/product.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
// const categoryValidationSchema = require('../validators/product.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');
const productValidationSchema = require('../validators/product.validator');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            upload.array('images'),
            checkSchema(productValidationSchema),
            authenticateUser, 
            authorizeUser(['superAdmin', 'storeAdmin'])
        ],
        handler: productCtlr.create,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [],
        handler: productCtlr.list,
    },
    {
        method: 'get',
        path: '/listByStore/:storeId',
        middlewares: [],
        handler: productCtlr.listByStore,
    },
    {
        method: 'get',
        path: '/listByCategory/:categoryId',
        middlewares: [],
        handler: productCtlr.listByCategory,
    },
    {
        method: 'get',
        path: '/listByStoreAndCategory',
        middlewares: [],
        handler: productCtlr.listByStoreAndCategory,
    },
    {
        method: 'get',
        path: '/show/:productId',
        middlewares: [],
        handler: productCtlr.show,
    },
    {
        method: 'put',
        path: '/update/:productId',
        middlewares: [
            upload.array('images'),
            authenticateUser, 
            authorizeUser(['superAdmin', 'storeAdmin'])
        ],
        handler: productCtlr.update,
    },
    {
        method: 'delete',
        path: '/delete/:productId',
        middlewares: [authenticateUser, authorizeUser(['superAdmin'])],
        handler: productCtlr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router; 