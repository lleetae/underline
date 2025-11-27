import React from "react";
import { Home, Mail, User } from "lucide-react";
import { cn } from "../../components/ui/utils";

interface BottomNavProps {
  activeTab: "home" | "mailbox" | "profile";
  onTabChange?: (tab: "home" | "mailbox" | "profile") => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#FCFCFA] border-t border-[var(--foreground)]/10 px-6 py-3 z-50 flex justify-center">
      <div className="flex justify-between items-center w-full max-w-md">
        <button 
           onClick={() => onTabChange?.("home")}
           className={cn(
             "flex flex-col items-center gap-1 transition-colors p-2",
             activeTab === "home" ? "text-[var(--primary)]" : "text-[var(--foreground)]/30"
           )}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Home</span>
        </button>

        <button 
           onClick={() => onTabChange?.("mailbox")}
           className={cn(
             "flex flex-col items-center gap-1 transition-colors p-2",
             activeTab === "mailbox" ? "text-[var(--primary)]" : "text-[var(--foreground)]/30"
           )}
        >
          <Mail className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Mailbox</span>
        </button>

        <button 
           onClick={() => onTabChange?.("profile")}
           className={cn(
             "flex flex-col items-center gap-1 transition-colors p-2",
             activeTab === "profile" ? "text-[var(--primary)]" : "text-[var(--foreground)]/30"
           )}
        >
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium tracking-wide uppercase">Profile</span>
        </button>
      </div>
    </div>
  );
}