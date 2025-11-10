import React from "react";
import { useNavigate, type LoaderFunction } from "react-router";
import { CheckCheck, ChevronDown, ChevronLeft, Lock, Mic, MoreVertical, Paperclip, Phone, Send, Video } from "lucide-react";

// interface and service
import { requireUserSession } from "~/services";
import { getMessages, getModelByConversation } from "~/services/chat.server";
import type { IMessageModelResponse, IMessagesResponse } from "~/interfaces";

interface LoaderReturn {
    messages: IMessagesResponse[]
    model: IMessageModelResponse
}

interface MessageDetailPageProps {
    loaderData: LoaderReturn
}

export const loader: LoaderFunction = async ({ request, params }) => {
    await requireUserSession(request);
    const conversationId = await params.chatId
    const model = await getModelByConversation(conversationId as string)

    if (!conversationId) {
        return { model, messages: [] };
    }
    const messages = await getMessages(conversationId as string);

    return {
        model,
        messages,
    };
};

export default function MessageDetailPage({ loaderData }: MessageDetailPageProps) {
    const navigate = useNavigate()
    const { model, messages } = loaderData;

    const chunksRef = React.useRef<Blob[]>([]);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [newMessage, setNewMessage] = React.useState('');
    const [recording, setRecording] = React.useState(false);
    const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);

    const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [showScrollButton, setShowScrollButton] = React.useState(false);

    // Auto scroll to bottom when messages change
    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (!containerRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50; // allow tolerance

        setShowScrollButton(!isAtBottom);
    };

    // Send text message
    const handleSend = () => {
        if (newMessage.trim()) {
            setNewMessage("");
        }
    };

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // onSend({ type: "image", file });
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            chunksRef.current = [];
            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                // onSend({ type: "audio", file: audioBlob });
            };
            recorder.start();

            setMediaRecorder(recorder);
            setRecording(true);

            // Auto stop at 1 minute
            timerRef.current = setTimeout(() => stopRecording(), 60000);
        } catch (err) {
            console.error("Mic permission denied:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            setRecording(false);
            if (timerRef.current) clearTimeout(timerRef.current);
        }
    };

    return (
        <>
            <div className="flex flex-col h-screen">
                <div className="p-2 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center space-x-2">
                        <ChevronLeft
                            className="w-5 h-5 cursor-pointer"
                            onClick={() => navigate("/dashboard/messages")}
                        />
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
                                {model.model.profile ? (
                                    <img
                                        src={model.model.profile}
                                        alt={model.model.firstName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-semibold">
                                        {model.model.firstName.charAt(0)}
                                    </span>
                                )}
                            </div>
                            {model.model.status && (
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full" />
                            )}
                        </div>
                        <div>
                            <h2 className="font-medium">{model.model.firstName}&nbsp;{model.model.lastName}</h2>
                            <p className="text-sm text-gray-400">
                                {model.model.status === "active" ? "online" : "last seen recently"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-rose-100 hover:text-rose-500 rounded-full cursor-pointer">
                            <Video className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-rose-100 hover:text-rose-500 rounded-full cursor-pointer">
                            <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-rose-100 hover:text-rose-500 rounded-full cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    className="flex-1 overflow-y-auto p-4 relative"
                    style={{
                        backgroundImage: `url("/images/light-chat-background.png")`,
                        backgroundSize: "cover",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "center",
                    }}
                    onScroll={handleScroll}
                >
                    <div className="space-y-2">
                        <div className="mb-4 w-auto flex items-start justify-center gap-2 bg-gray-200 border border-gray-300 p-2 rounded-md">
                            <Lock size={18} />
                            <p className="text-sm">
                                Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to them.
                            </p>
                        </div>

                        {messages.map((message, index) => {
                            const isMe = message.senderType === "customer";
                            const prevMessage = messages[index - 1];
                            const isSameSender = prevMessage && prevMessage.senderType === "customer" ? false : true === isMe;

                            return (
                                <div
                                    key={message.id}
                                    className={`flex items-center gap-2 ${isMe ? "justify-end" : "justify-start"} ${isSameSender ? "mt-0" : "mt-4"}`}
                                >
                                    <p
                                        className={`text-[14px] mt-2 ${isMe ? "text-gray-500" : "text-gray-500 hidden"}`}
                                    >
                                        {new Date(message.sendAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>

                                    <div
                                        className={`relative max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${isMe ? "bg-rose-200 text-gray-700 border border-rose-500" : "bg-gray-600 text-white border border-gray-800"}`}
                                        style={{
                                            borderTopRightRadius: isMe ? "0rem" : "1rem",
                                            borderTopLeftRadius: !isMe ? "0rem" : "1rem",
                                        }}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">
                                            {message.messageType === "text" ? message.messageText : "files"}
                                        </p>
                                        <CheckCheck size={12} className="text-blue-500" />
                                    </div>

                                    <p
                                        className={`text-[14px] mt-2 ${isMe ? "text-gray-500 hidden" : "text-gray-500"}`}
                                    >
                                        {new Date(message.sendAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {showScrollButton && (
                        <button
                            onClick={scrollToBottom}
                            className="fixed bottom-20 right-6 p-3 bg-white text-rose-500 rounded-full shadow-lg hover:bg-rose-600 hover:text-white transition"
                        >
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    )}
                </div>


                <div className="p-2 border-t bg-white sticky bottom-0 z-10">
                    <div className="flex items-center space-x-2">
                        <label className="p-2 hover:bg-rose-100 rounded-full cursor-pointer hover:text-rose-500">
                            <Paperclip className="w-5 h-5" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                        </label>

                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Type a message"
                                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                        </div>

                        {newMessage.trim() ? (
                            <button
                                onClick={handleSend}
                                className="p-2 hover:bg-rose-600 bg-rose-500 rounded-full cursor-pointer"
                            >
                                <Send className="w-5 h-5 text-white" />
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (!recording) startRecording();
                                    else stopRecording();
                                }}
                                onTouchStart={(e) => {
                                    e.preventDefault();
                                    startRecording();
                                }}
                                onTouchEnd={(e) => {
                                    e.preventDefault();
                                    stopRecording();
                                }}
                                className={`p-2 rounded-full cursor-pointer ${recording
                                    ? "bg-rose-500 text-white animate-pulse"
                                    : "hover:bg-rose-100 hover:text-rose-500"
                                    }`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}