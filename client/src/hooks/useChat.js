import { useCallback, useState, useEffect, useRef } from "react";
import { getSocket } from "../services/socket";

export const useChat = (roomId, user) => {
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => {
        // Prevent duplicate messages if already present
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      setIsChatOpen((open) => {
        if (!open) {
          setUnreadCount((count) => count + 1);
        }
        return open;
      });
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, []);

  const sendMessage = useCallback(
    (text) => {
      if (!text || !text.trim() || !roomId) return;

      const trimmedText = text.trim();
      const socket = socketRef.current || getSocket();

      const senderData = {
        id: user?.id,
        name: user?.fullName || user?.name || "Anonymous",
      };

      if (socket && socket.connected) {
        socket.emit("send-message", {
          roomId,
          message: trimmedText,
          user: senderData,
        });
      } else {
        // Optimistic local fallback if socket connection is temporarily reconnecting
        const localMsg = {
          id: `local_${Date.now()}`,
          senderId: user?.id,
          senderName: senderData.name,
          text: trimmedText,
          timestamp: new Date().toISOString(),
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, localMsg]);
      }
    },
    [roomId, user]
  );

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev;
      if (next) {
        setUnreadCount(0);
      }
      return next;
    });
  }, []);

  return {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toggleChat,
  };
};

export default useChat;