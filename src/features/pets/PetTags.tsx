import { PawPrint } from "lucide-react";
import { Pet } from "./types";

type Tone = "green" | "amber" | "red" | "mint" | "rose" | "grey";

const TONES: Record<Tone, string> = {
  green: "bg-[rgba(121,140,94,0.15)] text-[#55663f]",
  mint: "bg-[rgba(158,200,186,0.35)] text-[#2f6b58]",
  amber: "bg-[rgba(237,196,136,0.35)] text-[#8a5a12]",
  rose: "bg-[rgba(231,132,142,0.15)] text-[#a34852]",
  red: "bg-[rgba(231,132,142,0.3)] text-[#9b2c37]",
  grey: "bg-[#ecebe6] text-[#5f5e58]",
};

const TONE_BY_VALUE: Record<string, Tone> = {
  // Vaccination (AR-14): Completely mint / Partially rose / Not taken coral
  Completely: "mint",
  Partially: "rose",
  "Not taken": "red",
  // Due status (AR-16)
  "Up to date": "green",
  "Due soon": "amber",
  Overdue: "red",
  "Not vaccinated": "red",
  // Certificate (PT-20)
  Verified: "green",
  Rejected: "red",
  Missing: "red",
  "Not checked": "grey",
  // Registration (PT-21)
  Active: "green",
  "Pending approval": "amber",
  Declined: "red",
  Archived: "grey",
};

export const Tag = ({ value }: { value?: string | null }) => {
  if (!value) return <span className="text-[#888780]">—</span>;
  const tone = TONE_BY_VALUE[value] ?? "grey";
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {value}
    </span>
  );
};

export const PetPhoto = ({ pet, size = 40, onClick }: { pet: Pet; size?: number; onClick?: () => void }) =>
  pet.photo_url ? (
    <img
      src={pet.photo_url}
      alt={pet.name}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`rounded-lg object-cover ${onClick ? "cursor-zoom-in" : ""}`}
    />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-lg bg-[#f6f4ee] text-[#c4b89d]"
      aria-label="No photo"
    >
      <PawPrint style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  );
