import React from "react";
import { useParams } from "react-router-dom";
import { InvitedVisitorForm } from "@/components/mobile/InvitedVisitorForm";

export const InvitedVisitorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();

  return <InvitedVisitorForm visitorPageId={id} />;
};
