let io;

module.exports = {
    // Initialize Socket.IO
    initSocket: (serverIo) => {
        io = serverIo;
        console.log("Socket.IO initialized successfully ✅");
    },

    // Emit order notifications
    emitOrderNotification: (data) => {
        if (!io) {
            console.warn("Socket.IO not initialized!");
            return;
        }
        io.emit("restaurant-order-notification", data);
    },

    // Emit waiter call notifications
    emitCallWaiter: (data) => {
        if (!io) {
            console.warn("Socket.IO not initialized!");
            return;
        }
        io.emit("call-waiter", data);
    },
};
