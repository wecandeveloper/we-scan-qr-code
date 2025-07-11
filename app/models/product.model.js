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
    discountExpiry: {
        type: Date,  // Optional: when the offer expires
    },
    categoryId: { 
        type: Schema.Types.ObjectId, 
        ref: "Category" 
    },
    storeId: { 
        type: Schema.Types.ObjectId, 
        ref: "Store" 
    },
    stock: { 
        type: Number, 
        default: 0 
    },
    tags: [String],
    images: [String],
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
}, { timestamps: true });

productSchema.plugin(AutoIncrement, { inc_field: 'productId' })

const Product = model('Product', productSchema)
module.exports = Product