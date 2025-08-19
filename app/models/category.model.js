const { Schema, model } = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const categorySchema = new Schema({
    categoryId: {
        type: Number,
        unique: true,
    },
    name: { 
        type: String, 
        required: true,
        unique: false
    },
    restaurantId: {
        type: Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    description: String,
    image: String,
    imagePublicId: String,
    imageHash: String,
}, { timestamps: true });

categorySchema.plugin(AutoIncrement, { inc_field: 'categoryId' });

const Category = model("Category", categorySchema);
module.exports = Category