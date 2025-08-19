const express = require('express');
const router = express.Router();

const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const restaurantValidationSchema = require('../validators/restaurant.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');
const tableCtlr = require('../controllers/table.controller');

const routes = [
    {
        method: 'get',
        path: '/listAll',
        middlewares: [],
        handler: tableCtlr.listAll
    },
    {
        method: 'get',
        path: '/listByRestaurant/:restaurantId',
        middlewares: [],
        handler: tableCtlr.listByRestaurant
    },
]

setupRoutes(router, routes);
module.exports = router;