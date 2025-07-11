const User = require('../models/user.model')

const registerValidationSchema = {
    firstName:{
        notEmpty:{
            errorMessage:'firstName is required'
        },
    },
    lastName:{
        notEmpty:{
            errorMessage:'lastName is required'
        },
    },
    // createdBy:{
    //     notEmpty:{
    //         errorMessage:'createdBy is required'
    //     },
    // },
    'email.address':{
        notEmpty:{
            errorMessage:'email is required'
        },
        isEmail:{
            errorMessage:'invalid email'
        },
        custom:{
            options : async function (value){
                const user = await User.findOne({
                    'email.address': value,
                    $or: [
                        { isRejected: { $exists: false } },
                        { isRejected: false }
                    ]
                })
                if(!user){
                    return true
                }else{
                    throw new Error('Email Address already exist')
                }
            }
        },
        trim:true,
        normalizeEmail:true
    },

    'phone.number':{
        notEmpty:{
            errorMessage: "Phone number is required" 
        },
        custom:{
            options : async function (value){
                const user = await User.findOne({
                    'phone.number': value,
                    $or: [
                        { isRejected: { $exists: false } },
                        { isRejected: false }
                    ]
                })
                if(!user){
                    return true
                }else{
                    throw new Error('Phone Number already exist')
                }
            }
        }
    },
    'phone.countryCode':{
        notEmpty:{
            errorMessage: "Country Code is required" 
        }
    },
    password:{
        notEmpty:{
            errorMessage:'password is required'
        },
        isLength:{
            options:{min:6,max:16},
            errorMessage:'password must be between 6 and 16 characters long'
        }
    },
    role:{
        notEmpty:{
            errorMessage:"role is required"
        },
        isIn:{
            options:[["customer", "storeAdmin", "superAdmin"]]
        }
    }
}

const loginValidationSchema={
    username:{
        notEmpty:{
            errorMessage: 'email or phone is required'
        },
        trim:true,
    },
    password:{
        notEmpty:{
            errorMessage:'password is required'
        },
        isLength:{
            options:{min:6,max:16},
            errorMessage:'password must be between 6 and 16 characters long'
        },
        trim:true
    }
}

const updateUserValidationSchema = {
    firstName:{
        notEmpty:{
            errorMessage:'firstName is required'
        },
    },
    lastName:{
        notEmpty:{
            errorMessage:'lastName is required'
        },
    },
    'email.address':{
        notEmpty:{
            errorMessage:'email is required'
        },
        isEmail:{
            errorMessage:'invalid email'
        },
        custom:{
            // options : async function (value){
            //     const user = await User.findOne({email:value})
            //     if(!user){
            //         return true
            //     }else{
            //         throw new Error('email already exist')
            //     }
            // }
            options : async function (value, { req }) {
                const user = await User.findOne({ 'email.address': value });
                // Check if the user exists and if the email is not the current user's email
                if (user && user.email.address !== req.user.email.address) {
                    throw new Error('Email Address already exists');
                }
                return true; // Valid email
            }
        },
        trim:true,
        normalizeEmail:true
    },
    'phone.number':{
        notEmpty:{
            errorMessage: "Phone number is required" 
        },
        custom:{
            // options : async function (value){
            //     const user = await User.findOne({'phone.number':value})
            //     if(!user){
            //         return true
            //     }else{
            //         throw new Error('phone already exist')
            //     }
            // }
            options : async function (value, { req }) {
                const user = await User.findOne({ 'phone.number': value });
                // Check if the user exists and if the email is not the current user's email
                if (user && user.phone.number !== req.user.number) {
                    throw new Error('Phone Number already exists');
                }
                return true; // Valid email
            }
        }
    },
}

const changeUsernameValidationSchema = {
    username:{
        notEmpty:{
            errorMessage: 'username is required'
        },
        custom:{
            options : async function (value){
                const user = await User.findOne({'username':value})
                if(!user){
                    return true
                }else{
                    throw new Error('Username already exist')
                }
            }
        }
    }
}

const changeEmailValidationSchema = {
    'email.address': {
        notEmpty: {
            errorMessage: 'Email Address is required'
        },
        trim: true,
        custom: {
            options: async function (value){
                const user = await User.findOne({'email.address': value})
                if(!user){
                    return true
                }else{
                    throw new Error('Email Address already exist')
                }
            }
        }
    }
}

const changePhoneValidationSchema = {
    'phone.number': {
        notEmpty: {
            errorMessage: 'Phone Number is required'
        },
        trim: true,
        custom: {
            options: async function (value){
                const user = await User.findOne({'phone.number': value})
                if(!user){
                    return true
                }else{
                    throw new Error('Phone Number already exist')
                }
            }
        }
    }
}

module.exports ={
    registerValidationSchema,
    loginValidationSchema,
    changeUsernameValidationSchema,
    changeEmailValidationSchema,
    changePhoneValidationSchema,
    updateUserValidationSchema
}