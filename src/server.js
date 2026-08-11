require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const sequelize = require("./config/database");
require("./models");

const { registerProductSocket } = require("./sockets/productSocket");

const PORT = Number(process.env.PORT || 5000);
const server = http.createServer(app);

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",").map(v => v.trim()).filter(Boolean);

const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], credentials: true },
});

app.set("io", io);
registerProductSocket(io);

async function start() {
  try {
    await sequelize.authenticate();
    console.log("MySQL connected.");
    const alter = String(process.env.DB_SYNC_ALTER || "false").toLowerCase() === "true";
    await sequelize.sync({ alter });
    console.log(`Database synced${alter ? " with ALTER" : ""}.`);
    server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

start();
