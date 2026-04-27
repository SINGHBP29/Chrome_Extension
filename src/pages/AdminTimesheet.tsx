import { useState } from "react";
import { ArrowLeft, Search, Check, X, Clock, Filter, Users, Calendar, UserPlus, Bell, Mail, FileText, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface TeamTimesheet {
  id: string;
  employeeName: string;
  email: string;
  department: string;
  totalHours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedDate?: string;
  approvalNotes?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  location: string;
  employeeType: string;
  grade: string;
  company: string;
}

interface Meeting {
  id: string;
  title: string;
  content: string;
  date: string;
  link: string;
  attendees: string[];
}

const mockTeamTimesheets: TeamTimesheet[] = [
  {
    id: "ts1",
    employeeName: "John Doe",
    email: "john.doe@company.com",
    department: "Engineering",
    totalHours: 40,
    status: "approved",
    submittedDate: "2026-04-23",
  },
  {
    id: "ts2",
    employeeName: "Sarah Smith",
    email: "sarah.smith@company.com",
    department: "Design",
    totalHours: 38,
    status: "submitted",
    submittedDate: "2026-04-24",
  },
  {
    id: "ts3",
    employeeName: "Mike Johnson",
    email: "mike.johnson@company.com",
    department: "Engineering",
    totalHours: 42,
    status: "submitted",
    submittedDate: "2026-04-24",
  },
  {
    id: "ts4",
    employeeName: "Emma Wilson",
    email: "emma.wilson@company.com",
    department: "Product",
    totalHours: 0,
    status: "draft",
  },
  {
    id: "ts5",
    employeeName: "Alex Chen",
    email: "alex.chen@company.com",
    department: "Engineering",
    totalHours: 40,
    status: "rejected",
    approvalNotes: "Missing details for 2 entries",
  },
];

const mockEmployees: Employee[] = [
  { id: "e1", name: "John Doe", email: "john.doe@company.com", location: "Bangalore", employeeType: "Fulltime", grade: "T2", company: "Google" },
  { id: "e2", name: "Sarah Smith", email: "sarah.smith@company.com", location: "Hyderabad", employeeType: "Intern", grade: "IC0", company: "Visa" },
  { id: "e3", name: "Mike Johnson", email: "mike.johnson@company.com", location: "Chennai", employeeType: "Fulltime", grade: "T3", company: "Pepsi" },
  { id: "e4", name: "Emma Wilson", email: "emma.wilson@company.com", location: "Bangalore", employeeType: "Fulltime", grade: "T1", company: "Google" },
];

const AdminTimesheet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"timesheets" | "meeting" | "addEmployee" | "notify">("timesheets");
  const [timesheets, setTimesheets] = useState<TeamTimesheet[]>(mockTeamTimesheets);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | TeamTimesheet["status"]>("all");
  const [selectedTimesheet, setSelectedTimesheet] = useState<TeamTimesheet | null>(null);
  const [isApprovingModal, setIsApprovingModal] = useState(false);

  // Filters for employees
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Meeting modal
  const [isMeetingModal, setIsMeetingModal] = useState(false);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingContent, setMeetingContent] = useState("");
  const [meetingDate, setMeetingDate] = useState("");

  // Add employee modal
  const [isAddEmployeeModal, setIsAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    email: "",
    location: "",
    employeeType: "",
    grade: "",
    company: "",
  });

  // Notify modal
  const [isNotifyModal, setIsNotifyModal] = useState(false);
  const [notifyMonth, setNotifyMonth] = useState("");
  const [notifyYear, setNotifyYear] = useState("");

  const handleHostMeeting = () => {
    if (meetingTitle && meetingContent && meetingDate && selectedEmployees.length > 0) {
      const newMeeting: Meeting = {
        id: Date.now().toString(),
        title: meetingTitle,
        content: meetingContent,
        date: meetingDate,
        link: `https://meet.google.com/${Math.random().toString(36).substr(2, 9)}`,
        attendees: selectedEmployees,
      };
      setMeetings([...meetings, newMeeting]);
      // Here you would generate PDF and send emails
      alert(`Meeting hosted! Emails sent to ${selectedEmployees.length} employees.`);
      setIsMeetingModal(false);
      setMeetingTitle("");
      setMeetingContent("");
      setMeetingDate("");
      setSelectedEmployees([]);
    }
  };

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.email) {
      const emp: Employee = {
        id: Date.now().toString(),
        ...newEmployee,
      };
      setEmployees([...employees, emp]);
      alert("Employee added successfully!");
      setIsAddEmployeeModal(false);
      setNewEmployee({
        name: "",
        email: "",
        location: "",
        employeeType: "",
        grade: "",
        company: "",
      });
    }
  };

  const handleNotify = () => {
    if (notifyMonth && notifyYear && selectedEmployees.length > 0) {
      // Here you would send notification emails
      alert(`Notifications sent to ${selectedEmployees.length} employees for ${notifyMonth}/${notifyYear} timesheet.`);
      setIsNotifyModal(false);
      setNotifyMonth("");
      setNotifyYear("");
      setSelectedEmployees([]);
    }
  };

  const tabs = [
    { id: "timesheets", label: "Timesheets", icon: Clock },
    { id: "meeting", label: "Host Meeting", icon: Video },
    { id: "addEmployee", label: "Add Employee", icon: UserPlus },
    { id: "notify", label: "Notify", icon: Bell },
  ];

  const filteredTimesheets = timesheets.filter((ts) => {
    const matchesSearch =
      ts.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ts.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ts.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredEmployees = employees.filter((emp) => {
    const matchesLocation = locationFilter === "all" || emp.location === locationFilter;
    const matchesType = employeeTypeFilter === "all" || emp.employeeType === employeeTypeFilter;
    const matchesGrade = gradeFilter === "all" || emp.grade === gradeFilter;
    const matchesCompany = companyFilter === "all" || emp.company === companyFilter;
    return matchesLocation && matchesType && matchesGrade && matchesCompany;
  });

  const stats = {
    total: timesheets.length,
    submitted: timesheets.filter((ts) => ts.status === "submitted").length,
    approved: timesheets.filter((ts) => ts.status === "approved").length,
    pending: timesheets.filter((ts) => ts.status === "draft").length,
  };

  const getStatusColor = (status: TeamTimesheet["status"]) => {
    switch (status) {
      case "approved":
        return "bg-success/10 text-success";
      case "submitted":
        return "bg-warning/10 text-warning";
      case "rejected":
        return "bg-destructive/10 text-destructive";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-foreground";
    }
  };

  const handleApprove = () => {
    if (selectedTimesheet) {
      setTimesheets(
        timesheets.map((ts) =>
          ts.id === selectedTimesheet.id ? { ...ts, status: "approved" } : ts
        )
      );
      setSelectedTimesheet(null);
      setIsApprovingModal(false);
    }
  };

  const handleReject = () => {
    if (selectedTimesheet) {
      setTimesheets(
        timesheets.map((ts) =>
          ts.id === selectedTimesheet.id
            ? { ...ts, status: "rejected", approvalNotes: "Requires revision" }
            : ts
        )
      );
      setSelectedTimesheet(null);
      setIsApprovingModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-mesh flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center gap-3">
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
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage timesheets, meetings, and employees</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-smooth ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "timesheets" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Team</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-[10px] text-muted-foreground">Employees</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Submitted</p>
                  <p className="text-2xl font-bold text-warning">{stats.submitted}</p>
                  <p className="text-[10px] text-muted-foreground">Pending review</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">{stats.approved}</p>
                  <p className="text-[10px] text-muted-foreground">This week</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Not submitted</p>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name, email or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-secondary text-sm font-medium">
                    <Filter className="w-4 h-4" />
                    Filter
                  </button>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                  {(["all", "submitted", "approved", "rejected", "draft"] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${
                        filterStatus === status
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-background hover:bg-secondary"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timesheets Table */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-secondary/30">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Submitted</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTimesheets.map((ts) => (
                        <tr key={ts.id} className="hover:bg-secondary/30 transition-smooth">
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{ts.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{ts.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{ts.department}</td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold">{ts.totalHours}h</p>
                            <p className="text-xs text-muted-foreground">of 40h</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ts.status)}`}>
                              {ts.status.charAt(0).toUpperCase() + ts.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {ts.submittedDate ? new Date(ts.submittedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {ts.status === "submitted" && (
                              <Button
                                onClick={() => {
                                  setSelectedTimesheet(ts);
                                  setIsApprovingModal(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs rounded-lg"
                              >
                                Review
                              </Button>
                            )}
                            {ts.status !== "submitted" && (
                              <button
                                onClick={() => {
                                  setSelectedTimesheet(ts);
                                  setIsApprovingModal(true);
                                }}
                                className="text-xs text-primary hover:underline"
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "meeting" && (
            <div className="space-y-6">
              {/* Employee Filters */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold">Filter Employees</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                  <select
                    value={employeeTypeFilter}
                    onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="Intern">Intern</option>
                    <option value="Fulltime">Fulltime</option>
                  </select>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Grades</option>
                    <option value="IC0">IC0</option>
                    <option value="T1">T1</option>
                    <option value="T2">T2</option>
                    <option value="T3">T3</option>
                  </select>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Companies</option>
                    <option value="Google">Google</option>
                    <option value="Visa">Visa</option>
                    <option value="Pepsi">Pepsi</option>
                  </select>
                </div>
              </div>

              {/* Employee List */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Select Employees ({filteredEmployees.length})</h3>
                  <Button onClick={() => setIsMeetingModal(true)} disabled={selectedEmployees.length === 0}>
                    <Video className="w-4 h-4 mr-2" />
                    Host Meeting
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([...selectedEmployees, emp.email]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(email => email !== emp.email));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emp.location} • {emp.grade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "addEmployee" && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <h3 className="text-lg font-semibold">Add New Employee</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                <select
                  value={newEmployee.location}
                  onChange={(e) => setNewEmployee({ ...newEmployee, location: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select Location</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Hyderabad">Hyderabad</option>
                  <option value="Chennai">Chennai</option>
                </select>
                <select
                  value={newEmployee.employeeType}
                  onChange={(e) => setNewEmployee({ ...newEmployee, employeeType: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select Type</option>
                  <option value="Intern">Intern</option>
                  <option value="Fulltime">Fulltime</option>
                </select>
                <select
                  value={newEmployee.grade}
                  onChange={(e) => setNewEmployee({ ...newEmployee, grade: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select Grade</option>
                  <option value="IC0">IC0</option>
                  <option value="T1">T1</option>
                  <option value="T2">T2</option>
                  <option value="T3">T3</option>
                </select>
                <select
                  value={newEmployee.company}
                  onChange={(e) => setNewEmployee({ ...newEmployee, company: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                >
                  <option value="">Select Company</option>
                  <option value="Google">Google</option>
                  <option value="Visa">Visa</option>
                  <option value="Pepsi">Pepsi</option>
                </select>
              </div>
              <Button onClick={handleAddEmployee} className="w-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          )}

          {activeTab === "notify" && (
            <div className="space-y-6">
              {/* Employee Filters */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <h3 className="text-lg font-semibold">Filter Employees for Notification</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Locations</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                  </select>
                  <select
                    value={employeeTypeFilter}
                    onChange={(e) => setEmployeeTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="Intern">Intern</option>
                    <option value="Fulltime">Fulltime</option>
                  </select>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Grades</option>
                    <option value="IC0">IC0</option>
                    <option value="T1">T1</option>
                    <option value="T2">T2</option>
                    <option value="T3">T3</option>
                  </select>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    <option value="all">All Companies</option>
                    <option value="Google">Google</option>
                    <option value="Visa">Visa</option>
                    <option value="Pepsi">Pepsi</option>
                  </select>
                </div>
              </div>

              {/* Employee List */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Select Employees ({filteredEmployees.length})</h3>
                  <Button onClick={() => setIsNotifyModal(true)} disabled={selectedEmployees.length === 0}>
                    <Bell className="w-4 h-4 mr-2" />
                    Send Notification
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp.email)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEmployees([...selectedEmployees, emp.email]);
                          } else {
                            setSelectedEmployees(selectedEmployees.filter(email => email !== emp.email));
                          }
                        }}
                        className="rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{emp.name}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {emp.location} • {emp.grade}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {isApprovingModal && selectedTimesheet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Review Timesheet</h3>
              <p className="text-sm text-muted-foreground">{selectedTimesheet.employeeName}</p>
            </div>

            <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Hours</span>
                <span className="text-sm font-bold">{selectedTimesheet.totalHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-sm font-bold ${selectedTimesheet.status === "approved" ? "text-success" : ""}`}>
                  {selectedTimesheet.status.charAt(0).toUpperCase() + selectedTimesheet.status.slice(1)}
                </span>
              </div>
              {selectedTimesheet.approvalNotes && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Notes</span>
                  <span className="text-sm text-muted-foreground">{selectedTimesheet.approvalNotes}</span>
                </div>
              )}
            </div>

            {selectedTimesheet.status === "submitted" && (
              <>
                <textarea
                  placeholder="Add approval notes..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm max-h-24 resize-none"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    className="flex-1 bg-success hover:opacity-90 text-foreground rounded-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={handleReject}
                    variant="outline"
                    className="flex-1 rounded-lg flex items-center justify-center gap-2 text-destructive border-destructive/30"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </Button>
                </div>
              </>
            )}

            {selectedTimesheet.status !== "submitted" && (
              <Button
                onClick={() => setIsApprovingModal(false)}
                className="w-full bg-gradient-primary hover:opacity-90 rounded-lg"
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {isMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md space-y-4">
            <h3 className="text-lg font-bold">Host Meeting</h3>
            <input
              type="text"
              placeholder="Meeting Title"
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <textarea
              placeholder="Meeting Content"
              value={meetingContent}
              onChange={(e) => setMeetingContent(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm h-24 resize-none"
            />
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
            <div className="flex gap-3">
              <Button onClick={handleHostMeeting} className="flex-1">
                <Mail className="w-4 h-4 mr-2" />
                Send Invites
              </Button>
              <Button onClick={() => setIsMeetingModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notify Modal */}
      {isNotifyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md space-y-4">
            <h3 className="text-lg font-bold">Send Timesheet Notification</h3>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={notifyMonth}
                onChange={(e) => setNotifyMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Select Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
              <select
                value={notifyYear}
                onChange={(e) => setNotifyYear(e.target.value)}
                className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Select Year</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleNotify} className="flex-1">
                <Bell className="w-4 h-4 mr-2" />
                Send Notification
              </Button>
              <Button onClick={() => setIsNotifyModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTimesheet;
