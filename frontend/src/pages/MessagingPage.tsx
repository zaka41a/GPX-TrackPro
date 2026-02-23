import { useEffect, useState, useRef, useCallback } from "react";
import { PageTransition } from "@/components/PageTransition";
import { AppShell } from "@/layouts/AppShell";
import { messagingService } from "@/services/messagingService";
import { useAuth } from "@/hooks/useAuth";
import { DMConversation, DMMessage, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, ArrowLeft, Plus, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function MessagingPage() {
  const { user } = useAuth();
  const currentUserId = user?.id ? Number(user.id) : 0;

  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<DMConversation | null>(null);
  const [messages, setMessages] = useState<DMMessage[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);

  // New conversation
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const convos = await messagingService.listConversations();
      setConversations(convos);
    } catch {
      // silently fail
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  const fetchMessages = useCallback(async (convoId: number) => {
    try {
      const result = await messagingService.listMessages(convoId);
      // Messages come newest-first from API; reverse for display
      setMessages(result.messages.slice().reverse());
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Poll for new messages when a conversation is selected
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!selectedConvo) return;

    pollRef.current = setInterval(() => {
      fetchMessages(selectedConvo.id);
      fetchConversations();
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConvo, fetchMessages, fetchConversations]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectConvo = async (convo: DMConversation) => {
    setSelectedConvo(convo);
    setLoadingMessages(true);
    setShowNewConvo(false);
    await fetchMessages(convo.id);
    if (convo.unreadCount > 0) {
      await messagingService.markRead(convo.id);
      fetchConversations();
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConvo || !messageText.trim()) return;
    setSending(true);
    try {
      const msg = await messagingService.sendMessage(selectedConvo.id, messageText.trim());
      setMessages((prev) => [...prev, msg]);
      setMessageText("");
      fetchConversations();
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = async () => {
    setShowNewConvo(true);
    setSelectedConvo(null);
    setMessages([]);
    if (allUsers.length === 0) {
      setLoadingUsers(true);
      try {
        const users = await messagingService.listApprovedUsers();
        setAllUsers(users.filter((u) => Number(u.id) !== currentUserId));
      } catch {
        // silently fail
      } finally {
        setLoadingUsers(false);
      }
    }
  };

  const handleStartConvoWithUser = async (targetUserId: number) => {
    try {
      const convo = await messagingService.getOrCreateConversation(targetUserId);
      setShowNewConvo(false);
      await fetchConversations();
      // Find the full conversation with user name
      const convos = await messagingService.listConversations();
      setConversations(convos);
      const found = convos.find((c) => c.id === convo.id);
      if (found) handleSelectConvo(found);
    } catch {
      // silently fail
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const filteredUsers = allUsers.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <AppShell>
      <PageTransition>
        <div className="glass-surface rounded-xl overflow-hidden accent-line-top" style={{ height: "calc(100vh - 120px)" }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={cn(
              "w-full md:w-80 border-r border-border flex flex-col shrink-0",
              selectedConvo ? "hidden md:flex" : "flex"
            )}>
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-accent" />
                  <h2 className="font-semibold text-foreground text-sm">Messages</h2>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleNewConversation} title="New message">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingConvos ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-muted rounded" />
                          <div className="h-3 w-full bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConvo(convo)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/50",
                        selectedConvo?.id === convo.id && "bg-muted"
                      )}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">{getInitials(convo.otherUserName)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate">{convo.otherUserName}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{timeAgo(convo.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground truncate">{convo.lastMessage || "No messages yet"}</p>
                          {convo.unreadCount > 0 && (
                            <Badge className="ml-2 h-5 min-w-[20px] px-1.5 text-[10px] bg-accent text-white shrink-0">
                              {convo.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message thread / New conversation */}
            <div className={cn(
              "flex-1 flex flex-col",
              !selectedConvo && !showNewConvo ? "hidden md:flex" : "flex"
            )}>
              {showNewConvo ? (
                /* New conversation user picker */
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden" onClick={() => setShowNewConvo(false)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-semibold text-foreground text-sm">New Message</h3>
                  </div>
                  <div className="p-3 border-b border-border shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full bg-muted/50 rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleStartConvoWithUser(Number(u.id))}
                          className="w-full flex items-center gap-3 p-3.5 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-white">{getInitials(u.name)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : selectedConvo ? (
                /* Chat thread */
                <>
                  <div className="p-4 border-b border-border flex items-center gap-3 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 md:hidden" onClick={() => setSelectedConvo(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-white">{getInitials(selectedConvo.otherUserName)}</span>
                    </div>
                    <p className="font-semibold text-foreground text-sm">{selectedConvo.otherUserName}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMine = msg.senderId === currentUserId;
                        return (
                          <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5",
                              isMine
                                ? "bg-accent text-white rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            )}>
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              <p className={cn(
                                "text-[10px] mt-1",
                                isMine ? "text-white/70" : "text-muted-foreground"
                              )}>
                                {timeAgo(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input bar */}
                  <div className="p-3 border-t border-border shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        placeholder="Type a message..."
                        className="flex-1 bg-muted/50 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <Button size="sm" onClick={handleSendMessage} disabled={sending || !messageText.trim()}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty state */
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-foreground font-medium">Select a conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">Or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
