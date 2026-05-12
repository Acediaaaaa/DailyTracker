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
    <main className="min-h-screen p-6 md:p-12 flex flex-col items-center">
      {/* Header Info */}
      <div className="w-full max-w-2xl mb-8 flex justify-between items-end border-b border-cyan-900/50 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Task_Terminal<span className="text-cyan-500 animate-pulse">_</span>
          </h1>
          <p className="text-xs text-cyan-700 font-mono tracking-widest uppercase">System Status: Operational</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 font-mono">ENCRYPTED_SESSION_v2.4</p>
          <p className="text-[10px] text-slate-500 font-mono">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="w-full max-w-2xl glass-panel rounded-lg p-1">
        <div className="bg-black/20 p-6 rounded-md">
          {/* Input Area */}
          <form onSubmit={addTask} className="flex gap-3 mb-10">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="INITIALIZE NEW DATA_ENTRY..."
              className="tech-input flex-1"
            />
            <button type="submit" className="tech-button">
              Execute
            </button>
          </form>

          {/* Task List */}
          {loading ? (
            <div className="text-center py-10 text-cyan-900 animate-pulse font-mono">
              [ SCANNING DATABASE... ]
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between p-4 transition-all border-l-2 ${
                    task.is_completed 
                      ? "border-slate-800 bg-slate-900/20" 
                      : "border-cyan-500 bg-cyan-500/5"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleTask(task.id, task.is_completed)}
                      className={`w-5 h-5 border transition-all flex items-center justify-center ${
                        task.is_completed 
                          ? "border-slate-700 bg-slate-800" 
                          : "border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                      }`}
                    >
                      {task.is_completed && <div className="w-2 h-2 bg-cyan-500" />}
                    </button>
                    <span className={`font-mono text-sm tracking-tight transition-all ${
                      task.is_completed ? "text-slate-600 line-through" : "text-slate-200"
                    }`}>
                      {task.title}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs font-mono"
                  >
                    [TERMINATE]
                  </button>
                </div>
              ))}
              
              {tasks.length === 0 && (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded">
                  <p className="text-slate-600 text-xs font-mono uppercase">Zero records found in local_disk.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-[10px] text-slate-700 font-mono tracking-widest uppercase">
        &copy; 2026 DailyTracker Core // Cebu_Sector_07
      </footer>
    </main>
  );
}