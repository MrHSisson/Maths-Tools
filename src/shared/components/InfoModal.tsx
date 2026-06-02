import { X } from "lucide-react";
import type { InfoSection } from "../types";

export const InfoModal = ({ infoSections, onClose }: { infoSections: InfoSection[]; onClose: () => void }) => (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center"
    style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col"
      style={{ height: "80vh" }}
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tool Information</h2>
          <p className="text-sm text-gray-400 mt-0.5">A guide to all features and options</p>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto px-7 py-6 flex flex-col gap-6 flex-1">
        {infoSections.map(s => (
          <div key={s.title}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{s.icon}</span>
              <h3 className="text-lg font-bold text-blue-900">{s.title}</h3>
            </div>
            <div className="flex flex-col gap-2">
              {s.content.map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl px-4 py-3">
                  <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-7 py-4 border-t border-gray-100 flex justify-end flex-shrink-0">
        <button onClick={onClose} className="px-6 py-2 bg-blue-900 text-white rounded-xl font-bold text-sm hover:bg-blue-800">
          Close
        </button>
      </div>
    </div>
  </div>
);
