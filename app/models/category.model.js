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
        unique: true 
    },
    description: String,
    image: String,
}, { timestamps: true });

categorySchema.plugin(AutoIncrement, { inc_field: 'categoryId' });

const Category = model("Category", categorySchema);
module.exports = Category