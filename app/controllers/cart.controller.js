const { validationResult } = require('express-validator')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model');
const { default: mongoose } = require('mongoose');
const Coupon = require('../models/coupon.model');

const cartCtlr = {}

const calculateCartAmounts = (cart) => {
    const originalAmount = (cart.lineItems || []).reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return acc + (quantity * price);
    }, 0);

    cart.originalAmount = parseFloat(originalAmount.toFixed(2));

    const discountPercentage = parseFloat(cart.discountPercentage) || 0;
    let discountAmount = 0;

    if (discountPercentage > 0) {
        discountAmount = (originalAmount * discountPercentage) / 100;
    } else {
        discountAmount = parseFloat(cart.discountAmount) || 0;
    }
    if(cart.originalAmount >= 200) {
        cart.shippingCharge = 0;
    } else {
        cart.shippingCharge = 20;
    }
    cart.discountAmount = parseFloat(discountAmount.toFixed(2));
    cart.totalAmount = parseFloat((originalAmount - discountAmount + cart.shippingCharge).toFixed(2));

    return cart;
};

// Create/Update Cart
cartCtlr.create = async ({ body, user }) => {
    const cartObj = { ...body };
    cartObj.customerId = user.id;
    let alertMessage = "";

    // console.log("cartObj", cartObj)

    if (!cartObj.lineItems || cartObj.lineItems.length === 0) {
        throw { status: 400, message: "At least one product is required" };
    }

    // Validate Products and Calculate Price
    for (let i = 0; i < cartObj.lineItems.length; i++) {
        const product = await Product.findById(cartObj.lineItems[i].productId);

        if (!product || !product.isAvailable) {
            throw { status: 400, message: "Invalid or unavailable product in lineItems" };
        }
        // console.log(product)
        // Check if Out of Stock
        if (product.stock <= 0) {
            throw { status: 400, message: `${product.name} is currently out of stock` };
        }

        // Check if requested quantity exceeds stock
        const requestedQty = cartObj.lineItems[i].quantity || 1;
        // console.log(requestedQty)

        if (requestedQty > product.stock) {
            throw { 
                status: 400, 
                message: `Only ${product.stock} unit(s) of ${product.name} available in stock` 
            };
        }

        const itemPrice = product.offerPrice && product.offerPrice > 0 ? product.offerPrice : product.price;
        cartObj.lineItems[i].price = itemPrice;
        cartObj.lineItems[i].quantity = requestedQty;

        // Deduct stock immediately (optional, depends on your business rule)
        // product.stock -= requestedQty;
        // await product.save();
    }

    // Total Amount Calculation
    // cartObj.originalAmount = cartObj.lineItems.reduce((acc, cv) => {
    //     const quantity = parseFloat(cv.quantity) || 0;
    //     const price = parseFloat(cv.price) || 0;
    //     return acc + (quantity * price);
    // }, 0) || 0;

    // const originalAmount = parseFloat(cartObj.originalAmount) || 0;
    // const discountAmount = parseFloat(cartObj.discountAmount) || 0;

    // cartObj.totalAmount = originalAmount - discountAmount;

    calculateCartAmounts(cartObj)


    // console.log("cartObj", cartObj)

    // Check for Existing Cart
    const oldCart = await Cart.findOne({ customerId: user.id });

    if (oldCart) {
        // Check if Product Already Exists in Cart
        // console.log("oldCart", oldCart)
        for (const incomingItem of cartObj.lineItems) {
            const existingItem = oldCart.lineItems.find((item) =>
                item.productId.toString() === incomingItem.productId.toString()
            );

            if (existingItem) {
                const product = await Product.findById(existingItem.productId);
                if (product.stock <= 0) {
                    throw { status: 400, message: `${product.name} is currently out of stock` };
                }

                const requestedQty = existingItem.quantity + incomingItem.quantity;

                if (requestedQty > product.stock) {
                    throw { 
                        status: 400, 
                        message: `Only ${product.stock} unit(s) of ${product.name} available in stock` 
                    };
                }

                existingItem.quantity += incomingItem.quantity;
                alertMessage = `Updated quantity by ${existingItem.quantity}`;
            } else {
                oldCart.lineItems.push(incomingItem);
                alertMessage = `Item Added to the cart`;
            }
        }

        // Recalculate Total
        
        // oldCart.originalAmount = oldCart.lineItems.reduce((acc, cv) => {
        //     const quantity = parseFloat(cv.quantity) || 0;
        //     const price = parseFloat(cv.price) || 0;
        //     return acc + (quantity * price);
        // }, 0) || 0;

        // const originalAmount = parseFloat(oldCart.originalAmount) || 0;
        // const discountAmount = parseFloat(oldCart.discountAmount) || 0;

        // oldCart.totalAmount = originalAmount - discountAmount;

        calculateCartAmounts(oldCart)

        await oldCart.save();

        const updatedCart = await Cart.findById(oldCart._id)
            .populate('lineItems.productId', 'name price offerPrice discountPercentage images stock')
            .populate('customerId', 'lastName lastName email');

        return { message: alertMessage, data: updatedCart };
    } else {
        // New Cart
        const cart = await Cart.create(cartObj);

        const newCart = await Cart.findById(cart._id)
            .populate('lineItems.productId', 'name price offerPrice images')
            .populate('customerId', 'userName email');

        return { message: "Item Added to the Cart", data: newCart };
    }
};

cartCtlr.myCart = async ({ user }) => {
    const cart = await Cart.findOne({ customerId: user.id })
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name' },
            select: ['name', 'price', 'offerPrice', 'images']
        });

    if (!cart) {
        return { message: "Cart not found", data: null };
    }

    // Recalculate totalAmount using updated product prices
    // cart.originalAmount = cart.lineItems.reduce((acc, item) => {
    //     const quantity = parseFloat(item.quantity) || 0;
    //     const product = item.productId;

    //     const price = product?.offerPrice > 0 ? product.offerPrice : product.price;
    //     return acc + (quantity * price);
    // }, 0);

    // const originalAmount = parseFloat(cart.originalAmount) || 0;
    // const discountAmount = parseFloat(cart.discountAmount) || 0;

    // cart.totalAmount = originalAmount - discountAmount;


    calculateCartAmounts(cart)

    await cart.save();

    const newCart = await Cart.findById(cart._id)
        .populate({
            path: 'lineItems.productId',
            populate: { path: 'categoryId', select: 'name' },
            select: ['name', 'price', 'offerPrice', 'images']
        })
        .populate('customerId', ['firstName', 'lastName', 'email'])
        .populate('appliedCoupon', ['name', 'code', 'type', 'value'])

    return { data: newCart };
};

cartCtlr.emptyCart = async ({ user }) => {
    const id = user.id

    const cart = await Cart.findOneAndDelete({ customerId : id })
    if(!cart || cart.lineItems.length === 0) {
        return { message: "Cart is empty", data: null };
    }

    return { message: "Successfully deletd" , data: cart };
}

cartCtlr.incQty = async ({ params : { productId }, user}) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const product = await Product.findById(productId);
    if(!product) {
        return { message: "Product not found", data: null };
    }
    const cart = await Cart.findOne({ customerId : user.id })
    if(!cart || cart.lineItems.length === 0) {
        return { message: "Cart not found"};
    }
    // console.log(cart)
    let itemFound = false;
    cart.lineItems.forEach((ele) => {
        if(ele.productId == productId) {
            itemFound = true;
            if (product.stock <= 0) {
                throw { status: 400, message: `${product.name} is currently out of stock` };
            } else if(product.stock < ele.quantity + 1) {
                throw { 
                    status: 400, 
                    message: `Only ${product.stock} unit(s) of ${product.name} available in stock` 
                };
            } else {
                ele.quantity += 1;
            }
            // console.log("design found", ele)
        }
    })
    if (!itemFound) {
        throw { status: 400, message: "Product not found in cart" };
    }

    // cart.originalAmount = cart.lineItems.reduce((acc, cv) => {
    //     const quantity = parseFloat(cv.quantity) || 0;
    //     const price = parseFloat(cv.price) || 0;
    //     return acc + (quantity * price);
    // }, 0) || 0;

    // const originalAmount = parseFloat(cart.originalAmount) || 0;
    // const discountAmount = parseFloat(cart.discountAmount) || 0;

    // cart.totalAmount = originalAmount - discountAmount;

    calculateCartAmounts(cart)

    // console.log(cart)
    await cart.save()
    const newCart = await Cart.findById(cart._id)
        .populate({path : 'lineItems.productId', populate : { path  : 'categoryId', select : 'name'}, select : ['name', 'price', 'offerPrice', 'images']})
            .populate('customerId', ['firstName', 'lastName', 'email'])
    
    return { message: "Cart updated successfully", data: newCart };
}

cartCtlr.decQty = async ({ params: { productId }, user }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }

    const product = await Product.findById(productId);
    if (!product) {
        return { message: "Product not found", data: null };
    }

    const cart = await Cart.findOne({ customerId: user.id });
    if (!cart) {
        return { message: "Cart not found" };
    }

    let itemFound = false;

    cart.lineItems = cart.lineItems.reduce((acc, item) => {
        if (item.productId.toString() === productId) {
            itemFound = true;
            if (item.quantity > 1) {
                item.quantity--;
                acc.push(item); // Keep the item with reduced quantity
            }
            // If quantity is 1, skip adding to acc (removes item)
        } else {
            acc.push(item); // Keep other items
        }
        return acc;
    }, []);

    if (!itemFound) {
        throw { status: 400, message: "Product not found in cart" };
    }

    // cart.originalAmount = cart.lineItems.reduce((acc, cv) => {
    //     const quantity = parseFloat(cv.quantity) || 0;
    //     const price = parseFloat(cv.price) || 0;
    //     return acc + (quantity * price);
    // }, 0) || 0;

    // const originalAmount = parseFloat(cart.originalAmount) || 0;
    // const discountAmount = parseFloat(cart.discountAmount) || 0;

    // cart.totalAmount = originalAmount - discountAmount;

    calculateCartAmounts(cart)

    await cart.save();

    const newCart = await Cart.findById(cart._id)
        .populate({ path: 'lineItems.productId', populate: { path: 'categoryId', select: 'name' }, select: ['name', 'price', 'offerPrice', 'images'] })
        .populate('customerId', ['firstName', 'lastName', 'email']);

    return { message: "Cart updated successfully", data: newCart };
};

cartCtlr.removeLineItem = async ({ params: { productId }, user }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }

    const cart = await Cart.findOne({ customerId : user.id })
    const itemFound = cart.lineItems.find(item => item.productId.toString() === productId);
    if (!itemFound) {
        throw { status: 400, message: "Product not found in Cart" };
    }
    // console.log(cart)
    const newArr = cart.lineItems.filter((ele) => ele.productId != productId)
    // console.log(newArr)
    cart.lineItems = newArr

    if (cart.lineItems.length === 0) {
        // Either delete the cart completely
        await Cart.findByIdAndDelete(cart._id);
        return {
            message: "All items removed. Cart deleted.",
            data: null
        };

        // Or keep the cart but reset
        // cart.appliedCoupon = null;
        // cart.discountAmount = 0;
        // cart.discountPercentage = 0;
        // cart.originalAmount = 0;
        // cart.totalAmount = 0;
    }

    // cart.originalAmount = cart.lineItems.reduce((acc, cv) => {
    //     const quantity = parseFloat(cv.quantity) || 0;
    //     const price = parseFloat(cv.price) || 0;
    //     return acc + (quantity * price);
    // }, 0) || 0;

    // const originalAmount = parseFloat(cart.originalAmount) || 0;
    // const discountAmount = parseFloat(cart.discountAmount) || 0;

    // cart.totalAmount = originalAmount - discountAmount;

    calculateCartAmounts(cart)

    // console.log(cart)
    await cart.save()
    const newCart = await Cart.findById(cart._id)
        .populate({ path: 'lineItems.productId', populate: { path: 'categoryId', select: 'name' }, select: ['name', 'price', 'offerPrice', 'images'] })
        .populate('customerId', ['firstName', 'lastName', 'email']);

    return {
        message: "Line item removed successfully",
        data: newCart
    }
}

cartCtlr.validateCoupon = async ({ params: { couponCode }, user }) => {
    const cart = await Cart.findOne({ customerId: user.id }).populate("lineItems.productId");

    if (!cart) throw { status: 404, message: "Cart not found" };

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw { status: 400, message: "Invalid coupon code" };

    // Check if coupon is active
    if (!coupon.isActive) {
        throw { status: 400, message: "This coupon is not active" };
    }

    // Optional: Validate against current date (safety check)
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTill) {
        throw { status: 400, message: "This coupon is expired or not yet valid" };
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw { status: 400, message: "This coupon has reached its usage limit" };
    }

    // Check minimum order amount
    const originalAmount = cart.lineItems.reduce((total, item) => {
        return total + (item.productId.price * item.quantity);
    }, 0);

    if (originalAmount < coupon.minOrderAmount) {
        throw {
            status: 400,
            message: `This coupon requires a minimum order amount of AED ${coupon.minOrderAmount}`,
        };
    }

    // If applicableTo exists, check if any cart items match
    if (coupon.applicableTo?.length > 0) {
        const applicableItemExists = cart.lineItems.some(item =>
            coupon.applicableTo.includes(item.productId.categoryId?.toString())
        );

        if (!applicableItemExists) {
            throw {
                status: 400,
                message: "This coupon is not applicable to the products in your cart",
            };
        }
    }

    // Calculate discount
    let discountPercentage = 0;
    let discountAmount = 0;

    if (coupon.type === "percentage") {
        discountPercentage = coupon.value;
        discountAmount = (originalAmount * coupon.value) / 100;

        // Cap discount if maxDiscount is set
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    } else if (coupon.type === "fixed") {
        discountAmount = coupon.value;
    }

    const totalAmount = originalAmount - discountAmount;

    // Update cart with discount
    cart.originalAmount = originalAmount;
    cart.discountPercentage = discountPercentage;
    cart.discountAmount = discountAmount;
    cart.totalAmount = totalAmount;
    cart.appliedCoupon = coupon._id;
    await cart.save();

    // Increment coupon usage count
    coupon.usedCount += 1;
    await coupon.save();

    return {
        message: "Coupon applied successfully",
        originalAmount,
        discountAmount,
        totalAmount,
    };
};

cartCtlr.removeCoupon = async ({ user }) => {
    const cart = await Cart.findOne({ customerId: user.id }).populate("lineItems.productId");
    if (!cart) {
        throw { status: 404, message: "Cart not found" };
    }

    const originalAmount = (cart.lineItems || []).reduce((acc, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.price) || 0;
        return acc + (quantity * price);
    }, 0);

    // Optional: reduce usedCount if a coupon was applied
    if (cart.appliedCoupon) {
        await Coupon.findByIdAndUpdate(cart.appliedCoupon, { $inc: { usedCount: -1 } });
    }

    cart.originalAmount = parseFloat(originalAmount.toFixed(2));
    cart.discountAmount = 0;
    cart.discountPercentage = 0;
    cart.totalAmount = cart.originalAmount;
    cart.appliedCoupon = undefined;

    await cart.save();

    return {
        message: "Coupon removed successfully",
        originalAmount: cart.originalAmount,
        totalAmount: cart.totalAmount,
    };
};

module.exports = cartCtlr