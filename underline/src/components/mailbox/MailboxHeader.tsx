import React from "react";
import { Bell } from "lucide-react";

export function MailboxHeader() {
  return (
    <div className="sticky top-0 z-40 bg-[#FCFCFA]/95 backdrop-blur-md border-b border-[#1A3C34]/5">
      <div className="px-6 py-4 flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-[#1A3C34] tracking-tight">
          Mailbox
        </h1>
        <button className="p-2 -mr-2 rounded-full hover:bg-[#1A3C34]/5 transition-colors text-[#1A3C34]">
          <Bell className="w-5 h-5" />
        </button>
      </div>
      
      <div className="px-6 pb-4">
        <div className="bg-[#1A3C34]/5 px-4 py-2.5 rounded-md flex items-center justify-center text-xs font-sans font-medium text-[#1A3C34]/70 tracking-wide">
          매주 일요일 00:00에 초기화됩니다
        </div>
      </div>
    </div>
  );
}
