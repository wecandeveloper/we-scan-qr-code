const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const restaurantSchema = new Schema({
    restaurantId: {
        type: Number,
        unique: true
    },
    name: { type: String, required: true },
    slug: { type: String, unique: true }, // for QR link
    qrCodeURL: String,
    adminId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    address: {
        city: String,
        area: String,
        street: String
    },
    location: {
        type: { 
            type: String, 
            enum: ['Point'], 
            default: 'Point' 
        },
        coordinates: [Number] // [lng, lat]
    },
    contactNumber: {
        number: String,
        countryCode: String
    },
    images: [
        {
            url: String,
            publicId: String,
            hash: String,
        }
    ],
    tableCount: Number,
    isOpen: { 
        type: Boolean, 
        default: true 
    },
    isApproved: { 
        type: Boolean, 
        default: false 
    },
    isBlocked: { 
        type: Boolean, 
        default: false 
    },
    theme: {
        primaryColor: String,
        secondaryColor: String,
        logoURL: String,
        layoutStyle: String
  }
}, { timestamps: true });

restaurantSchema.plugin(AutoIncrement, { inc_field: 'restaurantId' })

const Restaurant = model('Restaurant', restaurantSchema)
module.exports = Restaurant