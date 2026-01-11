"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDatabase, ref, set, get, child } from "firebase/database";
import { useRouter } from "next/navigation";

export default function AssessmentForm() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [step, setStep] = useState(1);
    const [customTools, setCustomTools] = useState<string[]>([]);
    const [customChallenges, setCustomChallenges] = useState<string[]>([]);
    const [customSkills, setCustomSkills] = useState<string[]>([]);
    const [randomTools, setRandomTools] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        role: "",
        team: "",
        skills_self: [] as string[],
        challenges: [] as string[],
        tools_interest: [] as string[],
        additional_notes: "",
    });

    const skillsOptions = [
        "AI Prompting",
        "Project Management",
        "Client Communication",
        "Time Management",
        "Leadership",
        "Creative Thinking",
    ];

    const teamRoleMap: Record<string, string[]> = {
        "Activations and Events": [
            "Activations Manager",
            "Head of Activations",
            "HCP & DS",
            "Production Associate"
        ],
        "Content": [
            "Activations Manager"
        ],
        "Digital Solution": [
            "Web Developer",
            "SEO Specialist",
            "Game Developer"
        ],
        "Design & Creatives": [
            "Production Lead",
            "3D Animator",
            "AI Artist",
            "Lead AI Artist"
        ],
        "Shared Services Team": [
            "Sales",
            "Head of HR",
            "HR Generalist",
            "Accountant"
        ]
    };

    const challengesOptions = [
        "Too many tasks",
        "Tight deadlines",
        "Unclear requirements",
        "Tool knowledge gap",
        "Stress / burnout",
        "Client pressure",
        "Lack of focus",
    ];

    const teamToolsMap: Record<string, string[]> = {
        "Activations and Events": [
            "MidJourney / DALL·E 3",
            "Runway Gen-2/3",
            "Gamma",
            "SketchUp / Blender"
        ],
        "Content": [
            "ChatGPT / Claude",
            "ElevenLabs",
            "CapCut / Premiere AI",
            "Ideogram"
        ],
        "Digital Solution": [
            "GitHub Copilot",
            "Cursor",
            "v0.dev",
            "Figma AI"
        ],
        "Design & Creatives": [
            "MidJourney v6",
            "Krea.ai",
            "Magnific.ai",
            "ComfyUI"
        ],
        "Shared Services Team": [
            "ChatGPT",
            "Notion AI",
            "Canva Magic Studio",
            "Excel AI / Formula Bot"
        ]
    };

    const allToolsOptions = [
        "Whisk", "Freepik", "Seedream", "Midjourney", "Nanobanana",
        "Ideogram", "Adobe Firefly", "DZine", "Akool",
        "Kling", "Google VEO", "Wan", "Dreamina", "OpenAI Sora",
        "Lumalabs", "Higgsfield", "RunwayML", "HeyGen",
        "ElevenLabs", "Suno.AI",
        "Lupa AI", "Topaz", "Colourlab AI"
    ];

    useEffect(() => {
        const shuffled = [...allToolsOptions].sort(() => 0.5 - Math.random());
        setRandomTools(shuffled.slice(0, 6));
    }, []);

    const teamRelatedTools = (formData.team && teamToolsMap[formData.team]) ? teamToolsMap[formData.team] : [];

    // Combine: Random tools + Team tools + Any currently selected tools (to ensure persistence) + Custom tools
    // Note: customTools state might overlap with saved tools, but let's just make a comprehensive set.
    const displayedTools = Array.from(new Set([
        ...randomTools,
        ...teamRelatedTools,
        ...formData.tools_interest,
        ...customTools
    ]));

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const dbRef = ref(getDatabase());
                    const snapshot = await get(child(dbRef, `employee_inputs/${user.uid}`));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        // Ensure we use saved name, or fall back to auth name if missing in DB
                        // But strictly speaking, if snapshot exists, we take what's there.
                        // If 'name' is missing in legacy data, we default to user.displayName.
                        const savedName = data.name || user.displayName || "";

                        const savedTools = data.tools_interest || [];
                        const savedChallenges = data.challenges || [];
                        const savedSkills = data.skills_self || [];

                        setFormData({
                            ...data,
                            name: savedName,
                            skills_self: savedSkills,
                            challenges: savedChallenges,
                            tools_interest: savedTools,
                        });

                        // For tools: since options are dynamic, anything NOT in the current team's map *could* be custom.
                        // However, strictly speaking, custom tools are user-entered. 
                        // We will recalculate 'customTools' based on what is NOT in the specific team map selected at runtime?
                        // Or better, just treat saved ones that aren't in the map as custom.
                        // But wait, if they change teams, the map changes. 
                        // Simplification for now: Just load them. We'll derive customTools in render or state.
                        // Actually, let's keep the state approach for simplicity of adding new ones.

                        // We need to know the team to filter "default" tools effectively.
                        const team = data.team;
                        const defaults = (team && teamToolsMap[team]) ? new Set(teamToolsMap[team]) : new Set();

                        if (defaults.size > 0) {
                            const customT = savedTools.filter((t: string) => !defaults.has(t));
                            setCustomTools(customT);
                        } else {
                            // If no team yet, or unknown, maybe everything is custom? Or we just wait.
                            setCustomTools(savedTools);
                        }

                        // Identify custom challenges
                        const challengeDefaults = new Set(challengesOptions);
                        const customC = savedChallenges.filter((c: string) => !challengeDefaults.has(c));
                        setCustomChallenges(customC);

                        // Identify custom skills
                        const skillDefaults = new Set(skillsOptions);
                        const customS = savedSkills.filter((s: string) => !skillDefaults.has(s));
                        setCustomSkills(customS);
                    }
                } catch (error) {
                    console.error("Error fetching data:", error);
                } finally {
                    setFetching(false);
                }
            };
            fetchData();
        } else {
            setFetching(false);
        }
    }, [user]);

    // Pre-fill name from auth if not loaded from DB yet/empty
    useEffect(() => {
        if (user && !formData.name) {
            setFormData(prev => ({ ...prev, name: user.displayName || "" }));
        }
    }, [user]);

    // Re-evaluate custom tools when team changes to ensure correct categorization
    useEffect(() => {
        if (formData.team && teamToolsMap[formData.team]) {
            const defaults = new Set(teamToolsMap[formData.team]);
            const allSelected = formData.tools_interest;
            // Any selected tool that isn't in the new team's default list is effectively "custom" 
            // or just a leftover selection. We'll add it to customTools so it doesn't disappear from view.
            const newCustoms = allSelected.filter(t => !defaults.has(t));

            // Merge with user-added custom tools (filtering duplicates)
            setCustomTools(prev => Array.from(new Set([...prev, ...newCustoms])));
        }
    }, [formData.team]);

    const handleMultiSelect = (field: "skills_self" | "challenges" | "tools_interest", value: string, max?: number) => {
        setFormData((prev) => {
            const current = prev[field];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter((item) => item !== value) };
            }
            if (max && current.length >= max) return prev;
            return { ...prev, [field]: [...current, value] };
        });
    };

    const handleAddCustomTool = (val: string) => {
        const value = val.trim();
        if (!value) return;

        // If it's visible effectively, just toggle selection
        if (displayedTools.includes(value)) {
            if (!formData.tools_interest.includes(value)) {
                handleMultiSelect("tools_interest", value);
            }
            return;
        }

        if (!customTools.includes(value)) {
            setCustomTools(prev => [...prev, value]);
        }
        if (!formData.tools_interest.includes(value)) {
            handleMultiSelect("tools_interest", value);
        }
    };

    const handleDeleteCustomTool = (e: React.MouseEvent, tool: string) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomTools(prev => prev.filter(t => t !== tool));
        if (formData.tools_interest.includes(tool)) {
            handleMultiSelect("tools_interest", tool);
        }
    };

    const handleAddCustomChallenge = (val: string) => {
        const value = val.trim();
        if (!value) return;
        if (!challengesOptions.includes(value) && !customChallenges.includes(value)) {
            setCustomChallenges(prev => [...prev, value]);
        }
        if (!formData.challenges.includes(value)) {
            handleMultiSelect("challenges", value, 5);
        }
    };

    const handleDeleteCustomChallenge = (e: React.MouseEvent, item: string) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomChallenges(prev => prev.filter(c => c !== item));
        if (formData.challenges.includes(item)) {
            handleMultiSelect("challenges", item);
        }
    };

    const handleAddCustomSkill = (val: string) => {
        const value = val.trim();
        if (!value) return;
        if (!skillsOptions.includes(value) && !customSkills.includes(value)) {
            setCustomSkills(prev => [...prev, value]);
        }
        if (!formData.skills_self.includes(value)) {
            handleMultiSelect("skills_self", value, 5);
        }
    };

    const handleDeleteCustomSkill = (e: React.MouseEvent, item: string) => {
        e.preventDefault();
        e.stopPropagation();
        setCustomSkills(prev => prev.filter(s => s !== item));
        if (formData.skills_self.includes(item)) {
            handleMultiSelect("skills_self", item);
        }
    };

    const handleChange = (field: string, value: string) => {
        if (field === "team") {
            setFormData((prev) => ({ ...prev, team: value, role: "" })); // Reset role when team changes
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const db = getDatabase();
            await set(ref(db, "employee_inputs/" + user.uid), {
                ...formData,
                email: user.email,
                // Do not overwrite name with user.displayName; use formData.name
                name: formData.name || user.displayName,
                updated_at: Date.now(),
            });
            router.push("/success");
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="text-center p-10">Loading profile...</div>;

    return (
        <div className="max-w-3xl mx-auto p-8 gradient-border shadow-2xl relative z-10">
            <h2 className="text-2xl font-bold mb-8 text-white flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400 text-sm font-bold border border-cyan-500/20">{step}</span>
                PUNX Learning Profile <span className="text-gray-500 font-normal text-lg">/ {step === 5 ? "Review" : `Step ${step} of 5`}</span>
            </h2>

            {step === 1 && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-xl font-semibold text-white mb-4">Basic Info</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                        <input
                            type="text"
                            className="mt-1 block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Team</label>
                        <select
                            className="mt-1 block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none appearance-none"
                            value={formData.team}
                            onChange={(e) => handleChange("team", e.target.value)}
                        >
                            <option value="" className="bg-[#121212] text-gray-400">Select Team</option>
                            {Object.keys(teamRoleMap).map((t) => (
                                <option key={t} value={t} className="bg-[#121212]">{t}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                        <select
                            className="mt-1 block w-full bg-white/5 border border-white/10 rounded-lg shadow-sm p-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                            disabled={!formData.team}
                        >
                            <option value="" className="bg-[#121212] text-gray-400">{formData.team ? "Select Role" : "Select Team first"}</option>
                            {formData.team && teamRoleMap[formData.team]?.map((r) => (
                                <option key={r} value={r} className="bg-[#121212]">{r}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-8 animate-fadeIn">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Skills to improve <span className="text-sm font-normal text-cyan-400 ml-2">(Max 5)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[...skillsOptions, ...customSkills].map((opt) => (
                                <label key={opt} className={`group flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${formData.skills_self.includes(opt)
                                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.15)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                    }`}>
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.skills_self.includes(opt) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500 group-hover:border-gray-400'
                                            }`}>
                                            {formData.skills_self.includes(opt) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={`text-sm ${formData.skills_self.includes(opt) ? 'text-white font-medium' : 'text-gray-300'}`}>{opt}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.skills_self.includes(opt)}
                                        onChange={() => handleMultiSelect("skills_self", opt, 5)}
                                        className="hidden"
                                    />
                                    {customSkills.includes(opt) && (
                                        <button
                                            onClick={(e) => handleDeleteCustomSkill(e, opt)}
                                            className="ml-2 text-gray-500 hover:text-red-400 p-1"
                                            title="Delete custom item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </label>
                            ))}
                        </div>
                        <input
                            placeholder="Add other skill (Type & Enter)..."
                            className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm hover:bg-white/10 transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomSkill(e.currentTarget.value);
                                    e.currentTarget.value = "";
                                }
                            }}
                            onBlur={(e) => {
                                e.target.value && handleAddCustomSkill(e.target.value);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4 mt-8">Current Challenges <span className="text-sm font-normal text-cyan-400 ml-2">(Max 5)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[...challengesOptions, ...customChallenges].map((opt) => (
                                <label key={opt} className={`group flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${formData.challenges.includes(opt)
                                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.15)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                    }`}>
                                    <div className="flex items-center">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.challenges.includes(opt) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500 group-hover:border-gray-400'
                                            }`}>
                                            {formData.challenges.includes(opt) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={`text-sm ${formData.challenges.includes(opt) ? 'text-white font-medium' : 'text-gray-300'}`}>{opt}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.challenges.includes(opt)}
                                        onChange={() => handleMultiSelect("challenges", opt, 5)}
                                        className="hidden"
                                    />
                                    {customChallenges.includes(opt) && (
                                        <button
                                            onClick={(e) => handleDeleteCustomChallenge(e, opt)}
                                            className="ml-2 text-gray-500 hover:text-red-400 p-1"
                                            title="Delete custom item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </label>
                            ))}
                        </div>
                        <input
                            placeholder="Add other challenge (Type & Enter)..."
                            className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm hover:bg-white/10 transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomChallenge(e.currentTarget.value);
                                    e.currentTarget.value = "";
                                }
                            }}
                            onBlur={(e) => {
                                handleAddCustomChallenge(e.target.value);
                                e.target.value = "";
                            }}
                        />
                    </div>
                </div>
            )}
            {
                step === 3 && (
                    <div className="space-y-6 animate-fadeIn">
                        <h3 className="text-xl font-semibold text-white">Tools to Learn</h3>
                        <p className="text-gray-400 text-sm italic mb-4">Showing random discovery tools + team recommendations. Refreshes on reload.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {displayedTools.map((opt) => (
                                <label key={opt} className={`group flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${formData.tools_interest.includes(opt)
                                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(0,255,255,0.1)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                                    }`}>
                                    <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${formData.tools_interest.includes(opt) ? 'bg-cyan-500 border-cyan-500' : 'border-gray-500 group-hover:border-gray-400'
                                            }`}>
                                            {formData.tools_interest.includes(opt) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <span className={`text-sm ${formData.tools_interest.includes(opt) ? 'text-white font-medium' : 'text-gray-300'} break-all`}>{opt}</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={formData.tools_interest.includes(opt)}
                                        onChange={() => handleMultiSelect("tools_interest", opt)}
                                        className="hidden"
                                    />
                                    {customTools.includes(opt) && !allToolsOptions.includes(opt) && !teamRelatedTools.includes(opt) && (
                                        <button
                                            onClick={(e) => handleDeleteCustomTool(e, opt)}
                                            className="ml-2 text-gray-500 hover:text-red-400 p-1"
                                            title="Delete custom item"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </label>
                            ))}
                        </div>
                        <input
                            placeholder="Add other tool (Type & Enter)..."
                            className="mt-3 w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm hover:bg-white/10 transition-colors"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCustomTool(e.currentTarget.value);
                                    e.currentTarget.value = "";
                                }
                            }}
                            onBlur={(e) => {
                                handleAddCustomTool(e.target.value);
                                e.target.value = "";
                            }}
                        />
                    </div>
                )
            }

            {
                step === 4 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div>
                            <h3 className="text-xl font-semibold text-white">Final Thoughts</h3>
                            <p className="text-sm text-gray-400 mb-4">Any specific requests, learning goals, or notes?</p>
                            <textarea
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-cyan-500 outline-none h-40 resize-none"
                                placeholder="Type your notes here..."
                                value={formData.additional_notes}
                                onChange={(e) => handleChange("additional_notes", e.target.value)}
                                maxLength={500}
                            />
                        </div>
                    </div>
                )
            }

            {
                step === 5 && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-white text-lg">Basic Info</h3>
                                <button onClick={() => setStep(1)} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">Edit</button>
                            </div>
                            <p className="text-gray-300 text-sm mb-1"><span className="font-semibold text-gray-500 w-20 inline-block">Role:</span> {formData.role || "Not selected"}</p>
                            <p className="text-gray-300 text-sm"><span className="font-semibold text-gray-500 w-20 inline-block">Team:</span> {formData.team || "Not selected"}</p>
                        </div>

                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-white text-lg">Skills & Challenges</h3>
                                <button onClick={() => setStep(2)} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">Edit</button>
                            </div>
                            <div className="mb-3">
                                <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Skills</span>
                                <div className="flex flex-wrap gap-2">
                                    {formData.skills_self.length > 0 ? formData.skills_self.map(s => (
                                        <span key={s} className="bg-cyan-900/40 border border-cyan-500/30 text-cyan-200 text-xs px-2 py-1 rounded-md">{s}</span>
                                    )) : <span className="text-gray-500 italic text-sm">None</span>}
                                </div>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase font-bold tracking-wider mb-2">Challenges</span>
                                <div className="flex flex-wrap gap-2">
                                    {formData.challenges.length > 0 ? formData.challenges.map(c => (
                                        <span key={c} className="bg-red-900/20 border border-red-500/20 text-red-200 text-xs px-2 py-1 rounded-md">{c}</span>
                                    )) : <span className="text-gray-500 italic text-sm">None</span>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-white text-lg">Tools</h3>
                                <button onClick={() => setStep(3)} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">Edit</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tools_interest.length > 0 ? formData.tools_interest.map(t => (
                                    <span key={t} className="bg-gray-800 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded-md">{t}</span>
                                )) : <span className="text-gray-500 italic text-sm">None selected</span>}
                            </div>
                        </div>

                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-white text-lg">Notes</h3>
                                <button onClick={() => setStep(4)} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">Edit</button>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{formData.additional_notes || <span className="italic text-gray-600">No additional notes provided.</span>}</p>
                        </div>
                    </div>
                )
            }

            <div className="mt-8 flex justify-between pt-6 border-t border-white/10">
                {step > 1 ? (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="px-6 py-3 border border-white/10 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-medium"
                    >
                        Back
                    </button>
                ) : <div></div>}

                {step < 5 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-8 py-3 bg-cyan-400 text-black rounded-xl hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all text-sm font-bold"
                    >
                        Next Step
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-cyan-400 text-black rounded-xl hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Complete Profile"}
                    </button>
                )}
            </div>
        </div>
    );
}
