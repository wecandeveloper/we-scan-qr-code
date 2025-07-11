const express = require('express');
const router = express.Router();

const storeCtlr = require('../controllers/store.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const storeValidationSchema = require('../validators/store.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            upload.array('images'),
            checkSchema(storeValidationSchema),
            authenticateUser, 
            authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.create,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.list,
    },
    {
        method: 'get',
        path: '/show/:storeId',
        middlewares: [
            authenticateUser, 
            authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.list,
    },
    {
        method: 'get',
        path: '/listByCity',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.listByCity,
    },
    {
        method: 'get',
        path: '/listNearBy',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.listNearby,
    },
    {
        method: 'put',
        path: '/update/:storeId',
        middlewares: [
            upload.array('images'),
            authenticateUser, 
            authorizeUser(['superAdmin', 'storeAdmin']),
        ],
        handler: storeCtlr.update,
    },
    {
        method: 'delete',
        path: '/delete/:storeId',
        middlewares: [
            authenticateUser, 
            authorizeUser(['superAdmin'])
        ],
        handler: storeCtlr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router;