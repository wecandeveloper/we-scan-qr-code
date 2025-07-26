const Category = require("../models/category.model");
const mongoose = require("mongoose");

const categoryCtlr = {};

// Create Category
categoryCtlr.create = async ({ body, file }) => {
    let imageUrl = '';

    // File already uploaded to Cloudinary by multer-storage-cloudinary
    if (file && file.path) {
        imageUrl = file.path;  // `file.path` holds the Cloudinary URL
    }

    const category = new Category({
        ...body,
        image: imageUrl
    });

    await category.save();

    return {
        message: "Category created successfully",
        data: category
    };
};

// Get All Categories
categoryCtlr.list = async () => {
    const categories = await Category.find().sort({ categoryId: 1 });
    return { data: categories };
};

// Get One Category by ID
categoryCtlr.show = async ({ params: { categoryId } }) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }
    const category = await Category.findById(categoryId);
    if (!category) {
        throw { status: 404, message: "Category not found" };
    }
    return { data: category };
};

// Update Category
categoryCtlr.update = async ({ params: { categoryId }, body, file }) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }

    const isCategoryNameExist = await Category.findOne({ name: body.name });
    if (isCategoryNameExist && isCategoryNameExist._id.toString() !== categoryId) {
        throw { status: 400, message: "Category name already exists" };
    }

    let imageUrl;

    if (file) {
        imageUrl = file.path; // New image uploaded
    } else if (typeof body.image === "string" && body.image.trim() !== "") {
        imageUrl = body.image; // Existing image retained
    } else {
        throw { status: 400, message: "At least one image is required" };
    }

    const updateData = { ...body, image: imageUrl };

    const updatedCategory = await Category.findByIdAndUpdate(categoryId, updateData, {
        new: true,
        runValidators: true,
    });

    if (!updatedCategory) {
        throw { status: 404, message: "Category not found" };
    }

    return { message: "Category updated successfully", data: updatedCategory };
};

// Delete Category
categoryCtlr.delete = async ({ params: { categoryId } }) => {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
        throw { status: 404, message: "Category not found" };
    }
    return { message: "Category deleted successfully", data: category };
};

module.exports = categoryCtlr;