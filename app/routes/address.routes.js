const express = require('express');
const router = express.Router();

const addressCltr = require('../controllers/address.controllers')
const { authenticateUser, authorizeUser } = require('../middlewares/auth');
const setupRoutes = require('./route.util');
const { checkSchema } = require('express-validator');
const addressValidationSchema = require('../validators//address.validator');
const upload = require('../services/cloudinaryService/cloudinary.multer');

const routes = [
    {
        method: 'post',
        path: '/create',
        middlewares: [
            upload.single('image'), 
            checkSchema(addressValidationSchema), 
            authenticateUser,
            authorizeUser(['customer'])
        ],
        handler: addressCltr.create,
    },
    {
        method: 'get',
        path: '/myAddresses',
        middlewares: [
            authenticateUser, 
            authorizeUser(['customer'])
        ],
        handler: addressCltr.myAddresses,
    },
    {
        method: 'put',
        path: '/update/:addressId',
        middlewares: [
            authenticateUser, 
            authorizeUser(['customer'])
        ],
        handler: addressCltr.update,
    },
    {
        method: 'put',
        path: '/update/:addressId/setAsDefault',
        middlewares: [
            authenticateUser, 
            authorizeUser(['customer'])
        ],
        handler: addressCltr.setAsDefault,
    },
    {
        method: 'delete',
        path: '/delete/:addressId',
        middlewares: [
            authenticateUser, 
            authorizeUser(['customer'])
        ],
        handler: addressCltr.delete,
    },
]

setupRoutes(router, routes);
module.exports = router;  // Export the router to use in the main app.js file.