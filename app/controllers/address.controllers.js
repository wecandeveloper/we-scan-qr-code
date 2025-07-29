const { default: mongoose } = require('mongoose')
const Address = require('../models/address.model')

const addressCltr = {}

addressCltr.create = async ({ body, user }) => {
    // Create new address and set userId
    const address = new Address(body);
    address.userId = user.id;

    // Get all existing addresses for the user
    const addresses = await Address.find({ userId: user.id });

    // If no addresses exist, new address is default
    address.isDefault = addresses.length === 0;

    // Save the new address first
    await address.save();

    // If the new address is set as default, update others to not default
    if (address.isDefault) {
        const updatePromises = addresses.map((addr) => {
        if (addr._id.toString() !== address._id.toString() && addr.isDefault) {
            addr.isDefault = false;
            return addr.save();
        }
        return Promise.resolve(); // no changes needed
        });
        await Promise.all(updatePromises);
    }

    // Populate user info before returning
    const newAddress = await Address.findById(address._id)
        .populate('userId', ['username', 'email', 'phone']);

    return {
        message: "Address added successfully",
        data: newAddress,
    };
};

addressCltr.myAddresses = async ({ user }) => {
    const addresses = await Address.find({ userId: user.id }).sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email')

    return {
        message: "Addresses fetched successfully",
        data: addresses
    }
}

addressCltr.show = async ({ params: { addressId } }) => {
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        throw { status: 400, message: "Valid Address ID is required" };
    }

    const address = await Address.findById(addressId)
        .populate('userId', 'firstName lastName email')
    
    if (!address) {
        throw { status: 404, message: "Address not found" };
    }

    return { data: address };   
};

addressCltr.customerAddress = async ({ params: { userId } }) => {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw { status: 400, message: "Valid User ID is required" };
    }

    const address = await Address.findOne({userId: userId, isDefault: true})
        .populate('userId', 'firstName lastName email')
    
    if (!address) {
        throw { status: 404, message: "Address not found" };
    }

    return { data: address };   
};

addressCltr.delete = async ({ params: { addressId }, user }) => {
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }
    const address = await Address.findOneAndDelete({ _id: addressId, userId: user.id })

    if (!address) {
        throw { status: 404, message: "Address not found" }
    }

    return {
        message: "Address deleted successfully",
        data: address
    }
}

addressCltr.update = async ({ params: { addressId }, body, user }) => {
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        throw { status: 400, message: "Valid Address ID is required" };
    }

    // Update the requested address first
    const updated = await Address.findOneAndUpdate(
        { _id: addressId, userId: user.id },
        body,
        { new: true }
    );

    if (!updated) {
        throw { status: 404, message: "Address not found" };
    }

    // If the updated address is set as default, update others to not default
    if (body.isDefault === true) {
        // Find all other addresses for the user except the updated one
        const otherAddresses = await Address.find({
            userId: user.id,
            _id: { $ne: addressId },
            isDefault: true,
        });

        // Update them to isDefault false
        const updatePromises = otherAddresses.map(addr => {
            addr.isDefault = false;
            return addr.save();
        });

        await Promise.all(updatePromises);
    }

    return {
        message: "Address updated successfully",
        data: updated,
    };
};

addressCltr.setAsDefault = async ({ params: { addressId }, user }) => {
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        throw { status: 400, message: "Valid Address ID is required" };
    }

    const addresses = await Address.find({ userId: user.id });

    if (addresses.length === 0) {
        throw { status: 400, message: "No addresses found" };
    }

    const addressExists = addresses.some(addr => addr._id.toString() === addressId);

    if (!addressExists) {
        throw { status: 404, message: "Address not found for this user" };
    }

    // Update all addresses' isDefault
    const updatePromises = addresses.map((address) => {
        address.isDefault = address._id.toString() === addressId;
        return address.save();
    });

    await Promise.all(updatePromises);

    const updatedAddresses = await Address.find({ userId: user.id }).sort({ createdAt: -1 });

    return {
        message: "Default address updated successfully",
        data: updatedAddresses,
    };
};

module.exports = addressCltr
