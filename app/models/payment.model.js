const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const paymentSchema = new Schema  ({
    paymentId: {
        type: Number,
        unique: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'Cart'
    },
    lineItems: [
        {
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
            price: Number
        }
    ],
    sessionID:  {
        type: String,
        default: null
    },
    transactionID:  {
        type: String,
        default: null
    },
    originalAmount: Number,
    discountAmount: {
        type: Number,
        default: 0
    },
    shippingCharge: {
        type: Number,
        default: 0
    },
    totalAmount: Number,
    paymentType: String,
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Successful', 'Failed'],
        default: "Pending"
    }
}, { timestamps: true })

paymentSchema.plugin(AutoIncrement, { inc_field: 'paymentId' });

const Payment = model('Payment', paymentSchema)
module.exports = Payment