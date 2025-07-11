const { Schema, model } =  require("mongoose")
const AutoIncrement = require('mongoose-sequence')(require('mongoose'));

const userSchema = new Schema({
    userId: {
        type: Number,
        unique: true,
    },
    firstName: String,
    lastName: String,
    email: {
        address: String,
        isVerified: {
            type: Boolean, 
            default: false
        },
        otp: Number
    },
    password: String,
    phone: {
        number: String,
        countryCode : String,
        isVerified: {
            type: Boolean, 
            default: false
        },
        otp: Number
    },
    address: {
        city: String,
        area: String,
        street: String,
        building: String,
        landmark: String,
        pincode: String
    },
    profilePic: String,
    role: {
        type: String,
        enum: ["customer", "storeAdmin", "superAdmin"],
        default: "customer"
    },
    storeId: {
        type: Schema.Types.ObjectId,
        ref: "Store"
    },
    verificationToken: String,
    jwtToken: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isBlocked: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

userSchema.plugin(AutoIncrement, { inc_field: 'userId' });

const User = model('User', userSchema)
module.exports = User;