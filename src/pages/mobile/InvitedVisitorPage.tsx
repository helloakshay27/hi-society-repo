import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { InvitedVisitorForm } from "@/components/mobile/InvitedVisitorForm";

export const InvitedVisitorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  // Present on links generated with a validity (POST /short_urls)
  const [searchParams] = useSearchParams();
  const shortUrlId = searchParams.get("short_url_id") || undefined;

  return <InvitedVisitorForm visitorPageId={id} shortUrlId={shortUrlId} />;
};
