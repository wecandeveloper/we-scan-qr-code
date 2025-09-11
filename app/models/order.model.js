const { Schema, model } = require('mongoose');
const AutoIncrement = require("mongoose-sequence")(require("mongoose"));

const orderSchema = new Schema({
    orderId: {
        type: Number,
        unique: true // Global auto-increment ID
    },
    orderNo: {
        type: String,
        required: true // Not unique anymore
    },
    orderType: {
        type: String,
        enum: ['Dine-In', 'Home-Delivery', 'Take-Away'],
        default: "Placed"
    },
    deliveryAddress: Object,
    guestId: String,
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
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
    }
}, { timestamps: true });

// Auto-increment orderId globally
orderSchema.plugin(AutoIncrement, { inc_field: 'orderId' });

// Make orderNo unique per restaurant
orderSchema.index({ restaurantId: 1, orderNo: 1 }, { unique: true });

const Order = model('Order', orderSchema);
module.exports = Order;