const express = require('express');
const router = express.Router();

const restaurantCtlr = require('../controllers/restaurant.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const restaurantValidationSchema = require('../validators/restaurant.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            upload.array('images'),
            checkSchema(restaurantValidationSchema),
            authenticateUser, 
            authorizeUser(['restaurantAdmin'])
        ],
        handler: restaurantCtlr.create,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: restaurantCtlr.list,
    },
    {
        method: 'get',
        path: '/show/:restaurantSlug',
        middlewares: [],
        handler: restaurantCtlr.show,
    },
    {
        method: 'get',
        path: '/myRestaurant',
        middlewares: [
            authenticateUser,
            authorizeUser(['restaurantAdmin'])
        ],
        handler: restaurantCtlr.myRestaurant,
    },
    {
        method: 'get',
        path: '/listByCity',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: restaurantCtlr.listByCity,
    },
    {
        method: 'get',
        path: '/listNearBy',
        middlewares: [
            // authenticateUser, 
            // authorizeUser(['superAdmin'])
        ],
        handler: restaurantCtlr.listNearby,
    },
    {
        method: 'put',
        path: '/update/:restaurantId',
        middlewares: [
            upload.array('images'),
            authenticateUser, 
            authorizeUser(['superAdmin', 'restaurantAdmin']),
        ],
        handler: restaurantCtlr.update,
    },
    {
        method: 'put',
        path: '/:restaurantId/approve',
        middlewares: [
            authenticateUser, 
            authorizeUser(['superAdmin']),
        ],
        handler: restaurantCtlr.approveRestaurant,
    },
    {
        method: 'put',
        path: '/:restaurantId/block',
        middlewares: [
            authenticateUser, 
            authorizeUser(['superAdmin']),
        ],
        handler: restaurantCtlr.blockRestaurant,
    },
    {
        method: 'delete',
        path: '/delete/:restaurantId',
        middlewares: [
            authenticateUser, 
            authorizeUser(['superAdmin', 'restaurantAdmin']),
        ],
        handler: restaurantCtlr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router;