import React from 'react';

import { Switch } from "@/components/ui/switch";
interface StatusToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ checked, onChange }) => (
  <Switch checked={!!(checked)} onCheckedChange={() => onChange()} />
);
