const { default: mongoose } = require('mongoose')
const Cart = require('../models/cart.model')
const Order = require('../models/order.model')
const Payment = require('../models/payment.model')

const {pick} = require('lodash')
const Product = require('../models/product.model')

const orderCtlr = {}

orderCtlr.create = async ({ params: { paymentId }, user, body }) => {
    const orderObj = { ...body }
    // console.log(body)

    orderObj.customerId = user.id
    const cart = await Cart.findOne({ customerId: user.id })
    console.log(cart)
    if (!cart) {
        return { status: 400, message: "Your Cart is Empty" }
    }
    orderObj.lineItems = cart.lineItems
    orderObj.totalAmount = cart.totalAmount
    // orderObj.status = "Placed"
    const payment = await Payment.findOne({ _id: paymentId, customerId: user.id })
    // console.log("payment", payment)
    if(!payment) {
        return { status: 400, message: "Invalid payment" }
    } else {
    if (payment.paymentStatus == 'Successful') {
        const order = await Order.create(orderObj);
        
        // Update stock for each product in the order
        const stockUpdatePromises = orderObj.lineItems.map(async (item) => {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock = Math.max(product.stock - item.quantity, 0); // prevent negative stock
                await product.save();
            }
        });

        await Promise.all(stockUpdatePromises);

        const newOrder = await Order.findById(order._id)
            .populate({
                path: 'lineItems.productId',
                select: ['name', 'images'],
                populate: { path: 'categoryId', select: ['name'] }
            })
            .populate('customerId', ['firstName', 'lastName', 'email.address']);

        await Cart.findByIdAndDelete(cart._id);

        return {
            message: 'Order Placed Successfully',
            data: newOrder
        };
    } else {
            return { status: 400, message: "Payment failed" }
        }
    }
}

orderCtlr.listOrders = async () => {
    const orders = await Order.find().sort({ createdAt : -1 })
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price'], populate: { path: 'categoryId', select: ['name']} })
        .populate('customerId', ['firstName', 'lastName', 'email']);
    // console.log(orders)
    
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

orderCtlr.getMyOrders = async ({ user }) => {
    const orders = await Order.find({ customerId : user.id }).sort({ orderId : 1 })
        .populate({ path: 'lineItems.productId', select : ['name', 'images'], populate: { path: 'categoryId', select: ['name']} })
        .populate('customerId', ['firstName', 'lastName', 'email.address']);
    // console.log(orders)
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

orderCtlr.show = async ({ params: { orderId }, user }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            throw { status: 400, message: "Valid Category ID is required" };
        }

    if(user.role === 'customer') {
        const order = await Order.findOne({_id : orderId, customerId: user.id })
            .populate({ path: 'lineItems.productId', select : ['name', 'images'], populate: { path: 'categoryId', select: ['name']} })
            .populate('customerId', ['firstName', 'lastName', 'email.address']);

        if(!order) {
            return { message: "No Order found", data: null };
        }
        
        return { data: order };
    } else {
        const order = await Order.findById(orderId)
            .populate({ path: 'lineItems.productId', select : ['name', 'images'], populate: { path: 'categoryId', select: ['name']} })
            .populate('customerId', ['firstName', 'lastName', 'email.address']);

        if(!order) {
            return { message: "No Order found", data: null };
        }
        
        return { data: order };
    }
}

orderCtlr.cancelOrder = async ({ params: { orderId }, user, body }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }

    const updatedBody = pick(body, ['status']);
    let canceledOrder;

    const query = user.role === 'customer'
        ? { _id: orderId, customerId: user.id }
        : { _id: orderId };

    canceledOrder = await Order.findOneAndUpdate(query, updatedBody, { new: true })
        .populate({ 
            path: 'lineItems.productId', 
            select : ['name', 'images', 'stock'], 
            populate: { path: 'categoryId', select: ['name'] } 
        })
        .populate('customerId', ['firstName', 'lastName', 'email.address']);

    if (!canceledOrder) {
        return { message: "No Order found", data: null };
    }

    // ✅ If order status changed to "Cancelled", restore stock
    if (updatedBody.status === "Canceled") {
        const lineItems = canceledOrder.lineItems;
        console.log("cancelled Order", lineItems)
        for (const item of lineItems) {
            const product = item.productId;
            const quantityToRestore = item.quantity;

            if (product && product._id) {
                await Product.findByIdAndUpdate(
                    product._id,
                    { $inc: { stock: quantityToRestore } }
                );
            }
        }
    }

    return {
        message: 'Order Cancelled Successfully',
        data: canceledOrder
    };
};


orderCtlr.changeStatus = async ({ params: { orderId }, body }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }

    if (!body?.status || typeof body?.status !== "string") {
        throw { status: 400, message: "Order status is required" };
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return { message: "Order not found", data: null };
    }

    const updatedBody = pick(body, ['status']);
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatedBody, { new: true });

    return {
        message: 'Order Status Changed',
        status: updatedOrder.status,
        data: updatedOrder
    };
};

orderCtlr.delete = async ({ params: { orderId } }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }
    const order = await Order.findByIdAndDelete(orderId);
    if (!order) {
        throw { status: 404, message: "Order not found" };
    }
    return { message: "Order deleted Successfully", data: order };
};

module.exports = orderCtlr