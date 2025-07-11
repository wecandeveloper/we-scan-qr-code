const express = require('express');
const router = express.Router();

const categoryCtlr = require('../controllers/category.controller')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const categoryValidationSchema = require('../validators/category.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            upload.single('image'), 
            checkSchema(categoryValidationSchema), 
            authenticateUser,
            authorizeUser(['superAdmin'])
        ],
        handler: categoryCtlr.create,
    },
    {
        method: 'get',
        path: '/list',
        middlewares: [],
        handler: categoryCtlr.list,
    },
    {
        method: 'get',
        path: '/show/:categoryId',
        middlewares: [],
        handler: categoryCtlr.show,
    },
    {
        method: 'put',
        path: '/update/:categoryId',
        middlewares: [
            upload.single('image'), 
            authenticateUser, 
            authorizeUser(['superAdmin', 'storeAdmin'])
        ],
        handler: categoryCtlr.update,
    },
    {
        method: 'delete',
        path: '/delete/:categoryId',
        middlewares: [authenticateUser, authorizeUser(['superAdmin'])],
        handler: categoryCtlr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router;  // Export the router to use in the main app.js file.