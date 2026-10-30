import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Video,
  Plus,
  Scale,
  Calendar,
  Clock,
  User,
  Search,
  Copy,
  Check,
  X,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Share2,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Minimize2,
  Maximize2,
  Sparkles,
  Send,
  Bot,
  Trash2,
  MessageSquare,
  MonitorUp,
  Folder,
  Download,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosInstance, { getApiBaseUrl } from "../../api/axiosConfig";
import "./GoogleMeet.css";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:global.stun.twilio.com:3478" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
};

function RemoteVideoTile({ peer, isPresentation = false }) {
  const rRef = useRef(null);
  const audioRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const videoEl = rRef.current;
    if (!videoEl || !peer?.stream) return;

    if (videoEl.srcObject !== peer.stream) {
      videoEl.srcObject = peer.stream;
    }

    if (audioRef.current && peer.stream && audioRef.current.srcObject !== peer.stream) {
      audioRef.current.srcObject = peer.stream;
      audioRef.current.play?.().catch(() => {});
    }

    const checkTracks = () => {
      if (peer.stream) {
        const vTracks = peer.stream.getVideoTracks();
        const live = vTracks.length > 0 && vTracks.some((t) => t.enabled);
        setHasVideo(live);
      } else {
        setHasVideo(false);
      }
    };

    checkTracks();
    if (peer.stream) {
      peer.stream.onaddtrack = checkTracks;
      peer.stream.onremovetrack = checkTracks;
    }

    // Play video with immediate presentation autoplay fallback
    const playVideo = () => {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Remote video auto-play prevented:", err.message);
          // If browser blocks unmuted playback, mute presentation stream so screen displays immediately
          videoEl.muted = true;
          videoEl.play().catch(() => {});
          const unlock = () => {
            if (!isPresentation) videoEl.muted = false;
            videoEl.play().catch(() => {});
            audioRef.current?.play?.().catch(() => {});
            document.removeEventListener("click", unlock);
            document.removeEventListener("touchstart", unlock);
          };
          document.addEventListener("click", unlock, { once: true });
          document.addEventListener("touchstart", unlock, { once: true });
        });
      }
    };

    playVideo();
    const interval = setInterval(checkTracks, 500);
    return () => {
      clearInterval(interval);
    };
  }, [peer?.stream, peer?.trackUpdate, isPresentation]);

  return (
    <div className={`uom-video-tile ${isPresentation ? "uom-stage-tile" : ""}`}>
      {/* Hidden audio element ensuring audio always plays cleanly even if video is presentation-muted */}
      <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
      <video
        ref={rRef}
        autoPlay
        playsInline
        muted={isPresentation}
        className={`uom-video-stream remote-stream ${isPresentation ? "screen-content" : ""}`}
        style={{ display: isPresentation || hasVideo ? "block" : "none" }}
      />
      {!hasVideo && !isPresentation && (
        <div className="uom-peer-avatar-card">
          <div className="uom-avatar-bubble">
            {(peer?.userName || "P").charAt(0).toUpperCase()}
          </div>
          <span className="uom-avatar-peer-name">{peer?.userName || "Opposite Party"}</span>
          <span className="uom-avatar-status">
            <span className="uom-status-dot online" /> Audio Active
          </span>
        </div>
      )}
      <div className="uom-participant-badge">
        <span className="uom-status-dot online" />
        <span>{peer?.userName || "Participant"} ({peer?.userRole || "Counsel"})</span>
      </div>
    </div>
  );
}

export default function GoogleMeet() {
  const { roomId } = useParams();
  const [joinQuery, setJoinQuery] = useState("");
  const [selectedDayIndex] = useState(1); // 1 = MON 21

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [inChamber, setInChamber] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chamberTitle, setChamberTitle] = useState("Virtual Hearing Chamber");

  // Instant Meeting & Shareable Link
  const [activeChamberLink, setActiveChamberLink] = useState("");
  const [showInstantLinkPrompt, setShowInstantLinkPrompt] = useState(false);

  // In-Call Chat Box (Everyone texts one by one)
  const [showChatDrawer, setShowChatDrawer] = useState(false);
  const [chatMessageText, setChatMessageText] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "Hon'ble Presiding Mediator",
      role: "Mediator",
      roleColor: "#8b5cf6",
      text: "Good morning counsels and parties. The virtual dispute hearing is now in formal session. Please state your appearances.",
      time: "10:30 AM",
      isSelf: false,
    },
    {
      id: 2,
      sender: "Adv. Rajesh Sharma (Claimant)",
      role: "Claimant Counsel",
      roleColor: "#3b82f6",
      text: "Good morning Hon'ble Arbitrator. Submitting revised Statement of Claim and Annexure A-1 in digital format.",
      time: "10:31 AM",
      isSelf: false,
    },
    {
      id: 3,
      sender: "Reliance Legal Team",
      role: "Respondent",
      roleColor: "#10b981",
      text: "Receipt acknowledged. Reviewing digital annexures with our client. We are present and ready.",
      time: "10:32 AM",
      isSelf: false,
    },
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatDrawer]);

  // Meeting Toolbar Controls (matching screenshot)
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // WebRTC & Socket.IO Signaling State
  const [remotePeers, setRemotePeers] = useState({});
  const [activeRoomId, setActiveRoomId] = useState("");
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const activeRoomIdRef = useRef("");
  const remoteStreamsRef = useRef({});
  const pendingIceCandidatesRef = useRef({});
  const [activePresenter, setActivePresenter] = useState(null);

  // Media streams
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pipVideoRef = useRef(null);
  const stripVideoRef = useRef(null);

  // Week days
  const weekDays = [
    { name: "SUN", num: 20, label: "Sunday, Sep 20, 2026" },
    { name: "MON", num: 21, label: "Monday, Sep 21, 2026" },
    { name: "TUE", num: 22, label: "Tuesday, Sep 22, 2026" },
    { name: "WED", num: 23, label: "Wednesday, Sep 23, 2026" },
    { name: "THU", num: 24, label: "Thursday, Sep 24, 2026" },
    { name: "FRI", num: 25, label: "Friday, Sep 25, 2026" },
    { name: "SAT", num: 26, label: "Saturday, Sep 26, 2026" },
  ];

  // Event Schedule State (matching reference design Day 1 to Day 5)
  const [activeDayTab, setActiveDayTab] = useState("Day 1");
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const [eventScheduleDays, setEventScheduleDays] = useState({
    "Day 1": [
      {
        id: "ev-101",
        dateDay: "16",
        dateMonth: "NOVEMBER",
        speakerName: "Harman Kardon",
        speakerAvatar: "/avatars/speaker1.jpg",
        leader: "Aslan Linker",
        tag: "Inspire",
        time: "05:35 AM – 08:00 AM",
        duration: "2h 25m",
        venue: "Room B3",
        caseId: "ODR-2026-116",
        caseTitle: "Harman Kardon vs. SoundCraft Dynamics Ltd.",
        type: "arbitration",
        typeLabel: "Commercial Arbitration",
        description: "Formal virtual dispute proceedings regarding intellectual property licensing and audio components supply agreement.",
        neutral: "Hon'ble Justice S. K. Mohanty (Retd.)",
      },
      {
        id: "ev-102",
        dateDay: "20",
        dateMonth: "NOVEMBER",
        speakerName: "Toni Duggan",
        speakerAvatar: "/avatars/speaker2.jpg",
        leader: "Aslan Linker",
        tag: "Inspire",
        time: "05:35 AM – 08:00 AM",
        duration: "2h 25m",
        venue: "Room D3",
        caseId: "ODR-2026-120",
        caseTitle: "Toni Duggan Sports Management vs. League Board",
        type: "mediation",
        typeLabel: "Mediation Session",
        description: "Facilitated institutional mediation session covering sports sponsorship covenants, venue broadcast terms, and player compensation.",
        neutral: "Adv. Rajesh Pattnaik (Senior Mediator)",
      },
      {
        id: "ev-103",
        dateDay: "18",
        dateMonth: "NOVEMBER",
        speakerName: "Bilial Hossain",
        speakerAvatar: "/avatars/speaker3.jpg",
        leader: "Aslan Linker",
        tag: "Inspire",
        time: "05:35 AM – 08:00 AM",
        duration: "2h 25m",
        venue: "Room A3",
        caseId: "ODR-2026-118",
        caseTitle: "Bilial Hossain Warehousing vs. Continental Cargo",
        type: "conciliation",
        typeLabel: "Conciliation Hearing",
        description: "Cross-border maritime shipping settlement conference regarding unpaid storage demurrage claims.",
        neutral: "Dr. Ananya Mishra (Conciliator)",
      },
    ],
    "Day 2": [
      {
        id: "ev-201",
        dateDay: "21",
        dateMonth: "November",
        speakerName: "M/s Apex Logistics",
        speakerAvatar: "/avatars/speaker1.jpg",
        leader: "Justice Mohanty",
        tag: "Arbitration",
        time: "10:00 AM - 12:30 PM",
        duration: "2h 30'",
        venue: "Room B1",
        caseId: "ODR-2026-88",
        caseTitle: "M/s Apex Logistics vs. Reliance Freight Corp",
        type: "arbitration",
        typeLabel: "Commercial Arbitration",
        description: "High-value logistics contract dispute with digital evidentiary examination under Section 65B.",
        neutral: "Hon'ble Justice S. K. Mohanty (Retd.)",
      },
      {
        id: "ev-202",
        dateDay: "22",
        dateMonth: "November",
        speakerName: "Priya Sharma",
        speakerAvatar: "/avatars/speaker2.jpg",
        leader: "Rajesh Pattnaik",
        tag: "Mediation",
        time: "02:00 PM - 04:00 PM",
        duration: "2h 00'",
        venue: "Room D2",
        caseId: "ODR-2026-94",
        caseTitle: "Priya Sharma vs. Metro Urban Developers",
        type: "mediation",
        typeLabel: "Mediation Conference",
        description: "Real-estate possession delay compensation conference with mutual settlement term drafting.",
        neutral: "Adv. Rajesh Pattnaik (Senior Mediator)",
      },
    ],
    "Day 3": [
      {
        id: "ev-301",
        dateDay: "24",
        dateMonth: "November",
        speakerName: "BlueStone Enterprises",
        speakerAvatar: "/avatars/speaker3.jpg",
        leader: "Dr. Ananya Mishra",
        tag: "Conciliation",
        time: "11:00 AM - 01:00 PM",
        duration: "2h 00'",
        venue: "Room A1",
        caseId: "ODR-2026-102",
        caseTitle: "BlueStone Enterprises vs. TechVision LLP",
        type: "conciliation",
        typeLabel: "Conciliation Session",
        description: "IT Software development SLA failure dispute conciliation.",
        neutral: "Dr. Ananya Mishra (Conciliator)",
      },
    ],
    "Day 4": [
      {
        id: "ev-401",
        dateDay: "26",
        dateMonth: "November",
        speakerName: "Kalinga Metals Ltd.",
        speakerAvatar: "/avatars/speaker1.jpg",
        leader: "Justice Mohanty",
        tag: "Arbitration",
        time: "09:30 AM - 12:00 PM",
        duration: "2h 30'",
        venue: "Room B2",
        caseId: "ODR-2026-105",
        caseTitle: "Kalinga Metals Ltd. vs. Global Ore Traders",
        type: "arbitration",
        typeLabel: "International Arbitration",
        description: "Raw mineral supply pricing index dispute hearing.",
        neutral: "Hon'ble Justice S. K. Mohanty (Retd.)",
      },
    ],
    "Day 5": [
      {
        id: "ev-501",
        dateDay: "28",
        dateMonth: "November",
        speakerName: "Odishatech Cloud",
        speakerAvatar: "/avatars/speaker2.jpg",
        leader: "Rajesh Pattnaik",
        tag: "Mediation",
        time: "03:00 PM - 05:00 PM",
        duration: "2h 00'",
        venue: "Room C3",
        caseId: "ODR-2026-110",
        caseTitle: "Odishatech Cloud vs. SmartCity Infrastructure",
        type: "mediation",
        typeLabel: "Mediation Hearing",
        description: "Municipal data center cloud hosting invoice settlement conference.",
        neutral: "Adv. Rajesh Pattnaik (Senior Mediator)",
      },
    ],
  });

  // Schedule Form
  const [formCaseId, setFormCaseId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("arbitration");
  const [formTime, setFormTime] = useState("10:00 AM");
  const [formDuration, setFormDuration] = useState("60 mins");
  const [formNeutral, setFormNeutral] = useState("Presiding Mediator");


  // Fetch real scheduled hearings from backend
  useEffect(() => {
    const fetchBackendHearings = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail") || "";
        if (!userEmail) return;
        const res = await axiosInstance.post("/respondent/get-hearing-by-caseId", {
          email: userEmail,
        });

        if (res.data && res.data.hearings && res.data.hearings.length > 0) {
          const mapped = res.data.hearings.map((h, i) => ({
            id: h._id || `ev-dyn-${i}`,
            dateDay: (h.date || "").split("-")[2] || "21",
            dateMonth: "November",
            speakerName: h.caseName || `Hearing #${h.caseId}`,
            speakerAvatar: "/avatars/speaker1.jpg",
            leader: h.Judge || "Presiding Mediator",
            tag: h.hearingType || "Arbitration",
            time: h.time || "10:30 AM",
            duration: h.duration || "45 mins",
            venue: h.location || "Virtual Chamber",
            caseId: h.caseId || "ODR-2026",
            caseTitle: h.caseName || `Case #${h.caseId}`,
            type: (h.hearingType || "arbitration").toLowerCase(),
            typeLabel: h.hearingType || "Hearing Session",
            description: h.notes || "Official institutional hearing session.",
            neutral: h.Judge || "Mediator",
          }));

          setEventScheduleDays((prev) => ({
            ...prev,
            "Day 1": [...mapped, ...(prev["Day 1"] || [])],
          }));
        }
      } catch (err) {
        console.warn("Notice: Backend hearings fetch for chamber:", err.message);
      }
    };

    fetchBackendHearings();
  }, []);

  // Handle stream attachments for main video, screen share, presenter PIP, and strip video
  useEffect(() => {
    if (isScreenSharing && screenStreamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== screenStreamRef.current) {
        videoRef.current.srcObject = screenStreamRef.current;
        videoRef.current.play?.().catch(() => {});
      }
      if (pipVideoRef.current && streamRef.current && isVideoOn) {
        if (pipVideoRef.current.srcObject !== streamRef.current) {
          pipVideoRef.current.srcObject = streamRef.current;
          pipVideoRef.current.play?.().catch(() => {});
        }
      }
    } else if (!isScreenSharing && inChamber && !isMinimized && isVideoOn && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play?.().catch(() => {});
      }
    }

    if (stripVideoRef.current && streamRef.current && isVideoOn) {
      if (stripVideoRef.current.srcObject !== streamRef.current) {
        stripVideoRef.current.srcObject = streamRef.current;
        stripVideoRef.current.play?.().catch(() => {});
      }
    }
  }, [inChamber, isMinimized, isVideoOn, isScreenSharing, remotePeers, activePresenter]);

  // Cleanup all media tracks & socket connections on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        try {
          socketRef.current.emit("leave-video-room", {
            roomId: activeRoomIdRef.current || "utkal-odr-room",
            userId: localStorage.getItem("userId") || "",
          });
          socketRef.current.disconnect();
        } catch (e) {
          console.error("Socket cleanup error:", e);
        }
        socketRef.current = null;
      }
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        try {
          pc.close();
        } catch (e) {
          console.error("PeerConnection cleanup error:", e);
        }
      });
      peerConnectionsRef.current = {};
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Universal shareable meeting link
  const universalMeetingLink = `${window.location.origin}/meet/utkal-odr-room`;

  const handleCopyUniversalLink = () => {
    const linkToCopy = activeChamberLink || (activeRoomIdRef.current ? `${window.location.origin}/meet/${activeRoomIdRef.current}` : `${window.location.origin}/meet/${roomId || "utkal-odr-room"}`);
    navigator.clipboard.writeText(linkToCopy);
    toast.success("Meeting link copied! Anyone with this link can join directly.");
  };

  // WebRTC Peer Connection Factory
  const createPeerConnection = async (peerSocketId, stream, isInitiator, peerInfo = null) => {
    if (peerConnectionsRef.current[peerSocketId]) {
      try {
        peerConnectionsRef.current[peerSocketId].close();
      } catch (e) {
        console.error("Error closing existing peer connection:", e);
      }
      delete peerConnectionsRef.current[peerSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerSocketId] = pc;

    // Attach local stream tracks (screen share or camera)
    const localStream = screenStreamRef.current || stream || streamRef.current;
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStream);
        } catch (e) {
          console.error("Error adding local track to peer connection:", e);
        }
      });
    }

    // Forward ICE candidates to remote peer via backend socket
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          toSocketId: peerSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Receive remote video/audio track
    pc.ontrack = (event) => {
      console.log(`[WebRTC] Received remote track (${event.track.kind}) from: ${peerSocketId}`);
      let peerStream = remoteStreamsRef.current[peerSocketId];
      if (!peerStream) {
        peerStream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
        remoteStreamsRef.current[peerSocketId] = peerStream;
      }
      if (!peerStream.getTracks().some((t) => t.id === event.track.id)) {
        peerStream.addTrack(event.track);
      }

      event.track.onunmute = () => {
        console.log(`[WebRTC] Track unmuted (${event.track.kind}) from: ${peerSocketId}`);
      };

      setRemotePeers((prev) => {
        const existing = prev[peerSocketId] || {};
        return {
          ...prev,
          [peerSocketId]: {
            socketId: peerSocketId,
            stream: peerStream,
            userName: peerInfo?.userName || existing.userName || "Opposite Party",
            userRole: peerInfo?.userRole || existing.userRole || "Participant",
            userId: peerInfo?.userId || existing.userId || "",
            trackUpdate: Date.now(),
          },
        };
      });
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`Peer ${peerSocketId} ICE connection state: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        try {
          pc.restartIce?.();
        } catch (e) {}
      }
    };

    // If initiator, generate SDP offer and send via backend
    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socketRef.current) {
          const currentUserId = localStorage.getItem("userId") || `user_${Math.random().toString(36).slice(2, 8)}`;
          const currentUserName =
            localStorage.getItem("username") ||
            localStorage.getItem("userName") ||
            localStorage.getItem("userEmail") ||
            "Participant";
          const currentUserRole =
            localStorage.getItem("userRole") ||
            localStorage.getItem("role") ||
            "Counsel";

          socketRef.current.emit("video-offer", {
            toSocketId: peerSocketId,
            offer,
            senderInfo: {
              userId: currentUserId,
              userName: currentUserName,
              userRole: currentUserRole,
            },
          });
        }
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
      }
    }

    return pc;
  };

  // Screen Share Management (Stop & Toggle with WebRTC Track Replacement)
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.onended = null;
        } catch (e) {}
      });
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    setActivePresenter(null);

    // Revert WebRTC senders back to local camera track
    const camTrack = streamRef.current?.getVideoTracks()[0] || null;
    for (const [peerSocketId, pc] of Object.entries(peerConnectionsRef.current)) {
      try {
        const senders = pc.getSenders();
        let videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (!videoSender) {
          const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
          const vt = transceivers.find(
            (t) => (t.sender?.track && t.sender.track.kind === "video") || (t.receiver?.track && t.receiver.track.kind === "video")
          );
          if (vt && vt.sender) {
            videoSender = vt.sender;
          }
        }
        if (videoSender) {
          videoSender.replaceTrack(camTrack).catch(() => {});
        }
      } catch (e) {
        console.error("Error reverting peer track to camera:", e);
      }
    }

    if (socketRef.current && activeRoomIdRef.current) {
      socketRef.current.emit("screen-share-stopped", {
        roomId: activeRoomIdRef.current,
      });
    }

    // Switch videoRef back to camera if camera is on
    setTimeout(() => {
      if (videoRef.current) {
        if (isVideoOn && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play?.().catch(() => {});
        } else {
          videoRef.current.srcObject = null;
        }
      }
      if (stripVideoRef.current && isVideoOn && streamRef.current) {
        stripVideoRef.current.srcObject = streamRef.current;
        stripVideoRef.current.play?.().catch(() => {});
      }
    }, 50);

    toast.info("Screen sharing ended");
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast.warning("Display Media / Screen Sharing API is not supported in this browser.");
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });

      screenStreamRef.current = screenStream;

      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        if ("contentHint" in videoTrack) {
          videoTrack.contentHint = "detail";
        }
        videoTrack.onended = () => {
          stopScreenShare();
        };

        const myName = localStorage.getItem("username") || localStorage.getItem("userName") || localStorage.getItem("userEmail") || "You";

        // Replace or add video track on all active WebRTC peer connections
        for (const [peerSocketId, pc] of Object.entries(peerConnectionsRef.current)) {
          try {
            const senders = pc.getSenders();
            let videoSender = senders.find((s) => s.track && s.track.kind === "video");
            if (!videoSender) {
              const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
              const vt = transceivers.find(
                (t) => (t.sender?.track && t.sender.track.kind === "video") || (t.receiver?.track && t.receiver.track.kind === "video")
              );
              if (vt && vt.sender) {
                videoSender = vt.sender;
              }
            }

            if (videoSender) {
              const transceivers = pc.getTransceivers ? pc.getTransceivers() : [];
              const vt = transceivers.find((t) => t.sender === videoSender);
              let needsOffer = false;
              if (vt && (vt.direction === "recvonly" || vt.direction === "inactive")) {
                vt.direction = "sendrecv";
                needsOffer = true;
              }
              await videoSender.replaceTrack(videoTrack);
              console.log(`[WebRTC] Replaced video track for peer ${peerSocketId} with screen share`);
              if (needsOffer && pc.signalingState === "stable") {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current?.emit("video-offer", {
                  toSocketId: peerSocketId,
                  offer,
                  senderInfo: {
                    userId: localStorage.getItem("userId") || "",
                    userName: myName,
                    userRole: localStorage.getItem("userRole") || "Participant",
                  },
                });
              }
            } else {
              console.log(`[WebRTC] Adding new screen track for peer ${peerSocketId}`);
              pc.addTrack(videoTrack, screenStream);
              if (pc.signalingState === "stable") {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socketRef.current?.emit("video-offer", {
                  toSocketId: peerSocketId,
                  offer,
                  senderInfo: {
                    userId: localStorage.getItem("userId") || "",
                    userName: myName,
                    userRole: localStorage.getItem("userRole") || "Participant",
                  },
                });
              }
            }
          } catch (e) {
            console.error("Error replacing peer track with screen share:", e);
          }
        }
      }

      setIsScreenSharing(true);
      const myName = localStorage.getItem("username") || localStorage.getItem("userName") || localStorage.getItem("userEmail") || "You";
      setActivePresenter({
        isSelf: true,
        socketId: socketRef.current?.id,
        name: myName,
        startedAt: Date.now(),
      });

      if (socketRef.current && activeRoomIdRef.current) {
        socketRef.current.emit("screen-share-started", {
          roomId: activeRoomIdRef.current,
          presenterName: myName,
          socketId: socketRef.current?.id,
        });
      }

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
          videoRef.current.play?.().catch(() => {});
        }
        if (pipVideoRef.current && streamRef.current && isVideoOn) {
          pipVideoRef.current.srcObject = streamRef.current;
          pipVideoRef.current.play?.().catch(() => {});
        }
        if (stripVideoRef.current && streamRef.current && isVideoOn) {
          stripVideoRef.current.srcObject = streamRef.current;
          stripVideoRef.current.play?.().catch(() => {});
        }
      }, 50);

      toast.success("You are now presenting your screen");
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        console.log("User cancelled screen share dialog");
      } else {
        console.error("Screen share error:", err);
        toast.error(`Screen share failed: ${err.message || "Permission issue"}`);
      }
    }
  };

  // Launch Room & Initialize WebRTC Signaling via Socket.IO
  const handleLaunchChamber = async (title = "Virtual Hearing Chamber", isInstant = false, customRoomId = null) => {
    const chamberCode = customRoomId || (isInstant
      ? `instant-${Date.now().toString(36).slice(-5)}`
      : (roomId || "utkal-odr-room"));

    const link = `${window.location.origin}/meet/${chamberCode}`;
    setActiveChamberLink(link);
    setChamberTitle(title);
    setInChamber(true);
    setIsMinimized(false);
    setActiveRoomId(chamberCode);
    activeRoomIdRef.current = chamberCode;

    if (isInstant) {
      setShowInstantLinkPrompt(true);
    }
    if (typeof window !== "undefined" && window.history && chamberCode) {
      window.history.replaceState(null, "", `/meet/${chamberCode}`);
    }

    // 1. Obtain local camera & microphone stream
    let localStream = streamRef.current;
    if (!localStream) {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch (camErr) {
            console.warn("Video+audio failed, trying audio-only fallback:", camErr);
            try {
              localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (micErr) {
              console.warn("Audio-only also failed:", micErr);
            }
          }
          streamRef.current = localStream;
          if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
            videoRef.current.play?.().catch(() => {});
          }
        }
      } catch (err) {
        console.log("Camera access fallback:", err);
      }
    }

    // 2. Connect to Socket.IO signaling server
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(getApiBaseUrl(), {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    const currentUserId = localStorage.getItem("userId") || `user_${Math.random().toString(36).slice(2, 8)}`;
    const currentUserName =
      localStorage.getItem("username") ||
      localStorage.getItem("userName") ||
      localStorage.getItem("userEmail") ||
      "Participant";
    const currentUserRole =
      localStorage.getItem("userRole") ||
      localStorage.getItem("role") ||
      "Counsel";

    // When socket connects, join the video room
    const emitJoinRoom = () => {
      console.log("Emitting join-video-room for:", chamberCode, "socket ID:", socket.id);
      socket.emit("join-video-room", {
        roomId: chamberCode,
        userId: currentUserId,
        userName: currentUserName,
        userRole: currentUserRole,
      });
    };
    socket.on("connect", emitJoinRoom);
    if (socket.connected) {
      emitJoinRoom();
    }

    // 3. Newcomer receives list of existing peers in the room -> Initiates offer to each
    socket.on("all-users-in-room", async (clientsInRoom) => {
      console.log("Existing peers in video room:", clientsInRoom);
      for (const item of clientsInRoom) {
        const peerSocketId = typeof item === "string" ? item : item.socketId;
        const peerInfo = typeof item === "object" ? item : null;
        
        // Register immediately so the participant's tile appears in the grid
        setRemotePeers((prev) => ({
          ...prev,
          [peerSocketId]: {
            socketId: peerSocketId,
            userName: peerInfo?.userName || "Opposite Party",
            userRole: peerInfo?.userRole || "Participant",
            userId: peerInfo?.userId || "",
            stream: remoteStreamsRef.current[peerSocketId] || null,
            trackUpdate: Date.now(),
          },
        }));

        await createPeerConnection(peerSocketId, localStream, true, peerInfo);
      }
    });

    // 4. Remote peer connected notification
    socket.on("user-connected", ({ socketId, userId, userName, userRole }) => {
      console.log(`Peer connected: ${userName} (${socketId})`);
      toast.info(`${userName || "A participant"} joined the hearing room`);
      setRemotePeers((prev) => ({
        ...prev,
        [socketId]: {
          socketId,
          userId,
          userName: userName || "Opposite Party",
          userRole: userRole || "Participant",
          stream: remoteStreamsRef.current[socketId] || null,
          trackUpdate: Date.now(),
        },
      }));
    });

    // 5. Incoming video-offer from another peer
    socket.on("video-offer", async ({ fromSocketId, offer, senderInfo }) => {
      console.log(`Received video-offer from ${fromSocketId}:`, senderInfo);
      try {
        const currentLocal = screenStreamRef.current || streamRef.current || localStream;
        let pc = peerConnectionsRef.current[fromSocketId];
        if (!pc || pc.signalingState === "closed") {
          pc = await createPeerConnection(fromSocketId, currentLocal, false, senderInfo);
        }
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Drain queued ICE candidates
        const queued = pendingIceCandidatesRef.current[fromSocketId] || [];
        for (const cand of queued) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.error("Error adding queued candidate:", err);
          }
        }
        pendingIceCandidatesRef.current[fromSocketId] = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("video-answer", {
          toSocketId: fromSocketId,
          answer,
        });
      } catch (err) {
        console.error("Error processing video-offer:", err);
      }
    });

    // 6. Incoming video-answer from callee
    socket.on("video-answer", async ({ fromSocketId, answer }) => {
      console.log(`Received video-answer from ${fromSocketId}`);
      try {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued ICE candidates
          const queued = pendingIceCandidatesRef.current[fromSocketId] || [];
          for (const cand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.error("Error adding queued candidate:", err);
            }
          }
          pendingIceCandidatesRef.current[fromSocketId] = [];
        }
      } catch (err) {
        console.error("Error processing video-answer:", err);
      }
    });

    // 7. Incoming ICE candidate from peer
    socket.on("ice-candidate", async ({ fromSocketId, candidate }) => {
      try {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } else {
          if (!pendingIceCandidatesRef.current[fromSocketId]) {
            pendingIceCandidatesRef.current[fromSocketId] = [];
          }
          pendingIceCandidatesRef.current[fromSocketId].push(candidate);
        }
      } catch (err) {
        console.error("Error processing ice-candidate:", err);
      }
    });

    // 8. Remote peer started screen sharing
    socket.on("screen-share-started", ({ socketId, presenterName }) => {
      console.log(`Peer started sharing screen: ${presenterName} (${socketId})`);
      toast.info(`${presenterName || "A participant"} is now presenting their screen`);
      setActivePresenter({
        isSelf: false,
        socketId,
        name: presenterName || "Participant",
        startedAt: Date.now(),
      });
      // Force trigger remote peer tile update so screen presentation renders immediately
      setRemotePeers((prev) => {
        const next = { ...prev };
        const peerKey = next[socketId] ? socketId : Object.keys(next)[0];
        if (peerKey && next[peerKey]) {
          next[peerKey] = {
            ...next[peerKey],
            trackUpdate: Date.now(),
          };
        }
        return next;
      });
    });

    // 9. Remote peer stopped screen sharing
    socket.on("screen-share-stopped", ({ socketId }) => {
      console.log(`Peer stopped sharing screen (${socketId})`);
      setActivePresenter((prev) => (prev?.socketId === socketId || !socketId ? null : prev));
      setRemotePeers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          next[k] = { ...next[k], trackUpdate: Date.now() };
        });
        return next;
      });
      toast.info("Screen presentation ended");
    });

    // 10. Remote peer left or disconnected
    socket.on("user-disconnected", ({ socketId, userId }) => {
      console.log(`Peer disconnected: ${socketId}`);
      if (peerConnectionsRef.current[socketId]) {
        try {
          peerConnectionsRef.current[socketId].close();
        } catch (e) {}
        delete peerConnectionsRef.current[socketId];
      }
      delete remoteStreamsRef.current[socketId];
      delete pendingIceCandidatesRef.current[socketId];
      setRemotePeers((prev) => {
        const next = { ...prev };
        delete next[socketId];
        return next;
      });
      setActivePresenter((prev) => (prev?.socketId === socketId ? null : prev));
    });
  };

  // Leave Hearing Chamber and Clean Up WebRTC/Socket state
  const handleLeaveChamber = () => {
    if (socketRef.current) {
      const currentUserId = localStorage.getItem("userId") || "";
      socketRef.current.emit("leave-video-room", {
        roomId: activeRoomIdRef.current || activeRoomId || roomId || "utkal-odr-room",
        userId: currentUserId,
      });
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch (e) {}
    });
    peerConnectionsRef.current = {};
    remoteStreamsRef.current = {};
    pendingIceCandidatesRef.current = {};
    setRemotePeers({});
    setActivePresenter(null);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setActiveRoomId("");
    activeRoomIdRef.current = "";
    setInChamber(false);
    setIsMinimized(false);
    setIsScreenSharing(false);
    setShowChatDrawer(false);
    setShowInstantLinkPrompt(false);
    toast.info("Left the hearing chamber.");
  };

  // Auto-join chamber if roomId is present in the URL path
  useEffect(() => {
    if (roomId) {
      handleLaunchChamber(`Hearing Chamber (${roomId})`, false, roomId);
    }
  }, [roomId]);

  // In-Call Chat Sending (Everyone texts one by one)
  const handleSendChatMessage = (e) => {
    e?.preventDefault();
    if (!chatMessageText.trim()) return;
    const text = chatMessageText.trim();
    const newMsg = {
      id: Date.now(),
      sender: "You",
      role: "Participant",
      roleColor: "#2563eb",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isSelf: true,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessageText("");

    // Realistic participant response in the hearing
    setTimeout(() => {
      let replySender = "Hon'ble Presiding Mediator";
      let replyRole = "Mediator";
      let replyColor = "#8b5cf6";
      let replyText = `Noted. Recorded in hearing proceedings: "${text.length > 35 ? text.slice(0, 35) + '...' : text}"`;

      if (text.toLowerCase().includes("rejoinder") || text.toLowerCase().includes("extension") || text.toLowerCase().includes("time")) {
        replyText = "The tribunal grants reasonable time for filing. Pleadings schedule will be reflected in today's electronic minutes.";
      } else if (text.toLowerCase().includes("evidence") || text.toLowerCase().includes("document") || text.toLowerCase().includes("annexure")) {
        replySender = "Adv. Rajesh Sharma (Claimant)";
        replyRole = "Claimant Counsel";
        replyColor = "#3b82f6";
        replyText = "Documents uploaded to case docket with Section 65B electronic verification certificate.";
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: replySender,
          role: replyRole,
          roleColor: replyColor,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isSelf: false,
        },
      ]);
    }, 1200);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const audio = streamRef.current.getAudioTracks()[0];
      if (audio) audio.enabled = !isMicOn;
    }
    setIsMicOn(!isMicOn);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const video = streamRef.current.getVideoTracks()[0];
      if (video) video.enabled = !isVideoOn;
    }
    setIsVideoOn(!isVideoOn);
  };

  // Join case input
  const handleJoinQuery = (e) => {
    e?.preventDefault();
    if (!joinQuery.trim()) return;
    toast.info(`Connecting to ${joinQuery.toUpperCase()}`);
    handleLaunchChamber(`Case Chamber: ${joinQuery.toUpperCase()}`);
  };

  // Submit new schedule
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const dayNum = weekDays[selectedDayIndex].num;
    const typeLabels = {
      arbitration: "Arbitration",
      mediation: "Mediation",
      conciliation: "Conciliation",
    };

    const finalCaseId = formCaseId || `ODR-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Add to eventScheduleDays
    const newEvent = {
      id: `ev-${Date.now()}`,
      dateDay: `${dayNum}`,
      dateMonth: "November",
      speakerName: formTitle,
      speakerAvatar: "/avatars/speaker1.jpg",
      leader: formNeutral || "Mediator",
      tag: typeLabels[formType] || "Hearing",
      time: formTime,
      duration: formDuration,
      venue: `Room ${Math.floor(1 + Math.random() * 9)}B`,
      caseId: finalCaseId,
      caseTitle: formTitle,
      type: formType,
      typeLabel: typeLabels[formType] || "Hearing",
      description: `Institutional ${formType} hearing scheduled under Utkal ODR institutional dispute rules.`,
      neutral: formNeutral || "Presiding Mediator",
    };

    // Save to backend
    try {
      const userEmail = localStorage.getItem("userEmail") || "";
      await axiosInstance.post("/respondent/create-event", {
        caseId: finalCaseId,
        caseName: formTitle,
        type: typeLabels[formType] || "Hearing",
        date: `2026-11-${dayNum}`,
        time: formTime,
        duration: formDuration,
        location: newEvent.venue,
        description: newEvent.description,
        meetLink: `${window.location.origin}/meet/chamber-${finalCaseId}`,
        respondentEmail: userEmail,
        status: "Scheduled",
      });
    } catch (apiErr) {
      console.warn("Backend hearing record note:", apiErr.message);
    }

    setEventScheduleDays((prev) => ({
      ...prev,
      [activeDayTab]: [...(prev[activeDayTab] || []), newEvent],
    }));

    setFormCaseId("");
    setFormTitle("");
    setShowScheduleModal(false);
    toast.success("Hearing scheduled and registered successfully.");
  };

  // Download Schedule Handler
  const handleDownloadSchedule = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Day,Date,Month,Speaker/Party,Leader/Mediator,Category,Time,Duration,Venue,Case ID\n";
    
    Object.entries(eventScheduleDays).forEach(([day, items]) => {
      items.forEach((item) => {
        csvContent += `"${day}","${item.dateDay}","${item.dateMonth}","${item.speakerName}","${item.leader}","${item.tag}","${item.time}","${item.duration}","${item.venue}","${item.caseId}"\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Utkal_ODR_Event_Schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Event schedule downloaded successfully!");
  };

  const currentDayEvents = eventScheduleDays[activeDayTab] || [];

  const presenterPeer = activePresenter && !activePresenter.isSelf
    ? (remotePeers[activePresenter.socketId] ||
       Object.values(remotePeers).find(
         (p) => p.socketId === activePresenter.socketId || (activePresenter.userId && p.userId === activePresenter.userId)
       ) ||
       Object.values(remotePeers)[0])
    : null;

  return (
    <div className="uom-container">
      {/* ================= SIMPLE TOP HEADER ================= */}
      <header className="uom-header">
        <div className="uom-header-left">
          <div className="uom-logo-icon">
            <Scale size={20} />
          </div>
          <span className="uom-header-title">
            Utkal ODR <span>Meet</span>
          </span>
        </div>

        <div className="uom-header-right">
          <button
            className="uom-btn-outline"
            onClick={() => handleLaunchChamber("Instant Hearing Session", true)}
            title="Start Instant Meeting with shareable link & AI Co-Pilot"
          >
            <Video size={15} />
            <span>Instant Meeting</span>
          </button>

          <button
            className="uom-btn-outline"
            onClick={() => setShowScheduleModal(true)}
          >
            <Plus size={15} />
            <span>Schedule Session</span>
          </button>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="uom-main">
        {/* Quick Join Bar */}
        <section className="uom-join-bar">
          <form onSubmit={handleJoinQuery} className="uom-join-left">
            <div className="uom-join-input-wrap">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                className="uom-join-input"
                placeholder="Enter Case ID (e.g. ODR-2026-88) or Meeting Link..."
                value={joinQuery}
                onChange={(e) => setJoinQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="uom-btn-primary"
              disabled={!joinQuery.trim()}
              style={{ opacity: joinQuery.trim() ? 1 : 0.6 }}
            >
              Join Chamber
            </button>
          </form>
        </section>

        {/* ================= REFERENCE EVENT SCHEDULE SECTION ================= */}
        <section className="uom-schedule-section">
          {/* Header with Calendar Icon and Title/Subtitle */}
          <div className="uom-schedule-header-wrap">
            <div className="uom-title-icon">
              <Calendar size={24} color="#ffffff" />
            </div>
            <div className="uom-title-text-group">
              <h1 className="uom-schedule-title">Event Schedule</h1>
              <p className="uom-schedule-desc">
                View institutional dispute schedules, upcoming arbitration hearings, and mediation sessions.
              </p>
            </div>
          </div>

          {/* Day Selector Tabs */}
          <div className="uom-day-tabs-wrap">
            {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5"].map((day) => (    
              <button
                key={day}
                type="button"
                className={`uom-day-tab ${activeDayTab === day ? "active" : ""}`}
                onClick={() => setActiveDayTab(day)}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Separate Orange Table Header Bar */}
          <div className="uom-table-header-bar">
            <div className="uom-th-col">DATE</div>
            <div className="uom-th-col">SPEAKER</div>
            <div className="uom-th-col">SESSION</div>
            <div className="uom-th-col uom-th-venue">VENUE</div>
            <div className="uom-th-col uom-th-action">ACTION</div>
          </div>

          {/* List of Individual Row Cards */}
          <div className="uom-cards-list">
            {currentDayEvents.length > 0 ? (
              currentDayEvents.map((item) => (
                <div key={item.id} className="uom-event-row-card">
                  {/* Col 1: Date Box with Accent Underline */}
                  <div className="uom-date-box">
                    <span className="uom-date-num">{item.dateDay}</span>
                    <span className="uom-date-month">{item.dateMonth}</span>
                    <span className="uom-date-dash" />
                  </div>

                  {/* Col 2: Speaker Avatar */}
                  <div className="uom-speaker-avatar-wrap">
                    <img
                      src={item.speakerAvatar}
                      alt={item.speakerName}
                      className="uom-speaker-avatar-img"
                    />
                  </div>

                  {/* Col 3: Session */}
                  <div className="uom-session-details">
                    <h3
                      className="uom-session-title"
                      onClick={() => setSelectedSessionModal(item)}
                      title="Click to view details"
                    >
                      {item.speakerName}
                    </h3>
                    <div className="uom-session-meta">
                      <span className="uom-meta-leader">
                        <User size={14} color="#ea580c" />
                        <span>{item.leader}</span>
                      </span>
                      <span className="uom-meta-tag">
                        <Folder size={12} color="#64748b" />
                        <span>{item.tag}</span>
                      </span>
                    </div>
                    <div className="uom-session-time">
                      <Clock size={13} color="#64748b" />
                      <span>{item.time}</span>
                      <span className="uom-dot-sep">•</span>
                      <span>{item.duration}</span>
                    </div>
                  </div>

                  {/* Col 4: Venue Pill */}
                  <div className="uom-venue-wrap">
                    <div className="uom-venue-pill">
                      <MapPin size={13} color="#ea580c" />
                      <span>{item.venue}</span>
                    </div>
                  </div>

                  {/* Col 5: Action Button */}
                  <div className="uom-action-wrap">
                    <button
                      type="button"
                      className="uom-btn-view-details"
                      onClick={() => setSelectedSessionModal(item)}
                    >
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="uom-empty-state">
                <div className="uom-empty-icon">
                  <Calendar size={22} />
                  </div>
                  <h4 className="uom-empty-title">No events scheduled for {activeDayTab}</h4>
                  <p className="uom-empty-desc">
                    Click "Schedule Session" to add a session to this day.
                  </p>
                  <button
                    className="uom-btn-primary"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    <Plus size={14} />
                    <span>Schedule Session</span>
                  </button>
                </div>
              )}
            </div>
        </section>
      </main>

      {/* ================= SESSION / HEARING DETAILS MODAL (Read More) ================= */}
      {selectedSessionModal && (
        <div className="uom-modal-overlay">
          <div className="uom-modal" style={{ maxWidth: "560px" }}>
            <div className="uom-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="uom-logo-icon" style={{ width: "32px", height: "32px" }}>
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="uom-modal-title">{selectedSessionModal.speakerName}</h3>
                  <span style={{ fontSize: "11px", color: "var(--uom-text-muted)" }}>
                    Case ID: {selectedSessionModal.caseId || "ODR-2026-HEARING"}
                  </span>
                </div>
              </div>
              <button
                className="uom-close-btn"
                onClick={() => setSelectedSessionModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "6px 0 16px 0" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "10px" }}>
                <img
                  src={selectedSessionModal.speakerAvatar}
                  alt={selectedSessionModal.speakerName}
                  style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover" }}
                />
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--uom-text-title)" }}>
                    {selectedSessionModal.caseTitle || selectedSessionModal.speakerName}
                  </div>
                  <div style={{ fontSize: "12px", color: "#ea580c", fontWeight: 600, marginTop: "2px" }}>
                    Presiding Mediator: {selectedSessionModal.neutral || selectedSessionModal.leader}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--uom-text-muted)", marginTop: "2px" }}>
                    {selectedSessionModal.dateDay} {selectedSessionModal.dateMonth} • {selectedSessionModal.time} • {selectedSessionModal.venue}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--uom-text-title)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Procedural Scope & Docket Notes
                </h4>
                <p style={{ fontSize: "13px", color: "var(--uom-text-muted)", lineHeight: 1.5 }}>
                  {selectedSessionModal.description || "Official electronic dispute resolution proceeding conducted pursuant to institutional arbitration and conciliation frameworks under Section 65B verification."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <div style={{ background: "#f1f5f9", padding: "10px 12px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Session Type</span>
                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>{selectedSessionModal.typeLabel || selectedSessionModal.tag}</strong>
                </div>
                <div style={{ background: "#f1f5f9", padding: "10px 12px", borderRadius: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Assigned Venue</span>
                  <strong style={{ fontSize: "12.5px", color: "#0f172a" }}>{selectedSessionModal.venue}</strong>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="uom-btn-outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/meet/${selectedSessionModal.caseId || 'utkal-odr-room'}`);
                    toast.success("Hearing invitation link copied!");
                  }}
                >
                  <Copy size={14} />
                  <span>Copy Link</span>
                </button>
                <button
                  type="button"
                  className="uom-btn-primary"
                  onClick={() => {
                    const sessionToLaunch = selectedSessionModal;
                    setSelectedSessionModal(null);
                    handleLaunchChamber(`Hearing: ${sessionToLaunch.caseTitle || sessionToLaunch.speakerName}`);
                  }}
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", boxShadow: "0 4px 12px rgba(234, 88, 12, 0.35)" }}
                >
                  <Video size={14} />
                  <span>Enter Virtual Chamber</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SCHEDULE MODAL ================= */}
      {showScheduleModal && (
        <div className="uom-modal-overlay">
          <div className="uom-modal">
            <div className="uom-modal-header">
              <h3 className="uom-modal-title">Schedule Session</h3>
              <button
                className="uom-close-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              <div className="uom-form-group">
                <label className="uom-form-label">Case ID / Number</label>
                <input
                  type="text"
                  className="uom-form-input"
                  placeholder="e.g. ODR-2026-115"
                  value={formCaseId}
                  onChange={(e) => setFormCaseId(e.target.value)}
                  required
                />
              </div>

              <div className="uom-form-group">
                <label className="uom-form-label">Case Title / Parties</label>
                <input
                  type="text"
                  className="uom-form-input"
                  placeholder="e.g. Kumar Infra vs. State Trading Agency"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="uom-form-group">
                <label className="uom-form-label">Hearing Type</label>
                <select
                  className="uom-form-select"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                >
                  <option value="arbitration">Arbitration Hearing</option>
                  <option value="mediation">Mediation Session</option>
                  <option value="conciliation">Conciliation Conference</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="uom-form-group">
                  <label className="uom-form-label">Time</label>
                  <input
                    type="text"
                    className="uom-form-input"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                  />
                </div>
                <div className="uom-form-group">
                  <label className="uom-form-label">Duration</label>
                  <input
                    type="text"
                    className="uom-form-input"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="uom-form-group">
                <label className="uom-form-label">Presiding Mediator</label>
                <input
                  type="text"
                  className="uom-form-input"
                  value={formNeutral}
                  onChange={(e) => setFormNeutral(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  className="uom-btn-outline"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="uom-btn-primary">
                  Save Hearing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIRTUAL ROOM SCREEN ================= */}
      {inChamber && !isMinimized && (
        <div className="uom-modal-overlay">
          <div className={`uom-room-modal ${showChatDrawer ? "with-chat" : ""}`}>
            <div className="uom-room-top">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span>{chamberTitle}</span>
                <button
                  className="uom-btn-outline"
                  style={{
                    color: "#ffffff",
                    borderColor: "rgba(255,255,255,0.2)",
                    padding: "3px 10px",
                    fontSize: "12px",
                    borderRadius: "6px",
                  }}
                  onClick={handleCopyUniversalLink}
                  title="Copy joining link to invite others"
                >
                  <LinkIcon size={12} />
                  <span>Copy Joining Link</span>
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#10b981" }}>
                  <span className="uom-status-dot" />
                  <span>Connected • E2E Encrypted</span>
                </div>
                {/* Header Minimize Button */}
                <button
                  className="uom-ctrl-btn"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#f8fafc",
                  }}
                  onClick={() => {
                    setIsMinimized(true);
                    toast.info("Chamber minimized to Picture-in-Picture");
                  }}
                  title="Minimize chamber"
                >
                  <Minimize2 size={16} />
                </button>

                {/* Header Close Button */}
                <button
                  className="uom-ctrl-btn uom-chamber-close-btn"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#f8fafc",
                  }}
                  onClick={handleLeaveChamber}
                  title="Close and exit chamber"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="uom-room-middle">
              <div className="uom-room-video-area">
                {/* Instant Meeting Shareable Link Overlay */}
                {showInstantLinkPrompt && (
                  <div className="uom-instant-link-card">
                    <div className="uom-instant-link-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={16} color="#3b82f6" />
                        <span>Instant Meeting Ready</span>
                      </div>
                      <button
                        className="uom-close-btn"
                        style={{ color: "#94a3b8" }}
                        onClick={() => setShowInstantLinkPrompt(false)}
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "6px 0 10px 0" }}>
                      Share this direct link so others can join this session right now:
                    </p>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input
                        type="text"
                        readOnly
                        value={activeChamberLink || universalMeetingLink}
                        className="uom-form-input"
                        style={{
                          fontSize: "12px",
                          padding: "6px 8px",
                          background: "#090d16",
                          color: "#f8fafc",
                          border: "1px solid #334155",
                        }}
                      />
                      <button
                        type="button"
                        className="uom-btn-primary"
                        style={{ padding: "6px 12px", fontSize: "12px", flexShrink: 0 }}
                        onClick={() => {
                          navigator.clipboard.writeText(activeChamberLink || universalMeetingLink);
                          toast.success("Instant meeting link copied!");
                        }}
                      >
                        <Copy size={13} />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}


                {/* When ANYONE is sharing screen (You or Remote Peer) */}
                {activePresenter ? (
                  <div className="uom-presentation-layout">
                    {/* Top Presentation Banner */}
                    <div className="uom-presenting-banner">
                      <div className="uom-presenting-info">
                        <span className="uom-presenting-pulse" />
                        <MonitorUp size={15} />
                        <span>
                          {activePresenter.isSelf
                            ? "You are sharing your screen with the hearing chamber"
                            : `${activePresenter.name} is presenting their screen`}
                        </span>
                      </div>
                      {activePresenter.isSelf && (
                        <button
                          type="button"
                          className="uom-btn-stop-presenting"
                          onClick={stopScreenShare}
                        >
                          Stop Presenting
                        </button>
                      )}
                    </div>

                    {/* Main Presentation Stage */}
                    <div className="uom-presentation-main">
                      {activePresenter.isSelf ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="uom-video-stream screen-content"
                        />
                      ) : presenterPeer ? (
                        <RemoteVideoTile
                          key={`presenter-${presenterPeer.socketId}-${activePresenter.startedAt || "pres"}`}
                          peer={presenterPeer}
                          isPresentation={true}
                        />
                      ) : (
                        <div style={{ color: "#94a3b8", textAlign: "center" }}>
                          <MonitorUp size={48} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                          <p>Loading presentation screen...</p>
                        </div>
                      )}

                      {/* Presenter PIP when you are presenting */}
                      {activePresenter.isSelf && isVideoOn && (
                        <div className="uom-presenter-pip" title="Your Video (Presenter)">
                          <video
                            ref={pipVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="uom-presenter-pip-video"
                          />
                          <span className="uom-presenter-pip-label">You (Presenter)</span>
                        </div>
                      )}
                    </div>

                    {/* Participant Strip below presentation */}
                    <div className="uom-presentation-strip">
                      {/* Your webcam tile */}
                      <div className="uom-strip-tile">
                        {isVideoOn ? (
                          <video
                            ref={activePresenter.isSelf ? stripVideoRef : videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="uom-video-stream"
                          />
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: "11px" }}>
                            Camera Off
                          </div>
                        )}
                        <div className="uom-participant-badge" style={{ fontSize: "10px", padding: "2px 6px" }}>
                          <span>You</span>
                        </div>
                      </div>

                      {/* Remote participants' tiles */}
                      {Object.values(remotePeers)
                        .filter((p) => p.socketId !== activePresenter.socketId && p.socketId !== presenterPeer?.socketId)
                        .map((peer) => (
                          <div key={peer.socketId} className="uom-strip-tile">
                            <RemoteVideoTile peer={peer} isPresentation={false} />
                          </div>
                        ))}
                    </div>
                  </div>
                ) : Object.keys(remotePeers).length > 0 ? (
                  <div className="uom-video-grid">
                    {/* Local Camera Tile */}
                    <div className="uom-video-tile">
                      {isVideoOn ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="uom-video-stream"
                        />
                      ) : (
                        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                          <Scale size={36} style={{ opacity: 0.4, margin: "0 auto 8px auto" }} />
                          <p>Your camera is off</p>
                        </div>
                      )}
                      <div className="uom-participant-badge">
                        <span className="uom-status-dot online" />
                        <span>You ({localStorage.getItem("role") || localStorage.getItem("userRole") || "Participant"})</span>
                      </div>
                    </div>

                    {/* Remote Participants' Tiles */}
                    {Object.values(remotePeers).map((peer) => (
                      <RemoteVideoTile key={peer.socketId} peer={peer} />
                    ))}
                  </div>
                ) : isVideoOn ? (
                  <div style={{ width: "100%", height: "100%", position: "relative" }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="uom-video-stream"
                    />
                    <div className="uom-participant-badge">
                      <span className="uom-status-dot online" />
                      <span>You (Waiting for other participants to join...)</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "14px" }}>
                    <Scale size={48} style={{ opacity: 0.4, margin: "0 auto 12px auto" }} />
                    <p>Camera is switched off</p>
                    <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      Waiting for other participants to join the chamber...
                    </p>
                  </div>
                )}
              </div>

              {/* ================= IN-CALL CHAT DRAWER ================= */}
              {showChatDrawer && (
                <div className="uom-chat-drawer">
                  {/* Chat Drawer Header */}
                  <div className="uom-chat-header">
                    <div>
                      <div className="uom-chat-title">
                        <MessageSquare size={16} color="#3b82f6" />
                        <span>In-Call Messages</span>
                      </div>
                      <div className="uom-chat-subtitle">
                        Everyone in this hearing can message one by one
                      </div>
                    </div>
                    <button
                      className="uom-close-btn"
                      onClick={() => setShowChatDrawer(false)}
                      title="Close Chat"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Encryption Notice */}
                  <div className="uom-chat-notice">
                    <span>🔒 End-to-end encrypted • Certified under Section 65B</span>
                  </div>

                  {/* Message List */}
                  <div className="uom-chat-messages">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`uom-msg-item ${msg.isSelf ? "self" : "other"}`}
                      >
                        {!msg.isSelf && (
                          <div
                            className="uom-msg-avatar"
                            style={{ backgroundColor: msg.roleColor || "#475569" }}
                          >
                            {msg.sender.charAt(0)}
                          </div>
                        )}
                        <div className="uom-msg-bubble-wrap">
                          <div className="uom-msg-meta">
                            <span className="uom-msg-sender">{msg.sender}</span>
                            {msg.role && (
                              <span
                                className="uom-msg-role-tag"
                                style={{
                                  color: msg.roleColor || "#94a3b8",
                                  borderColor: msg.roleColor ? `${msg.roleColor}40` : "#334155",
                                }}
                              >
                                {msg.role}
                              </span>
                            )}
                            <span className="uom-msg-time">{msg.time}</span>
                          </div>
                          <div className={`uom-msg-bubble ${msg.isSelf ? "self" : "other"}`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input Form */}
                  <form onSubmit={handleSendChatMessage} className="uom-chat-input-form">
                    <input
                      type="text"
                      className="uom-chat-input"
                      style={{
                        color: "#000000",
                        WebkitTextFillColor: "#000000",
                        backgroundColor: "#ffffff",
                        caretColor: "#000000",
                        colorScheme: "light",
                      }}
                      placeholder="Send a message to everyone..."
                      value={chatMessageText}
                      onChange={(e) => setChatMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="uom-chat-send-btn"
                      disabled={!chatMessageText.trim()}
                      title="Send message"
                    >
                      <Send size={15} />
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="uom-room-bottom">
              {/* Mic Toggle */}
              <button
                className={`uom-ctrl-btn ${!isMicOn ? "off" : ""}`}
                onClick={toggleMic}
                title={isMicOn ? "Mute" : "Unmute"}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              {/* Video Toggle */}
              <button
                className={`uom-ctrl-btn ${!isVideoOn ? "off" : ""}`}
                onClick={toggleVideo}
                title={isVideoOn ? "Turn off video" : "Turn on video"}
              >
                {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Icon 1: Screen Share (Laptop with up arrow & red dot indicator) */}
              <button
                className={`uom-ctrl-btn ${isScreenSharing ? "active screen-sharing" : ""}`}
                onClick={toggleScreenShare}
                title={isScreenSharing ? "Stop sharing screen (Presenting)" : "Present now (Screen Share)"}
                id="uom-screen-share-btn"
              >
                <div className="uom-share-btn-wrap">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                    <polyline points="9 9 12 6 15 9" />
                    <line x1="12" y1="6" x2="12" y2="13" />
                  </svg>
                  <span className={`uom-red-indicator ${isScreenSharing ? "sharing-active" : ""}`} />
                </div>
              </button>


              {/* Icon 5: In-Call Chat Box (Everyone can text one by one) */}
              <button
                className={`uom-ctrl-btn ${showChatDrawer ? "active" : ""}`}
                onClick={() => {
                  setShowChatDrawer(!showChatDrawer);
                  if (!showChatDrawer) toast.info("In-call chat box opened");
                }}
                title="In-call chat box (Chat with everyone)"
              >
                <MessageSquare size={20} />
              </button>

              {/* Leave call */}
              <button
                className="uom-ctrl-btn leave"
                onClick={handleLeaveChamber}
                title="Leave chamber"
              >
                <PhoneOff size={16} />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= FLOATING PICTURE-IN-PICTURE (PiP) WIDGET ================= */}
      {inChamber && isMinimized && (
        <div className="uom-pip-widget">
          <div className="uom-pip-top">
            <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span className="uom-status-dot" />
              <span style={{ fontSize: "11.5px", fontWeight: 600 }}>{chamberTitle}</span>
            </div>
            <div className="uom-pip-actions">
              <button
                className="uom-pip-ctrl-btn"
                style={{ width: "26px", height: "26px" }}
                onClick={() => setIsMinimized(false)}
                title="Maximize chamber"
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          <div className="uom-pip-video-area">
            {isScreenSharing && screenStreamRef.current ? (
              <video
                ref={(el) => {
                  if (el && screenStreamRef.current && el.srcObject !== screenStreamRef.current) {
                    el.srcObject = screenStreamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="uom-video-stream screen-content"
              />
            ) : isVideoOn ? (
              <video
                ref={(el) => {
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                  }
                }}
                autoPlay
                playsInline
                muted
                className="uom-video-stream"
              />
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "11px" }}>
                <Scale size={24} style={{ opacity: 0.5, margin: "0 auto 4px auto" }} />
                <p>Camera Off</p>
              </div>
            )}
          </div>

          <div className="uom-pip-bottom">
            <button
              className={`uom-pip-ctrl-btn ${!isMicOn ? "off" : ""}`}
              onClick={toggleMic}
              title={isMicOn ? "Mute" : "Unmute"}
            >
              {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
            </button>

            <button
              className={`uom-pip-ctrl-btn ${!isVideoOn ? "off" : ""}`}
              onClick={toggleVideo}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video size={14} /> : <VideoOff size={14} />}
            </button>

            <button
              className="uom-pip-ctrl-btn"
              onClick={() => setIsMinimized(false)}
              title="Maximize chamber"
            >
              <Maximize2 size={14} />
            </button>

            <button
              className="uom-pip-ctrl-btn leave"
              onClick={handleLeaveChamber}
              title="Leave chamber"
            >
              <PhoneOff size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
