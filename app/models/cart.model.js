const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const cartSchema = new Schema({
    cartId: {
        type: Number,
        unique: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    lineItems: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: {
                type: Number,
                default: 1
            },
            price: Number
        }
    ],
    originalAmount: Number,  // 💡 Always store the original amount
    discountPercentage: {
        type: Number,
        default: 0,
    },
    discountAmount: {
        type: Number,
        default: 0
    },  // 💡 Amount reduced due to coupon
    totalAmount: Number,     // 💡 Final amount after applying discount
    appliedCoupon: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null,          // 💡 Store which coupon was used
    },
}, { timestamps: true })

cartSchema.plugin(AutoIncrement, { inc_field: 'cartId' });

const Cart = model('Cart', cartSchema)
module.exports = Cart