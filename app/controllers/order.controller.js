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

    // Assign restaurantId and guestId
    orderObj.restaurantId = body.restaurantId;
    orderObj.guestId = await getOrCreateGuestId(body);

    // Basic validations
    if (!orderObj.restaurantId) throw { status: 400, message: "Restaurant ID is required" };
    if (!orderObj.lineItems || orderObj.lineItems.length === 0)
        throw { status: 400, message: "At least one product is required" };
    if (!orderObj.orderType) throw { status: 400, message: "Order type is required" };

    // Validate Products
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

    let table;
    if (orderObj.orderType === "Dine-In") {
        // Validate table
        if (!orderObj.tableId) throw { status: 400, message: "Table ID is required" };
        table = await Table.findById(orderObj.tableId);
        if (!table) throw { status: 400, message: "Invalid table ID" };
        if (String(table.restaurantId) !== String(orderObj.restaurantId)) {
            throw { status: 400, message: "Table ID does not belong to this restaurant" };
        }
    }

    if (orderObj.orderType === "Home-Delivery" || orderObj.orderType === "Take-Away") {
        if (!orderObj.deliveryAddress) throw { status: 400, message: "Delivery address is required" };
    }

    // Calculate total amount
    orderObj.totalAmount = (orderObj.lineItems || []).reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return acc + quantity * price;
    }, 0);

    // Populate product details for the notification
    const populatedOrderDetails = {
        ...orderObj,
        lineItems: await Promise.all(orderObj.lineItems.map(async (item) => {
            const product = await Product.findById(item.productId)
                .populate('categoryId', 'name translations')
                .select('name images price offerPrice translations categoryId');
            
            return {
                ...item,
                productId: product
            };
        }))
    };

    // Emit notification via Socket.IO for restaurant approval
    socketService.emitOrderNotification(orderObj.restaurantId, {
        restaurantId: orderObj.restaurantId,
        type: orderObj.orderType === "Dine-In" ? "Dine In Order" : "Home Delivery Order",
        tableNo: table ? table.tableNumber : null,
        message: orderObj.orderType === "Dine-In" 
            ? `New Order Request from Table ${table.tableNumber}` 
            : orderObj.orderType === "Home-Delivery" ? `New Home Delivery Order Request` : `New Take Away Order Request`,
        tempOrder: orderObj, // Send temp order for approval
        orderDetails: populatedOrderDetails
    });

    // Return success message with guestId for tracking
    return { 
        success: true, 
        message: "Order request sent to restaurant for approval.",
        guestId: orderObj.guestId
    };
};

orderCtlr.accept = async ({ body }) => {
    const { tempOrder } = body;

    // Generate unique order number per restaurant
    const counter = await Counter.findOneAndUpdate(
        { restaurantId: tempOrder.restaurantId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );

    tempOrder.orderNo = `O${counter.seq}`;

    // Create the actual order in DB
    const order = await Order.create(tempOrder);

    const newOrder = await Order.findById(order._id)
        .populate({ 
            path: "lineItems.productId", 
            select: ["name", "images", "price", "offerPrice", "translations"], 
            populate: { path: "categoryId", select: ["name", "translations"] } 
        })
        .populate("restaurantId", "name address")
        .populate("tableId", "tableNumber");

    // Notify customer that order was accepted
    socketService.emitCustomerNotification(tempOrder.guestId, {
        status: "accepted",
        orderNo: order.orderNo,
        message: "Your order has been accepted!"
    });

    return { success: true, message: "Order accepted and created successfully.", data: newOrder };
};

orderCtlr.decline = async ({ body }) => {
    const { tempOrder } = body;

    // Notify customer that order was declined
    socketService.emitCustomerNotification(tempOrder.guestId, {
        status: "declined",
        message: "Sorry, your order has been declined by the restaurant."
    });

    return { success: true, message: "Order declined successfully." };
};

orderCtlr.listAllOrders = async () => {
    const orders = await Order.find().sort({ createdAt : -1 })
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name translations' },
            select: ['name', 'price', 'offerPrice', 'images', 'translations']
        })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');
    // console.log(orders)
    if(!orders || orders.length === 0) {
        return { message: "No orders found", data: null }
    } else {
        return { data: orders }
    }
}

// Example using query parameters
orderCtlr.listRestaurantOrders = async ({ user, query }) => {
    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;

    if (!restaurantId) throw { status: 403, message: "You are not assigned to any restaurant" };

    // Default: no filter (return all)
    let dateFilter = {};

    const now = new Date();

    if (query.filter === "daily") {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfDay, $lte: now } };
    } else if (query.filter === "weekly") {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { $gte: startOfWeek, $lte: now } };
    } else if (query.filter === "monthly") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { createdAt: { $gte: startOfMonth, $lte: now } };
    } else if (query.from && query.to) {
        // Custom range
        const fromDate = new Date(query.from);
        const toDate = new Date(query.to);
        dateFilter = { createdAt: { $gte: fromDate, $lte: toDate } };
    }

    const orders = await Order.find({ restaurantId, ...dateFilter })
        .sort({ createdAt: -1 })
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name translations' },
            select: ['name', 'price', 'offerPrice', 'images', 'translations']
        })
        .populate("restaurantId", "name address")
        .populate("tableId", "tableNumber");

    if (!orders || orders.length === 0) return { message: "No orders found", data: null };
    return { data: orders };
};

orderCtlr.getMyOrders = async ({ params: { guestId } }) => {
    const orders = await Order.find({ guestId : guestId }).sort({ orderId : 1 })
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name translations' },
            select: ['name', 'price', 'offerPrice', 'images', 'translations']
        })
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
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name translations' },
            select: ['name', 'price', 'offerPrice', 'images', 'translations']
        })
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
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name translations' },
            select: ['name', 'price', 'offerPrice', 'images', 'translations']
        })
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