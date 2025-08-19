const Table = require("../models/table.model");

const tableCtlr = {}

tableCtlr.listAll = async () => {
    const tables = await Table.find().populate('restaurantId', 'name address');
    if (!tables) {
        throw { status: 404, message: "Table not found" };
    }
    return { data: tables };
};

tableCtlr.listByRestaurant = async ({ params: { restaurantId } }) => {
    const tables = await Table.find({restaurantId: restaurantId}).populate('restaurantId', 'name address');
    if (!tables) {
        throw { status: 404, message: "Table not found" };
    }
    return { data: tables };
};

module.exports = tableCtlr