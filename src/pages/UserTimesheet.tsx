import { useState, useRef } from "react";
import { ArrowLeft, Plus, Check, Clock, AlertCircle, Video, FileText, Bell, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TimeEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  status: "draft" | "submitted";
}

interface Meeting {
  id: string;
  title: string;
  content: string;
  date: string;
  link: string;
}

const mockProjects = [
  { id: "p1", name: "Project Alpha", color: "bg-primary" },
  { id: "p2", name: "Project Beta", color: "bg-success" },
  { id: "p3", name: "Project Gamma", color: "bg-warning" },
];

const mockEntries: TimeEntry[] = [
  {
    id: "1",
    date: "2026-04-21",
    project: "Project Alpha",
    task: "API Development",
    hours: 8,
    status: "draft",
  },
  {
    id: "2",
    date: "2026-04-22",
    project: "Project Beta",
    task: "UI Design Review",
    hours: 6,
    status: "draft",
  },
  {
    id: "3",
    date: "2026-04-23",
    project: "Project Alpha",
    task: "Bug Fixes",
    hours: 8,
    status: "draft",
  },
];

const mockMeetings: Meeting[] = [
  {
    id: "m1",
    title: "Weekly Team Sync",
    content: "Discuss project progress and upcoming deadlines. Please review the attached documents.",
    date: "2026-04-25T10:00:00",
    link: "https://meet.google.com/abc-defg-hij",
  },
];

const mockNotifications = [
  {
    id: "n1",
    title: "Timesheet Submission Required",
    message: "Please submit your timesheet for April 2026 by end of this week.",
    month: 4,
    year: 2026,
    urgent: true,
  },
];

const UserTimesheet = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<TimeEntry[]>(mockEntries);
  const [meetings] = useState<Meeting[]>(mockMeetings);
  const [notifications] = useState(mockNotifications);
  const [isAdding, setIsAdding] = useState(false);
  const [status, setStatus] = useState<"draft" | "submitted">("draft");

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const weekStartDate = new Date(2026, 3, 21); // April 21, 2026

  const projectHours = mockProjects.map((project) => {
    const hours = entries
      .filter((e) => e.project === project.name)
      .reduce((sum, e) => sum + e.hours, 0);
    return { ...project, hours };
  });

  const handleSubmit = () => {
    setStatus("submitted");
    setEntries(entries.map((e) => ({ ...e, status: "submitted" })));
  };

  const handleRemoveTimesheet = () => {
    setStatus("draft");
    setEntries(entries.map((e) => ({ ...e, status: "draft" })));
    alert("Timesheet removed. You can start fresh.");
  };

  const handleRemindLater = () => {
    alert("Reminder set for later. We'll notify you again.");
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-1.5 hover:bg-secondary rounded-lg transition-smooth"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">My Timesheet</h1>
              <p className="text-xs text-muted-foreground">
                Week of {weekStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                status === "submitted"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {status === "submitted" ? "Submitted" : "Draft"}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Weekly Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Hours</span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="text-3xl font-bold">{totalHours}</div>
              <div className="text-xs text-muted-foreground">of 40 hours target</div>
              <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: `${(totalHours / 40) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                {status === "submitted" && <Check className="w-4 h-4 text-success" />}
              </div>
              <div className="text-2xl font-bold capitalize">{status}</div>
              <div className="text-xs text-muted-foreground">
                {status === "submitted" ? "Awaiting approval" : "Ready to submit"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Projects</span>
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold">{projectHours.length}</div>
              <div className="text-xs text-muted-foreground">Active projects</div>
            </div>
          </div>

          {/* Notifications */}
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-xl border border-warning/30 bg-warning/5 p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-warning mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <Button onClick={() => navigate("/timesheet/user")} size="sm" className="bg-primary hover:opacity-90">
                      Submit Timesheet
                    </Button>
                    <Button onClick={handleRemoveTimesheet} variant="outline" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                    <Button onClick={handleRemindLater} variant="ghost" size="sm">
                      Remind Later
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Meetings */}
          {meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">{meeting.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{new Date(meeting.date).toLocaleString()}</span>
                    <a
                      href={meeting.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Video className="w-3 h-3" />
                      Join Meeting
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Projects Breakdown */}
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h3 className="text-sm font-semibold">Hours by Project</h3>
            <div className="space-y-3">
              {projectHours.map((proj) => (
                <div key={proj.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{proj.name}</span>
                    <span className="text-sm font-bold">{proj.hours}h</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary"
                      style={{ width: `${(proj.hours / 40) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Time Entries */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Time Entries</h3>
              {status === "draft" && (
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-70 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Add Entry
                </button>
              )}
            </div>

            {isAdding && status === "draft" && (
              <div className="px-6 py-4 border-b border-border bg-secondary/20 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    placeholder="Date"
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                  <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm">
                    <option>Select Project</option>
                    {mockProjects.map((p) => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Task description"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <input
                  type="number"
                  placeholder="Hours"
                  min="0.5"
                  max="12"
                  step="0.5"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90">
                    Save
                  </button>
                  <button
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-medium hover:bg-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-secondary/30">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{entry.task}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.project} • {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{entry.hours}h</p>
                    {status === "draft" && (
                      <button className="text-xs text-primary hover:underline">Edit</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Action Buttons */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/0 px-6 py-6 border-t border-border">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              onClick={() => navigate("/timesheet/user")}
              className="w-full bg-gradient-primary hover:opacity-90 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Submit Timesheet
            </Button>
            <Button
              onClick={handleRemoveTimesheet}
              variant="outline"
              className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remove Timesheet
            </Button>
            <Button
              onClick={handleRemindLater}
              variant="secondary"
              className="w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              Remind Later
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Submit your timesheet for approval. You can remove it if needed or set a reminder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserTimesheet;
