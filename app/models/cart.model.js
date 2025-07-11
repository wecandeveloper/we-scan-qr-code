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
    totalAmount: Number
}, { timestamps: true })

cartSchema.plugin(AutoIncrement, { inc_field: 'cartId' });

const Cart = model('Cart', cartSchema)
module.exports = Cart