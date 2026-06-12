"use client";

import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { BackenedUrl } from "@/config";
import { useEffect, useState } from "react";
import { Plus, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

type Project = {
  id: string;
  description: string;
};

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const { getToken } = useAuth();
  const router = useRouter();

  const handleProject = async () => {
    try {
      const token = await getToken();

      const response = await axios.get(`${BackenedUrl}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProjects(response.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    if (open) {
      handleProject();
    }
  }, [open]);

  return (
    <>
      
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      
      <div
        className={`fixed top-0 left-0 h-screen w-72 bg:white dark:bg-[#0d1117] border-r border-zinc-800 z-50 transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h1 className="text-xl font-bold ">Bolty</h1>

          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        
        <div className="p-4">
          <button 
            onClick={() => {
              router.push("/");
              setOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black py-2.5 font-medium hover:opacity-90 transition"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        
        <div className="px-3 pb-4">
          <h2 className="text-xs uppercase tracking-wider text-grey-500 mb-3 px-2">
            Recent Projects
          </h2>

          <div className="flex flex-col gap-2 max-h-[75vh] overflow-y-auto pr-1">
            {projects.length > 0 ? (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    router.push(`/project/${project.id}`);
                    setOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare
                      size={15}
                      className="text-zinc-500 shrink-0"
                    />

                    <span className="text-sm text-grey-200 truncate">
                      {project.description}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center text-grey-500 text-sm py-8">
                No projects found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}