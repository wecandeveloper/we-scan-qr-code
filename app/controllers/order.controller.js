const { default: mongoose } = require('mongoose')
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/order.model')
const { pick } = require('lodash')
const Product = require('../models/product.model')
const Table = require('../models/table.model');
const User = require('../models/user.model');
const Counter = require("../models/counter.model");
const socketService = require('../services/socketService/socketService');
// const Address = require('../models/address.model')

async function getOrCreateGuestId(body) {
    let guestId = body.guestId;

    if (!guestId) {
        // No guestId sent → issue a new one
        return uuidv4();
    }

    const previousOrder = await Order.findOne({ guestId });

    if (!previousOrder) {
        // guestId sent but no order found → treat as new guest
        return uuidv4();
    }

    if (String(previousOrder.restaurantId) !== String(body.restaurantId)) {
        // Same guest ID but different restaurant → assign new ID
        return uuidv4();
    }

    // Reuse for same restaurant
    return guestId;
}

const orderCtlr = {}

orderCtlr.create = async ({ body }) => {
    const orderObj = { ...body };

    orderObj.restaurantId = body.restaurantId;
    orderObj.guestId = await getOrCreateGuestId(body);

    if (!orderObj.restaurantId) throw { status: 400, message: "Restaurant ID is required" };
    if (!orderObj.lineItems || orderObj.lineItems.length === 0)
        throw { status: 400, message: "At least one product is required" };

    // ✅ Validate Products
    for (let i = 0; i < orderObj.lineItems.length; i++) {
        const product = await Product.findById(orderObj.lineItems[i].productId);
        if (!product || !product.isAvailable) {
            throw { status: 400, message: "Invalid or Unavailable product in lineItems" };
        } else if (String(product.restaurantId) !== String(orderObj.restaurantId)) {
            throw { status: 400, message: "Product does not belong to this restaurant" };
        }
        const itemPrice = product.offerPrice && product.offerPrice > 0 ? product.offerPrice : product.price;
        orderObj.lineItems[i].price = itemPrice;
    }

    if (!orderObj.tableId) throw { status: 400, message: "Table ID is required" };
    const table = await Table.findById(orderObj.tableId);
    if (!table) throw { status: 400, message: "Invalid table ID" };
    if (String(table.restaurantId) !== String(orderObj.restaurantId)) {
        throw { status: 400, message: "Table ID does not belong to this restaurant" };
    }

    // ✅ Generate Atomic Unique Order Number Per Restaurant
    const counter = await Counter.findOneAndUpdate(
        { restaurantId: orderObj.restaurantId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    orderObj.orderNo = `O${counter.seq}`;

    // ✅ Calculate Total Amount
    orderObj.totalAmount = (orderObj.lineItems || []).reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return acc + quantity * price;
    }, 0);

    const order = await Order.create(orderObj);

    const newOrder = await Order.findById(order._id)
        .populate({ path: "lineItems.productId", select: ["name", "images", "price", "offerPrice"], populate: { path: "categoryId", select: ["name"] } })
        .populate("restaurantId", "name address")
        .populate("tableId", "tableNumber");

    // ✅ Emit Notification via Socket.IO
    socketService.emitOrderNotification({
        type: "Dine In Order",
        tableNo: table.tableNumber,
        message: `New Order Placed on Table ${table.tableNumber}`,
        orderNo: order.orderNo,
        orderDetails: newOrder
    });

    return { success: true, message: `Order Placed Successfully on Table No. ${table.tableNumber}`, data: newOrder };
};

orderCtlr.listAllOrders = async () => {
    const orders = await Order.find().sort({ createdAt : -1 })
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');
    // console.log(orders)
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

orderCtlr.listRestaurantOrders = async ({ user }) => {
    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    if (!restaurantId) {
        throw { status: 403, message: "You are not assigned to any restaurant" };
    }
    const orders = await Order.find({ restaurantId: restaurantId }).sort({ createdAt : -1 })
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');
    // console.log(orders)
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

orderCtlr.getMyOrders = async ({ params: { guestId } }) => {
    const orders = await Order.find({ guestId : guestId }).sort({ orderId : 1 })
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');
    // console.log(orders)
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

orderCtlr.show = async ({ params: { orderId } }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
            throw { status: 400, message: "Valid Category ID is required" };
        }

    const order = await Order.findById(orderId)
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');

    if(!order) {
        return { message: "No Order found"};
    }
    
    return { data: order };
}

orderCtlr.cancelOrder = async ({ params: { orderId, guestId }, body }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }

    const updatedBody = pick(body, ['status']);
    let cancelledOrder;

    cancelledOrder = await Order.findOneAndUpdate({_id: orderId, guestId: guestId}, updatedBody, { new: true })
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');

    if (!cancelledOrder) {
        return { message: "No Order found", data: null };
    }

    return {
        message: 'Order Cancelled Successfully',
        data: cancelledOrder
    };
};


orderCtlr.changeStatus = async ({ params: { orderId }, user, body }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }

    const order = await Order.findById(orderId);
    if (!order) {
        return { message: "Order not found", data: null };
    }

    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    if(String(restaurantId) !== String(order.restaurantId)){
        throw { status: 403, message: "RestauratId Mismatch or You are not the owner of this Restaurant" };
    }

    if (!body?.status || typeof body?.status !== "string") {
        throw { status: 400, message: "Order status is required" };
    }

    const updatedBody = pick(body, ['status']);
    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatedBody, { new: true });

    return {
        message: 'Order Status Changed',
        status: updatedOrder.status,
        data: updatedOrder
    };
};

orderCtlr.delete = async ({ params: { orderId }, user }) => {
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
        throw { status: 400, message: "Valid Order ID is required" };
    }
    const order = await Order.findById(orderId);
    if (!order) {
        throw { status: 404, message: "Order not found" };
    }

    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    if(String(restaurantId) !== String(order.restaurantId)){
        throw { status: 403, message: "RestauratId Mismatch or You are not the owner of this Restaurant" };
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId);

    return { message: "Order deleted Successfully", data: deletedOrder };
};

module.exports = orderCtlr