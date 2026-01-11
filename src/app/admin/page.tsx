"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDatabase, ref, set, get, child, query, orderByChild, equalTo, remove } from "firebase/database";
import { useRouter } from "next/navigation";

type EmployeeSummary = {
    uid: string;
    email: string;
    name: string;
    role?: string;
    team?: string;
};

type EmployeeFullProfile = {
    role: string;
    team: string;
    cadence: string;
    skills_self: string[];
    challenges: string[];
    tools_interest: string[];
    additional_notes: string;
    name: string;
    email: string;
    updated_at: number;
};

export default function AdminPage() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [emailInput, setEmailInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
    const [msg, setMsg] = useState("");

    // Selection for Detail View
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [selectedEmployeeData, setSelectedEmployeeData] = useState<EmployeeFullProfile | null>(null);
    const [adminNotes, setAdminNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const [allEmployees, setAllEmployees] = useState<EmployeeSummary[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
    const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null); // For animation

    // Permanent Delete Modal State
    const [isPermDeleteModalOpen, setIsPermDeleteModalOpen] = useState(false);
    const [employeeToPermDelete, setEmployeeToPermDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            // Optional: Redirect if not logged in, or handled by layout/middleware
            // router.push("/"); 
            return;
        }

        // Fetch linked employees
        const fetchEmployees = async () => {
            const db = getDatabase();
            const snapshot = await get(child(ref(db), `supervisors/${user.uid}/employees`));
            if (snapshot.exists()) {
                const data = snapshot.val();
                // data might be an object or array depending on how firebase saved it. 
                // We'll store as array.
                const list = Object.values(data) as EmployeeSummary[];
                setEmployees(list);
            }
        };

        fetchEmployees();
        fetchAllEmployees();
    }, [user]);

    const fetchAllEmployees = async () => {
        const db = getDatabase();
        setLoadingAll(true);
        try {
            const inputsRef = ref(db, "employee_inputs");
            const snapshot = await get(inputsRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const list: EmployeeSummary[] = Object.entries(data).map(([uid, val]: [string, any]) => ({
                    uid,
                    email: val.email,
                    name: val.name || "Unknown",
                    role: val.role,
                    team: val.team
                }));
                setAllEmployees(list);
            }
        } catch (e) {
            console.error("Error fetching all employees", e);
        } finally {
            setLoadingAll(false);
        }
    };

    // Fetch details when an employee is selected
    useEffect(() => {
        if (!selectedEmployeeId || !user) return;

        const fetchDetails = async () => {
            const db = getDatabase();

            // 1. Get Employee Profile
            const profileSnap = await get(child(ref(db), `employee_inputs/${selectedEmployeeId}`));
            if (profileSnap.exists()) {
                setSelectedEmployeeData(profileSnap.val());
            }

            // 2. Get Admin Notes
            const notesSnap = await get(child(ref(db), `admin_data/${selectedEmployeeId}`));
            if (notesSnap.exists()) {
                const data = notesSnap.val();
                // Verify this note belongs to this supervisor?
                // Simple check: `assigned_supervisor` matches.
                if (data.assigned_supervisor === user.uid) {
                    setAdminNotes(data.notes || "");
                } else {
                    setAdminNotes(""); // or handle error
                }
            } else {
                setAdminNotes("");
            }
        };

        fetchDetails();
    }, [selectedEmployeeId, user]);


    const handleAddEmployee = async () => {
        if (!emailInput.trim() || !user) return;
        setLoading(true);
        setMsg("");

        try {
            const db = getDatabase();

            // 1. Find the user by Email in employee_inputs
            // Robust method: Fetch all and find (avoids indexing issues)
            const inputsRef = ref(db, "employee_inputs");
            const snapshot = await get(inputsRef);

            if (snapshot.exists()) {
                const allInputs = snapshot.val();
                const foundEntry = Object.entries(allInputs).find(([key, val]: [string, any]) =>
                    val.email && val.email.trim().toLowerCase() === emailInput.trim().toLowerCase()
                );

                if (foundEntry) {
                    const [matchedUid, empData] = foundEntry as [string, any];

                    const entry: EmployeeSummary = {
                        uid: matchedUid,
                        email: empData.email,
                        name: empData.name || "Unknown"
                    };

                    // 2. Add to supervisor's list
                    await set(ref(db, `supervisors/${user.uid}/employees/${matchedUid}`), entry);

                    // Update local state
                    setEmployees(prev => {
                        const exists = prev.find(e => e.uid === matchedUid);
                        if (exists) return prev;
                        return [...prev, entry];
                    });

                    setMsg(`Successfully added ${empData.name}`);
                    setEmailInput("");
                    return;
                }
            }

            setMsg("No employee found with this email. Have they completed their assessment?");

        } catch (error) {
            console.error(error);
            setMsg("Error finding employee.");
        } finally {
            setLoading(false);
        }
    };

    const [newSkill, setNewSkill] = useState("");
    const [newChallenge, setNewChallenge] = useState("");
    const [newTool, setNewTool] = useState("");

    const handleRemoveEmployee = (e: React.MouseEvent, empUid: string) => {
        e.preventDefault();
        e.stopPropagation();
        setEmployeeToDelete(empUid);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteEmployee = async () => {
        if (!employeeToDelete || !user) return;

        try {
            const db = getDatabase();
            await remove(ref(db, `supervisors/${user.uid}/employees/${employeeToDelete}`));

            // Trigger animation
            setDeletingEmployeeId(employeeToDelete);
            setIsDeleteModalOpen(false);

            // Wait for animation to finish before removing from state
            setTimeout(() => {
                setEmployees(prev => prev.filter(emp => emp.uid !== employeeToDelete));
                if (selectedEmployeeId === employeeToDelete) {
                    setSelectedEmployeeId(null);
                    setSelectedEmployeeData(null);
                }
                setDeletingEmployeeId(null);
                setEmployeeToDelete(null);
            }, 500); // 500ms match CSS transition

        } catch (e) {
            console.error("Error removing employee", e);
            alert("Failed to remove employee.");
            setIsDeleteModalOpen(false);
        }
    };

    // Quick add from browsing list
    const handleQuickAdd = async (emp: EmployeeSummary) => {
        if (!user) return;
        try {
            const db = getDatabase();
            await set(ref(db, `supervisors/${user.uid}/employees/${emp.uid}`), emp);
            setEmployees(prev => [...prev, emp]);
            setMsg(`Added ${emp.name}`);
        } catch (e) {
            console.error("Error adding employee", e);
        }
    };

    const handleAddItem = async (field: "skills_self" | "challenges" | "tools_interest", value: string, setter: (s: string) => void) => {
        if (!selectedEmployeeId || !value.trim()) return;

        try {
            const db = getDatabase();
            const currentList = selectedEmployeeData?.[field] || [];

            if (currentList.includes(value.trim())) {
                alert("Item already exists.");
                return;
            }

            const updatedList = [...currentList, value.trim()];

            // Update Firebase
            await set(ref(db, `employee_inputs/${selectedEmployeeId}/${field}`), updatedList);

            // Update Local State
            setSelectedEmployeeData(prev => prev ? ({ ...prev, [field]: updatedList }) : null);
            setter("");

        } catch (error) {
            console.error("Error adding item:", error);
            alert("Failed to add item.");
        }
    };

    const handleRemoveItem = async (e: React.MouseEvent, field: "skills_self" | "challenges" | "tools_interest", value: string) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (!selectedEmployeeId) return;

        // Removed confirm dialog to fix reported issue with deletion not working.
        // if (!confirm(`Remove "${value}"?`)) return;

        try {
            console.log(`Attempting to remove ${value} from ${field}`);
            const db = getDatabase();
            const currentList = selectedEmployeeData?.[field] || [];
            const updatedList = currentList.filter(item => item !== value);

            // Update Firebase
            await set(ref(db, `employee_inputs/${selectedEmployeeId}/${field}`), updatedList);

            // Update Local State
            setSelectedEmployeeData(prev => prev ? ({ ...prev, [field]: updatedList }) : null);

        } catch (error) {
            console.error("Error removing item:", error);
            alert("Failed to remove item.");
        }
    };

    const handleSaveNotes = async () => {
        if (!selectedEmployeeId || !user) return;
        setSavingNotes(true);
        try {
            const db = getDatabase();
            await set(ref(db, `admin_data/${selectedEmployeeId}`), {
                notes: adminNotes,
                assigned_supervisor: user.uid,
                updated_at: Date.now()
            });
            alert("Notes saved successfully");
        } catch (e) {
            console.error(e);
            alert("Failed to save notes");
        } finally {
            setSavingNotes(false);
        }
    };

    const handlePermDeleteEmployee = async () => {
        if (!employeeToPermDelete || !user) return;
        setLoading(true);

        try {
            const db = getDatabase();

            // 1. Remove from employee_inputs (The full profile)
            await remove(ref(db, `employee_inputs/${employeeToPermDelete}`));

            // 2. Remove from admin_data (The notes)
            await remove(ref(db, `admin_data/${employeeToPermDelete}`));

            // 3. Remove from local supervisor list IF they are in it
            await remove(ref(db, `supervisors/${user.uid}/employees/${employeeToPermDelete}`));

            // Update local state
            setEmployees(prev => prev.filter(emp => emp.uid !== employeeToPermDelete));
            setAllEmployees(prev => prev.filter(emp => emp.uid !== employeeToPermDelete));

            // Clear selection if it was the deleted user
            if (selectedEmployeeId === employeeToPermDelete) {
                setSelectedEmployeeId(null);
                setSelectedEmployeeData(null);
            }

            setIsPermDeleteModalOpen(false);
            setEmployeeToPermDelete(null);
            setMsg("Employee profile permanently deleted.");

        } catch (e) {
            console.error("Error permanently deleting employee", e);
            alert("Failed to delete employee profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 font-sans selection:bg-cyan-500/30">
            <nav className="glass border-b border-white/10 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-xl tracking-tight text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">PUNX Supervisor</span>
                    <span className="text-xs bg-cyan-900/30 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 uppercase tracking-wider font-bold">Admin</span>
                </div>

                <div className="flex items-center gap-4">
                    {user && <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>}
                    <button onClick={() => logout("/admin/login")} className="text-sm text-gray-400 hover:text-white font-medium transition-colors hover:bg-white/5 px-3 py-1.5 rounded-lg">
                        Log Out
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Manage Employees */}
                <div className="md:col-span-1 space-y-6">

                    {/* Add Employee Card */}
                    <div className="glass-card p-5 rounded-xl border border-white/10">
                        <h2 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,255,255,0.5)]"></span>
                            Add Employee
                        </h2>
                        <div className="space-y-3">
                            <input
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all placeholder-gray-600"
                                placeholder="Employee Email..."
                                value={emailInput}
                                onChange={e => setEmailInput(e.target.value)}
                            />
                            <button
                                onClick={handleAddEmployee}
                                disabled={loading}
                                className="w-full bg-cyan-400 text-black py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-300 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)] hover:shadow-[0_0_25px_rgba(0,255,255,0.4)]"
                            >
                                {loading ? "Searching..." : "Link Employee"}
                            </button>
                            {msg && <p className={`text-xs ${msg.includes("Success") || msg.includes("Added") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {isDeleteModalOpen && (
                        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn transition-opacity">
                            <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100 border border-white/20">
                                <div className="text-center mb-4">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                        <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Remove Employee?</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Are you sure you want to remove this employee from your team? This action cannot be undone.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="w-full px-4 py-2 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-colors border border-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteEmployee}
                                        className="w-full px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Available Employees Card */}
                    <div className="glass-card p-5 rounded-xl border border-white/10 max-h-60 overflow-y-auto custom-scrollbar">
                        <h2 className="font-semibold text-lg mb-2 text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></span>
                            Available Employees
                        </h2>
                        {allEmployees.filter(all => !employees.some(e => e.uid === all.uid)).length === 0 ? (
                            <p className="text-gray-500 text-xs italic">No new employees to add.</p>
                        ) : (
                            <ul className="space-y-1">
                                {allEmployees
                                    .filter(all => !employees.some(e => e.uid === all.uid))
                                    .map(emp => (
                                        <li key={emp.uid} className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg group transition-colors">
                                            <div className="truncate text-xs">
                                                <p className="font-medium text-gray-300 group-hover:text-white transition-colors">{emp.name}</p>
                                                <p className="text-gray-600 group-hover:text-gray-500 transition-colors">{emp.email}</p>
                                                {(emp.role || emp.team) && (
                                                    <p className="text-gray-600 text-[10px] mt-0.5">
                                                        {emp.role || "No Role"} • {emp.team || "No Team"}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleQuickAdd(emp)}
                                                className="text-cyan-400 hover:text-cyan-300 text-xs font-bold px-2 py-1 bg-cyan-900/30 rounded border border-cyan-500/30 opacity-0 group-hover:opacity-100 transition-all hover:shadow-[0_0_10px_rgba(0,255,255,0.2)]"
                                            >
                                                Add
                                            </button>
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>

                    {/* Employee List Card */}
                    <div className="glass-card p-5 rounded-xl border border-white/10">
                        <h2 className="font-semibold text-lg mb-4 text-white flex items-center gap-2">
                            <span className="w-1 h-5 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"></span>
                            Your Team ({employees.length})
                        </h2>
                        {employees.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No employees linked yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {employees.map(emp => (
                                    <li
                                        key={emp.uid}
                                        onClick={() => { setSelectedEmployeeId(emp.uid); setSelectedEmployeeData(null); }}
                                        className={`p-3 rounded-xl cursor-pointer text-sm flex justify-between items-center transition-all duration-300 ${selectedEmployeeId === emp.uid ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200 border shadow-[0_0_15px_rgba(0,255,255,0.1)]' : 'hover:bg-white/5 text-gray-300 border border-transparent'} ${deletingEmployeeId === emp.uid ? 'opacity-0 translate-x-10 bg-red-900/20' : 'opacity-100'}`}
                                    >
                                        <div className="truncate flex-1">
                                            <p className="font-medium">{emp.name}</p>
                                            <p className="text-xs opacity-60">{emp.email}</p>
                                            {(emp.role || emp.team) && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {emp.role || "No Role"} • {emp.team || "No Team"}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => handleRemoveEmployee(e, emp.uid)}
                                                className="text-gray-600 hover:text-red-400 p-1.5 rounded-full hover:bg-red-900/20 transition-colors"
                                                title="Remove from Team"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 opacity-50 transition-transform ${selectedEmployeeId === emp.uid ? 'translate-x-1 text-cyan-400' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right Column: Detail View */}
                <div className="md:col-span-2">
                    {selectedEmployeeId ? (
                        selectedEmployeeData ? (
                            <div className="glass-card rounded-xl border border-white/10 overflow-hidden min-h-[600px] flex flex-col">
                                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white mb-1">{selectedEmployeeData.name}</h2>
                                        <p className="text-gray-400 text-sm">{selectedEmployeeData.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="inline-block bg-white/5 border border-white/10 text-xs px-2 py-1 rounded text-gray-400 mb-1">
                                            Last Updated: {selectedEmployeeData.updated_at ? new Date(selectedEmployeeData.updated_at).toLocaleDateString() : 'N/A'}
                                        </span>
                                        <p className="text-cyan-400 font-medium text-sm drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">{selectedEmployeeData.role || "No Role"}</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-8 flex-1">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Team</p>
                                            <p className="font-semibold text-white tracking-wide">{selectedEmployeeData.team || "N/A"}</p>
                                        </div>
                                    </div>

                                    {/* Skills & Challenges */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                                                Skills to Improve
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(selectedEmployeeData.skills_self || []).map(s => (
                                                    <div key={s} className="flex items-center bg-green-900/20 border border-green-500/20 rounded-lg px-3 py-1.5 transition-all hover:bg-green-900/30">
                                                        <span className="text-green-300 text-xs font-medium mr-2">{s}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRemoveItem(e, "skills_self", s)}
                                                            className="text-green-600 hover:text-red-400 focus:outline-none transition-colors"
                                                            title="Remove skill"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!selectedEmployeeData.skills_self || selectedEmployeeData.skills_self.length === 0) && <p className="text-gray-600 text-sm italic">None selected</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-green-500/50 outline-none transition-all placeholder-gray-600"
                                                    placeholder="Add skill..."
                                                    value={newSkill}
                                                    onChange={e => setNewSkill(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddItem("skills_self", newSkill, setNewSkill)}
                                                />
                                                <button
                                                    onClick={() => handleAddItem("skills_self", newSkill, setNewSkill)}
                                                    className="bg-green-600/20 border border-green-500/30 text-green-400 px-3 py-1 rounded-lg text-xs hover:bg-green-600/40 transition-all font-bold"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span>
                                                Current Challenges
                                            </h3>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {(selectedEmployeeData.challenges || []).map(c => (
                                                    <div key={c} className="flex items-center bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-1.5 transition-all hover:bg-red-900/30">
                                                        <span className="text-red-300 text-xs font-medium mr-2">{c}</span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleRemoveItem(e, "challenges", c)}
                                                            className="text-red-600 hover:text-red-400 focus:outline-none transition-colors"
                                                            title="Remove challenge"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!selectedEmployeeData.challenges || selectedEmployeeData.challenges.length === 0) && <p className="text-gray-600 text-sm italic">None selected</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-red-500/50 outline-none transition-all placeholder-gray-600"
                                                    placeholder="Add challenge..."
                                                    value={newChallenge}
                                                    onChange={e => setNewChallenge(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddItem("challenges", newChallenge, setNewChallenge)}
                                                />
                                                <button
                                                    onClick={() => handleAddItem("challenges", newChallenge, setNewChallenge)}
                                                    className="bg-red-600/20 border border-red-500/30 text-red-400 px-3 py-1 rounded-lg text-xs hover:bg-red-600/40 transition-all font-bold"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tools */}
                                    <div>
                                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
                                            Tools of Interest
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {(selectedEmployeeData.tools_interest || []).map(t => (
                                                <div key={t} className="flex items-center bg-blue-900/20 border border-blue-500/20 rounded-lg px-3 py-1.5 transition-all hover:bg-blue-900/30">
                                                    <span className="text-blue-300 text-xs font-medium mr-2">{t}</span>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleRemoveItem(e, "tools_interest", t)}
                                                        className="text-blue-500 hover:text-red-400 focus:outline-none transition-colors"
                                                        title="Remove tool"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                            {(!selectedEmployeeData.tools_interest || selectedEmployeeData.tools_interest.length === 0) && <p className="text-gray-600 text-sm italic">None selected</p>}
                                        </div>
                                        <div className="flex gap-2 max-w-sm">
                                            <input
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-600"
                                                placeholder="Add tool..."
                                                value={newTool}
                                                onChange={e => setNewTool(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddItem("tools_interest", newTool, setNewTool)}
                                            />
                                            <button
                                                onClick={() => handleAddItem("tools_interest", newTool, setNewTool)}
                                                className="bg-blue-600/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-lg text-xs hover:bg-blue-600/40 transition-all font-bold"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>

                                    {/* User Notes */}
                                    <div>
                                        <h3 className="font-semibold text-white mb-2">Employee Notes</h3>
                                        <div className="bg-black/20 p-4 rounded-xl text-sm text-gray-300 italic border border-white/5 whitespace-pre-wrap">
                                            {selectedEmployeeData.additional_notes || <span className="text-gray-600">No notes provided.</span>}
                                        </div>
                                    </div>

                                    <hr className="border-white/10" />

                                    {/* Admin Private Notes */}
                                    <div className="bg-yellow-900/10 p-5 rounded-xl border border-yellow-500/10">
                                        <h3 className="font-semibold text-yellow-200 mb-2 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Supervisor Notes (Private)
                                        </h3>
                                        <p className="text-xs text-gray-400 mb-3">Only you can see this. Use this area to track growth, assigned tasks, or feedback.</p>
                                        <textarea
                                            className="w-full bg-black/40 border border-yellow-500/20 rounded-xl p-3 text-sm text-white focus:ring-1 focus:ring-yellow-500/50 outline-none placeholder-gray-600"
                                            rows={5}
                                            placeholder="Add private notes, areas for improvement, or recommended actions..."
                                            value={adminNotes}
                                            onChange={e => setAdminNotes(e.target.value)}
                                        />
                                        <div className="mt-3 text-right">
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={savingNotes}
                                                className="bg-yellow-600/20 border border-yellow-500/30 text-yellow-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-yellow-600/30 transition-all disabled:opacity-50"
                                            >
                                                {savingNotes ? "Saving..." : "Save Notes"}
                                            </button>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-yellow-500/10">
                                            <h4 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Danger Zone
                                            </h4>
                                            <p className="text-sm text-gray-500 mb-4">Permanently delete this employee's profile and all associated data. This cannot be undone.</p>
                                            <button
                                                onClick={() => {
                                                    setEmployeeToPermDelete(selectedEmployeeId);
                                                    setIsPermDeleteModalOpen(true);
                                                }}
                                                className="border border-red-500/30 bg-red-900/10 text-red-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-900/20 transition-colors shadow-[0_0_10px_rgba(248,113,113,0.1)] hover:shadow-[0_0_15px_rgba(248,113,113,0.2)]"
                                            >
                                                Delete Employee Profile
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-10 min-h-[400px]">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                                    <p className="text-gray-400">Loading employee profile...</p>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="h-full flex items-center justify-center bg-white/5 rounded-xl border border-white/10 p-10 min-h-[400px] text-center">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <h3 className="text-lg font-medium text-white">Select an Employee</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Click on an employee from the list on the left to view their profile and manage notes.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Permanent Delete Confirmation Modal */}
                {isPermDeleteModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[60] animate-fadeIn transition-opacity">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 transform transition-all scale-100 border border-red-100">
                            <div className="text-center mb-4">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4 animate-pulse">
                                    <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Permanent Delete</h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    You are about to <span className="font-bold text-red-600">PERMANENTLY DELETE</span> this employee's entire profile, assessment data, and history.
                                </p>
                                <p className="text-xs text-gray-500 mt-2 font-medium">
                                    This action is irreversible.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 px-2">
                                <button
                                    onClick={() => setIsPermDeleteModalOpen(false)}
                                    className="w-full px-4 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl font-medium transition-colors border border-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePermDeleteEmployee}
                                    className="w-full px-4 py-3 bg-red-600/90 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
}
