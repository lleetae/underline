import React from "react";
import { cn } from "../../components/ui/utils";

interface MailboxTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MailboxTabs({ activeTab, onTabChange }: MailboxTabsProps) {
  const tabs = [
    { id: "sent", label: "보냄" },
    { id: "received", label: "받음" },
    { id: "matched", label: "매칭됨" },
  ];

  return (
    <div className="px-6 border-b border-[#1A3C34]/10">
      <div className="flex w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-all relative",
              activeTab === tab.id
                ? "text-[#1A3C34]"
                : "text-[#1A3C34]/40 hover:text-[#1A3C34]/60"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A3C34]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
