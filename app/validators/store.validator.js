const Store = require("../models/store.model");

const storeValidationSchema = {
    name: {
        notEmpty: {
            errorMessage: "Store name is required",
        },
        custom:{
            options : async function (value){
                const store = await Store.findOne({
                    name: value,
                    $or: [
                        { isRejected: { $exists: false } },
                        { isRejected: false }
                    ]
                })
                if(!store){
                    return true
                }else{
                    throw new Error('Store name already exist')
                }
            }
        },
    },

    city: {
        notEmpty: {
            errorMessage: "Store City is required",
        },
        // optional: true,
        isString: {
            errorMessage: "City must be a string",
        },
        trim: true,
    },

    area: {
        notEmpty: {
            errorMessage: "Store Area is required",
        },
        // optional: true,
        isString: {
            errorMessage: "Area must be a string",
        },
        trim: true,
    },

    address: {
        optional: true,
        isString: {
            errorMessage: "Address must be a string",
        },
        trim: true,
    },

    latitude: {
        notEmpty: {
            errorMessage: "Store Location Latitude value is required",
        },
        isFloat: {
            errorMessage: "Latitude must be a valid number",
        },
    },

    longitude: {
        notEmpty: {
            errorMessage: "Store Location Longitude value is required",
        },
        isFloat: {
            errorMessage: "Longitude must be a valid number",
        },
    },


    contactNumber: {
        optional: true,
        notEmpty: {
            errorMessage: "Store Contact number is required",
        },
        isMobilePhone: {
            options: ['any'],
            errorMessage: "Contact number must be a valid mobile number",
        },
    },

    // Multiple Image  // image: [String],

    // images: {
    //     // optional: true,
    //     isArray: {
    //         errorMessage: "Image must be an array of strings",
    //     },
    //     custom: {
    //     options: (value) => {
    //         if (value.every((item) => typeof item === "string")) {
    //             return true;
    //             }
    //             throw new Error("Each image must be a string URL or path");
    //         },
    //     },
    // },

    isOpen: {
        optional: true,
        isBoolean: {
            errorMessage: "isOpen must be a boolean value",
        },
        toBoolean: true,  // Converts string 'true'/'false' to boolean
    },
};


module.exports = storeValidationSchema