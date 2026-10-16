import { sql } from "./config/db.js";
import { clerkClient } from "@clerk/express";

// Socket.IO Room State: roomId -> Map<socketId, participantObject>
const rooms = new Map();

// Helper to ensure user exists in Neon DB
const ensureDbUser = async (userId, userObj = {}) => {
    if (!userId) return null;
    try {
        const existing = await sql`SELECT id FROM users WHERE id = ${userId}`;
        if (existing.length > 0) return userId;

        let name = userObj.name || userObj.fullName || "User";
        let email = userId + "@confera.user";
        let image = userObj.imageUrl || "";

        try {
            const clerkUser = await clerkClient.users.getUser(userId);
            email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
            name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || name;
            image = clerkUser.imageUrl || image;
        } catch (e) {}

        await sql`
            INSERT INTO users (id, name, email, image, plan)
            VALUES (${userId}, ${name}, ${email}, ${image}, 'free')
            ON CONFLICT (id) DO NOTHING
        `;
        return userId;
    } catch (err) {
        console.warn("Could not ensure DB user:", err.message);
        return null;
    }
};

export function setupSocketIO(io) {
    io.on("connection", (socket) => {
        let currentRoomId = null;
        let currentUser = null;

        // Helper to cleanly handle user leaving a room
        const handleUserLeave = async (roomId, socketId) => {
            if (!roomId || !rooms.has(roomId)) return;

            const roomParticipants = rooms.get(roomId);
            const departingUser = roomParticipants.get(socketId);
            if (!departingUser) return;

            roomParticipants.delete(socketId);

            // Notify remaining participants
            socket.to(roomId).emit("user-left", {
                socketId: socketId,
                userId: departingUser.userId,
                username: departingUser.username,
            });

            // Update participant left_at timestamp in Database
            try {
                const meetings = await sql`SELECT id FROM meetings WHERE meeting_id = ${roomId}`;
                if (meetings.length > 0) {
                    const meetingDbId = meetings[0].id;
                    if (departingUser.userId) {
                        await sql`
                            UPDATE meeting_participants
                            SET left_at = NOW()
                            WHERE meeting_id = ${meetingDbId} 
                            AND user_id = ${departingUser.userId} 
                            AND left_at IS NULL
                        `;
                    } else {
                        await sql`
                            UPDATE meeting_participants
                            SET left_at = NOW()
                            WHERE meeting_id = ${meetingDbId} 
                            AND name = ${departingUser.username} 
                            AND left_at IS NULL
                        `;
                    }
                }
            } catch (err) {
                console.error("Error updating participant left_at:", err);
            }

            if (roomParticipants.size === 0) {
                rooms.delete(roomId);
            }
        };

        // User joins a meeting room
        socket.on("join-room", async ({ roomId, user, audioEnabled = true, videoEnabled = true }) => {
            try {
                const cleanRoomId = (roomId || "").trim().toLowerCase();
                if (!cleanRoomId) return;

                // Verify meeting status from DB
                let meetings = await sql`SELECT * FROM meetings WHERE LOWER(meeting_id) = ${cleanRoomId}`;
                let meeting = meetings[0];

                if (!meeting) {
                    const hostId = await ensureDbUser(user?.id, user);
                    try {
                        const [created] = await sql`
                            INSERT INTO meetings (meeting_id, title, host_id, status)
                            VALUES (${cleanRoomId}, ${cleanRoomId.startsWith('pmi') ? 'Personal Meeting Room' : 'Live Conference'}, ${hostId}, 'active')
                            RETURNING *
                        `;
                        meeting = created;
                    } catch (dbErr) {
                        try {
                            const [created] = await sql`
                                INSERT INTO meetings (meeting_id, title, status)
                                VALUES (${cleanRoomId}, 'Live Conference', 'active')
                                RETURNING *
                            `;
                            meeting = created;
                        } catch (e2) {
                            meeting = { id: 0, meeting_id: cleanRoomId, title: 'Live Conference', status: 'active', host_id: null };
                        }
                    }
                }

                // If meeting was marked ended but users are still in room or it's a PMI room, reactivate
                if (meeting && meeting.status === "ended") {
                    const roomIsActive = rooms.has(cleanRoomId) && rooms.get(cleanRoomId).size > 0;
                    if (cleanRoomId.startsWith('pmi') || roomIsActive) {
                        try {
                            await sql`UPDATE meetings SET status = 'active', updated_at = NOW() WHERE id = ${meeting.id}`;
                            meeting.status = "active";
                        } catch (e) {
                            meeting.status = "active";
                        }
                    } else {
                        socket.emit("meeting-ended", { message: "This meeting has already ended" });
                        return;
                    }
                }

                currentRoomId = cleanRoomId;
                const isHost = Boolean(meeting.host_id && user?.id && meeting.host_id.toString() === user.id.toString());

                currentUser = {
                    socketId: socket.id,
                    userId: user?.id || null,
                    username: user?.name || user?.fullName || "Guest",
                    avatar: user?.imageUrl || "",
                    isHost,
                    audioEnabled,
                    videoEnabled
                };

                if (!rooms.has(cleanRoomId)) {
                    rooms.set(cleanRoomId, new Map());
                }

                const roomParticipants = rooms.get(cleanRoomId);

                // Fetch host plan to enforce participant limits (10 for free, 100 for premium)
                let hostPlan = "free";
                if (meeting?.host_id) {
                    const hosts = await sql`SELECT plan FROM users WHERE id = ${meeting.host_id}`;
                    hostPlan = hosts[0]?.plan || "free";
                }
                const maxParticipants = hostPlan === "premium" ? 100 : 10;

                if (roomParticipants.size >= maxParticipants) {
                    socket.emit("meeting-ended", {
                        message: `Meeting capacity limit reached (max ${maxParticipants} participants for ${hostPlan.toUpperCase()} plan). Host must upgrade to premium!`,
                    });
                    return;
                }

                socket.join(cleanRoomId);

                // Get existing participants in the room
                const existingUsers = Array.from(roomParticipants.values());

                // Add new participant to room state
                roomParticipants.set(socket.id, currentUser);

                // Save or refresh participant into DB
                const userId = await ensureDbUser(user?.id, user);
                if (meeting?.id) {
                    const existingParticipants = await sql`
                        SELECT id FROM meeting_participants
                        WHERE meeting_id = ${meeting.id}
                        AND ((${userId}::text IS NOT NULL AND user_id = ${userId}) OR name = ${currentUser.username})
                        AND left_at IS NULL
                    `;

                    if (existingParticipants.length === 0) {
                        await sql`
                            INSERT INTO meeting_participants (meeting_id, user_id, name, joined_at)
                            VALUES (${meeting.id}, ${userId}, ${currentUser.username}, NOW())
                        `;
                    }
                }

                // Send list of existing users to the newcomer
                socket.emit("all-users", existingUsers);

                // Notify everyone else in the room
                socket.to(cleanRoomId).emit("user-joined", currentUser);

            } catch (error) {
                console.error("Error joining room in socket:", error);
                socket.emit("meeting-ended", { message: "Failed to join room" });
            }
        });

        // WebRTC Signaling: Offer
        socket.on("offer", ({ targetSocketId, callerSocketId, sdp }) => {
            io.to(targetSocketId).emit("offer", {
                callerSocketId: callerSocketId || socket.id,
                sdp,
                callerUser: currentUser,
            });
        });

        // WebRTC Signaling: Answer
        socket.on("answer", ({ targetSocketId, responderSocketId, sdp }) => {
            io.to(targetSocketId).emit("answer", {
                responderSocketId: responderSocketId || socket.id,
                sdp,
            });
        });

        // WebRTC Signaling: ICE Candidate
        socket.on("ice-candidate", ({ targetSocketId, senderSocketId, candidate }) => {
            io.to(targetSocketId).emit("ice-candidate", {
                senderSocketId: senderSocketId || socket.id,
                candidate,
            });
        });

        // Audio toggle event
        socket.on("toggle-audio", ({ roomId, audioEnabled }) => {
            const targetRoom = roomId || currentRoomId;
            if (rooms.has(targetRoom) && rooms.get(targetRoom).has(socket.id)) {
                rooms.get(targetRoom).get(socket.id).audioEnabled = audioEnabled;
            }
            socket.to(targetRoom).emit("user-toggle-audio", {
                socketId: socket.id,
                audioEnabled,
            });
        });

        // Video toggle event
        socket.on("toggle-video", ({ roomId, videoEnabled }) => {
            const targetRoom = roomId || currentRoomId;
            if (rooms.has(targetRoom) && rooms.get(targetRoom).has(socket.id)) {
                rooms.get(targetRoom).get(socket.id).videoEnabled = videoEnabled;
            }
            socket.to(targetRoom).emit("user-toggle-video", {
                socketId: socket.id,
                videoEnabled,
            });
        });

        // Screen share toggle event
        socket.on("toggle-screen-share", ({ roomId, isScreenSharing }) => {
            const targetRoom = roomId || currentRoomId;
            socket.to(targetRoom).emit("user-toggle-screen-share", {
                socketId: socket.id,
                isScreenSharing,
            });
        });

        // Chat message event -> persist to DB & broadcast
        socket.on("send-message", async ({ roomId, message, user }) => {
            try {
                const targetRoom = roomId || currentRoomId;
                if (!targetRoom) return;

                const meetings = await sql`SELECT id FROM meetings WHERE meeting_id = ${targetRoom}`;
                if (meetings.length === 0) return;

                const meetingDbId = meetings[0].id;
                const rawSenderId = user?.id || currentUser?.userId || null;
                const senderId = await ensureDbUser(rawSenderId, user || currentUser);
                const senderName = user?.name || user?.fullName || currentUser?.username || "Anonymous";
                const text = typeof message === "string" ? message : (message?.text || "");

                if (!text || !text.trim()) return;

                const [savedMsg] = await sql`
                    INSERT INTO meeting_messages (meeting_id, sender_id, sender_name, text, timestamp)
                    VALUES (${meetingDbId}, ${senderId}, ${senderName}, ${text.trim()}, NOW())
                    RETURNING id, sender_id, sender_name, text, timestamp
                `;

                const formattedMsg = {
                    id: savedMsg.id.toString(),
                    senderId: savedMsg.sender_id,
                    senderName: savedMsg.sender_name,
                    text: savedMsg.text,
                    timestamp: savedMsg.timestamp,
                    time: new Date(savedMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                };

                // Broadcast to all participants in the room
                io.to(targetRoom).emit("receive-message", formattedMsg);
            } catch (error) {
                console.error("Error saving/sending chat message:", error);
                socket.emit("chat-error", { error: "Failed to send message" });
            }
        });

        // Host ends meeting for everyone
        socket.on("end-meeting", async ({ roomId }) => {
            try {
                const targetRoom = roomId || currentRoomId;
                if (!targetRoom) return;

                const meetings = await sql`SELECT * FROM meetings WHERE meeting_id = ${targetRoom}`;
                if (meetings.length === 0) return;
                const meeting = meetings[0];

                const userId = currentUser?.userId;
                if (meeting.host_id !== userId && !currentUser?.isHost) {
                    socket.emit("error-message", { message: "Only the host can end the meeting" });
                    return;
                }

                await sql`
                    UPDATE meetings 
                    SET status = 'ended', ended_at = NOW(), updated_at = NOW()
                    WHERE id = ${meeting.id}
                `;

                await sql`
                    UPDATE meeting_participants
                    SET left_at = NOW()
                    WHERE meeting_id = ${meeting.id} AND left_at IS NULL
                `;

                // Notify all participants in the room that meeting ended
                io.to(targetRoom).emit("meeting-ended", { message: "Meeting has been ended by the host" });

                rooms.delete(targetRoom);
            } catch (error) {
                console.error("Error ending meeting via socket:", error);
            }
        });

        // User leaves room explicitly
        socket.on("leave-room", async ({ roomId }) => {
            const targetRoom = roomId || currentRoomId;
            await handleUserLeave(targetRoom, socket.id);
            socket.leave(targetRoom);
            if (currentRoomId === targetRoom) {
                currentRoomId = null;
            }
        });

        // User disconnects (closing browser, connection drop, etc.)
        socket.on("disconnect", async () => {
            if (currentRoomId) {
                await handleUserLeave(currentRoomId, socket.id);
                currentRoomId = null;
            }
        });
    });
}