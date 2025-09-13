const { Schema, model } = require("mongoose")
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const categorySchema = new Schema({
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


const Category = model("Category", categorySchema);
module.exports = Category