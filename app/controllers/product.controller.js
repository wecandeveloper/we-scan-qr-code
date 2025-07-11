const { default: mongoose } = require("mongoose");
const Product = require("../models/product.model");
const Store = require("../models/store.model");
const Category = require("../models/category.model");

const checkAndResetOffer = async (product) => {
    const today = new Date();

    if (product.discountExpiry && new Date(product.discountExpiry) <= today) {
        if (product.offerPrice > 0 || product.discountPercentage > 0) {
            await Product.findByIdAndUpdate(product._id, {
                offerPrice: 0,
                discountPercentage: 0,
            });
            product.offerPrice = 0;
            product.discountPercentage = 0;
        }
    }
    return product;
};

const productCtlr = {}

// Create Products
productCtlr.create = async ({ body, files }) => {
    const isProductNameExist = await Product.findOne({ name: body.name });
    if (isProductNameExist) {
        throw { status: 400, message: "Product name already exists" };
    }

    if (!files || files.length === 0) {
        throw { status: 400, message: "At least one image is required" };
    }

    console.log(files);

    const imageUrls = files.map(file => file.path);

    let price = parseFloat(body.price);
    let discountPercentage = parseFloat(body.discountPercentage) || 0;
    let offerPrice = 0;

    if (discountPercentage > 0 && price > 0) {
        offerPrice = price - (price * discountPercentage / 100);
    }

    const product = new Product({
        ...body,
        price,
        discountPercentage,
        offerPrice,
        images: imageUrls
    });

    await product.save()

    const populatedProduct = await Product.findById(product._id)
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');

    return {
        message: "Product created successfully",
        data: populatedProduct
    };
};

// Get All Products
productCtlr.list = async () => {
    const products = await Product.find()
        .sort({ productId: 1 })
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');
    
    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };    
}

// List Product by Category
productCtlr.listByCategory = async ({ params: { categoryId } }) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw { status: 404, message: "Category not found" };
    }

    const products = await Product.find({ categoryId: categoryId })
        .sort({ productId: 1 })
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');
    
    // console.log(products)

    if (!products || products.length === 0) {
        throw { status: 404, message: "No Products on the Selected Category" };
    }

    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };
};

// List Product by Store
productCtlr.listByStore = async ({ params: { storeId } }) => {
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw { status: 400, message: "Valid Store ID is required" };
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw { status: 404, message: "Store not found" };
    }

    const products = await Product.find({ storeId: storeId })
        .sort({ productId: 1 })
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');
    
    // console.log(products)

    if (!products || products.length === 0) {
        throw { status: 404, message: "No Products on the Selected Store" };
    }

    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };
};

// List Products by Store & Category
productCtlr.listByStoreAndCategory = async ({ query: { storeId, categoryId } }) => {
    
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw { status: 400, message: "Valid Store ID is required" };
    }
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw { status: 404, message: "Store not found" };
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw { status: 404, message: "Category not found" };
    }

    const products = await Product.find({ storeId, categoryId })
        .sort({ productId: 1 })
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');

    if (!products || products.length === 0) {
        throw { status: 404, message: "No products found for this Store & Category" };
    }

    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };
};

// Get One Product by ID
productCtlr.show = async ({ params: { productId } }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const product = await Product.findById(productId)
        .populate('categoryId', 'name')
        .populate('storeId', 'name city area isOpen');
    
    if (!product) {
        throw { status: 404, message: "Product not found" };
    }
    const updatedProduct = await checkAndResetOffer(product);

    return { data: updatedProduct };   
};

// Update Product
productCtlr.update = async ({ params: { productId }, body, files }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }

    const isProductNameExist = await Product.findOne({ name: body.name });
    if (isProductNameExist && isProductNameExist._id.toString() !== productId) {
        throw { status: 400, message: "Product name already exists" };
    }

    let imageUrls = [];
    if (files && files.length > 0) {
        imageUrls = files.map(file => file.path);
    }

    const updateData = { ...body };

    if (imageUrls.length > 0) {
        updateData.images = imageUrls;
    }

    // Fetch current product to retain existing values
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        throw { status: 404, message: "Product not found" };
    }

    // Only update price if provided
    if (body.price !== undefined) {
        updateData.price = parseFloat(body.price);
    } else {
        updateData.price = existingProduct.price;
    }

    // Only update discount if provided
    if (body.discountPercentage !== undefined) {
        updateData.discountPercentage = parseFloat(body.discountPercentage);
    } else {
        updateData.discountPercentage = existingProduct.discountPercentage;
    }

    // Offer Price Calculation
    updateData.offerPrice = 0;
    if (updateData.discountPercentage > 0 && updateData.price > 0) {
        updateData.offerPrice = updateData.price - (updateData.price * updateData.discountPercentage / 100);
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
        runValidators: true,
    });

    return { message: "Product updated successfully", data: updatedProduct };
};

// Delete Product
productCtlr.delete = async ({ params: { productId } }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
        throw { status: 404, message: "Product not found" };
    }
    return { message: "Product deleted successfully", DeletedData: product };
};

module.exports = productCtlr