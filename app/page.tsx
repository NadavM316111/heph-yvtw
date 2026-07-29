"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  email: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  confidential: boolean;
}

interface Conversation {
  id: string;
  participantEmail: string;
  messages: Message[];
  confidentialMode: boolean;
  ndaAcceptedAt?: number;
  ndaAcceptedBy?: string[];
}

interface AppState {
  user: User | null;
  conversations: Conversation[];
  activeConversationId: string | null;
}

// ─── NDA Text ─────────────────────────────────────────────────────────────────

const NDA_TEXT = `INTERNATIONAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT

This Confidentiality Agreement ("Agreement") is entered into as of the date of activation 
between the parties identified as participants in this conversation (collectively, "Parties").

1. CONFIDENTIAL INFORMATION
All communications transmitted within this Confidential Mode session ("Confidential Information") 
are protected under this Agreement. Confidential Information includes all messages, data, media, 
documents, and any other content shared while Confidential Mode is active.

2. OBLIGATIONS OF THE PARTIES
Each Party agrees to:
  a) Hold all Confidential Information in strict confidence;
  b) Not disclose Confidential Information to any third party without prior written consent;
  c) Not use Confidential Information for any purpose other than the intended communication;
  d) Apply no less than reasonable care to protect the Confidential Information.

3. INTERNATIONAL JURISDICTION
This Agreement is governed by international confidentiality standards including but not limited to:
  - The OECD Guidelines on Privacy and Transborder Data Flows
  - EU General Data Protection Regulation (GDPR) principles
  - The UN Convention principles of good faith and fair dealing
  - Applicable domestic laws of each Party's jurisdiction

4. TERM
This Agreement remains in effect in perpetuity for all Confidential Information exchanged 
during active Confidential Mode sessions, unless mutually terminated in writing by all Parties.

5. REMEDIES
Breach of this Agreement may result in injunctive relief, monetary damages, and/or other 
remedies available under applicable international and domestic law.

6. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the Parties with respect to 
confidentiality of the communications herein.

By enabling Confidential Mode, each Party acknowledges they have read, understood, 
and agree to be bound by the terms of this Agreement.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function saveState(state: AppState) {
  try {
    localStorage.setItem("confi_state", JSON.stringify(state));
  } catch {}
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem("confi_state");
    if (raw) return JSON.parse(raw) as AppState;
  } catch {}
  return { user: null, conversations: [], activeConversationId: null };
}

// ─── Seed data helper ─────────────────────────────────────────────────────────

function seedDemoConversations(userEmail: string): Conversation[] {
  const now = Date.now();
  return [
    {
      id: generateId(),
      participantEmail: "alice@example.com",
      confidentialMode: false,
      messages: [
        {
          id: generateId(),
          senderId: "alice@example.com",
          text: "Hey! How are you doing?",
          timestamp: now - 3600000,
          confidential: false,
        },
        {
          id: generateId(),
          senderId: userEmail,
          text: "Doing well, thanks! Ready to discuss the project.",
          timestamp: now - 3540000,
          confidential: false,
        },
      ],
    },
    {
      id: generateId(),
      participantEmail: "bob@corp.io",
      confidentialMode: true,
      ndaAcceptedAt: now - 7200000,
      ndaAcceptedBy: [userEmail, "bob@corp.io"],
      messages: [
        {
          id: generateId(),
          senderId: "bob@corp.io",
          text: "The acquisition terms are finalized.",
          timestamp: now - 7100000,
          confidential: true,
        },
        {
          id: generateId(),
          senderId: userEmail,
          text: "Understood. I'll keep this strictly confidential.",
          timestamp: now - 7050000,
          confidential: true,
        },
      ],
    },
  ];
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────

function AuthScreen({ onAuth }: { onAuth: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, email, password }),
      });
      const data = await res.json();
      if (data.ok) {
        onAuth({ email: data.email });
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.authWrap}>
      <div style={styles.authCard}>
        <div style={styles.authLogo}>
          <LockIcon size={36} color="#25d366" />
          <h1 style={styles.authTitle}>Confi</h1>
          <p style={styles.authSubtitle}>Confidential Messaging</p>
        </div>

        <div style={styles.tabRow}>
          <button
            style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }}
            onClick={() => setMode("login")}
          >
            Sign In
          </button>
          <button
            style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {error && <p style={styles.errorText}>{error}</p>}
          <button style={styles.primaryBtn} type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── NDA Modal ────────────────────────────────────────────────────────────────

function NDAModal({
  onAccept,
  onDecline,
}: {
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = textRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolled(true);
    }
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <ShieldIcon size={24} color="#25d366" />
          <h2 style={styles.modalTitle}>International NDA — Confidential Mode</h2>
        </div>
        <p style={styles.modalDesc}>
          Enabling Confidential Mode activates a legally binding International
          Non-Disclosure Agreement. Please read and accept the terms below.
        </p>
        <div
          ref={textRef}
          onScroll={handleScroll}
          style={styles.ndaText}
        >
          <pre style={styles.ndaPre}>{NDA_TEXT}</pre>
        </div>
        {!scrolled && (
          <p style={styles.scrollHint}>↓ Scroll to read the full agreement</p>
        )}
        <div style={styles.modalActions}>
          <button style={styles.declineBtn} onClick={onDecline}>
            Decline
          </button>
          <button
            style={{ ...styles.acceptBtn, opacity: scrolled ? 1 : 0.4 }}
            onClick={onAccept}
            disabled={!scrolled}
          >
            I Agree & Enable
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Conversation Modal ────────────────────────────────────────────────────

function NewConvModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (email: string) => void;
}) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) onCreate(email.trim());
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={{ ...styles.modalBox, maxWidth: 400 }}>
        <h2 style={styles.modalTitle}>New Conversation</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Recipient Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@example.com"
            required
            autoFocus
          />
          <div style={styles.modalActions}>
            <button type="button" style={styles.declineBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.acceptBtn}>
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Icons (inline SVG components) ───────────────────────────────────────────

function LockIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SendIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function PlusIcon({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CheckIcon({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Page() {
  const [appState, setAppState] = useState<AppState>(() => loadState());
  const [showNDA, setShowNDA] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [pendingConfidentialConvId, setPendingConfidentialConvId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Track page view
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname }),
    }).catch(() => {});
  }, []);

  // Persist state
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [appState.activeConversationId, appState.conversations]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setAppState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  function handleAuth(user: User) {
    updateState((prev) => ({
      ...prev,
      user,
      conversations:
        prev.conversations.length === 0
          ? seedDemoConversations(user.email)
          : prev.conversations,
    }));
  }

  function handleLogout() {
    updateState(() => ({ user: null, conversations: [], activeConversationId: null }));
  }

  function handleNewConversation(email: string) {
    const existing = appState.conversations.find(
      (c) => c.participantEmail === email
    );
    if (existing) {
      updateState((prev) => ({ ...prev, activeConversationId: existing.id }));
      setShowNewConv(false);
      return;
    }
    const newConv: Conversation = {
      id: generateId(),
      participantEmail: email,
      messages: [],
      confidentialMode: false,
    };
    updateState((prev) => ({
      ...prev,
      conversations: [newConv, ...prev.conversations],
      activeConversationId: newConv.id,
    }));
    setShowNewConv(false);
  }

  function handleToggleConfidential(convId: string) {
    const conv = appState.conversations.find((c) => c.id === convId);
    if (!conv) return;

    if (conv.confidentialMode) {
      // Turn off
      updateState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((c) =>
          c.id === convId
            ? { ...c, confidentialMode: false, ndaAcceptedAt: undefined, ndaAcceptedBy: undefined }
            : c
        ),
      }));
    } else {
      // Show NDA first
      setPendingConfidentialConvId(convId);
      setShowNDA(true);
    }
  }

  function handleNDAAccept() {
    if (!pendingConfidentialConvId || !appState.user) return;
    const now = Date.now();
    updateState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === pendingConfidentialConvId
          ? {
              ...c,
              confidentialMode: true,
              ndaAcceptedAt: now,
              ndaAcceptedBy: [prev.user!.email],
            }
          : c
      ),
    }));
    setShowNDA(false);
    setPendingConfidentialConvId(null);
  }

  function handleNDADecline() {
    setShowNDA(false);
    setPendingConfidentialConvId(null);
  }

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || !appState.activeConversationId || !appState.user) return;
    const conv = appState.conversations.find(
      (c) => c.id === appState.activeConversationId
    );
    if (!conv) return;

    const newMsg: Message = {
      id: generateId(),
      senderId: appState.user.email,
      text: message.trim(),
      timestamp: Date.now(),
      confidential: conv.confidentialMode,
    };

    updateState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((c) =>
        c.id === prev.activeConversationId
          ? { ...c, messages: [...c.messages, newMsg] }
          : c
      ),
    }));
    setMessage("");

    // Simulate reply after delay (only in non-confidential for demo purposes)
    if (!conv.confidentialMode) {
      setTimeout(() => {
        const replies = [
          "Got it, thanks!",
          "Sounds good to me.",
          "Let me check on that.",
          "Understood, will do.",
          "Can we discuss this further?",
        ];
        const reply: Message = {
          id: generateId(),
          senderId: conv.participantEmail,
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: Date.now(),
          confidential: false,
        };
        updateState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((c) =>
            c.id === conv.id ? { ...c, messages: [...c.messages, reply] } : c
          ),
        }));
      }, 1200 + Math.random() * 800);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!appState.user) {
    return <AuthScreen onAuth={handleAuth} />;
  }

  const activeConv = appState.conversations.find(
    (c) => c.id === appState.activeConversationId
  );

  const lastMsg = (conv: Conversation) =>
    conv.messages[conv.messages.length - 1];

  return (
    <div style={styles.appWrap}>
      {/* Sidebar */}
      <aside style={{ ...styles.sidebar, ...(sidebarOpen ? {} : styles.sidebarHidden) }}>
        {/* Sidebar header */}
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarBrand}>
            <LockIcon size={18} color="#25d366" />
            <span style={styles.brandName}>Confi</span>
          </div>
          <button style={styles.iconBtn} onClick={() => setShowNewConv(true)} title="New chat">
            <PlusIcon size={20} color="#aaa" />
          </button>
        </div>

        {/* User pill */}
        <div style={styles.userPill}>
          <div style={styles.avatar}>{appState.user.email[0].toUpperCase()}</div>
          <span style={styles.userEmail}>{appState.user.email}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>

        {/* Conversation list */}
        <div style={styles.convList}>
          {appState.conversations.length === 0 && (
            <p style={styles.emptyHint}>No conversations yet. Start one!</p>
          )}
          {appState.conversations.map((conv) => {
            const active = conv.id === appState.activeConversationId;
            const last = lastMsg(conv);
            return (
              <button
                key={conv.id}
                style={{
                  ...styles.convItem,
                  ...(active ? styles.convItemActive : {}),
                }}
                onClick={() =>
                  updateState((prev) => ({ ...prev, activeConversationId: conv.id }))
                }
              >
                <div style={styles.convAvatar}>
                  {conv.participantEmail[0].toUpperCase()}
                  {conv.confidentialMode && (
                    <div style={styles.confiBadge}>
                      <ShieldIcon size={8} color="#fff" />
                    </div>
                  )}
                </div>
                <div style={styles.convInfo}>
                  <div style={styles.convName}>{conv.participantEmail}</div>
                  {last && (
                    <div style={styles.convPreview}>
                      {last.confidential ? "🔒 Confidential message" : last.text}
                    </div>
                  )}
                </div>
                {last && (
                  <div style={styles.convTime}>{formatTime(last.timestamp)}</div>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main chat area */}
      <main style={styles.chatMain}>
        {!activeConv ? (
          <div style={styles.noChatSelected}>
            <LockIcon size={64} color="#333" />
            <h2 style={styles.noChatTitle}>Confi Messaging</h2>
            <p style={styles.noChatDesc}>
              Select a conversation or start a new one.
              <br />
              Enable Confidential Mode to protect your messages under an
              international NDA.
            </p>
            <button style={styles.primaryBtn} onClick={() => setShowNewConv(true)}>
              New Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={styles.chatHeader}>
              <button
                style={styles.iconBtn}
                onClick={() => setSidebarOpen((o) => !o)}
                title="Toggle sidebar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div style={styles.chatHeaderAvatar}>
                {activeConv.participantEmail[0].toUpperCase()}
              </div>
              <div style={styles.chatHeaderInfo}>
                <div style={styles.chatHeaderName}>{activeConv.participantEmail}</div>
                {activeConv.confidentialMode && activeConv.ndaAcceptedAt && (
                  <div style={styles.chatHeaderSub}>
                    🔒 NDA active since {formatDate(activeConv.ndaAcceptedAt)}
                  </div>
                )}
              </div>

              {/* Confidential toggle */}
              <div style={styles.confidentialToggleWrap}>
                <span style={styles.confidentialLabel}>
                  {activeConv.confidentialMode ? (
                    <span style={{ color: "#25d366", display: "flex", alignItems: "center", gap: 4 }}>
                      <ShieldIcon size={14} color="#25d366" /> Confidential ON
                    </span>
                  ) : (
                    <span style={{ color: "#888" }}>Confidential OFF</span>
                  )}
                </span>
                <div
                  style={{
                    ...styles.toggleTrack,
                    background: activeConv.confidentialMode ? "#25d366" : "#444",
                  }}
                  onClick={() => handleToggleConfidential(activeConv.id)}
                >
                  <div
                    style={{
                      ...styles.toggleThumb,
                      transform: activeConv.confidentialMode
                        ? "translateX(22px)"
                        : "translateX(2px)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* NDA banner */}
            {activeConv.confidentialMode && (
              <div style={styles.ndaBanner}>
                <ShieldIcon size={16} color="#25d366" />
                <span>
                  This conversation is protected by an International NDA.
                  All messages are confidential.
                </span>
              </div>
            )}

            {/* Messages */}
            <div style={styles.messages}>
              {activeConv.messages.length === 0 && (
                <div style={styles.emptyMessages}>
                  <p>No messages yet. Say hello!</p>
                </div>
              )}
              {activeConv.messages.map((msg) => {
                const isMe = msg.senderId === appState.user!.email;
                return (
                  <div
                    key={msg.id}
                    style={{
                      ...styles.msgRow,
                      justifyContent: isMe ? "flex-end" : "flex-start",
                    }}
                  >
                    {!isMe && (
                      <div style={styles.msgAvatar}>
                        {msg.senderId[0].toUpperCase()}
                      </div>
                    )}
                    <div
                      style={{
                        ...styles.msgBubble,
                        background: isMe
                          ? msg.confidential
                            ? "#1a4731"
                            : "#005c4b"
                          : msg.confidential
                          ? "#1e1e2e"
                          : "#1e1e1e",
                        borderColor: msg.confidential ? "#25d366" : "transparent",
                        borderWidth: 1,
                        borderStyle: "solid",
                      }}
                    >
                      {msg.confidential && (
                        <div style={styles.msgConfiBadge}>
                          <LockIcon size={10} color="#25d366" />
                          <span style={{ fontSize: 10, color: "#25d366" }}>Confidential</span>
                        </div>
                      )}
                      <p style={styles.msgText}>{msg.text}</p>
                      <div style={styles.msgMeta}>
                        <span style={styles.msgTime}>{formatTime(msg.timestamp)}</span>
                        {isMe && <CheckIcon size={13} color="#aaa" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form style={styles.inputRow} onSubmit={handleSendMessage}>
              {activeConv.confidentialMode && (
                <div style={styles.inputLockIcon}>
                  <LockIcon size={16} color="#25d366" />
                </div>
              )}
              <input
                style={{
                  ...styles.msgInput,
                  ...(activeConv.confidentialMode
                    ? { borderColor: "#25d366", background: "#0d1f17" }
                    : {}),
                }}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  activeConv.confidentialMode
                    ? "🔒 Confidential message…"
                    : "Type a message…"
                }
                autoComplete="off"
              />
              <button
                type="submit"
                style={styles.sendBtn}
                disabled={!message.trim()}
              >
                <SendIcon size={18} color="#fff" />
              </button>
            </form>
          </>
        )}
      </main>

      {/* Modals */}
      {showNDA && <NDAModal onAccept={handleNDAAccept} onDecline={handleNDADecline} />}
      {showNewConv && (
        <NewConvModal onClose={() => setShowNewConv(false)} onCreate={handleNewConversation} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Auth
  authWrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0a0a0a",
    padding: 16,
  },
  authCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 40,
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
  },
  authLogo: {
    textAlign: "center",
    marginBottom: 28,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#fff",
    marginTop: 8,
  },
  authSubtitle: {
    color: "#666",
    fontSize: 14,
    marginTop: 4,
  },
  tabRow: {
    display: "flex",
    background: "#1a1a1a",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#888",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  tabActive: {
    background: "#222",
    color: "#fff",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  input: {
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  errorText: {
    color: "#ff5555",
    fontSize: 13,
    textAlign: "center",
  },
  primaryBtn: {
    padding: "12px 20px",
    background: "#25d366",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 15,
    cursor: "pointer",
    marginTop: 4,
    transition: "opacity 0.2s",
  },

  // App layout
  appWrap: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0a0a0a",
  },

  // Sidebar
  sidebar: {
    width: 300,
    minWidth: 300,
    background: "#111",
    borderRight: "1px solid #1e1e1e",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.2s, min-width 0.2s",
    overflow: "hidden",
  },
  sidebarHidden: {
    width: 0,
    minWidth: 0,
  },
  sidebarHeader: {
    padding: "16px 16px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e1e1e",
  },
  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brandName: {
    fontWeight: 700,
    fontSize: 18,
    color: "#fff",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 6,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  userPill: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    borderBottom: "1px solid #1e1e1e",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#25d366",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
  userEmail: {
    fontSize: 12,
    color: "#aaa",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  logoutBtn: {
    background: "none",
    border: "1px solid #333",
    borderRadius: 6,
    color: "#888",
    fontSize: 11,
    cursor: "pointer",
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },
  convList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0",
  },
  emptyHint: {
    color: "#555",
    fontSize: 13,
    textAlign: "center",
    padding: 24,
  },
  convItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
    borderBottom: "1px solid #181818",
  },
  convItemActive: {
    background: "#1e1e1e",
  },
  convAvatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#2a2a2a",
    color: "#ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
    position: "relative",
  },
  confiBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#25d366",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #111",
  },
  convInfo: {
    flex: 1,
    overflow: "hidden",
  },
  convName: {
    fontSize: 13,
    fontWeight: 600,
    color: "#ddd",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  convPreview: {
    fontSize: 12,
    color: "#666",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 2,
  },
  convTime: {
    fontSize: 11,
    color: "#555",
    flexShrink: 0,
  },

  // Chat
  chatMain: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#0d0d0d",
  },
  noChatSelected: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
    textAlign: "center",
  },
  noChatTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: "#444",
  },
  noChatDesc: {
    fontSize: 14,
    color: "#555",
    lineHeight: 1.6,
    maxWidth: 340,
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 20px",
    borderBottom: "1px solid #1e1e1e",
    background: "#111",
    flexShrink: 0,
  },
  chatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#2a2a2a",
    color: "#ccc",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 15,
    flexShrink: 0,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    fontWeight: 600,
    fontSize: 14,
    color: "#e0e0e0",
  },
  chatHeaderSub: {
    fontSize: 11,
    color: "#25d366",
    marginTop: 2,
  },
  confidentialToggleWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  confidentialLabel: {
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: "nowrap",
  },
  toggleTrack: {
    width: 46,
    height: 24,
    borderRadius: 12,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
  },
  toggleThumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
  },
  ndaBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "#0d1f17",
    borderBottom: "1px solid #1a4731",
    padding: "8px 20px",
    fontSize: 12,
    color: "#25d366",
    flexShrink: 0,
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  emptyMessages: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#555",
    fontSize: 14,
  },
  msgRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: 8,
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#2a2a2a",
    color: "#aaa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 12,
    flexShrink: 0,
  },
  msgBubble: {
    maxWidth: "68%",
    borderRadius: 14,
    padding: "8px 12px",
  },
  msgConfiBadge: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  msgText: {
    fontSize: 14,
    color: "#e0e0e0",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  msgMeta: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3,
    marginTop: 4,
  },
  msgTime: {
    fontSize: 11,
    color: "#777",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderTop: "1px solid #1e1e1e",
    background: "#111",
    flexShrink: 0,
  },
  inputLockIcon: {
    flexShrink: 0,
  },
  msgInput: {
    flex: 1,
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 24,
    padding: "10px 16px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#25d366",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.2s",
  },

  // Modal
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 16,
  },
  modalBox: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 560,
    maxHeight: "90vh",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
  },
  modalDesc: {
    fontSize: 13,
    color: "#888",
    lineHeight: 1.6,
  },
  ndaText: {
    flex: 1,
    overflowY: "auto",
    background: "#0d0d0d",
    border: "1px solid #222",
    borderRadius: 8,
    padding: 16,
    maxHeight: 300,
  },
  ndaPre: {
    fontFamily: "monospace",
    fontSize: 11,
    color: "#aaa",
    whiteSpace: "pre-wrap",
    lineHeight: 1.6,
  },
  scrollHint: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  modalActions: {
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
  },
  declineBtn: {
    padding: "10px 20px",
    background: "none",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#888",
    fontSize: 14,
    cursor: "pointer",
  },
  acceptBtn: {
    padding: "10px 20px",
    background: "#25d366",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};