import React, { useEffect, useState } from "react";
import { FormControl, InputLabel, Select as MuiSelect, MenuItem } from "@mui/material";
import { fieldStyles, menuProps } from "@/components/ticket-management/fieldStyles";
import { getAuthHeader, getFullUrl } from "@/config/apiConfig";

interface SocietyBlock {
  id: number;
  name: string;
}

interface SocietyFlat {
  id: number;
  flat_no: string;
  block_name: string;
  flat_str?: string;
}

interface Props {
  blockId: string;
  flatId: string;
  onBlockChange: (blockId: string) => void;
  onFlatChange: (flatId: string) => void;
}

const getSocietyId = () =>
  localStorage.getItem("selectedSocietyId") ||
  localStorage.getItem("society_id") ||
  localStorage.getItem("org_id") ||
  "";

const flatLabel = (f: SocietyFlat) =>
  f.flat_str || (f.block_name && f.flat_no ? `${f.block_name} - ${f.flat_no}` : f.flat_no);

// Tower + Flat dropdowns for filter dialogs. Flats load for the selected tower;
// changing the tower clears the flat.
export const TowerFlatFilterFields: React.FC<Props> = ({
  blockId,
  flatId,
  onBlockChange,
  onFlatChange,
}) => {
  const [blocks, setBlocks] = useState<SocietyBlock[]>([]);
  const [flats, setFlats] = useState<SocietyFlat[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingFlats, setLoadingFlats] = useState(false);

  useEffect(() => {
    const societyId = getSocietyId();
    if (!societyId) return;
    setLoadingBlocks(true);
    fetch(getFullUrl(`/get_society_blocks.json?society_id=${societyId}`), {
      headers: { Authorization: getAuthHeader() },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setBlocks(data?.society_blocks || []))
      .catch((error) => console.error("Error fetching towers:", error))
      .finally(() => setLoadingBlocks(false));
  }, []);

  useEffect(() => {
    const societyId = getSocietyId();
    if (!blockId || !societyId) {
      setFlats([]);
      return;
    }
    setLoadingFlats(true);
    fetch(
      getFullUrl(`/get_society_flats.json?society_id=${societyId}&society_block_id=${blockId}`),
      { headers: { Authorization: getAuthHeader() } }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setFlats(data?.society_flats || []))
      .catch((error) => console.error("Error fetching flats:", error))
      .finally(() => setLoadingFlats(false));
  }, [blockId]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <FormControl fullWidth variant="outlined" disabled={loadingBlocks}>
        <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Tower</InputLabel>
        <MuiSelect
          value={blockId}
          onChange={(e) => {
            onBlockChange(e.target.value);
            onFlatChange("");
          }}
          displayEmpty
          label="Tower"
          sx={fieldStyles}
          MenuProps={menuProps}
        >
          <MenuItem value=""><em>{loadingBlocks ? "Loading..." : "Select Tower"}</em></MenuItem>
          {blocks.map((b) => (
            <MenuItem key={b.id} value={b.id.toString()}>
              {b.name}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>

      <FormControl fullWidth variant="outlined" disabled={!blockId || loadingFlats}>
        <InputLabel shrink sx={{ backgroundColor: 'white', px: 1 }}>Flat</InputLabel>
        <MuiSelect
          value={flatId}
          onChange={(e) => onFlatChange(e.target.value)}
          displayEmpty
          label="Flat"
          sx={fieldStyles}
          MenuProps={menuProps}
        >
          <MenuItem value="">
            <em>{loadingFlats ? "Loading..." : !blockId ? "Select tower first" : "Select Flat"}</em>
          </MenuItem>
          {flats.map((f) => (
            <MenuItem key={f.id} value={f.id.toString()}>
              {flatLabel(f)}
            </MenuItem>
          ))}
        </MuiSelect>
      </FormControl>
    </div>
  );
};
