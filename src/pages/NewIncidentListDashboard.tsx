import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Plus, ArrowRight } from "lucide-react";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";

// ---------------------------------------------------------------------------
// TEMP DUMMY DATA
// Swap `fetchIncidents()` below for a real API call once the endpoint is
// ready (e.g. GET `${baseUrl}/incidents.json`). The shape of `NewIncidentRow`
// mirrors the columns shown in the reference screenshot — adjust field names
// to match the real response once available.
// ---------------------------------------------------------------------------

interface NewIncidentRow {
    id: number;
    description: string;
    site: string;
    region: string;
    tower: string;
    incidentDate: string; // dd/mm/yyyy
    incidentTime: string; // h:mm AM/PM
    level: string;
    category: string;
    subCategory: string;
    supportRequired: "Yes" | "No";
    assignedTo: string;
    currentStatus: string;
}

const DUMMY_INCIDENTS: NewIncidentRow[] = [
    {
        id: 3839,
        description: "Fire in the park(this is test data please ignore)",
        site: "Living Demo",
        region: "Mumbai",
        tower: "C",
        incidentDate: "19/08/2026",
        incidentTime: "4:25 PM",
        level: "Level 2",
        category: "Security",
        subCategory: "Public Disturbance",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 3838,
        description: "Fire Incident happened at Tower FM",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "19/08/2026",
        incidentTime: "4:14 PM",
        level: "Level 1",
        category: "Construction",
        subCategory: "Construction – Others",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 3835,
        description: "Test",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "19/08/2026",
        incidentTime: "11:41 AM",
        level: "Level 2",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 3064,
        description: "tesetd",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "10/03/2026",
        incidentTime: "1:25 AM",
        level: "Level 1",
        category: "Vehicle accident",
        subCategory: "Vehicle hit the pet/ Stray",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 2914,
        description:
            "Help Desk received multiple calls related to Over Voltage fluctuation at Hillside 1 from Tower 1 & Tower 2 flats & from one of the Flat Tower 2, 1503 received complaint that smoke coming out from her bathroom exhaust fan. Electrician was sent immediately to this flat & voltage was checked through multi-meter at one point & noticed voltage received at that point was 390 Volts.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "B",
        incidentDate: "09/01/2026",
        incidentTime: "3:56 PM",
        level: "Level 0",
        category: "Construction",
        subCategory: "Plant equipment induced collapse",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 2911,
        description:
            "Help Desk received multiple calls related to Over Voltage fluctuation at Hillside 1 from Tower 1 & Tower 2 flats & from one of the Flat Tower 2, 1503 received complaint that smoke coming out from her bathroom exhaust fan.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "B",
        incidentDate: "08/01/2026",
        incidentTime: "11:53 AM",
        level: "Level 0",
        category: "Engineering",
        subCategory: "Electrical",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 2699,
        description: "Satyam got injured. Please action immediately",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "13/10/2025",
        incidentTime: "12:38 PM",
        level: "Level 0",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 1925,
        description: "Health ralated incident",
        site: "Living Demo",
        region: "Mumbai",
        tower: "-",
        incidentDate: "17/02/2025",
        incidentTime: "7:41 PM",
        level: "Level 3",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Approve",
    },
    {
        id: 1804,
        description:
            "Help Desk received multiple calls related to Over Voltage fluctuation at Hillside 1 from Tower 1 & Tower 2 flats & from one of the Flat Tower 2, 1503 received complaint that smoke coming out from her bathroom exhaust fan.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "13/01/2025",
        incidentTime: "12:53 PM",
        level: "Level 1",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 1802,
        description: "TESTING",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "13/01/2025",
        incidentTime: "10:22 AM",
        level: "Level 0",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Approve",
    },
    {
        id: 1109,
        description: "Test Incident",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "15/04/2024",
        incidentTime: "10:57 AM",
        level: "Level 2",
        category: "Building structure and property damage",
        subCategory: "CCTV",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 1078,
        description: "Demo",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "17/06/2019",
        incidentTime: "2:30 PM",
        level: "Level 1",
        category: "Health and Safety",
        subCategory: "Injury / Illness",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 1046,
        description: "Test test",
        site: "Living Demo",
        region: "Mumbai",
        tower: "-",
        incidentDate: "15/02/2024",
        incidentTime: "2:08 PM",
        level: "Level 2",
        category: "Fire",
        subCategory: "Fire - Kitchen/Pantry",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Open",
    },
    {
        id: 1032,
        description: "Test incident",
        site: "Living Demo",
        region: "Mumbai",
        tower: "C",
        incidentDate: "05/02/2024",
        incidentTime: "12:40 PM",
        level: "Level 0",
        category: "Engineering",
        subCategory: "Mechanical",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 1014,
        description: "This is test incident. Please ignore",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "24/01/2024",
        incidentTime: "2:24 PM",
        level: "Level 0",
        category: "Near Miss / Good Catch",
        subCategory: "Near Miss / Good Catch",
        supportRequired: "Yes",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 1010,
        description:
            "The lift door sensors didn't work and hence a maid hand got injured as she was trying to stop the lift four with her hand.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "19/01/2024",
        incidentTime: "12:25 AM",
        level: "Level 1",
        category: "Engineering",
        subCategory: "Other Engineering Systems",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 942,
        description: "MSEB Power Failure happend at Godrej Emrald at 9:17 AM . All utilities are working on DG supply.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "A",
        incidentDate: "09/11/2023",
        incidentTime: "12:05 PM",
        level: "Level 1",
        category: "Utility failure",
        subCategory: "Water supply",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Pending",
    },
    {
        id: 940,
        description:
            "Help Desk received multiple calls related to Over Voltage fluctuation at Hillside 1 from Tower 1 & Tower 2 flats & from one of the Flat Tower 2, 1503 received complaint that smoke coming out from her bathroom exhaust fan.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "09/11/2023",
        incidentTime: "11:55 AM",
        level: "Level 1",
        category: "Construction",
        subCategory: "Construction – Others",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Closed",
    },
    {
        id: 933,
        description:
            "Help Desk received multiple calls related to Over Voltage fluctuation at Hillside 1 from Tower 1 Tower 2 flats from one of the Flat Tower 2 1503 received complaint that smoke coming out from her bathroom exhaust fan.",
        site: "Living Demo",
        region: "Mumbai",
        tower: "FM",
        incidentDate: "30/10/2023",
        incidentTime: "7:47 PM",
        level: "Level 1",
        category: "Animal-related incidents",
        subCategory: "Wild animal sighting",
        supportRequired: "No",
        assignedTo: "-",
        currentStatus: "Closed",
    },
];

// Pad the dummy set out so pagination (multiple pages) has something to show,
// same as the "1 2 3 4 » Last »" footer in the reference screenshot.
const buildExtendedDummyData = (): NewIncidentRow[] => {
    const extra: NewIncidentRow[] = [];
    for (let i = 1; i <= 45; i++) {
        const base = DUMMY_INCIDENTS[i % DUMMY_INCIDENTS.length];
        extra.push({
            ...base,
            id: base.id - i * 3,
            description: `${base.description}`,
        });
    }
    return [...DUMMY_INCIDENTS, ...extra];
};

const ALL_DUMMY_DATA = buildExtendedDummyData();

const PAGE_SIZE = 20;

const STATUS_COLORS: Record<string, string> = {
    Pending: "text-yellow-700",
    Closed: "text-green-700",
    Open: "text-blue-700",
    Approve: "text-purple-700",
};

export const NewIncidentListDashboard = () => {
    const navigate = useNavigate();

    const [loading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Swap this for a real fetch once the API is available:
    // const [incidents, setIncidents] = useState<NewIncidentRow[]>([]);
    // useEffect(() => { fetchIncidents(); }, []);
    const incidents = ALL_DUMMY_DATA;

    const filteredIncidents = useMemo(() => {
        if (!appliedSearch.trim()) return incidents;
        return incidents.filter((row) =>
            String(row.id).includes(appliedSearch.trim())
        );
    }, [incidents, appliedSearch]);

    const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / PAGE_SIZE));
    const paginatedIncidents = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredIncidents.slice(start, start + PAGE_SIZE);
    }, [filteredIncidents, currentPage]);

    const handleSearchSubmit = () => {
        setAppliedSearch(searchInput);
        setCurrentPage(1);
    };

    const columns: ColumnConfig[] = [
        { key: "id", label: "ID", sortable: true, defaultVisible: true, draggable: true },
        { key: "description", label: "Description", sortable: false, defaultVisible: true, draggable: true },
        { key: "site", label: "Site", sortable: true, defaultVisible: true, draggable: true },
        { key: "region", label: "Region", sortable: true, defaultVisible: true, draggable: true },
        { key: "tower", label: "Tower", sortable: true, defaultVisible: true, draggable: false },
        { key: "incidentTime", label: "Incident Time", sortable: true, defaultVisible: true, draggable: true },
        { key: "level", label: "Level", sortable: true, defaultVisible: true, draggable: true },
        { key: "category", label: "Category", sortable: true, defaultVisible: true, draggable: true },
        { key: "subCategory", label: "Sub Category", sortable: true, defaultVisible: true, draggable: true },
        { key: "supportRequired", label: "Support Required", sortable: true, defaultVisible: true, draggable: true },
        { key: "assignedTo", label: "Assigned To", sortable: true, defaultVisible: true, draggable: true },
        { key: "currentStatus", label: "Current Status", sortable: true, defaultVisible: true, draggable: true },
    ];

    const renderCell = (item: NewIncidentRow, columnKey: string) => {
        switch (columnKey) {
            case "id":
                return <span className="text-[#C72030] font-medium">#{item.id}</span>;
            case "description":
                return (
                    <span className="block max-w-[420px] whitespace-normal text-gray-700">
                        {item.description}
                    </span>
                );
            case "incidentTime":
                return (
                    <div className="whitespace-nowrap">
                        <div>{item.incidentDate}</div>
                        <div className="text-gray-500">{item.incidentTime}</div>
                    </div>
                );
            case "currentStatus":
                return (
                    <span className={`font-medium ${STATUS_COLORS[item.currentStatus] ?? "text-gray-700"}`}>
                        {item.currentStatus}
                    </span>
                );
            case "supportRequired":
                return <span>{item.supportRequired}</span>;
            default:
                return <span>{String((item as any)[columnKey] ?? "-")}</span>;
        }
    };

    return (
        <div className="p-4 sm:p-6">
            {/* Top bar: search-by-ID + Add button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search using Incident Id"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSearchSubmit();
                        }}
                        className="h-10 w-[260px]"
                    />
                    <Button
                        onClick={handleSearchSubmit}
                        className="h-10 w-10 p-0 !bg-[#C72030] hover:!bg-[#C72030]/90"
                    >
                        <ArrowRight className="w-4 h-4 text-white" />
                    </Button>
                </div>

                <Button
                    onClick={() => navigate("/safety/incident/new-add")}
                    className="!bg-[#C72030] hover:!bg-[#C72030]/90 !text-white"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
            </div>

            <EnhancedTable
                data={paginatedIncidents}
                columns={columns}
                renderCell={renderCell}
                renderActions={(item: NewIncidentRow) => (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/safety/incident/view-new/${item.id}`)}
                    >
                        <Eye className="w-4 h-4 text-[#C72030]" />
                    </Button>
                )}
                loading={loading}
                emptyMessage="No incidents found"
                enableSearch={false}
                enableExport={false}
                storageKey="new-incidents-dashboard"
                pagination={false}
            />

            {/* Numbered pagination, matching the reference footer */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-1 text-sm">
                    {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((page) => (
                        <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={
                                page === currentPage
                                    ? "!bg-[#C72030] !text-white h-8 w-8 p-0"
                                    : "h-8 w-8 p-0"
                            }
                        >
                            {page}
                        </Button>
                    ))}
                    {totalPages > 4 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3"
                            >
                                »
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="h-8 px-3"
                            >
                                Last »
                            </Button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default NewIncidentListDashboard;