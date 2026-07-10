require("dotenv").config();

// Exit early if critical env variables are missing
if (!process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: JWT_SECRET environment variable is missing in .env!");
  process.exit(1);
}

const Express = require("express");
const cors = require("cors");
const connectMongoDb = require("./config/connectMongoDb");
const AdminRouter = require("./Router/AdminRouter");
const ClaimantRouter = require("./Router/ClaimantRouter/ClaimantRouter");
const NeutralRouter = require("./Router/NeutralRouter");
const RespondentRouter = require("./Router/RespondentRouter");
const ChatRouter = require("./Router/ChatRouter");
const LegalAiRouter = require("./Router/legalAiRouter");
const ServiceRequestRouter = require("./Router/ServiceRequestRouter");
const PaymentRouter = require("./Router/PaymentRouter");
const errorHandler = require("./middlewares/errorHandler");

const app = Express();

// Port
const PORT = process.env.PORT || 3636;

// Middlewares
app.use(Express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      // Dynamically reflect the request origin to avoid wildcard * issues with credentials
      callback(null, true);
    },
    credentials: true,
  })
);

const rateLimiter = require("./middlewares/rateLimiter");

// Rate limiters for security-sensitive endpoints
app.use(["/claimant/login", "/admin/login", "/neutral/login", "/respondent/login"], rateLimiter({
  max: 20,
  windowMs: 15 * 60 * 1000,
  message: "Too many login attempts. Please try again in 15 minutes."
}));
app.use("/api/chat/message", rateLimiter({
  max: 100,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests to the AI assistant. Please try again later."
}));

// Routes
app.use("/admin", AdminRouter);
app.use("/claimant", ClaimantRouter);
app.use("/neutral", NeutralRouter);
app.use("/respondent", RespondentRouter);
app.use("/api/chat", ChatRouter);
app.use("/api/legal-ai", LegalAiRouter);
app.use("/api/service-requests", ServiceRequestRouter);
app.use("/api/payments", PaymentRouter);

// Connect to MongoDB
connectMongoDb();

// Basic route to check server status
app.get("/", (req, res) => {
  res.send("ODR Backend is running");
});

// Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/chatMessage");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Real-time chat client connected:", socket.id);

  socket.on("join_room", (data) => {
    console.log("join_room request received on backend:", data);
    const { caseId, userAId, userBId } = data;
    if (!caseId || !userAId || !userBId) {
      console.warn("Invalid join_room data. Missing fields:", { caseId, userAId, userBId });
      return;
    }
    const sortedIds = [userAId, userBId].sort().join("_");
    const roomName = `room_${caseId}_${sortedIds}`;
    socket.join(roomName);
    console.log(`User socket ${socket.id} successfully joined chat room: ${roomName}`);
  });

  socket.on("send_message", async (data) => {
    console.log("send_message request received on backend:", data);
    try {
      const { caseId, senderId, senderRole, receiverId, receiverRole, message } = data;

      const savedMsg = await ChatMessage.create({
        caseId,
        senderId,
        senderRole,
        receiverId,
        receiverRole,
        message,
        timestamp: new Date(),
      });
      console.log("Saved chat message to MongoDB:", savedMsg._id);

      const sortedIds = [senderId, receiverId].sort().join("_");
      const roomName = `room_${caseId}_${sortedIds}`;

      console.log(`Broadcasting receive_message to room: ${roomName}`);
      io.to(roomName).emit("receive_message", savedMsg);
    } catch (err) {
      console.error("Socket chat event database save error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Real-time chat client disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
