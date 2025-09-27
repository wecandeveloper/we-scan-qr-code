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

            // ✅ Guest joins its room
            socket.on("join-guest", (guestId) => {
                socket.join(`guest_${guestId}`);
                console.log(`Socket ${socket.id} joined room guest_${guestId}`);
                console.log(`Total clients in guest_${guestId}:`, io.sockets.adapter.rooms.get(`guest_${guestId}`)?.size || 0);
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

    // Emit customer notifications
    emitCustomerNotification: (guestId, data) => {
        if (!io) {
            console.warn("Socket.IO not initialized!");
            return;
        }
        console.log(`Emitting customer notification to guest_${guestId}:`, data);
        io.to(`guest_${guestId}`).emit("customer-order-notification", data);
    },
};
