const { Types } = require("mongoose");
const Category = require("../models/category.model");
const Store = require("../models/store.model");

const productValidationSchema = {
    
    name: {
        notEmpty: {
            errorMessage: "Product name is required",
        },
        isString: {
            errorMessage: "Product name must be a string",
        },
        trim: true,
    },

    description: {
        optional: true,
        isString: {
            errorMessage: "Description must be a string",
        },
        trim: true,
    },

    price: {
        notEmpty: {
            errorMessage: "Product price is required",
        },
        isFloat: {
            options: { min: 0 },
            errorMessage: "Price must be a valid number greater than or equal to 0",
        },
    },

    offerPrice: {
        optional: true,
        isFloat: {
            options: { min: 0 },
            errorMessage: "Offer price must be a valid number greater than or equal to 0",
        },
    },

    discountPercentage: {
        optional: true,
        isFloat: {
            options: { min: 0, max: 100 },
            errorMessage: "Discount percentage must be between 0 and 100",
        },
    },

    discountExpiry: {
        optional: true,
        custom: {
            options: (value) => {
                if (!value) return true; // allow empty
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    throw new Error("Discount expiry must be a valid date");
                }
                return true;
            }
        }
    },

    categoryId: {
        notEmpty: {
            errorMessage: "Category ID is required",
        },
        custom: {
            options: async (value) => {
                if (!Types.ObjectId.isValid(value)) {
                    throw new Error("Invalid Category ID");
                }
                
                const category = await Category.findById(value);
                if (!category) {
                    throw new Error("Category not found");
                }
                
                return true;
            },
        },
    },

    // storeId: {
    //     notEmpty: {
    //         errorMessage: "Store ID is required",
    //     },
    //     custom: {
    //         options: async (value) => {
    //             if (!Types.ObjectId.isValid(value)) {
    //                 throw new Error("Invalid Store ID");
    //             }
                
    //             const store = await Store.findById(value);
    //             if (!store) {
    //                 throw new Error("Store not found");
    //             }
                
    //             return true;
    //         },
    //     },
    // },

    stock: {
        optional: true,
        isInt: {
            options: { min: 0 },
            errorMessage: "Stock must be a non-negative integer",
        },
    },

    tags: {
        optional: true,
        isArray: {
            errorMessage: "Tags must be an array of strings",
        },
        custom: {
            options: (value) => {
                if (value.every((tag) => typeof tag === "string")) {
                    return true;
                }
                throw new Error("Each tag must be a string");
            },
        },
    },

    images: {
        optional: true,
        isArray: {
            errorMessage: "Images must be an array of strings",
        },
        custom: {
            options: (value) => {
                if (value.every((img) => typeof img === "string")) {
                    return true;
                }
                throw new Error("Each image must be a string URL or path");
            },
        },
    },

    isAvailable: {
        optional: true,
        isBoolean: {
            errorMessage: "isAvailable must be a boolean value",
        },
        toBoolean: true,
    },
};

module.exports = productValidationSchema;