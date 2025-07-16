const { Schema, model } = require('mongoose')
const AutoIncrement = require("mongoose-sequence")(require("mongoose"))

const addressSchema = new Schema  ({
    addressId: {
        type: Number,
        unique: true
    },
    name : String,
    addressNo : String,
    street : String,
    city : String,
    state : String,
    pincode : String,
    userId : {
        type : Schema.Types.ObjectId,
        ref : 'User'
    },
    isDefault : Boolean
}, { timestamps : true })

addressSchema.plugin(AutoIncrement, { inc_field: 'addressId' });

const Address = model('Address', addressSchema)
module.exports = Address