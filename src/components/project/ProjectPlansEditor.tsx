import React, { useState } from "react";
import { TextField, MenuItem } from "@mui/material";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const PLAN_TYPES = [
  { value: "master", label: "Master" },
  { value: "tower", label: "Tower" },
  { value: "unit", label: "Unit" },
];

export interface ProjectPlan {
  id?: number | string;
  name: string;
  plan_type?: string;
  tower?: string;
  area_sqft?: string | number;
  facing?: string;
  // New uploads are Files; plans loaded from the API carry image objects
  images?: Array<File | { document_url?: string; url?: string }>;
}

interface Props {
  plans: ProjectPlan[];
  onAdd: (plan: ProjectPlan) => void;
  onRemove: (plan: ProjectPlan, index: number) => void;
}

const imageSrc = (img: File | { document_url?: string; url?: string }) => {
  if (img instanceof File) return URL.createObjectURL(img);
  return img?.document_url || img?.url || "";
};

/**
 * Floor plans: name, type (master / tower / unit), tower, area, facing and images.
 * Used by the project create and edit pages.
 */
export const ProjectPlansEditor: React.FC<Props> = ({ plans, onAdd, onRemove }) => {
  const [name, setName] = useState("");
  const [planType, setPlanType] = useState("unit");
  const [tower, setTower] = useState("");
  const [area, setArea] = useState("");
  const [facing, setFacing] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0);

  const handleAdd = () => {
    if (!name.trim() || images.length === 0) {
      toast.error("Please enter plan name and select images.");
      return;
    }
    onAdd({
      name: name.trim(),
      plan_type: planType,
      tower: tower.trim(),
      area_sqft: area,
      facing: facing.trim(),
      images,
    });
    setName("");
    setTower("");
    setArea("");
    setFacing("");
    setImages([]);
    setFileKey((k) => k + 1); // reset the file input
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Floor Plans</h2>
      </div>
      <div className="p-6 space-y-4" style={{ backgroundColor: "#AAB9C50D" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Plan Name"
            placeholder="e.g. 3 BHK — Tower A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Plan Type"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          >
            {PLAN_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Tower"
            placeholder="e.g. Tower A"
            value={tower}
            onChange={(e) => setTower(e.target.value)}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Area (sq ft)"
            type="number"
            placeholder="e.g. 2450"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Facing"
            placeholder="e.g. North"
            value={facing}
            onChange={(e) => setFacing(e.target.value)}
            variant="outlined"
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <div className="flex items-center">
            <input
              key={fileKey}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files || []))}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary h-9 px-4 text-sm font-medium"
          >
            Add Plan
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#e6e2d8" }}>
                <th className="text-left font-semibold py-3 px-4">Plan Name</th>
                <th className="text-left font-semibold py-3 px-4">Type</th>
                <th className="text-left font-semibold py-3 px-4">Tower</th>
                <th className="text-left font-semibold py-3 px-4">Area (sq ft)</th>
                <th className="text-left font-semibold py-3 px-4">Facing</th>
                <th className="text-left font-semibold py-3 px-4">Images</th>
                <th className="text-left font-semibold py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-gray-500">
                    No plans added yet
                  </td>
                </tr>
              ) : (
                plans.map((plan, index) => (
                  <tr key={plan.id ?? `new-${index}`} className="border-t">
                    <td className="py-3 px-4 font-medium">{plan.name}</td>
                    <td className="py-3 px-4 capitalize">{plan.plan_type || "-"}</td>
                    <td className="py-3 px-4">{plan.tower || "-"}</td>
                    <td className="py-3 px-4">{plan.area_sqft || "-"}</td>
                    <td className="py-3 px-4">{plan.facing || "-"}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2 flex-wrap">
                        {(plan.images || []).slice(0, 4).map((img, i) => (
                          <img
                            key={i}
                            src={imageSrc(img)}
                            alt="Plan"
                            className="rounded border border-gray-200"
                            style={{ width: 48, height: 48, objectFit: "cover" }}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => onRemove(plan, index)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#C72030]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProjectPlansEditor;
