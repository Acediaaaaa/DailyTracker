"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Task {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export default function DailyTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("ERR_FETCH_FAILED:", error);
    else setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel("db_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const { error } = await supabase.from("tasks").insert([{ title: newTask }]);
    if (!error) setNewTask("");
  };

  const toggleTask = async (id: string, is_completed: boolean) => {
    await supabase.from("tasks").update({ is_completed: !is_completed }).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  return (
    <main className="min-h-screen p-4 md:p-12 flex flex-col items-center">
      {/* Header Info - Responsive flex direction */}
      <div className="w-full max-w-2xl mb-6 md:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-cyan-900/50 pb-4 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white uppercase italic">
            Task_Terminal<span className="text-cyan-500 animate-pulse">_</span>
          </h1>
          <p className="text-[10px] md:text-xs text-cyan-700 font-mono tracking-widest uppercase">System Status: Operational</p>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="text-[9px] md:text-[10px] text-slate-500 font-mono">ENCRYPTED_SESSION_v2.4</p>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-mono uppercase">Node: Cebu_Sector_07</p>
        </div>
      </div>

      {/* Main Terminal Container */}
      <div className="w-full max-w-2xl glass-panel rounded-lg p-0.5 md:p-1">
        <div className="bg-black/40 p-4 md:p-8 rounded-md">
          {/* Input Area - Optimized for mobile tapping */}
          <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3 mb-8 md:mb-12">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="INITIALIZE DATA_ENTRY..."
              className="tech-input flex-1 text-sm md:text-base"
            />
            <button type="submit" className="tech-button w-full sm:w-auto py-3 sm:py-2">
              Execute
            </button>
          </form>

          {/* Task List */}
          {loading ? (
            <div className="text-center py-10 text-cyan-900 animate-pulse font-mono text-xs">
              [ SCANNING DATABASE... ]
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-3 md:p-4 transition-all border-l-2 ${
                    task.is_completed 
                      ? "border-slate-800 bg-slate-900/20" 
                      : "border-cyan-500 bg-cyan-500/5"
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                    <button
                      onClick={() => toggleTask(task.id, task.is_completed)}
                      className={`min-w-[20px] h-5 w-5 border transition-all flex items-center justify-center ${
                        task.is_completed 
                          ? "border-slate-700 bg-slate-800" 
                          : "border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      }`}
                    >
                      {task.is_completed && <div className="w-2 h-2 bg-cyan-500" />}
                    </button>
                    <span className={`font-mono text-xs md:text-sm tracking-tight truncate transition-all ${
                      task.is_completed ? "text-slate-600 line-through" : "text-slate-200"
                    }`}>
                      {task.title}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-600 hover:text-red-500 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all text-[10px] font-mono ml-2 shrink-0"
                  >
                    [X]
                  </button>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded">
                  <p className="text-slate-600 text-[10px] font-mono uppercase">Zero records found.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Responsive Footer */}
      <footer className="mt-auto pt-8 pb-4 text-[9px] text-slate-700 font-mono tracking-[0.2em] uppercase text-center">
        &copy; 2026 DailyTracker Core // Port_8080 // Secure_Mode
      </footer>
    </main>
  );
}