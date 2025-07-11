const { validationResult } = require('express-validator')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model');
const { default: mongoose } = require('mongoose');

const cartCtlr = {}

// Create/Update Cart
cartCtlr.create = async ({ body, user }) => {
    // console.log(user)
    const cartObj = { ...body };
    cartObj.customerId = user.id;

    if (!cartObj.lineItems || cartObj.lineItems.length === 0) {
        throw { status: 400, message: "At least one product is required" };
    }

    // Validate Products and Calculate Price
    for (let i = 0; i < cartObj.lineItems.length; i++) {
        const product = await Product.findById(cartObj.lineItems[i].productId);

        if (!product || !product.isAvailable) {
            throw { status: 400, message: "Invalid or unavailable product in lineItems" };
        }

        // Check if Out of Stock
        if (product.stock <= 0) {
            throw { status: 400, message: `${product.name} is currently out of stock` };
        }

        // Check if requested quantity exceeds stock
        const requestedQty = cartObj.lineItems[i].quantity || 1;

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
    cartObj.totalAmount = cartObj.lineItems.reduce((acc, cv) => {
        const quantity = parseFloat(cv.quantity) || 0;
        const price = parseFloat(cv.price) || 0;
        return acc + (quantity * price);
    }, 0) || 0;

    // console.log("cartObj", cartObj)

    // Check for Existing Cart
    const oldCart = await Cart.findOne({ customerId: user.id });

    if (oldCart) {
        // Check if Product Already Exists in Cart
        // console.log("oldCart", oldCart)
        const existingItem = oldCart.lineItems.find((item) => item.productId.toString() === cartObj.lineItems[0].productId);
        // console.log("existingItem", existingItem)
        
        if (existingItem) {
            existingItem.quantity += cartObj.lineItems[0].quantity;
        } else {
            oldCart.lineItems.push(cartObj.lineItems[0]);
        }

        // Recalculate Total
        // oldCart.totalAmount = oldCart.lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
        
        oldCart.totalAmount = oldCart.lineItems.reduce((acc, cv) => {
            const quantity = parseFloat(cv.quantity) || 0;
            const price = parseFloat(cv.price) || 0;
            return acc + (quantity * price);
        }, 0) || 0;

        await oldCart.save();

        const updatedCart = await Cart.findById(oldCart._id)
            .populate('lineItems.productId', 'name price offerPrice discountPercentage images stock')
            .populate('customerId', 'lastName lastName email');

        return { message: "Cart updated successfully", data: updatedCart };
    } else {
        // New Cart
        const cart = await Cart.create(cartObj);

        const newCart = await Cart.findById(cart._id)
            .populate('lineItems.productId', 'name price offerPrice images')
            .populate('customerId', 'userName email');

        return { message: "Cart created successfully", data: newCart };
    }
};

cartCtlr.myCart = async ({ params: { cartId } }) => {
    // const id = user.id
    // console.log(id)
    // const cart = await Cart.findOne({ customerId : id })
    const cart = await Cart.findOne({ _id : cartId })
        .populate({ path: 'lineItems.productId', select: ['name', 'images', 'price', 'offerPrice'], populate: [{ path: 'categoryId', select: ['name'] }, { path: 'storeId', select: ['name'] }] })
        .populate('customerId', ['firstName', 'lastName', 'email']);
    
    if(!cart) {
        return { message: "Cart not found", data: null };
    }
    
    return { data: cart }; 
}

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

    cart.totalAmount = cart.lineItems.reduce((acc, cv) => {
        const quantity = parseFloat(cv.quantity) || 0;
        const price = parseFloat(cv.price) || 0;
        return acc + (quantity * price);
    }, 0) || 0;

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

    cart.totalAmount = cart.lineItems.reduce((acc, cv) => {
        const quantity = parseFloat(cv.quantity) || 0;
        const price = parseFloat(cv.price) || 0;
        return acc + (quantity * price);
    }, 0) || 0;

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

    cart.totalAmount = cart.lineItems.reduce((acc, cv) => {
        const quantity = parseFloat(cv.quantity) || 0;
        const price = parseFloat(cv.price) || 0;
        return acc + (quantity * price);
    }, 0) || 0;
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

module.exports = cartCtlr

// cartCtlr.create = async (req, res) => {
//     const { body } = req
//     try {
//         const cart = new Cart(body)
//         cart.customer = req.user.id
//         cart.design = req.params.designId
//         await cart.save()
//         const newCart = await Cart.findById(cart._id)
//             .populate({path : 'design',populate : { path  : 'product', select : 'name'}, select : ['product','designName', 'color', 'size']})
//                 .populate('customer', ['username', 'email'])
//         const userProduct = await Product.findOne({ _id : newCart.design.product })
//         // console.log(userProduct)
//         const userDesign = await Design.findOne({ _id : newCart.design._id })
//         // console.log(userDesign)
//         const CustomizationAmount = userDesign.customization.reduce((acc, cv) => {
//             return acc + cv.amount
//         }, 0)
//         console.log(CustomizationAmount)
//         const amount = userProduct.price + userDesign.charges + CustomizationAmount
//         newCart.totalAmount = amount
//         console.log(amount)
//         res.status(200).json(newCart)
//     } catch(err) {
//         res.status(500.).json('internal server error')
//     }
// }