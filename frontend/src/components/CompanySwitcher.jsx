import React from "react";
import { Building2 } from "lucide-react";

export const XEDRUO_COMPANIES = [
  ["xedruo-power-holdings", "01 — Xedruo Power Holdings"],
  ["xedruo", "02 — Xedruo"],
  ["sportruo", "03 — Sportruo"],
  ["hireruo", "04 — Hireruo"],
  ["adom", "05 — Adom"],
  ["agruo", "06 — Agruo"],
  ["heathrou", "07 — Heathrou"],
  ["xedruo-education", "08 — Xedruo Education"],
  ["xedruo-capital", "09 — Xedruo Capital"],
  ["xedruo-energy", "10 — Xedruo Energy"],
  ["xedruo-logistics", "11 — Xedruo Logistics"],
  ["xedruo-properties", "12 — Xedruo Properties"],
  ["spacetruo", "13 — Spacetruo"],
  ["xedruo-ai", "14 — Xedruo AI"],
];

export default function CompanySwitcher({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
      <Building2 size={16} className="text-cyan-300 shrink-0" />
      <span className="text-xs text-slate-500 hidden sm:inline">Working on</span>
      <select
        value={value || "xedruo-power-holdings"}
        onChange={(e) => onChange?.(e.target.value)}
        className="max-w-[230px] bg-transparent text-sm text-white outline-none"
      >
        {XEDRUO_COMPANIES.map(([id, name]) => (
          <option key={id} value={id} className="bg-slate-950 text-white">{name}</option>
        ))}
      </select>
    </label>
  );
}
