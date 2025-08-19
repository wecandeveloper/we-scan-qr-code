const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const orderSchema = new Schema ({
    orderId: {
        type: Number,
        unique: true
    },
    orderNo: {
        type: String,
        unique: true,
        required: true
    },
    guestId: String,
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    tableId: {
        type: Schema.Types.ObjectId,
        ref: 'Table'
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
    totalAmount: Number,
    status: {
        type: String,
        enum: ['Placed', 'Preparing', 'Ready', 'Cancelled'],
        default: "Placed"
    },
    orderDate: { 
        type: Date, 
        default: Date.now 
    },
}, { timestamps : true })

orderSchema.plugin(AutoIncrement, { inc_field: 'orderId' });

const Order = model('Order', orderSchema)
module.exports = Order