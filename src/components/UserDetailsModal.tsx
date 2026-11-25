import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  ExternalLink,
  File,
  FileText,
  Files,
  Home,
  Info,
  Loader2,
  Mail,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Read-only user summary, sourced from the same endpoint as ViewUserPage
// (GET /crm/admin/user_societies/:id.json). Pass the ticket's user_society_id.

interface UserDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userSocietyId: string | number | null | undefined;
}

const decodeUrl = (url?: string): string | null => {
  if (!url) return null;
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

const getFilenameFromUrl = (url: string): string =>
  url.split("/").pop()?.split("?")[0] || "Attachment";

const isImageUrl = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url);

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="min-w-0">
    <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-0.5">
      {label}
    </div>
    <div className="text-[13.5px] font-medium text-[#1A1A18] break-words">
      {value || "-"}
    </div>
  </div>
);

const Section = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-[rgba(26,26,24,0.09)] bg-white p-4">
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F5F4F0] flex-none">
        <Icon className="w-[13px] h-[13px] text-[#1A1A18]" />
      </span>
      <h3 className="text-[14px] font-semibold text-[#1A1A18]">{title}</h3>
    </div>
    {children}
  </div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
    {children}
  </div>
);

export const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  open,
  onOpenChange,
  userSocietyId,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userSocietyId) return;

    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    if (!baseUrl || !token) {
      setError("Missing authentication details. Please login again.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUser(null);

    axios
      .get(
        `https://${baseUrl}/crm/admin/user_societies/${userSocietyId}.json`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((response) => {
        if (cancelled) return;
        if (!response.data) setError("User data not found.");
        setUser(response.data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error fetching user details:", err);
        setError(err.response?.data?.message || "Failed to load user details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, userSocietyId]);

  const profilePicture = decodeUrl(user?.profile_picture);
  const fullName =
    user?.full_name ||
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    "User";
  const members: string[] = Array.isArray(user?.other_members)
    ? user.other_members
    : [];
  const documents: any[] = Array.isArray(user?.user_flat_documents)
    ? user.user_flat_documents
    : [];

  const status =
    user?.approved === true
      ? { label: "Approved", cls: "bg-[rgba(18,161,80,0.12)] text-[#0E7F3F]" }
      : user?.approved === false
        ? { label: "Rejected", cls: "bg-[rgba(229,72,77,0.12)] text-[#A32126]" }
        : { label: "Pending", cls: "bg-[rgba(242,163,18,0.3)] text-[#8A5B00]" };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] p-0 gap-0 bg-[#FDFDFB] border-none shadow-2xl max-h-[90vh] flex flex-col overflow-hidden [&>button]:hidden">
        <DialogHeader className="px-6 py-4 flex flex-row items-center justify-between space-y-0 border-b border-[rgba(26,26,24,0.09)] bg-white shrink-0">
          <DialogTitle className="text-base font-semibold text-[#1A1A18]">
            User Details
          </DialogTitle>
          <div className="flex items-center gap-3">
            {/* {userSocietyId && (
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/settings/manage-users/${userSocietyId}`);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#da7756] hover:underline"
              >
                View full profile
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )} */}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!userSocietyId ? (
            <p className="py-12 text-center text-sm text-[#888780]">
              User details are not available for this ticket.
            </p>
          ) : loading ? (
            <div className="py-12 flex flex-col items-center gap-3 text-sm text-[#888780]">
              <Loader2 className="w-6 h-6 animate-spin text-[#da7756]" />
              Loading user details...
            </div>
          ) : error || !user ? (
            <p className="py-12 text-center text-sm text-[#e7848e]">
              {error || "User not found."}
            </p>
          ) : (
            <>
              {/* Header */}
              <div className="rounded-2xl border border-[rgba(26,26,24,0.09)] bg-white p-4 flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#F5F4F0] flex items-center justify-center overflow-hidden shrink-0">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <UserIcon className="w-7 h-7 text-[#1A1A18]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[18px] font-semibold text-[#1A1A18] leading-tight mb-1.5 break-words">
                    {fullName}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[rgba(26,26,24,0.55)] mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5" />
                      {user.flat_no
                        ? `${user.flat_no}${user.block_no ? `, ${user.block_no}` : ""}`
                        : "No Flat"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {user.phase || "-"}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.cls}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </div>
              </div>

              <Section title="Contact Information" icon={Mail}>
                <Grid>
                  <InfoField label="Email" value={user.email} />
                  <InfoField label="Mobile Number" value={user.mobile_number} />
                  <InfoField
                    label="Alternate Email 1"
                    value={user.alternate_email_1}
                  />
                  <InfoField
                    label="Alternate Email 2"
                    value={user.alternate_email_2}
                  />
                  <InfoField
                    label="Landline Number"
                    value={user.user_flat?.landline}
                  />
                  <InfoField label="Intercom Number" value={user.intercom} />
                </Grid>
              </Section>

              <Section title="Personal Details" icon={UserIcon}>
                <Grid>
                  <InfoField label="Date of Birth" value={user.birthday} />
                  <InfoField label="Anniversary" value={user.anniversary} />
                  <InfoField
                    label="Spouse Birthday"
                    value={user.spouse_birthday}
                  />
                  <InfoField label="Resident Type" value={user.resident_type} />
                  <InfoField
                    label="Lives Here"
                    value={user.lives_here === "true" ? "Yes" : "No"}
                  />
                  <InfoField
                    label="Membership Type"
                    value={user.is_primary ? "Primary" : "Secondary"}
                  />
                  <InfoField label="Move In Date" value={user.movein_date} />
                  <InfoField
                    label="Date of Possession"
                    value={formatDate(user.date_of_possession)}
                  />
                  <InfoField
                    label="Agreement Expire Date"
                    value={user.user_flat?.agreement_expire_date}
                  />
                </Grid>
              </Section>

              <Section title="Residential Details" icon={Home}>
                <Grid>
                  <InfoField label="Phase" value={user.phase} />
                  <InfoField
                    label="Alternate Address"
                    value={user.alternate_address}
                  />
                  <InfoField label="Adults Residing" value={user.adults} />
                  <InfoField label="Children Residing" value={user.children} />
                  <InfoField label="Pets" value={user.pets} />
                  <InfoField
                    label="EV Connection"
                    value={user.ev_connection ? "Yes" : "No"}
                  />
                </Grid>
              </Section>

              <Section title="Official Details" icon={Info}>
                <Grid>
                  <InfoField label="GST Number" value={user.gst_number} />
                  <InfoField label="PAN Number" value={user.pan_number} />
                  <InfoField label="Designation" value={user.designation} />
                  <InfoField
                    label="Committee Member"
                    value={user.committee_member ? "Yes" : "No"}
                  />
                </Grid>
              </Section>

              <Section title="Club Info" icon={Info}>
                {user.club_member ? (
                  <Grid>
                    <InfoField
                      label="Membership Number"
                      value={user.club_member.membership_number}
                    />
                    <InfoField
                      label="Start Date"
                      value={formatDate(user.club_member.startdate)}
                    />
                    <InfoField
                      label="End Date"
                      value={formatDate(user.club_member.enddate)}
                    />
                    <InfoField
                      label="Access Card ID"
                      value={user.club_member.access_card_id}
                    />
                    {user.club_member.club_member_check && (
                      <InfoField label="Club Membership" value="Active" />
                    )}
                    {user.club_member.access_card_check && (
                      <InfoField label="Access Card" value="Allocated" />
                    )}
                  </Grid>
                ) : (
                  <p className="text-sm text-[#888780]">
                    No club membership details configured
                  </p>
                )}
              </Section>

              {members.length > 0 && (
                <Section
                  title={`Members List (${members.length})`}
                  icon={Users}
                >
                  <ul className="space-y-1">
                    {members.map((member, index) => (
                      <li key={index} className="text-sm text-[#1A1A1A] px-1">
                        • {member}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {documents.length > 0 && (
                <Section
                  title={`Attachments (${documents.length})`}
                  icon={Files}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {documents.map((doc, index) => {
                      const url: string = doc.document_url || "";
                      const filename = getFilenameFromUrl(url);
                      return (
                        <button
                          key={doc.id || index}
                          type="button"
                          onClick={() => url && window.open(url, "_blank")}
                          className="flex flex-col items-center gap-2 p-2 rounded-xl border border-[#e5e7eb] bg-white hover:border-[#da7756] transition-colors"
                          title={filename}
                        >
                          <div className="w-full h-20 rounded-lg bg-[#fafafa] flex items-center justify-center overflow-hidden">
                            {isImageUrl(url) ? (
                              <img
                                src={url}
                                alt={filename}
                                className="w-full h-full object-cover"
                              />
                            ) : /\.pdf(\?|$)/i.test(url) ? (
                              <FileText className="w-8 h-8 text-[#e7848e]" />
                            ) : (
                              <File className="w-8 h-8 text-gray-500" />
                            )}
                          </div>
                          <span className="w-full truncate text-[11px] font-semibold text-[#1A1A1A]">
                            {filename}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsModal;
