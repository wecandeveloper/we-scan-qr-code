const { default: mongoose } = require('mongoose');
const Store = require('../models/store.model');

const storeCtlr = {}

// Create Store
storeCtlr.create = async ({ body, files }) => {
    if (!files || files.length === 0) {
        throw { status: 400, message: "At least one image is required" };
    }
    console.log(files)

    const imageUrls = files.map(file => file.path); // Cloudinary returns secure URL in 'path'

    const store = new Store({
        ...body,
        images: imageUrls,
        location: {
        type: "Point",
        coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)]
    }
    });

    await store.save();

    return { message: "Store created successfully", data: store };
};

// Get All Stores
storeCtlr.list = async () => {
    const stores = await Store.find().sort({storeId: 1});
    return { data: stores };
};

// Get One Store by ID
storeCtlr.show = async ({ params: { storeId } }) => {
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw { status: 400, message: "Valid Store ID is required" };
    }

    const store = await Store.findById(storeId);
    if (!store) {
        throw { status: 404, message: "Store not found" };
    }

    return { data: store };
};

// List Store by City
storeCtlr.listByCity = async ({ query: { city } }) => {
    if (!city) {
        throw { status: 400, message: "City name is required" };
    }

    const cleanCity = city.replace(/\s+/g, '').toLowerCase();

    const stores = await Store.find({
        $expr: {
            $eq: [
                { $replaceAll: { input: { $toLower: "$city" }, find: " ", replacement: "" } },
                cleanCity
            ]
        }
    });

    return { data: stores };
};

// List NearBy Store
storeCtlr.listNearby = async ({ query: { latitude, longitude, radius } }) => {
    if (!latitude || !longitude) {
        throw { status: 400, message: "Latitude and Longitude are required" };
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    // Approximate radius in kilometers
    const R = 6371; 

    // Simple Haversine-like calculation using aggregation
    const stores = await Store.find({
        location: {
            $nearSphere: {
                $geometry: { type: "Point", coordinates: [lon, lat] },
                $maxDistance: radius * 1000 // radius in meters
            }
        }
    });

    return { data: stores };
};

// Update Store
storeCtlr.update = async ({ params: { storeId }, body, files }) => {
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw { status: 400, message: "Valid Store ID is required" };
    }
    // console.log(body)

    const isStoreNameExist = await Store.findOne({ name: body.name });
    if (isStoreNameExist && isStoreNameExist._id.toString() !== storeId) {
        throw { status: 400, message: "Store name already exist" };
    }

    let imageUrls = [];
    if (files && files.length > 0) {
        imageUrls = files.map(file => file.path);
    }

    const updateData = { ...body };
    if (imageUrls.length > 0) {
        updateData.images = imageUrls;
    }

    if (body.latitude && body.longitude) {
        updateData.location = {
            type: "Point",
            coordinates: [parseFloat(body.longitude), parseFloat(body.latitude)]
        };
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, { new: true });
    if (!updatedStore) {
        throw { status: 404, message: "Store not found" };
    }

    return { message: "Store updated successfully", data: updatedStore };
};

// Delete Store
storeCtlr.delete = async ({ params: { storeId } }) => {
    if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
        throw { status: 400, message: "Valid Store ID is required" };
    }

    const deletedStore = await Store.findByIdAndDelete(storeId);
    if (!deletedStore) {
        throw { status: 404, message: "Store not found" };
    }

    return { message: "Store deleted successfully", data: deletedStore };
};

module.exports = storeCtlr