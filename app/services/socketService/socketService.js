let io;

module.exports = {
    // Initialize Socket.IO
    initSocket: (serverIo) => {
        io = serverIo;
        console.log("Socket.IO initialized successfully ✅");

        io.on("connection", (socket) => {
            console.log("New socket connected:", socket.id);
    
            // ✅ Restaurant joins its room
            socket.on("join-restaurant", (restaurantId) => {
                socket.join(`restaurant_${restaurantId}`);
                console.log(`Socket ${socket.id} joined room restaurant_${restaurantId}`);
            });
    
            // (optional) handle disconnects
            socket.on("disconnect", () => {
                console.log(`Socket ${socket.id} disconnected`);
            });
        });
    },

    // Emit order notifications
    emitOrderNotification: (restaurantId, data) => {
        if (!io) {
            console.warn("Socket.IO not initialized!");
            return;
        }
        io.to(`restaurant_${restaurantId}`).emit("restaurant-order-notification", data);
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
