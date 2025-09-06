const { Types } = require('mongoose');
const Restaurant = require('../models/restaurant.model');
const Table = require('../models/table.model');
const Product = require('../models/product.model');

const orderValidationSchema = {
    restaurantId: {
        notEmpty: {
            errorMessage: "Restaurant ID is required",
        },
        custom: {
            options: async (value) => {
                if (!Types.ObjectId.isValid(value)) {
                    throw new Error("Invalid Restaurant ID");
                }

                const restaurant = await Restaurant.findById(value);
                if (!restaurant) {
                    throw new Error("Restaurant not found");
                }
                return true;
            },
        },
    },
    // tableId: {
    //     notEmpty: {
    //         errorMessage: "Table ID is required",
    //     },
    //     custom: {
    //         options: async (value) => {
    //             if (!Types.ObjectId.isValid(value)) {
    //                 throw new Error("Invalid Table ID");
    //             }

    //             const table = await Table.findById(value);
    //             if (!table) {
    //                 throw new Error("Table not found");
    //             }
    //             return true;
    //         },
    //     },
    // },
    lineItems: {
        isArray: {
            errorMessage: "Line items must be an array",
        },
        custom: {
            options: async (lineItems) => {
                if (!lineItems.length) {
                    throw new Error("At least one line item is required");
                }

                for (const item of lineItems) {
                    if (!item.productId || !Types.ObjectId.isValid(item.productId)) {
                        throw new Error("Invalid product ID in line items");
                    }

                    const product = await Product.findById(item.productId);
                    if (!product) {
                        throw new Error(`Product not found for ID: ${item.productId}`);
                    }

                    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
                        throw new Error("Quantity must be a positive number");
                    }
                }

                return true;
            },
        },
    },
    status: {
        optional: true, // Allow default to work if not passed
        isIn: {
            options: [['Placed', 'Preparing', 'Ready', 'Cancelled']],
            errorMessage: "Status must be one of: Placed, Preparing, Ready, or Cancelled",
        },
    }
};

const changeOrderValidationShcema = {
    status: {
        optional: true, // Allow default to work if not passed
        isIn: {
            options: [['Placed', 'Preparing', 'Ready', 'Cancelled']],
            errorMessage: "Status must be one of: Placed, Preparing, Ready, or Cancelled",
        },
    }
}

module.exports = {
    orderValidationSchema,
    changeOrderValidationShcema
};