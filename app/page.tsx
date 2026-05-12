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

  // 1. Fetch Initial Tasks
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    // 2. Setup Realtime Subscription
    const channel = supabase
      .channel("realtime_tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Actions
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const { error } = await supabase
      .from("tasks")
      .insert([{ title: newTask }]);

    if (!error) setNewTask("");
  };

  const toggleTask = async (id: string, is_completed: boolean) => {
    await supabase
      .from("tasks")
      .update({ is_completed: !is_completed })
      .eq("id", id);
  };

  const deleteTask = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Daily Tracker</h1>
          <p className="text-slate-500 text-sm mb-6">Stay organized and productive.</p>

          <form onSubmit={addTask} className="flex gap-2 mb-8">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-slate-700"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </form>

          {loading ? (
            <div className="text-center py-4 text-slate-400 animate-pulse">Loading tasks...</div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group transition-all hover:border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => toggleTask(task.id, task.is_completed)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span
                      className={`text-slate-700 transition-all ${
                        task.is_completed ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-slate-400 py-6 italic">No tasks found. Start by adding one!</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}