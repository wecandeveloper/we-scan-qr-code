const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const storeSchema = new Schema({
    storeId: {
        type: Number,
        unique: true
    },
    name: { 
        type: String, 
        required: true 
    },
    city: String,
    area: String,
    address: String,
    // location: {
    //     latitude: Number,
    //     longitude: Number
    // },
    location: {
        type: { 
            type: String, 
            enum: ['Point'], 
            required: true 
        },
        coordinates: { 
            type: [Number], 
            required: true 
        }
    }, 
    // [longitude, latitude]
    // const lon = store.location.coordinates[0]
    // const lat = store.location.coordinates[1]
    contactNumber: String,
    images: [String],
    isOpen: { 
        type: Boolean, 
        default: true 
    },
});

storeSchema.plugin(AutoIncrement, { inc_field: 'storeId' })
storeSchema.index({ location: "2dsphere" });

const Store = model('Store', storeSchema)
module.exports = Store