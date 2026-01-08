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

    const [formData, setFormData] = useState({
        role: "",
        team: "",
        cadence: "weekly",
        skills_self: [] as string[],
        challenges: [] as string[],
        tools_interest: [] as string[],
        motivational_style: "",
        learning_style: "",
        additional_notes: "",
    });

    const skillsOptions = [
        "AI Prompting",
        "Project Management",
        "Client Communication",
        "Time Management",
        "Leadership",
        "Creative Thinking",
        "Technical Skills",
        "Presentation / Deck Building",
    ];

    const challengesOptions = [
        "Too many tasks",
        "Tight deadlines",
        "Unclear requirements",
        "Tool knowledge gap",
        "Stress / burnout",
        "Client pressure",
        "Lack of focus",
    ];

    const toolsOptions = [
        "ChatGPT",
        "MidJourney",
        "Runway",
        "Pika",
        "Veo",
        "Krea",
        "Project management tools",
        "Internal tools",
    ];

    const motivationalOptions = [
        "Inspirational",
        "Tactical / How-to",
        "Founder mindset",
        "Productivity hacks",
        "Direct & blunt",
    ];

    const learningOptions = [
        "Bullet summaries",
        "Step-by-step",
        "Examples & use cases",
        "Analogies",
        "Mixed",
    ];

    useEffect(() => {
        if (user) {
            const fetchData = async () => {
                try {
                    const dbRef = ref(getDatabase());
                    const snapshot = await get(child(dbRef, `employee_inputs/${user.uid}`));
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        const savedTools = data.tools_interest || [];
                        const savedChallenges = data.challenges || [];
                        setFormData({
                            ...data,
                            skills_self: data.skills_self || [],
                            challenges: savedChallenges,
                            tools_interest: savedTools,
                        });

                        // Identify custom tools
                        const toolDefaults = new Set(toolsOptions);
                        const customT = savedTools.filter((t: string) => !toolDefaults.has(t));
                        setCustomTools(customT);

                        // Identify custom challenges
                        const challengeDefaults = new Set(challengesOptions);
                        const customC = savedChallenges.filter((c: string) => !challengeDefaults.has(c));
                        setCustomChallenges(customC);
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
        if (!toolsOptions.includes(value) && !customTools.includes(value)) {
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

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const db = getDatabase();
            await set(ref(db, "employee_inputs/" + user.uid), {
                ...formData,
                email: user.email,
                name: user.displayName,
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
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                PUNX Learning Profile / {step === 5 ? "Review" : `Step ${step} of 5`}
            </h2>

            {step === 1 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-700">Basic Info</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" disabled value={user?.displayName || ""} className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                            value={formData.role}
                            onChange={(e) => handleChange("role", e.target.value)}
                        >
                            <option value="">Select Role</option>
                            <option value="Account Manager">Account Manager</option>
                            <option value="Creative / Designer">Creative / Designer</option>
                            <option value="Video / Studio">Video / Studio</option>
                            <option value="Events / Activations">Events / Activations</option>
                            <option value="Developer">Developer</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Team</label>
                        <select
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-white"
                            value={formData.team}
                            onChange={(e) => handleChange("team", e.target.value)}
                        >
                            <option value="">Select Team</option>
                            <option value="Accounts">Accounts</option>
                            <option value="Creative">Creative</option>
                            <option value="Production">Production</option>
                            <option value="Strategy">Strategy</option>
                            <option value="Tech">Tech</option>
                            <option value="Operations">Operations</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Learning Cadence</label>
                        <div className="mt-2 space-y-2">
                            {["Weekly", "Bi-weekly"].map((opt) => (
                                <label key={opt} className="items-center flex">
                                    <input
                                        type="radio"
                                        name="cadence"
                                        value={opt.toLowerCase()}
                                        checked={formData.cadence === opt.toLowerCase()}
                                        onChange={(e) => handleChange("cadence", e.target.value)}
                                        className="h-4 w-4 text-indigo-600 border-gray-300"
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">Top 3 Skills to Improve</h3>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {skillsOptions.map((opt) => (
                                <label key={opt} className={`flex items-center p-3 border rounded-md cursor-pointer ${formData.skills_self.includes(opt) ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={formData.skills_self.includes(opt)}
                                        onChange={() => handleMultiSelect("skills_self", opt, 3)}
                                        className="h-4 w-4 text-indigo-600 rounded"
                                    />
                                    <span className="ml-3 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                        <input
                            placeholder="Other (type here)..."
                            className="mt-2 w-full p-2 border rounded-md"
                            onBlur={(e) => e.target.value && handleMultiSelect("skills_self", e.target.value, 3)}
                        />
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mt-6">Current Challenges (Max 5)</h3>
                        <div className="mt-4 grid grid-cols-1 gap-2">
                            {[...challengesOptions, ...customChallenges].map((opt) => (
                                <label key={opt} className={`flex items-center justify-between p-3 border rounded-md cursor-pointer ${formData.challenges.includes(opt) ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formData.challenges.includes(opt)}
                                            onChange={() => handleMultiSelect("challenges", opt, 5)}
                                            className="h-4 w-4 text-indigo-600 rounded"
                                        />
                                        <span className="ml-3 text-gray-700">{opt}</span>
                                    </div>
                                    {customChallenges.includes(opt) && (
                                        <button
                                            onClick={(e) => handleDeleteCustomChallenge(e, opt)}
                                            className="ml-2 text-gray-400 hover:text-red-500 p-1"
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
                            placeholder="Other (type here and press Enter)..."
                            className="mt-2 w-full p-2 border rounded-md"
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

            {step === 3 && (
                <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-700">Tools to Learn</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[...toolsOptions, ...customTools].map((opt) => (
                            <label key={opt} className={`flex items-center justify-between p-3 border rounded-md cursor-pointer ${formData.tools_interest.includes(opt) ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.tools_interest.includes(opt)}
                                        onChange={() => handleMultiSelect("tools_interest", opt)}
                                        className="h-4 w-4 text-indigo-600 rounded"
                                    />
                                    <span className="ml-3 text-gray-700 break-all">{opt}</span>
                                </div>
                                {customTools.includes(opt) && (
                                    <button
                                        onClick={(e) => handleDeleteCustomTool(e, opt)}
                                        className="ml-2 text-gray-400 hover:text-red-500 p-1"
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
                        placeholder="Other (type here and press Enter)..."
                        className="mt-2 w-full p-2 border rounded-md"
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
            )}

            {step === 4 && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-700">Motivation Style</h3>
                        <div className="mt-2 space-y-2">
                            {motivationalOptions.map((opt) => (
                                <label key={opt} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="motivation"
                                        value={opt}
                                        checked={formData.motivational_style === opt}
                                        onChange={(e) => handleChange("motivational_style", e.target.value)}
                                        className="h-4 w-4 text-indigo-600"
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mt-6">Learning Style</h3>
                        <div className="mt-2 space-y-2">
                            {learningOptions.map((opt) => (
                                <label key={opt} className="flex items-center">
                                    <input
                                        type="radio"
                                        name="learning"
                                        value={opt}
                                        checked={formData.learning_style === opt}
                                        onChange={(e) => handleChange("learning_style", e.target.value)}
                                        className="h-4 w-4 text-indigo-600"
                                    />
                                    <span className="ml-2 text-gray-700">{opt}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold text-gray-700 mt-6">Optional Notes</h3>
                        <textarea
                            className="w-full mt-2 p-3 border border-gray-300 rounded-md shadow-sm h-24"
                            placeholder="Anything specific you want to focus on..."
                            value={formData.additional_notes}
                            onChange={(e) => handleChange("additional_notes", e.target.value)}
                            maxLength={300}
                        />
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Basic Info</h3>
                            <button onClick={() => setStep(1)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                        </div>
                        <p className="text-gray-700 text-sm"><span className="font-medium">Role:</span> {formData.role || "Not selected"}</p>
                        <p className="text-gray-700 text-sm"><span className="font-medium">Team:</span> {formData.team || "Not selected"}</p>
                        <p className="text-gray-700 text-sm"><span className="font-medium">Cadence:</span> {formData.cadence}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Skills & Challenges</h3>
                            <button onClick={() => setStep(2)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                        </div>
                        <p className="text-gray-700 text-sm mb-1"><span className="font-medium">Skills:</span> {formData.skills_self.join(", ") || "None"}</p>
                        <p className="text-gray-700 text-sm"><span className="font-medium">Challenges:</span> {formData.challenges.join(", ") || "None"}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Tools</h3>
                            <button onClick={() => setStep(3)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                        </div>
                        <p className="text-gray-700 text-sm">{formData.tools_interest.join(", ") || "None"}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-gray-800">Preferences</h3>
                            <button onClick={() => setStep(4)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Edit</button>
                        </div>
                        <p className="text-gray-700 text-sm mb-1"><span className="font-medium">Motivation:</span> {formData.motivational_style || "Not selected"}</p>
                        <p className="text-gray-700 text-sm mb-1"><span className="font-medium">Learning Style:</span> {formData.learning_style || "Not selected"}</p>
                        <p className="text-gray-700 text-sm"><span className="font-medium">Notes:</span> {formData.additional_notes || "None"}</p>
                    </div>
                </div>
            )}

            <div className="mt-8 flex justify-between">
                {step > 1 ? (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Back
                    </button>
                ) : <div></div>}

                {step < 5 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
                    >
                        {step === 4 ? "Review" : "Next"}
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {loading ? "Confirm & Submit" : "Confirm & Submit"}
                    </button>
                )}
            </div>
        </div>
    );
}
