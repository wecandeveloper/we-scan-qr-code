const { default: mongoose } = require('mongoose')
const { v4: uuidv4 } = require('uuid');
const Order = require('../models/order.model')
const { pick } = require('lodash')
const Product = require('../models/product.model')
const Table = require('../models/table.model');
const User = require('../models/user.model');
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
    const orderObj = { ...body }
    // console.log(body)
    orderObj.restaurantId = body.restaurantId;

    orderObj.guestId = await getOrCreateGuestId(body);

    if(!orderObj.restaurantId) {
        throw { status: 400, message: "Restaurant ID is required" };
    } 

    if (!orderObj.lineItems || orderObj.lineItems.length === 0) {
        throw { status: 400, message: "At least one product is required" };
    }

    // Validate Products
    for (let i = 0; i < orderObj.lineItems.length; i++) {
        const product = await Product.findById(orderObj.lineItems[i].productId);
        // console.log(product)

        if (!product || !product.isAvailable) {
            throw { status: 400, message: "Invalid or unavailable product in lineItems" };
        } else if (String(product.restaurantId) !== String(orderObj.restaurantId)) {
            throw { status: 400, message: "Product does not belong to this restaurant" };
        }

        const itemPrice = product.offerPrice && product.offerPrice > 0 ? product.offerPrice : product.price;
        orderObj.lineItems[i].price = itemPrice;
    }

    if(!orderObj.tableId) {
        throw { status: 400, message: "Table ID is required" };
    } 
    if(!orderObj.tableId) {
        throw { status: 400, message: "Table ID is required" };
    }
    const table = await Table.findById(orderObj.tableId);
    if(!table) {
        throw { status: 400, message: "Invalid table ID" };
    } else if(String(table.restaurantId) !== String(orderObj.restaurantId)) {
        throw { status: 400, message: "Table ID does not belong to this restaurant" }
    }

    const lastOrder = await Order.findOne().sort({ orderNo: -1 }).lean();

    let newOrderNo = 1;
    if (lastOrder && lastOrder.orderNo) {
        // Remove the 'O' prefix and parse the number
        const lastNumber = parseInt(lastOrder.orderNo.replace('O', ''), 10);
        newOrderNo = lastNumber + 1;
    }

    // Format with prefix
    orderObj.orderNo = `O${newOrderNo}`;


    const totalAmount = (orderObj.lineItems || []).reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return acc + (quantity * price);
    }, 0);
    orderObj.totalAmount = totalAmount;

    console.log("cartObj", orderObj)

    const order = await Order.create(orderObj);

    const newOrder = await Order.findById(order._id)
        .populate({ path: 'lineItems.productId', select : ['name', 'images', 'price', 'offerPrice'], populate: { path: 'categoryId', select: ['name']} })
        .populate('restaurantId', 'name address')
        .populate('tableId', 'tableNumber');

    return { success: true, message: `Order Placed Successfully on Table No. ${table.tableNumber}`, data: newOrder };
}

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