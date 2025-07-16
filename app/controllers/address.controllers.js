const { default: mongoose } = require('mongoose')
const Address = require('../models/address.model')

const addressCltr = {}

addressCltr.create = async ({ body, user }) => {
    const address = new Address(body)
    address.userId = user.id

    const addresses = await Address.find({ userId: user.id })

    address.isDefault = addresses.length === 0

    await address.save()

    const newAddress = await Address.findById(address._id)
        .populate('userId', ['username', 'email', 'phone'])

    return {
        message: "Address added successfully",
        data: newAddress
    }
}

addressCltr.myAddresses = async ({ user }) => {
    const addresses = await Address.find({ userId: user.id }).sort({ createdAt: -1 })

    return {
        message: "Addresses fetched successfully",
        data: addresses
    }
}

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
        throw { status: 400, message: "Valid Category ID is required" };
    }
    const updated = await Address.findOneAndUpdate(
        { _id: addressId, userId: user.id },
        body,
        { new: true }
    )

    if (!updated) {
        throw { status: 404, message: "Address not found" }
    }

    return {
        message: "Address updated successfully",
        data: updated
    }
}

addressCltr.setAsDefault = async ({ params: { addressId }, user }) => {
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
        throw { status: 400, message: "Valid Category ID is required" };
    }
    const addresses = await Address.find({ userId: user.id })

    if (addresses.length === 0) {
        throw { status: 400, message: "No addresses found" }
    }

    const updatePromises = addresses.map((address) => {
        address.isDefault = address._id.toString() === addressId
        return address.save()
    })

    await Promise.all(updatePromises)

    const updatedAddresses = await Address.find({ userId: user.id }).sort({ createdAt: -1 })

    return {
        message: "Default address updated successfully",
        data: updatedAddresses
    }
}

module.exports = addressCltr
