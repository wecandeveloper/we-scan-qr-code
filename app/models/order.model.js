const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const orderSchema = new Schema ({
    orderId: {
        type: Number,
        unique: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: 'Store'
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
    deliveryAddress: {
        name: String,
        addressNo: String,
        street: String,
        city: String,
        state: String,
        pincode: String,
        phone: {
            countryCode: String,
            number: String
        }
    },
    totalAmount: Number,
    status: {
        type: String,
        enum: ['Placed', 'Canceled', 'Dispatched', 'Delivered'],
        default: "Placed"
    },
    paymentMethod: String,
    orderDate: { 
        type: Date, 
        default: Date.now 
    },
}, { timestamps : true })

orderSchema.plugin(AutoIncrement, { inc_field: 'orderId' });

const Order = model('Order', orderSchema)
module.exports = Order