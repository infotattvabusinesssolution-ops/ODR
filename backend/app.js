const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

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
const AuthRouter = require("./Router/AuthRouter");
const LandingRouter = require("./Router/LandingRouter");
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
app.use("/api/auth", AuthRouter);
app.use("/api/landing", LandingRouter);

// Temporary route to reset user password to password123
app.get("/reset-password/:email", async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const User = require("./models/users");
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.send("User not found");
    user.password = await bcrypt.hash("password123", 10);
    await user.save();
    res.send("Password successfully reset to: password123");
  } catch(err) {
    res.send("Error: " + err.message);
  }
});

// Connect to MongoDB
connectMongoDb();

// Serve frontend static files
app.use(Express.static(path.join(__dirname, "../frontend/dist")));

const fs = require('fs');

// For any other route that doesn't match an API route, send the React index.html
app.get(/(.*)/, (req, res) => {
  const indexPath = path.join(__dirname, "../frontend/dist", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Gracefully handle missing frontend build instead of throwing ENOENT error
    res.status(404).send("Frontend build not found. Please run 'npm run build' in the frontend directory.");
  }
});

// Global Error Handler Middleware (must be registered last)
app.use(errorHandler);

const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const ChatMessage = require("./models/chatMessage");
const Case = require("./models/Case");
const User = require("./models/users");

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

  socket.on("join_room", async (data) => {
    try {
      console.log("join_room request received on backend:", data);
      const { caseId, userAId, userBId } = data;
      if (!caseId || !userAId || !userBId) {
        console.warn("Invalid join_room data. Missing fields:", { caseId, userAId, userBId });
        return;
      }

      const caseRecord = await Case.findOne(
        mongoose.Types.ObjectId.isValid(caseId) ? { $or: [{ _id: caseId }, { caseId }] } : { caseId }
      );
      const canonicalCaseId = caseRecord ? String(caseRecord.caseId || caseRecord._id) : String(caseId);

      const sortedIds = [String(userAId), String(userBId)].sort().join("_");
      const roomName = `room_${canonicalCaseId}_${sortedIds}`;
      socket.join(roomName);

      // Join room aliases for case._id and case.caseId to ensure cross-view reliability
      if (caseRecord && caseRecord.caseId && caseRecord._id) {
        socket.join(`room_${String(caseRecord._id)}_${sortedIds}`);
        socket.join(`room_${String(caseRecord.caseId)}_${sortedIds}`);
      }
      console.log(`User socket ${socket.id} successfully joined chat room: ${roomName}`);
    } catch (e) {
      console.error("join_room error:", e);
    }
  });

  socket.on("send_message", async (data) => {
    console.log("send_message request received on backend:", data);
    try {
      const { caseId, senderId, senderRole, receiverId, receiverRole, message } = data;

      if (!caseId || !senderId || !receiverId || !message) {
        console.warn("send_message missing required fields:", { caseId, senderId, receiverId, message });
        return;
      }

      let validSenderId = senderId;
      let validReceiverId = receiverId;

      if (!mongoose.Types.ObjectId.isValid(validSenderId)) {
        const foundSender = await User.findOne({
          $or: [{ email: validSenderId }, { role: senderRole }]
        });
        if (foundSender) validSenderId = foundSender._id;
      }
      if (!mongoose.Types.ObjectId.isValid(validReceiverId)) {
        const foundReceiver = await User.findOne({
          $or: [{ email: validReceiverId }, { role: receiverRole }]
        });
        if (foundReceiver) validReceiverId = foundReceiver._id;
      }

      const caseRecord = await Case.findOne(
        mongoose.Types.ObjectId.isValid(caseId) ? { $or: [{ _id: caseId }, { caseId }] } : { caseId }
      );
      const canonicalCaseId = caseRecord ? String(caseRecord.caseId || caseRecord._id) : String(caseId);

      const savedMsg = await ChatMessage.create({
        caseId: canonicalCaseId,
        senderId: validSenderId,
        senderRole: senderRole || "respondent",
        receiverId: validReceiverId,
        receiverRole: receiverRole || "claimant",
        message,
        timestamp: new Date(),
      });
      console.log("Saved chat message to MongoDB:", savedMsg._id);

      const sortedIds = [String(validSenderId), String(validReceiverId)].sort().join("_");
      const roomName = `room_${canonicalCaseId}_${sortedIds}`;

      console.log(`Broadcasting receive_message to room: ${roomName}`);
      io.to(roomName).emit("receive_message", savedMsg);
      if (caseRecord && caseRecord._id) {
        io.to(`room_${String(caseRecord._id)}_${sortedIds}`).emit("receive_message", savedMsg);
      }
      // Also emit to the sender socket directly to ensure instant message feedback
      socket.emit("receive_message", savedMsg);
    } catch (err) {
      console.error("Socket chat event database save error:", err);
    }
  });

  // --- WEBRTC VIDEO CALL SIGNALING EVENTS ---
  socket.on("join-video-room", ({ roomId, userId, userName, userRole }) => {
    try {
      if (!roomId) return;
      socket.join(roomId);
      socket.data = socket.data || {};
      socket.data.videoRoom = { roomId, userId, userName, userRole };
      console.log(`Video call participant joined room [${roomId}]: socket=${socket.id}, user=${userName} (${userId})`);

      // Find all existing peer sockets in this room
      const clientsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
        .filter((id) => id !== socket.id)
        .map((peerId) => {
          const peerSocket = io.sockets.sockets.get(peerId);
          const peerData = peerSocket?.data?.videoRoom || {};
          return {
            socketId: peerId,
            userId: peerData.userId || "",
            userName: peerData.userName || "Participant",
            userRole: peerData.userRole || "Counsel",
          };
        });

      // Send the list of existing peers to the newcomer so they can initiate WebRTC offers
      socket.emit("all-users-in-room", clientsInRoom);

      // Sync active presentation to newly joined participant
      if (activePresentations.has(roomId)) {
        socket.emit("active-presentation-state", activePresentations.get(roomId));
      }

      // Notify everyone else in the room that a new peer connected
      socket.to(roomId).emit("user-connected", {
        socketId: socket.id,
        userId,
        userName,
        userRole,
      });
    } catch (err) {
      console.error("join-video-room error:", err);
    }
  });

  socket.on("video-offer", ({ toSocketId, offer, senderInfo }) => {
    try {
      io.to(toSocketId).emit("video-offer", {
        fromSocketId: socket.id,
        offer,
        senderInfo,
      });
    } catch (err) {
      console.error("video-offer error:", err);
    }
  });

  socket.on("video-answer", ({ toSocketId, answer }) => {
    try {
      io.to(toSocketId).emit("video-answer", {
        fromSocketId: socket.id,
        answer,
      });
    } catch (err) {
      console.error("video-answer error:", err);
    }
  });

  socket.on("ice-candidate", ({ toSocketId, candidate }) => {
    try {
      io.to(toSocketId).emit("ice-candidate", {
        fromSocketId: socket.id,
        candidate,
      });
    } catch (err) {
      console.error("ice-candidate error:", err);
    }
  });

  const activePresentations = io.activePresentations || (io.activePresentations = new Map());

  // Screen sharing signaling events
  socket.on("screen-share-started", ({ roomId, presenterName }) => {
    try {
      const targetRoom = roomId || socket.data?.videoRoom?.roomId;
      if (targetRoom) {
        activePresentations.set(targetRoom, {
          type: "screen",
          socketId: socket.id,
          presenterName: presenterName || "Participant",
        });
        socket.to(targetRoom).emit("screen-share-started", {
          socketId: socket.id,
          presenterName: presenterName || "Participant",
        });
      }
    } catch (err) {
      console.error("screen-share-started error:", err);
    }
  });

  socket.on("screen-share-stopped", ({ roomId }) => {
    try {
      const targetRoom = roomId || socket.data?.videoRoom?.roomId;
      if (targetRoom) {
        activePresentations.delete(targetRoom);
        socket.to(targetRoom).emit("screen-share-stopped", {
          socketId: socket.id,
        });
      }
    } catch (err) {
      console.error("screen-share-stopped error:", err);
    }
  });

  // Document / Evidence sharing signaling events (Full Mobile & Desktop Support)
  socket.on("document-share-started", ({ roomId, docUrl, docName, isImage, presenterName }) => {
    try {
      const targetRoom = roomId || socket.data?.videoRoom?.roomId;
      if (targetRoom) {
        activePresentations.set(targetRoom, {
          type: "document",
          socketId: socket.id,
          docUrl,
          docName,
          isImage,
          presenterName: presenterName || "Participant",
        });
        socket.to(targetRoom).emit("document-share-started", {
          socketId: socket.id,
          docUrl,
          docName,
          isImage,
          presenterName: presenterName || "Participant",
        });
      }
    } catch (err) {
      console.error("document-share-started error:", err);
    }
  });

  socket.on("document-share-stopped", ({ roomId }) => {
    try {
      const targetRoom = roomId || socket.data?.videoRoom?.roomId;
      if (targetRoom) {
        activePresentations.delete(targetRoom);
        socket.to(targetRoom).emit("document-share-stopped", {
          socketId: socket.id,
        });
      }
    } catch (err) {
      console.error("document-share-stopped error:", err);
    }
  });

  socket.on("leave-video-room", ({ roomId, userId }) => {
    try {
      const targetRoom = roomId || socket.data?.videoRoom?.roomId;
      if (targetRoom) {
        if (activePresentations.get(targetRoom)?.socketId === socket.id) {
          activePresentations.delete(targetRoom);
          socket.to(targetRoom).emit("screen-share-stopped", { socketId: socket.id });
          socket.to(targetRoom).emit("document-share-stopped", { socketId: socket.id });
        }
        socket.leave(targetRoom);
        socket.to(targetRoom).emit("user-disconnected", {
          socketId: socket.id,
          userId,
        });
      }
      if (socket.data) delete socket.data.videoRoom;
    } catch (err) {
      console.error("leave-video-room error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Real-time client disconnected:", socket.id);
    if (socket.data && socket.data.videoRoom) {
      const { roomId, userId } = socket.data.videoRoom;
      if (roomId) {
        if (activePresentations.get(roomId)?.socketId === socket.id) {
          activePresentations.delete(roomId);
          socket.to(roomId).emit("screen-share-stopped", { socketId: socket.id });
          socket.to(roomId).emit("document-share-stopped", { socketId: socket.id });
        }
        socket.to(roomId).emit("user-disconnected", {
          socketId: socket.id,
          userId,
        });
      }
    }
  });
});

// Start the server
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
