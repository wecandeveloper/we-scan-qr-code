const Table = require("../models/table.model");
const socketService = require("../services/socketService/socketService");

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

tableCtlr.callWaiter = async ({ body }) => {
    const { tableId, restaurantId } = body;
    // console.log(body)

    if (!tableId || !restaurantId) {
        throw new Error("Table number and restaurant ID are required");
    }

    // Optional: Verify table exists in DB
    const table = await Table.findOne({ _id: tableId, restaurantId: restaurantId });
    if (!table) {
        throw new Error("Table not found");
    }

    // Prepare data for waiter notification
    const data = {
        tableNo: table.tableNumber,
        restaurantId,
        message: `Waiter requested at Table ${table.tableNumber}`,
        timestamp: new Date(),
    };

    // Emit to restaurant admins
    socketService.emitCallWaiter(data);

    return {
        success: true,
        message: "Waiter called successfully",
        data,
    };
};


module.exports = tableCtlr