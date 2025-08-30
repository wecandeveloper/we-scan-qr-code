const { Schema, model } =  require("mongoose")
const AutoIncrement = require('mongoose-sequence')(require('mongoose'));

const productSchema = new Schema({
    productId: {
        type: Number,
        unique: true
    },
    name: { 
        type: String, 
        required: true 
    },
    description: String,
    price: { 
        type: Number, 
        required: true
    },
    offerPrice: { 
        type: Number, 
        default: 0 // or null if no offer
    },
    discountPercentage: {
        type: Number, // Example: 15 for 15%
        default: 0
    },
    discountExpiry: Date,
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: "Category",
        required: true
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    tags: [String],
    // images: [String],
    images: [
        {
            url: String,
            publicId: String,
            hash: String,
        }
    ],
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    isFeatured: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

productSchema.plugin(AutoIncrement, { inc_field: 'productId' })

const Product = model('Product', productSchema)
module.exports = Product