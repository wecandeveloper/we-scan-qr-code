const addressValidationSchema = {
    addressNo : {
        notEmpty : {
            errorMessage : 'Address No is required'
        }
    },
    street : {
        notEmpty : {
            errorMessage : 'Street Name is required'
        }
    },
    city : {
        notEmpty : {
            errorMessage : 'City Name is required'
        }
    },
    state : {
        notEmpty : {
            errorMessage : 'State Name is required'
        }
    },
    pincode : {
        notEmpty : {
            errorMessage : 'Pincode is required'
        }
    },
    // user:{
    //     notEmpty:{
    //         errorMessage:"user field can't be left blank"
    //     },
    //     isMongoId:{
    //         errorMessage: "Please provide a valid User id"
    //     }
    // }
}

module.exports = addressValidationSchema