const { default: mongoose } = require("mongoose");
const Product = require("../models/product.model");
const Store = require("../models/restaurant.model");
const Category = require("../models/category.model");
const { processMultipleImageBuffers, deleteCloudinaryImages, getBufferHash, uploadImageBuffer } = require("../services/cloudinaryService/cloudinary.uploader");
const User = require("../models/user.model");
const Restaurant = require("../models/restaurant.model");

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
productCtlr.create = async ({ body, files, user }) => {
    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    if(String(restaurantId) !== String(body.restaurantId)){
        throw { status: 403, message: "RestauratId Mismatch or You are not the owner of this Restaurant" };
    }
    const isProductNameExist = await Product.findOne({ name: body.name, restaurantId: body.restaurantId });
    if (isProductNameExist) {
        throw { status: 400, message: "Product name already exists" };
    }

    if (!files || files.length === 0) {
        throw { status: 400, message: "At least one image is required" };
    }

    const category = await Category.findById(body.categoryId);
    if (!category) {
        throw { status: 400, message: "Category not found" };
    }

    const restaurantCategory = await Category.findOne({ _id: body.categoryId, restaurantId: body.restaurantId });
    if (!restaurantCategory) {
        throw { status: 400, message: "Category not found in the Restaurant" };
    }

    const restaurant = await Restaurant.findById(body.restaurantId);
    // console.log(files);

    const uploadedImages = await processMultipleImageBuffers(files, Product, `${restaurant.folderKey}/Products`);

    let price = parseFloat(body.price);
    let discountPercentage = parseFloat(body.discountPercentage) || 0;
    let offerPrice = 0;

    if (discountPercentage > 0 && price > 0) {
        offerPrice = price - (price * discountPercentage / 100);
    }

    // Parse translations if provided
    let translations = new Map();
    if (body.translations) {
        try {
            const translationsObj = typeof body.translations === 'string' 
                ? JSON.parse(body.translations) 
                : body.translations;
            
            for (const [lang, data] of Object.entries(translationsObj)) {
                translations.set(lang, {
                    name: data.name || '',
                    description: data.description || ''
                });
            }
        } catch (error) {
            console.error('Error parsing translations:', error);
        }
    }

    const product = new Product({
        ...body,
        translations,
        price,
        discountPercentage,
        offerPrice,
        images: uploadedImages
    });

    await product.save()

    const populatedProduct = await Product.findById(product._id)
        .populate('categoryId', 'name')
        .populate('categoryId', 'name')
        .populate('restaurantId', 'name address contactNumber');

    return {
        message: "Product created successfully",
        data: populatedProduct
    };
};

// Get All Products
productCtlr.list = async () => {
    const products = await Product.find()
        .sort({ productId: 1 })
        .populate('categoryId', 'name translations')
        .populate('restaurantId', 'name address contactNumber');
    
    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };    
}

// Get All Product for Admin
// productCtlr.listByRestaurantForAdmin = async ({ user }) => {
//     const userData = await User.findById(user.id);
//     const restaurantId = userData.restaurantId;
//     const products = await Product.find({restaurantId: restaurantId}).populate('categoryId', 'name').populate('restaurantId', 'name address contactNumber');
//     for (let i = 0; i < products.length; i++) {
//         await checkAndResetOffer(products[i])
//     }
//     return { data: products };
// };

// List Product by Restaurant
productCtlr.listByRestaurant = async ({ params: { restaurantSlug } }) => {
    const restaurant = await Restaurant.findOne({slug: restaurantSlug});
    if(!restaurant) {
        throw { status: 404, message: "Restaurant not found" };
    }
    const restaurantId = restaurant._id;
    const products = await Product.find({restaurantId: restaurantId})
        .populate('categoryId', 'name translations')
        .populate('restaurantId', 'name address contactNumber')
    return { data: products };
};

// List Product by Category
productCtlr.listByCategory = async ({ params: { categoryId } }) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const category = await Category.findById(categoryId);
    if (!category) {
        throw { status: 400, message: "Category not found" };
    }

    // const restaurantCategory = await Category.findOne({ _id: categoryId, restaurantId: body.restaurantId });
    // if (!restaurantCategory) {
    //     throw { status: 400, message: "Category not found in the Restaurant" };
    // }

    const products = await Product.find({ categoryId: categoryId })
        .sort({ productId: 1 })
        .populate('categoryId', 'name translations')
        .populate('restaurantId', 'name address contactNumber');
    
    // console.log(products)

    if (!products || products.length === 0) {
        throw { status: 404, message: "No Products on the Selected Category" };
    }

    for (let i = 0; i < products.length; i++) {
        await checkAndResetOffer(products[i]);
    }

    return { data: products };
};

// Get One Product by ID
productCtlr.show = async ({ params: { productId } }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }

    const product = await Product.findById(productId)
        .populate('categoryId', 'name translations')
        .populate('restaurantId', 'name address ');
    
    if (!product) {
        throw { status: 404, message: "Product not found" };
    }
    const updatedProduct = await checkAndResetOffer(product);

    return { data: updatedProduct };   
};

// Update Product
productCtlr.update = async ({ params: { productId }, body, files, user }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }
    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    if(String(restaurantId) !== String(body.restaurantId)){
        throw { status: 403, message: "You are not authorized to update this Product" }
    }
    const existingProduct = await Product.findOne({ _id: productId, restaurantId: restaurantId });
    if (!existingProduct) {
        throw { status: 404, message: "Product not found" };
    }

    // Validate product name uniqueness per restaurant
    const isProductNameExist = await Product.findOne({
        name: body.name,
        restaurantId: existingProduct.restaurantId,
        _id: { $ne: productId },
    });

    if (isProductNameExist) {
        throw { status: 400, message: "Product name already exists in this restaurant" };
    }

    // Parse translations if provided
    let translations = existingProduct.translations || new Map();
    if (body.translations) {
        try {
            const translationsObj = typeof body.translations === 'string' 
                ? JSON.parse(body.translations) 
                : body.translations;
            
            for (const [lang, data] of Object.entries(translationsObj)) {
                translations.set(lang, {
                    name: data.name || '',
                    description: data.description || ''
                });
            }
        } catch (error) {
            console.error('Error parsing translations:', error);
        }
    }

    const updateData = { 
        ...body,
        translations
    };

    // Optional: Handle Category validation if provided
    if (body.categoryId) {
        const category = await Category.findOne({
            _id: body.categoryId,
            restaurantId: existingProduct.restaurantId
        });
        if (!category) {
            throw { status: 404, message: "Category not found for this restaurant" };
        }
        updateData.categoryId = category._id;
    }

    const restaurant = await Restaurant.findById(existingProduct.restaurantId);

    // Handle image update if files are uploaded
    if (files && files.length > 0) {

        const newImages = await processMultipleImageBuffers(files, Product, `${restaurant.folderKey}/Products`);

        // Delete old images from Cloudinary if new ones are added
        if (newImages.length > 0 && existingProduct.images?.length > 0) {
            const publicIdsToDelete = existingProduct.images.map(img => img.publicId);
            await deleteCloudinaryImages(publicIdsToDelete);
            updateData.images = newImages;
        }
    }

    // Parse & update price
    const price = parseFloat(body.price);
    updateData.price = !isNaN(price) ? price : existingProduct.price;

    // Parse & update discount
    const discount = parseFloat(body.discountPercentage);
    updateData.discountPercentage = !isNaN(discount) ? discount : existingProduct.discountPercentage;

    // Offer Price Calculation
    updateData.offerPrice = 0;
    if (updateData.discountPercentage > 0 && updateData.price > 0) {
        updateData.offerPrice = updateData.price - (updateData.price * updateData.discountPercentage / 100);
    }

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
        runValidators: true,
    }).populate('categoryId', 'name');

    // Reset expired offers if needed
    await checkAndResetOffer(updatedProduct);

    return {
        message: "Product updated successfully",
        data: updatedProduct
    };
};

// Delete Product
productCtlr.delete = async ({ params: { productId }, user }) => {
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw { status: 400, message: "Valid Product ID is required" };
    }
    const userData = await User.findById(user.id);
    const restaurantId = userData.restaurantId;
    const product = await Product.findOneAndDelete({ _id: productId, restaurantId });
    if (!product) {
        throw { status: 404, message: "Product not found or You are not authorized to delete this Product" };
    }
    await deleteCloudinaryImages(product.images.map(img => img.publicId));
    
    return { message: "Product deleted successfully", data: product };
};

module.exports = productCtlr