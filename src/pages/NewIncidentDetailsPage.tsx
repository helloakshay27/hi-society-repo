
// import React, { useEffect, useState } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Button } from '@/components/ui/button';
// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
// } from '@/components/ui/card';
// import { Heading } from '@/components/ui/heading';
// import { toast } from 'sonner';
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import {
//     TextField,
//     FormControl,
//     InputLabel,
//     Select as MuiSelect,
//     MenuItem,
// } from '@mui/material';
// // Adjust this import path to wherever incidentService actually lives in your project
// import { incidentService, Incident } from '@/services/incidentService';

// interface InjuryRow {
//     injuryType: string;
//     howManyPeople: string | number;
//     whoGotInjured: string;
// }

// interface WitnessRow {
//     name: string;
//     contact?: string;
// }

// // The shape the UI actually renders. Built by mapping the raw `Incident`
// // API response onto friendlier, display-ready fields.
// interface IncidentDetailView {
//     id: string;
//     status: string;
//     site: string;
//     region: string;
//     tower: string;
//     description: string;
//     incidentDateTime: string;
//     revisionDateTime: string;
//     reportingDateTime: string;
//     reportedBy: string;
//     level: string;
//     primaryCategory: string;
//     categoryForPrimary: string;
//     secondaryCategory: string;
//     secondaryCategoryFor: string;
//     secondaryCategoryForInjury: string;
//     supportRequired: string;
//     propertyDamage: string;
//     propertyDamageCategory: string;
//     damageEvaluation: string;
//     damageCoveredInsurance: string;
//     damagedRecovered: string;
//     workRelatedInjury: string;
//     rca: string;
//     rcaCategory: string;
//     correctiveAction: string;
//     preventiveAction: string;
//     injuries: InjuryRow[];
//     witnesses: WitnessRow[];
// }

// const fieldStyles = {
//     height: { xs: 28, sm: 36, md: 45 },
//     '& .MuiInputBase-input, & .MuiSelect-select': {
//         padding: { xs: '8px', sm: '10px', md: '12px' },
//     },
//     '& .MuiOutlinedInput-root': {
//         borderRadius: '8px',
//         backgroundColor: 'white',
//         '& fieldset': {
//             borderColor: '#e5e7eb',
//         },
//         '&:hover fieldset': {
//             borderColor: '#9ca3af',
//         },
//         '&.Mui-focused fieldset': {
//             borderColor: '#C72030',
//         },
//     },
//     '& .MuiInputLabel-root': {
//         color: '#6b7280',
//         '&.Mui-focused': {
//             color: '#C72030',
//         },
//     },
// };

// const DetailField = ({
//     label,
//     value,
// }: {
//     label: string;
//     value?: string | number | null;
// }) => {
//     if (value === undefined || value === null || value === '') {
//         return null;
//     }

//     return (
//         <div className="pb-4 mb-4 border-b border-dashed border-gray-200">
//             <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
//                 {label}
//             </p>
//             <p className="text-sm text-gray-800">
//                 {value}
//             </p>
//         </div>
//     );
// };

// // ---------------------------------------------------------------------
// // Helpers to safely coerce raw API fields into display-friendly strings
// // ---------------------------------------------------------------------

// const formatDateTime = (value?: string | null): string => {
//     if (!value) return '';
//     const parsed = new Date(value);
//     if (Number.isNaN(parsed.getTime())) return value;
//     return parsed.toLocaleString('en-IN', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit',
//     });
// };

// const yesNo = (value: boolean | string | null | undefined): string => {
//     if (typeof value === 'boolean') return value ? 'Yes' : 'No';
//     if (typeof value === 'string') {
//         const v = value.trim().toLowerCase();
//         if (v === 'true' || v === '1' || v === 'yes') return 'Yes';
//         if (v === 'false' || v === '0' || v === 'no') return 'No';
//         // otherwise return the original string (e.g. "Yes, from the insurance agency")
//         return value;
//     }
//     return '';
// };

// // The `injuries` field on the raw Incident is typed as `any[]` since the
// // API doesn't publish a strict shape. Defensively pull out the likely
// // field names so the table still renders if the API uses slightly
// // different keys.
// const mapInjuries = (raw: any[] | undefined | null): InjuryRow[] => {
//     if (!Array.isArray(raw)) return [];

//     return raw.map((injury) => ({
//         injuryType:
//             injury?.injury_type ??
//             injury?.injuryType ??
//             injury?.inj_type ??
//             injury?.name ??
//             '',
//         howManyPeople:
//             injury?.how_many_people ??
//             injury?.howManyPeople ??
//             injury?.people_count ??
//             injury?.count ??
//             '',
//         whoGotInjured:
//             injury?.who_got_injured ??
//             injury?.whoGotInjured ??
//             injury?.injured_person ??
//             injury?.person_name ??
//             '',
//     }));
// };

// const mapWitnesses = (
//     raw: Incident['incident_witnesses']
// ): WitnessRow[] => {
//     if (!Array.isArray(raw)) return [];

//     return raw
//         .filter((witness) => !witness._destroy)
//         .map((witness) => ({
//             name: witness.name ?? '',
//             contact: witness.mobile ?? '',
//         }));
// };

// // Maps the raw `Incident` API response onto the fields this page renders.
// const mapIncidentToView = (incident: Incident): IncidentDetailView => ({
//     id: String(incident.id ?? ''),
//     status: incident.current_status ?? '',
//     site: incident.site_name ?? incident.building_name ?? '',
//     region: incident.building_name ?? '',
//     tower: incident.tower_name ?? '',
//     description: incident.description ?? '',
//     incidentDateTime: formatDateTime(incident.inci_date_time),
//     revisionDateTime: formatDateTime(incident.updated_at),
//     reportingDateTime: formatDateTime(incident.created_at),
//     reportedBy: incident.created_by ?? '',
//     level: incident.inc_level_name ?? '',
//     primaryCategory: incident.category_name ?? '',
//     categoryForPrimary: incident.sub_category_name ?? '',
//     secondaryCategory: incident.sec_category_name ?? '',
//     secondaryCategoryFor: incident.sec_sub_category_name ?? '',
//     secondaryCategoryForInjury: incident.sec_sub_sub_category_name ?? '',
//     supportRequired: yesNo(incident.support_required),
//     propertyDamage: yesNo(incident.property_damage),
//     propertyDamageCategory: incident.property_damage_category_name ?? '',
//     damageEvaluation: incident.damage_evaluation ?? '',
//     damageCoveredInsurance: yesNo(incident.damage_covered_insurance),
//     damagedRecovered: incident.damaged_recovered ?? '',
//     preventiveAction: incident.preventive_action ?? (Array.isArray(incident.preventive_fields) && incident.preventive_fields.length > 0 ? (incident.preventive_fields[0].description ?? incident.preventive_fields[0].action ?? '') : ''),
//     workRelatedInjury: incident.work_related_injury ?? '',
//     rca: incident.rca ?? '',
//     rcaCategory: incident.rca_category_name ?? incident.rca_category ?? '',
//     correctiveAction: incident.corrective_action ?? '',
//     injuries: mapInjuries(incident.injuries),
//     witnesses: mapWitnesses(incident.incident_witnesses),
// });

// export const NewIncidentDetailsPage = () => {
//     const navigate = useNavigate();
//     const { id } = useParams<{ id: string }>();

//     const [rawIncident, setRawIncident] = useState<Incident | null>(null);
//     const [incident, setIncident] = useState<IncidentDetailView | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState<string | null>(null);

//     const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
//     const [newStatus, setNewStatus] = useState('');
//     const [statusComment, setStatusComment] = useState('');
//     const [submitting, setSubmitting] = useState(false);

//     // Static status options for the dropdown. Replace with an API-backed
//     // list if the backend exposes one (e.g. incidentService.getStatuses()).
//     const statusOptions = [
//         { id: 1, name: 'Open' },
//         { id: 2, name: 'In Progress' },
//         { id: 3, name: 'Resolved' },
//         { id: 4, name: 'Closed' },
//     ];

//     const fetchIncident = async () => {
//         if (!id) {
//             setError('No incident id was provided in the URL.');
//             setLoading(false);
//             return;
//         }

//         setLoading(true);
//         setError(null);

//         try {
//             const data = await incidentService.getIncidentById(id);

//             if (!data) {
//                 setError('Incident not found.');
//                 setRawIncident(null);
//                 setIncident(null);
//                 return;
//             }

//             setRawIncident(data);
//             const mapped = mapIncidentToView(data);
//             setIncident(mapped);
//             setNewStatus(mapped.status);
//         } catch (err) {
//             console.error('Failed to fetch incident details:', err);
//             setError('Failed to load incident details. Please try again.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         fetchIncident();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [id]);

//     const handleEditDetails = () => {
//         if (id) {
//             navigate(`/safety/incident/edit/${id}`);
//         }
//     };

//     const handleDownloadReport = () => {
//         toast.info('Download Report is currently available for UI preview only.');
//     };

//     const handleUpdateStatusSubmit = async () => {
//         if (!newStatus) {
//             toast.error('Please select a status');
//             return;
//         }

//         if (!id) {
//             toast.error('Missing incident id');
//             return;
//         }

//         const selectedStatus = statusOptions.find(
//             (option) => String(option.id) === String(newStatus)
//         );
//         const updatedStatusLabel = selectedStatus?.name || newStatus;

//         setSubmitting(true);

//         try {
//             // NOTE: incidentService.updateIncident currently doesn't map a
//             // dedicated "status" field into the request body. Wire that up
//             // on the service side (e.g. incident[current_status] or a
//             // dedicated status-change endpoint) once it's available.
//             await incidentService.updateIncident(id, {
//                 statusComment,
//             });

//             setIncident((previous) =>
//                 previous ? { ...previous, status: updatedStatusLabel } : previous
//             );

//             setUpdateStatusOpen(false);
//             setStatusComment('');
//             toast.success(`Status changed to ${updatedStatusLabel}`);

//             // Re-fetch so the page reflects whatever the server actually saved
//             fetchIncident();
//         } catch (err) {
//             console.error('Failed to update incident status:', err);
//             toast.error('Failed to update status. Please try again.');
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     if (loading) {
//         return (
//             <div className="p-6">
//                 <p className="text-sm text-gray-500">Loading incident details…</p>
//             </div>
//         );
//     }

//     if (error || !incident) {
//         return (
//             <div className="p-6">
//                 <p className="text-sm text-red-600 mb-4">
//                     {error ?? 'Incident details could not be loaded.'}
//                 </p>
//                 <Button
//                     onClick={fetchIncident}
//                     className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white"
//                 >
//                     Retry
//                 </Button>
//             </div>
//         );
//     }

//     return (
//         <div className="p-6">
//             {/* Breadcrumb */}
//             <div className="mb-6">
//                 <nav className="flex items-center text-sm text-gray-600 mb-4">
//                     <span>Home</span>
//                     <span className="mx-2">{'>'}</span>
//                     <span>Safety</span>
//                     <span className="mx-2">{'>'}</span>
//                     <span>Incident</span>
//                 </nav>

//                 <Heading
//                     level="h1"
//                     variant="primary"
//                     spacing="none"
//                     className="text-[#C72030] font-semibold"
//                 >
//                     INCIDENT DETAILS
//                 </Heading>
//             </div>

//             {/* =====================================================
//                 INCIDENT DETAIL CARD
//             ====================================================== */}
//             <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
//                 <CardHeader className="bg-[#F6F4EE] mb-0 flex flex-row items-center justify-between space-y-0">
//                     <CardTitle className="text-lg text-black">
//                         DETAIL (#{incident.id})
//                     </CardTitle>

//                     <div className="flex gap-2">
//                         <Button
//                             onClick={handleEditDetails}
//                             className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
//                         >
//                             Edit Details
//                         </Button>

//                         <Button
//                             onClick={() => setUpdateStatusOpen(true)}
//                             className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
//                         >
//                             Update Status
//                         </Button>

//                         <Button
//                             onClick={handleDownloadReport}
//                             className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
//                         >
//                             Download Report
//                         </Button>
//                     </div>
//                 </CardHeader>

//                 <CardContent className="p-6 bg-white">
//                     {/* Status / Site / Region / Tower */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
//                         <DetailField label="Status" value={incident.status} />
//                         <DetailField label="Site" value={incident.site} />
//                         <DetailField label="Region" value={incident.region} />
//                         <DetailField label="Tower" value={incident.tower} />
//                     </div>

//                     {/* Description */}
//                     <div className="grid grid-cols-1">
//                         <DetailField label="Description" value={incident.description} />
//                     </div>

//                     {/* Date / Time */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
//                         <DetailField
//                             label="Incident Date and Time"
//                             value={incident.incidentDateTime}
//                         />
//                         <DetailField
//                             label="Revision Date and Time"
//                             value={incident.revisionDateTime}
//                         />
//                         <DetailField
//                             label="Reporting Date and Time"
//                             value={incident.reportingDateTime}
//                         />
//                         <DetailField label="Reported By" value={incident.reportedBy} />
//                     </div>

//                     {/* Level / Categories */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
//                         <DetailField label="Level" value={incident.level} />
//                         <DetailField
//                             label="Incident Primary Category"
//                             value={incident.primaryCategory}
//                         />
//                         <DetailField
//                             label={
//                                 incident.primaryCategory
//                                     ? `Category For The ${incident.primaryCategory} Incident`
//                                     : 'Category For The Incident'
//                             }
//                             value={incident.categoryForPrimary}
//                         />
//                         <DetailField
//                             label="Incident Secondary Category"
//                             value={incident.secondaryCategory}
//                         />
//                     </div>

//                     {/* Secondary Categories / Support / Property Damage */}
//                     <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
//                         <DetailField
//                             label={
//                                 incident.secondaryCategory
//                                     ? `Secondary Category For The ${incident.secondaryCategory} Incident`
//                                     : 'Secondary Category'
//                             }
//                             value={incident.secondaryCategoryFor}
//                         />
//                         <DetailField
//                             label="Secondary Category For The Injury / Illness Incident"
//                             value={incident.secondaryCategoryForInjury}
//                         />
//                         <DetailField label="Support Required" value={incident.supportRequired} />
//                         <DetailField
//                             label="Has Any Property Damage Happened In The Incident"
//                             value={incident.propertyDamage}
//                         />
//                     </div>

//                     {/* Property Damage */}
//                     {incident.propertyDamage === 'Yes' && (
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
//                             <DetailField
//                                 label="Property Damage Category"
//                                 value={incident.propertyDamageCategory}
//                             />
//                             <DetailField
//                                 label="Damage Evaluation"
//                                 value={incident.damageEvaluation}
//                             />
//                             <DetailField
//                                 label="Damage Covered Under Insurance"
//                                 value={incident.damageCoveredInsurance}
//                             />
//                             <DetailField
//                                 label="Damaged Recovered"
//                                 value={incident.damagedRecovered}
//                             />
//                         </div>
//                     )}

//                     {/* Work Related Injury */}
//                     <div className="grid grid-cols-1">
//                         <DetailField
//                             label="Work Related Injury"
//                             value={incident.workRelatedInjury}
//                         />
//                     </div>

//                     {/* RCA */}
//                     <div className="grid grid-cols-1">
//                         <DetailField label="RCA" value={incident.rca} />
//                     </div>

//                     {/* RCA Category */}
//                     <div className="grid grid-cols-1">
//                         <DetailField label="RCA Category" value={incident.rcaCategory} />
//                     </div>

//                     {/* Corrective Action */}
//                     <div className="grid grid-cols-1">
//                         <DetailField
//                             label="Corrective Action"
//                             value={incident.correctiveAction}
//                         />
//                     </div>
//                     {/* Preventive Action */}
//                     <div className="grid grid-cols-1">
//                         <DetailField
//                             label="Preventive Action"
//                             value={incident.preventiveAction}
//                         />
//                     </div>

//                 </CardContent>
//             </Card>

//             {/* =====================================================
//                 INJURIES
//             ====================================================== */}
//             {incident.injuries.length > 0 && (
//                 <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
//                     <CardHeader className="bg-[#F6F4EE] mb-0">
//                         <CardTitle className="text-lg text-black flex items-center gap-2">
//                             INJURIES
//                             <span className="bg-[#C72030] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                                 {incident.injuries.length}
//                             </span>
//                         </CardTitle>
//                     </CardHeader>

//                     <CardContent className="p-0 bg-white overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead>
//                                 <tr className="bg-[#F6F7F7] text-left text-gray-600">
//                                     <th className="px-6 py-3 font-semibold">Injury Type</th>
//                                     <th className="px-6 py-3 font-semibold">How Many Peoples</th>
//                                     <th className="px-6 py-3 font-semibold">Who Got Injured</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {incident.injuries.map((injury, index) => (
//                                     <tr key={index} className="border-t border-gray-100">
//                                         <td className="px-6 py-3">{injury.injuryType}</td>
//                                         <td className="px-6 py-3">{injury.howManyPeople}</td>
//                                         <td className="px-6 py-3">{injury.whoGotInjured}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* =====================================================
//                 WITNESSES
//             ====================================================== */}
//             {incident.witnesses.length > 0 && (
//                 <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
//                     <CardHeader className="bg-[#F6F4EE] mb-0">
//                         <CardTitle className="text-lg text-black flex items-center gap-2">
//                             WITNESSES
//                             <span className="bg-[#C72030] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
//                                 {incident.witnesses.length}
//                             </span>
//                         </CardTitle>
//                     </CardHeader>

//                     <CardContent className="p-0 bg-white overflow-x-auto">
//                         <table className="w-full text-sm">
//                             <thead>
//                                 <tr className="bg-[#F6F7F7] text-left text-gray-600">
//                                     <th className="px-6 py-3 font-semibold">Name</th>
//                                     <th className="px-6 py-3 font-semibold">Contact</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {incident.witnesses.map((witness, index) => (
//                                     <tr key={index} className="border-t border-gray-100">
//                                         <td className="px-6 py-3">{witness.name}</td>
//                                         <td className="px-6 py-3">{witness.contact}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </CardContent>
//                 </Card>
//             )}

//             {/* =====================================================
//                 UPDATE STATUS
//             ====================================================== */}
//             {/* <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
//                 <CardHeader className="bg-[#F6F4EE] mb-0">
//                     <CardTitle className="text-lg text-black">UPDATE STATUS</CardTitle>
//                 </CardHeader>

//                 <CardContent className="p-6 bg-white">
//                     <Button
//                         onClick={() => setUpdateStatusOpen(true)}
//                         className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white px-6 py-2"
//                     >
//                         Update Status
//                     </Button>
//                 </CardContent>
//             </Card> */}

//             {/* =====================================================
//                 UPDATE STATUS DIALOG
//             ====================================================== */}
//             <Dialog open={updateStatusOpen} onOpenChange={setUpdateStatusOpen}>
//                 <DialogContent className="sm:max-w-md">
//                     <DialogHeader>
//                         <DialogTitle className="text-[#C72030]">Update Status</DialogTitle>
//                     </DialogHeader>

//                     <div className="space-y-4 py-2">
//                         <FormControl fullWidth variant="outlined">
//                             <InputLabel shrink>Status</InputLabel>
//                             <MuiSelect
//                                 label="Status"
//                                 value={newStatus}
//                                 onChange={(event) => setNewStatus(event.target.value)}
//                                 displayEmpty
//                                 sx={fieldStyles}
//                             >
//                                 <MenuItem value="">
//                                     <em>Select Status</em>
//                                 </MenuItem>
//                                 {statusOptions.map((option) => (
//                                     <MenuItem key={option.id} value={String(option.id)}>
//                                         {option.name}
//                                     </MenuItem>
//                                 ))}
//                             </MuiSelect>
//                         </FormControl>

//                         <TextField
//                             label="Comment"
//                             value={statusComment}
//                             onChange={(event) => setStatusComment(event.target.value)}
//                             fullWidth
//                             multiline
//                             rows={3}
//                             variant="outlined"
//                             InputLabelProps={{ shrink: true }}
//                             sx={{
//                                 '& .MuiOutlinedInput-root': {
//                                     borderRadius: '8px',
//                                     backgroundColor: 'white',
//                                 },
//                             }}
//                         />

//                         <div className="flex justify-end gap-2 pt-2">
//                             <Button
//                                 variant="outline"
//                                 onClick={() => setUpdateStatusOpen(false)}
//                                 className="!border-[#C72030] !text-[#C72030]"
//                                 disabled={submitting}
//                             >
//                                 Cancel
//                             </Button>

//                             <Button
//                                 onClick={handleUpdateStatusSubmit}
//                                 className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white"
//                                 disabled={submitting}
//                             >
//                                 {submitting ? 'Submitting…' : 'Submit'}
//                             </Button>
//                         </div>
//                     </div>
//                 </DialogContent>
//             </Dialog>
//         </div>
//     );
// };

// export default NewIncidentDetailsPage;

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { toast } from 'sonner';
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
import {
    TextField,
    FormControl,
    InputLabel,
    Select as MuiSelect,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button as MuiButton,
    IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
// Adjust this import path to wherever incidentService actually lives in your project
import { incidentService, Incident, IncidentAttachment } from '@/services/incidentService';

interface InjuryRow {
    injuryType: string;
    howManyPeople: string | number;
    whoGotInjured: string;
}

interface WitnessRow {
    name: string;
    contact?: string;
}

interface AttachmentRow {
    id: number;
    label: string;
    url: string;
}

interface StatusLogRow {
    id: string;
    updatedBy: string;
    dateTime: string;
    status: string;
    comment: string;
}

// The shape the UI actually renders. Built by mapping the raw `Incident`
// API response onto friendlier, display-ready fields.
interface IncidentDetailView {
    id: string;
    status: string;
    site: string;
    region: string;
    tower: string;
    description: string;
    incidentDateTime: string;
    revisionDateTime: string;
    reportingDateTime: string;
    reportedBy: string;
    level: string;
    primaryCategory: string;
    categoryForPrimary: string;
    secondaryCategory: string;
    secondaryCategoryFor: string;
    secondaryCategoryForInjury: string;
    supportRequired: string;
    propertyDamage: string;
    propertyDamageCategory: string;
    damageEvaluation: string;
    damageCoveredInsurance: string;
    damagedRecovered: string;
    workRelatedInjury: string;
    rca: string;
    rcaCategory: string;
    correctiveAction: string;
    preventiveAction: string;
    injuries: InjuryRow[];
    witnesses: WitnessRow[];
    attachments: AttachmentRow[];
    statusLogs: StatusLogRow[];
}

const fieldStyles = {
    height: { xs: 28, sm: 36, md: 45 },
    '& .MuiInputBase-input, & .MuiSelect-select': {
        padding: { xs: '8px', sm: '10px', md: '12px' },
    },
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        backgroundColor: 'white',
        '& fieldset': {
            borderColor: '#e5e7eb',
        },
        '&:hover fieldset': {
            borderColor: '#9ca3af',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        color: '#6b7280',
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
};

const DetailField = ({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    return (
        <div className="pb-4 mb-4 border-b border-dashed border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {label}
            </p>
            <p className="text-sm text-gray-800">
                {value}
            </p>
        </div>
    );
};

// A slim section header used for Injuries / Attachments / Update Status —
// a small pill-style label with a count badge, matching the reference UI.
const SectionLabel = ({
    label,
    count,
}: {
    label: string;
    count?: number;
}) => (
    <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold tracking-wide uppercase bg-[#EAF7F3] text-[#0F9D82] px-2 py-1 rounded">
            {label}
        </span>
        {typeof count === 'number' && (
            <span className="bg-[#1D9BF0] text-white text-[11px] font-medium rounded px-1.5 py-0.5 min-w-[18px] text-center">
                {count}
            </span>
        )}
    </div>
);

// ---------------------------------------------------------------------
// Helpers to safely coerce raw API fields into display-friendly strings
// ---------------------------------------------------------------------

const formatDateTime = (value?: string | null): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Matches the "DD/MM/YYYY/ h:mm AM" style used in the status-log table
const formatLogDateTime = (value?: string | null): string => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();

    let hours = parsed.getHours();
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${day}/${month}/${year}/ ${hours}:${minutes} ${ampm}`;
};

const yesNo = (value: boolean | string | null | undefined): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
        const v = value.trim().toLowerCase();
        if (v === 'true' || v === '1' || v === 'yes') return 'Yes';
        if (v === 'false' || v === '0' || v === 'no') return 'No';
        // otherwise return the original string (e.g. "Yes, from the insurance agency")
        return value;
    }
    return '';
};

// `rca_category` can come back either as a plain string/id or as a nested
// object ({ id, name, ... }) depending on the endpoint. Prefer the
// dedicated `rca_category_name` field, then fall back to whichever shape
// `rca_category` happens to be.
const resolveRcaCategory = (incident: Incident): string => {
    if (incident.rca_category_name) return incident.rca_category_name;

    const raw = incident.rca_category as unknown;
    if (typeof raw === 'string') return raw;
    if (raw && typeof raw === 'object' && 'name' in (raw as any)) {
        return (raw as any).name ?? '';
    }
    return '';
};

// The `injuries` field on the raw Incident is typed as `any[]` since the
// API doesn't publish a strict shape. Defensively pull out the likely
// field names so the table still renders if the API uses slightly
// different keys.
const mapInjuries = (raw: any[] | undefined | null): InjuryRow[] => {
    if (!Array.isArray(raw)) return [];

    return raw.map((injury) => ({
        injuryType:
            injury?.injury_type ??
            injury?.injuryType ??
            injury?.inj_type ??
            injury?.name ??
            '',
        howManyPeople:
            injury?.how_many_people ??
            injury?.howManyPeople ??
            injury?.people_count ??
            injury?.count ??
            '',
        whoGotInjured:
            injury?.who_got_injured ??
            injury?.whoGotInjured ??
            injury?.injured_person ??
            injury?.person_name ??
            '',
    }));
};

const mapWitnesses = (
    raw: Incident['incident_witnesses']
): WitnessRow[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((witness) => !witness._destroy)
        .map((witness) => ({
            name: witness.name ?? '',
            contact: witness.mobile ?? '',
        }));
};

const mapAttachments = (
    raw: IncidentAttachment[] | undefined | null
): AttachmentRow[] => {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((attachment) => attachment.active !== 0)
        .map((attachment) => ({
            id: attachment.id,
            label: attachment.doctype || `Attachment ${attachment.id}`,
            url: attachment.url,
        }));
};

// `logs` is typed as `any[]` — the update-status history. Defensively map
// the likely field names for who made the change, when, the resulting
// status, and any comment left with it.
const mapStatusLogs = (raw: any[] | undefined | null): StatusLogRow[] => {
    if (!Array.isArray(raw)) return [];

    return raw.map((log, index) => ({
        id: String(log?.id ?? index),
        updatedBy:
            log?.updated_by_name ??
            log?.updated_by ??
            log?.user_name ??
            log?.created_by ??
            log?.name ??
            '',
        dateTime: formatLogDateTime(
            log?.created_at ?? log?.updated_at ?? log?.date ?? log?.timestamp
        ),
        status: log?.status ?? log?.current_status ?? log?.new_status ?? log?.state ?? '',
        comment: log?.comment ?? log?.remarks ?? log?.note ?? log?.description ?? '',
    }));
};

// Maps the raw `Incident` API response onto the fields this page renders.
const mapIncidentToView = (incident: Incident): IncidentDetailView => ({
    id: String(incident.id ?? ''),
    status: incident.current_status ?? '',
    site: incident.site_name ?? incident.building_name ?? '',
    region: incident.building_name ?? '',
    tower: incident.tower_name ?? '',
    description: incident.description ?? '',
    incidentDateTime: formatDateTime(incident.inci_date_time || incident.inc_time),
    revisionDateTime: formatDateTime(incident.updated_at),
    reportingDateTime: formatDateTime(incident.created_at),
    reportedBy: incident.created_by ?? '',
    level: incident.inc_level_name ?? '',
    primaryCategory: incident.category_name ?? '',
    categoryForPrimary: incident.sub_category_name ?? '',
    secondaryCategory: incident.sec_category_name ?? '',
    secondaryCategoryFor: incident.sec_sub_category_name ?? '',
    secondaryCategoryForInjury: incident.sec_sub_sub_category_name ?? '',
    supportRequired: yesNo(incident.support_required),
    propertyDamage: yesNo(incident.property_damage),
    propertyDamageCategory: incident.property_damage_category_name ?? '',
    damageEvaluation: incident.damage_evaluation ?? '',
    damageCoveredInsurance: yesNo(incident.damage_covered_insurance),
    damagedRecovered: incident.damaged_recovered ?? '',
    preventiveAction:
        incident.preventive_action ??
        (Array.isArray(incident.preventive_fields) && incident.preventive_fields.length > 0
            ? incident.preventive_fields[0].description ?? incident.preventive_fields[0].action ?? ''
            : ''),
    workRelatedInjury: incident.work_related_injury ?? '',
    rca: incident.rca ?? '',
    rcaCategory: resolveRcaCategory(incident),
    correctiveAction: incident.corrective_action ?? '',
    injuries: mapInjuries(incident.injuries),
    witnesses: mapWitnesses(incident.incident_witnesses),
    attachments: mapAttachments(incident.attachments),
    statusLogs: mapStatusLogs(incident.logs),
});

export const NewIncidentDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [rawIncident, setRawIncident] = useState<Incident | null>(null);
    const [incident, setIncident] = useState<IncidentDetailView | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [updateStatusOpen, setUpdateStatusOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusComment, setStatusComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState<{ url: string; fileName: string } | null>(null);

    // Status options are loaded from the IncidenceStatus tag type so the
    // dropdown stays in sync with the server-side configuration.
    const [statusOptions, setStatusOptions] = useState<{
        id: number | string;
        name: string;
    }[]>([]);

    const fetchStatusOptions = async () => {
        try {
            let baseUrl = localStorage.getItem('baseUrl') || '';
            const token = localStorage.getItem('token') || '';
            if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                baseUrl = 'https://' + baseUrl.replace(/^\/+/, '');
            }

            const resp = await fetch(
                `${baseUrl}/incidence_tags.json?q[tag_type_eq]=IncidenceStatus`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!resp.ok) throw new Error('Failed to fetch statuses');
            const json = await resp.json();
            const items = (json.data || []).map((it: any) => ({ id: it.id, name: it.name }));
            setStatusOptions(items);
        } catch (err) {
            console.error('Failed to fetch incident status options:', err);
        }
    };

    useEffect(() => {
        fetchStatusOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchIncident = async () => {
        if (!id) {
            setError('No incident id was provided in the URL.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await incidentService.getIncidentById(id);

            if (!data) {
                setError('Incident not found.');
                setRawIncident(null);
                setIncident(null);
                return;
            }

            setRawIncident(data);
            const mapped = mapIncidentToView(data);
            setIncident(mapped);
            setNewStatus(mapped.status);
        } catch (err) {
            console.error('Failed to fetch incident details:', err);
            setError('Failed to load incident details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncident();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleEditDetails = () => {
        if (id) {
            // navigate(`/safety/incident/edit/${id}`);
            navigate(`/safety/incident/safety/edit/${id}`);

        }
    };

    const handleDownloadReport = () => {
        toast.info('Download Report is currently available for UI preview only.');
    };

    const handleUpdateStatusSubmit = async () => {
        if (!newStatus) {
            toast.error('Please select a status');
            return;
        }

        if (!id) {
            toast.error('Missing incident id');
            return;
        }

        const selectedStatus = statusOptions.find(
            (option) => String(option.id) === String(newStatus)
        );
        const updatedStatusLabel = selectedStatus?.name || newStatus;

        setSubmitting(true);

        try {
            // POST an OSR log entry so the status change is recorded server-side
            let baseUrl = localStorage.getItem('baseUrl') || '';
            const token = localStorage.getItem('token') || '';
            if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
                baseUrl = 'https://' + baseUrl.replace(/^\/+/, '');
            }

            const resp = await fetch(`${baseUrl}/incidents_create_osr_log.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    cusdirect: `/incidents/${id}`,
                    about: 'Incident',
                    about_id: Number(id),
                    current_status: updatedStatusLabel,
                    comment: statusComment,
                }),
            });

            if (!resp.ok) {
                throw new Error(`HTTP error! status: ${resp.status}`);
            }

            setIncident((previous) =>
                previous ? { ...previous, status: updatedStatusLabel } : previous
            );

            setUpdateStatusOpen(false);
            setStatusComment('');
            toast.success(`Status changed to ${updatedStatusLabel}`);

            // Re-fetch so the page (including the status log table) reflects
            // whatever the server actually saved.
            fetchIncident();
        } catch (err) {
            console.error('Failed to update incident status:', err);
            toast.error('Failed to update status. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <p className="text-sm text-gray-500">Loading incident details…</p>
            </div>
        );
    }

    if (error || !incident) {
        return (
            <div className="p-6">
                <p className="text-sm text-red-600 mb-4">
                    {error ?? 'Incident details could not be loaded.'}
                </p>
                <Button
                    onClick={fetchIncident}
                    className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white"
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="mb-6">
                <nav className="flex items-center text-sm text-gray-600 mb-4">
                    <span>Home</span>
                    <span className="mx-2">{'>'}</span>
                    <span>Safety</span>
                    <span className="mx-2">{'>'}</span>
                    <span>Incident</span>
                </nav>

                <Heading
                    level="h1"
                    variant="primary"
                    spacing="none"
                    className="text-[#C72030] font-semibold"
                >
                    INCIDENT DETAILS
                </Heading>
            </div>

            {/* =====================================================
                INCIDENT DETAIL CARD
            ====================================================== */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className="bg-[#F6F4EE] mb-0 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg text-black">
                        DETAIL (#{incident.id})
                    </CardTitle>

                    <div className="flex gap-2">
                        <Button
                            onClick={handleEditDetails}
                            className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
                        >
                            Edit Details
                        </Button>

                        <Button
                            onClick={() => setUpdateStatusOpen(true)}
                            className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
                        >
                            Update Status
                        </Button>

                        <Button
                            onClick={handleDownloadReport}
                            className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
                        >
                            Download Report
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6 bg-white">
                    {/* Status / Site / Region / Tower */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
                        <DetailField label="Status" value={incident.status} />
                        <DetailField label="Site" value={incident.site} />
                        <DetailField label="Region" value={incident.region} />
                        <DetailField label="Tower" value={incident.tower} />
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1">
                        <DetailField label="Description" value={incident.description} />
                    </div>

                    {/* Date / Time */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
                        <DetailField
                            label="Incident Date and Time"
                            value={incident.incidentDateTime}
                        />
                        <DetailField
                            label="Revision Date and Time"
                            value={incident.revisionDateTime}
                        />
                        <DetailField
                            label="Reporting Date and Time"
                            value={incident.reportingDateTime}
                        />
                        <DetailField label="Reported By" value={incident.reportedBy} />
                    </div>

                    {/* Level / Categories */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
                        <DetailField label="Level" value={incident.level} />
                        <DetailField
                            label="Incident Primary Category"
                            value={incident.primaryCategory}
                        />
                        <DetailField
                            label={
                                incident.primaryCategory
                                    ? `Category For The ${incident.primaryCategory} Incident`
                                    : 'Category For The Incident'
                            }
                            value={incident.categoryForPrimary}
                        />
                        <DetailField
                            label="Incident Secondary Category"
                            value={incident.secondaryCategory}
                        />
                    </div>

                    {/* Secondary Categories / Support / Property Damage */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
                        <DetailField
                            label={
                                incident.secondaryCategory
                                    ? `Secondary Category For The ${incident.secondaryCategory} Incident`
                                    : 'Secondary Category'
                            }
                            value={incident.secondaryCategoryFor}
                        />
                        <DetailField
                            label="Secondary Category For The Injury / Illness Incident"
                            value={incident.secondaryCategoryForInjury}
                        />
                        <DetailField label="Support Required" value={incident.supportRequired} />
                        <DetailField
                            label="Has Any Property Damage Happened In The Incident"
                            value={incident.propertyDamage}
                        />
                    </div>

                    {/* Property Damage */}
                    {incident.propertyDamage === 'Yes' && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8">
                            <DetailField
                                label="Property Damage Category"
                                value={incident.propertyDamageCategory}
                            />
                            <DetailField
                                label="Damage Evaluation"
                                value={incident.damageEvaluation}
                            />
                            <DetailField
                                label="Damage Covered Under Insurance"
                                value={incident.damageCoveredInsurance}
                            />
                            <DetailField
                                label="Damaged Recovered"
                                value={incident.damagedRecovered}
                            />
                        </div>
                    )}

                    {/* Work Related Injury */}
                    <div className="grid grid-cols-1">
                        <DetailField
                            label="Work Related Injury"
                            value={incident.workRelatedInjury}
                        />
                    </div>

                    {/* RCA */}
                    <div className="grid grid-cols-1">
                        <DetailField label="RCA" value={incident.rca} />
                    </div>

                    {/* RCA Category */}
                    <div className="grid grid-cols-1">
                        <DetailField label="RCA Category" value={incident.rcaCategory} />
                    </div>

                    {/* Corrective Action */}
                    <div className="grid grid-cols-1">
                        <DetailField
                            label="Corrective Action"
                            value={incident.correctiveAction}
                        />
                    </div>

                    {/* Preventive Action */}
                    <div className="grid grid-cols-1">
                        <DetailField
                            label="Preventive Action"
                            value={incident.preventiveAction}
                        />
                    </div>
                </CardContent>
            </Card>

            <Dialog
                open={!!previewAttachment}
                onClose={() => setPreviewAttachment(null)}
                maxWidth="md"
                fullWidth
            >
                <DialogContent sx={{ p: 0, position: 'relative', backgroundColor: '#000' }}>
                    <IconButton
                        onClick={() => setPreviewAttachment(null)}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: '#fff',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            zIndex: 1,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {previewAttachment && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={previewAttachment.url}
                            alt={previewAttachment.fileName}
                            style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block' }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* =====================================================
                WITNESSES
            ====================================================== */}

            {/* INJURIES */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className="bg-[#F6F4EE] mb-0">
                    <CardTitle className="text-lg text-black flex items-center gap-2">
                        INJURIES
                        <span className="bg-[#C72030] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {incident.injuries.length}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-x-auto">
                    {incident.injuries.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#F6F7F7] text-left text-gray-600">
                                    <th className="px-6 py-3 font-semibold">Injury Type</th>
                                    <th className="px-6 py-3 font-semibold">How Many Peoples</th>
                                    <th className="px-6 py-3 font-semibold">Who Got Injured</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incident.injuries.map((injury, index) => (
                                    <tr key={index} className="border-t border-gray-100">
                                        <td className="px-6 py-3">{injury.injuryType}</td>
                                        <td className="px-6 py-3">{injury.howManyPeople}</td>
                                        <td className="px-6 py-3">{injury.whoGotInjured}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="px-6 py-4 text-sm text-gray-500">No injuries recorded.</p>
                    )}
                </CardContent>
            </Card>

            {/* ATTACHMENTS */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className="bg-[#F6F4EE] mb-0">
                    <CardTitle className="text-lg text-black flex items-center gap-2">
                        ATTACHMENTS
                        <span className="bg-[#C72030] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {incident.attachments.length}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 bg-white">
                    {incident.attachments.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {incident.attachments.map((attachment) => {
                                const isImage = String(attachment.label || '').startsWith('image/');
                                if (isImage) {
                                    return (
                                        <div key={attachment.id} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                            <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={attachment.url} alt={attachment.label} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="p-2 bg-white border-t border-gray-100">
                                                <p className="text-xs text-gray-600 truncate" title={attachment.label}>{attachment.label}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewAttachment({ url: attachment.url, fileName: attachment.label })}
                                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity"
                                                aria-label={`Preview ${attachment.label}`}
                                            >
                                                <ZoomInIcon style={{ color: '#fff' }} />
                                            </button>
                                        </div>
                                    );
                                }

                                // Non-image: keep as a link but styled as a box
                                return (
                                    <a
                                        key={attachment.id}
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="aspect-square bg-gray-100 flex items-center justify-center p-2">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l5-5 5 5" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-white border-t border-gray-100">
                                            <p className="text-xs text-gray-600 truncate" title={attachment.label}>{attachment.label}</p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No attachments uploaded.</p>
                    )}
                </CardContent>
            </Card>

            {/* UPDATE STATUS (log history) */}
            <Card className="mb-6 border-[#D9D9D9] bg-[#F6F7F7]">
                <CardHeader className="bg-[#F6F4EE] mb-0 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg text-black">UPDATE STATUS</CardTitle>
                    {/* <Button
                        onClick={() => setUpdateStatusOpen(true)}
                        className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white text-sm px-4 py-2"
                    >
                        Update Status
                    </Button> */}
                </CardHeader>
                <CardContent className="p-0 bg-white overflow-x-auto">
                    {incident.statusLogs.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[#F6F7F7] text-left text-gray-600">
                                    <th className="px-6 py-3 font-semibold">Updated By</th>
                                    <th className="px-6 py-3 font-semibold">Status</th>
                                    <th className="px-6 py-3 font-semibold">Comment</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incident.statusLogs.map((log) => (
                                    <tr key={log.id} className="border-t border-gray-100">
                                        <td className="px-6 py-3">
                                            <span className="font-semibold text-[#C72030]">{log.updatedBy}</span>
                                            {log.dateTime && (
                                                <span className="text-xs text-gray-500 ml-2">{log.dateTime}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">{log.status}</td>
                                        <td className="px-6 py-3">{log.comment}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="px-6 py-4 text-sm text-gray-500">No status updates yet.</p>
                    )}
                </CardContent>
            </Card>


            <Dialog
                open={updateStatusOpen}
                onClose={() => !submitting && setUpdateStatusOpen(false)}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ color: '#C72030', fontWeight: 600 }}>
                    Update Status
                </DialogTitle>

                <DialogContent>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
                        <FormControl fullWidth variant="outlined">
                            <InputLabel shrink>Status</InputLabel>
                            <MuiSelect
                                label="Status"
                                value={newStatus}
                                onChange={(event) => setNewStatus(event.target.value)}
                                displayEmpty
                                sx={fieldStyles}
                                MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
                            >
                                <MenuItem value="">
                                    <em>Select Status</em>
                                </MenuItem>
                                {statusOptions.map((option) => (
                                    <MenuItem key={option.id} value={String(option.id)}>
                                        {option.name}
                                    </MenuItem>
                                ))}
                            </MuiSelect>
                        </FormControl>

                        <TextField
                            label="Comment"
                            value={statusComment}
                            onChange={(event) => setStatusComment(event.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    backgroundColor: 'white',
                                },
                            }}
                        />
                    </div>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <MuiButton
                        onClick={() => setUpdateStatusOpen(false)}
                        disabled={submitting}
                        variant="outlined"
                        sx={{
                            color: '#C72030',
                            borderColor: '#C72030',
                            '&:hover': { borderColor: '#C72030', backgroundColor: '#C7203010' },
                        }}
                    >
                        Cancel
                    </MuiButton>

                    <MuiButton
                        onClick={handleUpdateStatusSubmit}
                        disabled={submitting}
                        variant="contained"
                        sx={{
                            backgroundColor: '#C72030',
                            '&:hover': { backgroundColor: '#a91b28' },
                        }}
                    >
                        {submitting ? 'Submitting…' : 'Submit'}
                    </MuiButton>
                </DialogActions>
            </Dialog>
        </div >
    );
};

export default NewIncidentDetailsPage;