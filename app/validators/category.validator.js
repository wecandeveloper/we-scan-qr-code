const Category = require('../models/category.model');  // Adjust path as per your project structure

const categoryValidationSchema = {
    name: {
        notEmpty: {
            errorMessage: "Category name is required",
        },
        custom: {
        options: async function (value) {
            const category = await Category.findOne({ name: value });
            if (!category) {
            return true;
            } else {
            throw new Error("Category name already exists");
            }
        },
        },
        trim: true,
    },

    description: {
        // optional: true, // Description is not required
        isString: {
            errorMessage: "Description must be a string",
        },
        trim: true,
    },

    // image: String,  // Single image URL

    // image: {
    //     notEmpty: {
    //         errorMessage: "Product Category Image is required",
    //     },
    //     // optional: true,
    //     isString: {
    //         errorMessage: "Image must be a string URL",
    //     },
    // },
};

module.exports = categoryValidationSchema;