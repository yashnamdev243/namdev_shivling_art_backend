function registerProductSocket(io) {
  io.on("connection", (socket) => {
    socket.on("product:join", (productId) => {
      if (productId) socket.join(`product:${productId}`);
    });

    socket.on("product:leave", (productId) => {
      if (productId) socket.leave(`product:${productId}`);
    });
  });
}

function emitProductLikeUpdate(io, productId, payload) {
  io.to(`product:${productId}`).emit("product:likeUpdated", {
    productId,
    ...payload,
  });
}

function emitProductReviewUpdate(io, productId, payload) {
  io.to(`product:${productId}`).emit("product:reviewUpdated", {
    productId,
    ...payload,
  });
}

module.exports = {
  registerProductSocket,
  emitProductLikeUpdate,
  emitProductReviewUpdate,
};
