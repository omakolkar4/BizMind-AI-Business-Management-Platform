"use client";

import * as React from "react";
import {
  Users,
  Search,
  MessageSquare,
  Send,
  X,
  Building2,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Mail,
  Calendar,
  Briefcase,
  Shield,
  CheckSquare,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TeamDirectoryPage() {
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [isOwner, setIsOwner] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [deptFilter, setDeptFilter] = React.useState("All");

  // Profile Modal State
  const [selectedProfile, setSelectedProfile] = React.useState<any | null>(null);

  // Messaging State
  const [chatColleague, setChatColleague] = React.useState<any | null>(null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [messageInput, setMessageInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const loadTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        setEmployees(json.employees || []);
        setIsOwner(Boolean(json.isOwner));
      } else {
        toast.error("Failed to load team directory.");
      }
    } catch {
      toast.error("Network error loading team.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTeam();
  }, []);

  const openChat = async (colleague: any) => {
    setChatColleague(colleague);
    if (!colleague.userId) {
      toast.info("This team member does not have an active messaging user linked yet.");
      return;
    }
    try {
      setChatLoading(true);
      const res = await fetch(`/api/messages?userId=${colleague.userId}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.messages || []);
      }
    } catch {
      toast.error("Failed to load messages.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !chatColleague?.userId) return;

    try {
      setSending(true);
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: chatColleague.userId,
          content: messageInput,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to send message.");
        return;
      }

      setMessages((prev) => [...prev, json.message]);
      setMessageInput("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch {
      toast.error("Network error sending message.");
    } finally {
      setSending(false);
    }
  };

  const departments = ["All", ...Array.from(new Set(employees.map((e) => e.department)))];

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "All" || emp.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <DashboardShell>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>Colleague & Team Directory</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Find colleagues across departments, view work availability, and communicate directly for operational deliverables.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={loadTeam} disabled={loading} className="text-xs h-8">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Roster</span>
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-3 rounded-2xl border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9 bg-background"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-semibold">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1 text-xs font-semibold text-foreground outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((emp) => (
              <Card
                key={emp.id}
                onClick={() => setSelectedProfile(emp)}
                className="border shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-700 transition-all cursor-pointer"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground text-sm leading-snug">{emp.name}</h3>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{emp.role}</p>
                        <p className="text-[11px] text-muted-foreground">{emp.department}</p>
                      </div>
                    </div>

                    <Badge
                      variant={emp.status === "Active" ? "success" : "secondary"}
                      className="text-[10px] px-2 py-0 shrink-0"
                    >
                      {emp.status}
                    </Badge>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground text-[11px]">
                      {emp.tasks?.length || 0} Open Deliverables
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openChat(emp);
                      }}
                      className="text-xs h-8 px-3 font-semibold"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      <span>Chat</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center text-xs text-muted-foreground border">
            No colleagues found matching your search.
          </Card>
        )}

        {/* Colleague Profile Modal */}
        {selectedProfile && (
          <Dialog open={Boolean(selectedProfile)} onOpenChange={(open) => !open && setSelectedProfile(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader className="pb-2">
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-600" />
                  <span>Colleague Profile</span>
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Work profile and deliverables directory. Confidential personal and salary records are strictly protected.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2 text-xs">
                {/* Profile Header Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 via-card to-purple-50/30 dark:from-indigo-950/20 dark:via-card dark:to-purple-950/20 border flex items-center gap-3.5">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shadow-xs shrink-0">
                    {selectedProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-extrabold text-base text-foreground truncate">{selectedProfile.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-semibold text-indigo-600 border-indigo-300">
                        {selectedProfile.role}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {selectedProfile.department}
                      </Badge>
                      <Badge variant={selectedProfile.status === "Active" ? "success" : "secondary"} className="text-[10px]">
                        {selectedProfile.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Work Details Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl border bg-muted/20">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      <span>Department</span>
                    </span>
                    <p className="font-bold text-foreground">{selectedProfile.department}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Tenure</span>
                    </span>
                    <p className="font-bold text-foreground">
                      {selectedProfile.joiningDate ? formatDate(selectedProfile.joiningDate) : "Active Team"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>Work Username</span>
                    </span>
                    <p className="font-mono text-muted-foreground">@{selectedProfile.username || selectedProfile.name.toLowerCase().replace(/\s+/g, ".")}</p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" />
                      <span>Assigned Tasks</span>
                    </span>
                    <p className="font-bold text-foreground">{selectedProfile.tasks?.length || 0} Open Deliverables</p>
                  </div>
                </div>

                {/* Owner-Only Privileged Information (If viewed by company owner) */}
                {isOwner && (
                  <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Owner HR Confidential Overview</span>
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Monthly Compensation:</span>
                        <span className="font-mono font-bold text-foreground">
                          {selectedProfile.salary ? `₹${Number(selectedProfile.salary).toLocaleString("en-IN")}` : "Not configured"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Contact Phone:</span>
                        <span className="font-mono text-foreground">{selectedProfile.phone || "Not set"}</span>
                      </div>
                    </div>
                    {selectedProfile.notes && (
                      <div className="pt-1 border-t text-[11px] text-muted-foreground">
                        <strong>Management Notes:</strong> {selectedProfile.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button: Start Work Chat */}
                <div className="pt-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const colleague = selectedProfile;
                      setSelectedProfile(null);
                      openChat(colleague);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-xs"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>Start Work Chat with {selectedProfile.name}</span>
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Work Messaging Modal */}
        {chatColleague && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl flex flex-col h-[520px] overflow-hidden animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    {chatColleague.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{chatColleague.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {chatColleague.role} • {chatColleague.department}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setChatColleague(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Message Thread Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-muted/5">
                {chatLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                    Loading conversation...
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((m) => {
                    const isMe = m.senderId !== chatColleague.userId;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-none shadow-xs"
                              : "bg-muted text-foreground rounded-bl-none border"
                          }`}
                        >
                          {m.content}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-xs text-muted-foreground space-y-1">
                    <MessageSquare className="h-6 w-6 mx-auto text-indigo-400 opacity-60" />
                    <p className="font-semibold text-foreground">No messages yet.</p>
                    <p className="text-[11px]">Send a work update or ask a question regarding project deliverables.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t bg-card flex items-center gap-2">
                <Input
                  placeholder={`Message ${chatColleague.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sending || !chatColleague.userId}
                  className="text-xs h-9 bg-muted/30"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending || !messageInput.trim() || !chatColleague.userId}
                  className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
