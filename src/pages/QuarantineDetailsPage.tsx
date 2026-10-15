import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, User, ShieldAlert, Activity } from "lucide-react";
import { QUARANTINE_MOCK_RECORDS } from "./quarantineTrackerData";

type Tone = "danger" | "success" | "warning" | "neutral";

const TONE_BY_VALUE: Record<string, Tone> = {
  "In Quarantine": "danger",
  Critical: "danger",
  Positive: "danger",
  Completed: "success",
  Cleared: "success",
  Recovered: "success",
  Improving: "success",
  Negative: "success",
  "Under Observation": "warning",
  Pending: "warning",
};

const Pill: React.FC<{ value: string }> = ({ value }) => (
  <span className={`ref-pill ref-pill-${TONE_BY_VALUE[value] ?? "neutral"}`}>{value}</span>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="ref-kv-label">{label}</div>
    <div className="ref-kv-value">{children || "-"}</div>
  </div>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({
  icon,
  title,
  children,
}) => (
  <div className="ref-card">
    <div className="ref-card-head">
      <span className="ref-chip">{icon}</span>
      <h2>{title}</h2>
    </div>
    <div className="ref-card-body grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
      {children}
    </div>
  </div>
);

const QuarantineDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const record = QUARANTINE_MOCK_RECORDS.find((r) => r.id === id);

  const goBack = () => navigate("/bms/quarantine-tracker");

  return (
    <div className="p-6 min-h-screen quarantine-details-page">
      <style>{`
        html body #root .quarantine-details-page {
          background: #FDFDFB;
        }
        html body #root .quarantine-details-page .ref-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 14px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(26, 26, 24, 0.55);
          transition: color 0.16s;
        }
        html body #root .quarantine-details-page .ref-back:hover {
          color: #1A1A18;
        }
        html body #root .quarantine-details-page .ref-card {
          background: #ffffff;
          border: 1px solid rgba(26, 26, 24, 0.09);
          border-radius: 16px;
          overflow: hidden;
        }
        html body #root .quarantine-details-page .ref-card-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 22px 24px 0;
        }
        html body #root .quarantine-details-page .ref-card-head h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A18;
        }
        html body #root .quarantine-details-page .ref-chip {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: #F5F4F0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        html body #root .quarantine-details-page .ref-chip svg {
          width: 14px;
          height: 14px;
          color: #1A1A18 !important;
          stroke: #1A1A18 !important;
        }
        html body #root .quarantine-details-page .ref-card-body {
          padding: 16px 24px 22px;
        }
        html body #root .quarantine-details-page .ref-kv-label {
          margin-bottom: 4px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(26, 26, 24, 0.48);
        }
        html body #root .quarantine-details-page .ref-kv-value {
          font-size: 13.5px;
          font-weight: 500;
          color: #1A1A18;
          word-break: break-word;
        }
        html body #root .quarantine-details-page .ref-pill {
          display: inline-flex;
          align-items: center;
          padding: 2px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
        }
        html body #root .quarantine-details-page .ref-pill-danger {
          background: rgba(231, 132, 142, 0.18);
          color: #A63D49;
        }
        html body #root .quarantine-details-page .ref-pill-success {
          background: rgba(121, 140, 94, 0.18);
          color: #56683F;
        }
        html body #root .quarantine-details-page .ref-pill-warning {
          background: rgba(237, 196, 136, 0.3);
          color: #85621F;
        }
        html body #root .quarantine-details-page .ref-pill-neutral {
          background: #F5F4F0;
          color: #1A1A18;
        }
      `}</style>

      <button type="button" onClick={goBack} className="ref-back">
        <ArrowLeft className="w-4 h-4" />
        Back to Quarantine Tracker
      </button>

      {!record ? (
        <div className="ref-card">
          <div className="ref-card-body text-center py-12">
            <p className="text-[14px] font-semibold text-[#1A1A18]">Quarantine record not found</p>
            <p className="text-[13px] text-[rgba(26,26,24,0.55)] mt-1">
              It may have been removed or the link is incorrect.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
              {record.residentName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-[rgba(26,26,24,0.55)]">
              <span>
                Tower {record.tower} • Flat {record.flat}
              </span>
              <Pill value={record.status} />
            </div>
          </div>

          <div className="space-y-6">
            <Section icon={<User />} title="Resident Details">
              <Field label="Resident Name">{record.residentName}</Field>
              <Field label="Tower">{record.tower}</Field>
              <Field label="Flat">{record.flat}</Field>
              <Field label="Contact Number">{record.contactNumber}</Field>
              <Field label="Emergency Contact">{record.emergencyContact}</Field>
            </Section>

            <Section icon={<ShieldAlert />} title="Quarantine Details">
              <Field label="Type">{record.quarantineType}</Field>
              <Field label="Status">
                <Pill value={record.status} />
              </Field>
              <Field label="Start Date">{record.startDate}</Field>
              <Field label="End Date">{record.endDate}</Field>
              <Field label="Created On">{record.createdOn}</Field>
              <Field label="Created By">{record.createdBy}</Field>
            </Section>

            <Section icon={<Activity />} title="Health Details">
              <Field label="Health Status">
                <Pill value={record.healthStatus} />
              </Field>
              <Field label="Test Result">
                <Pill value={record.testResult} />
              </Field>
              <Field label="Last Checkup">{record.lastCheckup}</Field>
              <Field label="Temperature">{record.temperature}</Field>
              <Field label="Symptoms">{record.symptoms}</Field>
            </Section>
          </div>
        </>
      )}
    </div>
  );
};

export default QuarantineDetailsPage;
