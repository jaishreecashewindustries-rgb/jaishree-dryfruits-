import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { WHATSAPP_NUMBER } from "../utils/helpers";

export default function WhatsAppButton() {
  return null;
  // eslint-disable-next-line no-unreachable
  const [open, setOpen] = useState(false);

  const quickMessages = [
    "I want to place an order",
    "Track my existing order",
    "Ask about product quality",
    "Bulk / Corporate order enquiry",
    "Gift hamper customization",
  ];

  return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Quick message panel */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-slide-up">
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={18} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">JAI SHREE Dryfruits</p>
                <p className="text-white/80 text-xs">Typically replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="p-4">
            <p className="text-gray-600 text-xs mb-3 font-medium">👋 Hi! How can we help you today?</p>
            <div className="space-y-2">
              {quickMessages.map((msg) => (
                <a
                  key={msg}
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-gray-700 px-3 py-2 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-all"
                >
                  {msg}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-[#25D366] hover:bg-[#20B858] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
      >
        {open ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
      </button>
    </div>
  );
}
