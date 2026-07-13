import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, Info, X, CheckCircle, ChevronRight } from 'lucide-react';
import { useApp } from '../context';

export default function NotificationBell() {
  const { alerts, resolveAlert } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unresolved = alerts.filter(a => !a.resolved);
  const critical = unresolved.filter(a => a.severity === 'Critical').length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white dark:bg-[#1C2526] border border-[#E2EAE7] dark:border-[#2D3A32] hover:border-[#0F766E]/50 transition-colors"
      >
        <Bell className="w-5 h-5 text-[#6B7280] dark:text-[#6B7280]" />
        {unresolved.length > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${critical > 0 ? 'bg-red-500 animate-pulse' : 'bg-[#0F766E]'}`}>
            {unresolved.length > 9 ? '9+' : unresolved.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F1714] border border-[#E2EAE7] dark:border-[#2D3A32] rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 border-b border-[#E2EAE7] dark:border-[#2D3A32] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111827] dark:text-white">Notifications</h3>
              <span className="text-xs text-[#6B7280] dark:text-[#6B7280]">{unresolved.length} unread</span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {unresolved.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-[#6B7280] dark:text-[#6B7280]">All clear! No alerts.</p>
                </div>
              ) : (
                unresolved.slice(0, 10).map(a => (
                  <div key={a.id} className="p-4 border-b border-[#E2EAE7] dark:border-[#2D3A32] hover:bg-[#F8FAF8] dark:hover:bg-[#1C2526]/60 transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${a.severity === 'Critical' ? 'bg-red-500' : a.severity === 'Warning' ? 'bg-[#0F766E]' : 'bg-[#8A9A96]'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#111827] dark:text-white">{a.title}</p>
                          <button
                            onClick={() => resolveAlert(a.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6B7280] hover:text-emerald-500"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-[#6B7280] dark:text-[#6B7280] mt-0.5 line-clamp-2">{a.message}</p>
                        <p className="text-[10px] text-[#6B7280] dark:text-[#6B7280] mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${a.severity === 'Critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : a.severity === 'Warning' ? 'bg-[#0F766E]/10 text-[#115E59]' : 'bg-[#F8FAF8] dark:bg-[#1C2526] text-[#6B7280] dark:text-[#6B7280]'}`}>
                        {a.severity}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-[#E2EAE7] dark:border-[#2D3A32] text-center">
              <span className="text-xs text-[#6B7280]">{alerts.length} total notifications</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
