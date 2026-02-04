import { createRoot } from "react-dom/client";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LayoutProvider } from "./contexts/LayoutContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";
import { EnhancedSelectProvider } from "./providers/EnhancedSelectProvider";
import { initializeGlobalMUISelectSearchEnhancer } from "./utils/globalMUISelectSearchEnhancer";
import "./styles/enhanced-select.css"; // Global enhanced select styles
import { Layout } from "./components/Layout";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import DashboardConfiguration from "./pages/DashboardConfiguration";
import ParkingBookingListSiteWise from "./pages/ParkingBookingListSiteWise";
import ConditionalParkingPage from "./pages/ConditionalParkingPage";

// Import existing pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import Invoice Approvals page
import { InvoiceApprovalsPage } from "./pages/InvoiceApprovalsPage";
import { AddInvoiceApprovalsPage } from "./pages/settings/AddInvoiceApprovalsPage";

// Import Asset Groups page
import { AssetGroupsPage } from "./pages/AssetGroupsPage";
import { AssetGroupsPageNew } from "./pages/AssetGroupsPageNew";
import { ChecklistGroupsPage } from "./pages/ChecklistGroupsPage";

// Import Snagging pages
import { SnaggingDashboard } from "./pages/SnaggingDashboard";
import { SnaggingDetailsPage } from "./pages/SnaggingDetailsPage";

// Import Ticket pages
import { TicketDashboard } from "./pages/TicketDashboard";
import { AddTicketDashboard } from "./pages/AddTicketDashboard";
import { TicketDetailsPage } from "./pages/TicketDetailsPage";
import { TicketFeedsPage } from "./pages/TicketFeedsPage";
import { TicketTagVendorPage } from "./pages/TicketTagVendorPage";
import AssignTicketsPage from "./pages/AssignTicketsPage";
import UpdateTicketsPage from "./pages/UpdateTicketsPage";

// Import Fitout pages
import { FitoutSetupDashboard } from "./pages/FitoutSetupDashboard";
import { FitoutRequestListDashboard } from "./pages/FitoutRequestListDashboard";
import { AddProjectDashboard } from "./pages/AddProjectDashboard";
import { FitoutChecklistDashboard } from "./pages/FitoutChecklistDashboard";
import { AddChecklistDashboard } from "./pages/AddChecklistDashboard";
import { FitoutViolationDashboard } from "./pages/FitoutViolationDashboard";
import { CostApprovalPage } from "./pages/maintenance/CostApprovalPage";
import { CostApprovalPage as CostApprovalStandalonePage } from "./pages/CostApprovalPage";

// Import Maintenance pages
import { AssetDashboard } from "./pages/AssetDashboard";
import { AssetDetailsPage } from "./pages/AssetDetailsPage";
import AddAssetPage from "./pages/AddAssetPage";
import { InActiveAssetsDashboard } from "./pages/InActiveAssetsDashboard";
import { MoveAssetPage } from "./pages/MoveAssetPage";
import { DisposeAssetPage } from "./pages/DisposeAssetPage";

// Import Incident pages
import { IncidentListDashboard } from "./pages/IncidentListDashboard";
import { AddIncidentPage } from "./pages/AddIncidentPage";
import { IncidentDetailsPage } from "./pages/IncidentDetailsPage";
import { EditIncidentDetailsPage } from "./pages/EditIncidentDetailsPage";
import PermissionsTestPage from "./pages/PermissionsTestPage";
// import { IncidentListDashboard } from './pages/IncidentListDashboard';
// import { AddIncidentPage } from './pages/AddIncidentPage';
// import { IncidentDetailsPage } from './pages/IncidentDetailsPage';
// import { EditIncidentDetailsPage } from './pages/EditIncidentDetailsPage';

// Import Inventory pages
import { InventoryDashboard } from "./pages/InventoryDashboard";
import { InventoryDetailsPage } from "./pages/InventoryDetailsPage";
import { InventoryFeedsPage } from "./pages/InventoryFeedsPage";
import { EditInventoryPage } from "./pages/EditInventoryPage";
import InventoryConsumptionDashboard from "./pages/InventoryConsumptionDashboard";
import InventoryConsumptionViewPage from "./pages/InventoryConsumptionViewPage";
import EcoFriendlyListPage from "./pages/EcoFriendlyListPage";
import { NewInboundPage } from "./pages/NewInboundPage";
import { NewOutboundPage } from "./pages/NewOutboundPage";
import { OutboundListPage } from "./pages/OutboundListPage";
import { OutboundDetailPage } from "./pages/OutboundDetailPage";

// Import Task pages
import { ScheduledTaskDashboard } from "./pages/maintenance/ScheduledTaskDashboard";
import { TaskDetailsPage } from "./pages/TaskDetailsPage";
import { JobSheetPage } from "./pages/JobSheetPage";

// Import Utility pages
import { UtilityDashboard } from "./pages/UtilityDashboard";
import { AddAssetDashboard } from "./pages/AddAssetDashboard";
import { AddEnergyAssetDashboard } from "./pages/AddEnergyAssetDashboard";
import { UtilityWaterDashboard } from "./pages/UtilityWaterDashboard";
import { AddWaterAssetDashboard } from "./pages/AddWaterAssetDashboard";
import { EditWaterAssetDashboard } from "./pages/EditWaterAssetDashboard";
import UtilitySTPDashboard from "./pages/UtilitySTPDashboard";
import AddSTPAssetDashboard from "./pages/AddSTPAssetDashboard";
import UtilityEVConsumptionDashboard from "./pages/UtilityEVConsumptionDashboard";
import UtilityDailyReadingsDashboard from "./pages/UtilityDailyReadingsDashboard";
import EditMeasurementPage from "./pages/EditMeasurementPage";
import UtilitySolarGeneratorDashboard from "./pages/UtilitySolarGeneratorDashboard";
import { UtilityRequestDashboard } from "./pages/UtilityRequestDashboard";
import { UtilityRequestDetailsPage } from "./pages/UtilityRequestDetailsPage";
import { AddUtilityRequestPage } from "./pages/AddUtilityRequestPage";
import { EditUtilityRequestPage } from "./pages/EditUtilityRequestPage";
import UtilityConsumptionDashboard from "./pages/UtilityConsumptionDashboard";
import { GenerateUtilityBillPage } from "./pages/GenerateUtilityBillPage";

// Import Waste Generation pages
import UtilityWasteGenerationDashboard from "./pages/UtilityWasteGenerationDashboard";
import { UtilityWasteGenerationSetupDashboard } from "./pages/UtilityWasteGenerationSetupDashboard";
import AddWasteGenerationPage from "./pages/AddWasteGenerationPage";
import EditWasteGenerationPage from "./pages/EditWasteGenerationPage";
import { WasteGenerationDetailsPage } from "./pages/WasteGenerationDetailsPage";

// Import Survey pages
import { SurveyListDashboard } from "./pages/SurveyListDashboard";
import { AddSurveyPage } from "./pages/AddSurveyPage";
import { EditSurveyPage } from "./pages/EditSurveyPage";
import { SurveyDetailsPage } from "./pages/SurveyDetailsPage";
import { SurveyMappingDashboard } from "./pages/SurveyMappingDashboard";
import { AddSurveyMapping } from "./pages/AddSurveyMapping";
import { EditSurveyMapping } from "./pages/EditSurveyMapping";
import { SurveyMappingDetailsPage } from "./pages/SurveyMappingDetailsPage";
import { SurveyResponseDashboard } from "./pages/SurveyResponseDashboard";
import { SurveyResponsePage } from "./pages/SurveyResponsePage";
import { SurveyResponseDetailPage } from "./pages/SurveyResponseDetailPage";

// Import Schedule pages
import { ScheduleListDashboard } from "./pages/ScheduleListDashboard";
import { AddSchedulePage } from "./pages/AddSchedulePage";
import { ScheduleExportPage } from "./pages/ScheduleExportPage";
import { EditSchedulePage } from "./pages/EditSchedulePage";
import CloneSchedulePage from "./pages/CloneSchedulePage";
import { CopySchedulePage } from "./pages/CopySchedulePage";
import { ViewSchedulePage } from "./pages/ViewSchedulePage";

// Import Visitors pages
import { VisitorsDashboard } from "./pages/VisitorsDashboard";
import { VisitorsHistoryDashboard } from "./pages/VisitorsHistoryDashboard";
import { VisitorDetailsPage } from "./pages/VisitorDetailsPage";
import { PatrollingDashboard } from "./pages/PatrollingDashboard";
import { PatrollingDetailsPage } from "./pages/PatrollingDetailsPage";
import { PatrollingCreatePage } from "./pages/PatrollingCreatePage";
import { PatrollingEditPage } from "./pages/PatrollingEditPage";
import { VisitorFormPage } from "./pages/VisitorFormPage";
import { VisitorManagementSetup } from "./pages/VisitorManagementSetup";
import { AddVisitorGatePage } from "./pages/AddVisitorGatePage";
import { EditVisitorGatePage } from "./pages/EditVisitorGatePage";
import { SupportStaffPage } from "./pages/SupportStaffPage";
import { EditSupportStaffPage } from "./pages/EditSupportStaffPage";
import { VisitingPurposePage } from "./pages/VisitingPurposePage";

// Import Icons pages
import { IconsDashboard } from "./pages/IconsDashboard";
import { AddIconPage } from "./pages/AddIconPage";
import { EditIconPage } from "./pages/EditIconPage";

// Import new dashboard pages
import { IncidentDashboard } from "./pages/IncidentDashboard";
import { PermitToWorkDashboard } from "./pages/PermitToWorkDashboard";
import { PermitDetails } from "./pages/PermitDetails";
import PermitSafetyCheckForm from "./pages/PermitSafetyCheckForm";
import { PermitPendingApprovalsDashboard } from "./pages/PermitPendingApprovalsDashboard";
import { VendorPermitForm } from "./pages/VendorPermitForm";
import FillForm from "./pages/FillForm";
import FillJSAForm from "./pages/FillJSAForm";
import { AddPermitChecklist } from "./pages/AddPermitChecklist";
import { PermitChecklistList } from "./pages/PermitChecklistList";
import { PermitChecklistDetails } from "./pages/PermitChecklistDetails";
import { EditPermitChecklist } from "./pages/EditPermitCheklist";
import { EditPermitPage } from "./pages/EditPermitPage";

import { LeadDashboard } from "./pages/LeadDashboard";
import { EnergyDashboard } from "./pages/EnergyDashboard";

// // Import Inventory pages
// import { InventoryDashboard } from "./pages/InventoryDashboard";
// import { InventoryDetailsPage } from "./pages/InventoryDetailsPage";
// import { InventoryFeedsPage } from "./pages/InventoryFeedsPage";
// import { EditInventoryPage } from "./pages/EditInventoryPage";
// import InventoryConsumptionDashboard from "./pages/InventoryConsumptionDashboard";
// import InventoryConsumptionViewPage from "./pages/InventoryConsumptionViewPage";
// import EcoFriendlyListPage from "./pages/EcoFriendlyListPage";

// // Import Task pages
// import { ScheduledTaskDashboard } from "./pages/maintenance/ScheduledTaskDashboard";
// import { TaskDetailsPage } from "./pages/TaskDetailsPage";

// // Import Utility pages
// import { UtilityDashboard } from "./pages/UtilityDashboard";
// import { AddAssetDashboard } from "./pages/AddAssetDashboard";
// import { AddEnergyAssetDashboard } from "./pages/AddEnergyAssetDashboard";
// import { UtilityWaterDashboard } from "./pages/UtilityWaterDashboard";
// import { AddWaterAssetDashboard } from "./pages/AddWaterAssetDashboard";
// import UtilitySTPDashboard from "./pages/UtilitySTPDashboard";
// import AddSTPAssetDashboard from "./pages/AddSTPAssetDashboard";
// import UtilityEVConsumptionDashboard from "./pages/UtilityEVConsumptionDashboard";
// import UtilitySolarGeneratorDashboard from "./pages/UtilitySolarGeneratorDashboard";

// // Import Waste Generation pages
// import UtilityWasteGenerationDashboard from "./pages/UtilityWasteGenerationDashboard";
// import { UtilityWasteGenerationSetupDashboard } from "./pages/UtilityWasteGenerationSetupDashboard";
// import AddWasteGenerationPage from "./pages/AddWasteGenerationPage";

// // Import Survey pages
// import { SurveyListDashboard } from "./pages/SurveyListDashboard";
// import { AddSurveyPage } from "./pages/AddSurveyPage";
// import { SurveyMappingDashboard } from "./pages/SurveyMappingDashboard";
// import { SurveyResponseDashboard } from "./pages/SurveyResponseDashboard";
// import { SurveyResponsePage } from "./pages/SurveyResponsePage";

// // Import Schedule pages
// import { ScheduleListDashboard } from "./pages/ScheduleListDashboard";
// import { AddSchedulePage } from "./pages/AddSchedulePage";
// import { ScheduleExportPage } from "./pages/ScheduleExportPage";
// import { EditSchedulePage } from "./pages/EditSchedulePage";
// import { CopySchedulePage } from "./pages/CopySchedulePage";
// import { ViewSchedulePage } from "./pages/ViewSchedulePage";
import { ViewPerformancePage } from "./pages/ViewPerformancePage";

// // Import Visitors pages
// import { VisitorsDashboard } from "./pages/VisitorsDashboard";
// import { VisitorsHistoryDashboard } from "./pages/VisitorsHistoryDashboard";
// import { PatrollingDashboard } from "./pages/PatrollingDashboard";
// import { PatrollingDetailsPage } from "./pages/PatrollingDetailsPage";

// Import Staff pages
import { StaffsDashboard } from "./pages/StaffsDashboard";

// Import Staff Details page
import { StaffDetailsPage } from "./pages/StaffDetailsPage";

// Import Edit Staff page
import { EditStaffPage } from "./pages/EditStaffPage";

// Import Add Staff page
import { AddStaffPage } from "./pages/AddStaffPage";

// Import Mailroom pages
import { InboundListPage } from "./pages/InboundListPage";
import { InboundDetailPage } from "./pages/InboundDetailPage";

import { FnBRestaurantDashboard } from "./pages/FnBRestaurantDashboard";
import { FnBRestaurantDetailsPage } from "./pages/FnBRestaurantDetailsPage";
import { ProductSetupDetailPage } from "./pages/ProductSetupDetailPage";
import { ProductEditPage } from "./pages/ProductEditPage";
import { RestaurantOrderDetailPage } from "./pages/RestaurantOrderDetailPage";
import { FnBDiscountsPage } from "./pages/FnBDiscountsPage";
import { AddRestaurantPage } from "./pages/AddRestaurantPage";
import ParkingDashboard from "./pages/ParkingDashboard";
import ParkingDetailsPage from "./pages/ParkingDetailsPage";
import ParkingBookingsDashboard from "./pages/ParkingBookingsDashboard";
import ParkingCreatePage from "./pages/ParkingCreatePage";
import ParkingEditPage from "./pages/ParkingEditPage";
import { ParkingCategoryPage } from "./pages/ParkingCategoryPage";
import { SlotConfigurationPage } from "./pages/SlotConfigurationPage";
import { AddSlotConfigurationPage } from "./pages/AddSlotConfigurationPage";
import { EditSlotConfigurationPage } from "./pages/EditSlotConfigurationPage";
import { TimeSlotSetupPage } from "./pages/TimeSlotSetupPage";

// Import Design Insights pages
import { DesignInsightsDashboard } from "./pages/DesignInsightsDashboard";
import { AddDesignInsightDashboard } from "./pages/AddDesignInsightDashboard";
import { DesignInsightDetailsDashboard } from "./pages/DesignInsightDetailsDashboard";
import { EditDesignInsightDashboard } from "./pages/EditDesignInsightDashboard";
import { HOTODashboard } from "./pages/HOTODashboard";

// Import Security pages
import { VehicleParkingDashboard } from "./pages/VehicleParkingDashboard";
import { RVehiclesDashboard } from "./pages/RVehiclesDashboard";
import { RVehiclesHistoryDashboard } from "./pages/RVehiclesHistoryDashboard";

// Import GVehiclesDashboard
import { GVehiclesDashboard } from "./pages/GVehiclesDashboard";

// Import GVehicleOutDashboard
import { GVehicleOutDashboard } from "./pages/GVehicleOutDashboard";

// Import Gate Pass pages
import { GatePassDashboard } from "./pages/GatePassDashboard";
import { GatePassInwardsDashboard } from "./pages/GatePassInwardsDashboard";
import { GatePassInwardsDetailPage } from "./pages/GatePassInwardsDetailPage";
import { AddGatePassInwardPage } from "./pages/AddGatePassInwardPage";
import { GatePassOutwardsDashboard } from "./pages/GatePassOutwardsDashboard";
import { GatePassOutwardsAddPage } from "./pages/GatePassOutwardsAddPage";
import { GatePassOutwardsDetailPage } from "./pages/GatePassOutwardsDetailPage";

// Import Space Management pages
import { SpaceManagementBookingsDashboard } from "./pages/SpaceManagementBookingsDashboard";
import { SpaceManagementSeatRequestsDashboard } from "./pages/SpaceManagementSeatRequestsDashboard";

// Import Seat Setup pages
import { SeatSetupDashboard } from "./pages/setup/SeatSetupDashboard";
import { AddSeatSetupDashboard } from "./pages/setup/AddSeatSetupDashboard";
import { EditSeatSetupDashboard } from "./pages/setup/EditSeatSetupDashboard";
import { SeatTypeDashboard } from "./pages/SeatTypeDashboard";

// Import Shift page
import { ShiftDashboard } from "./pages/setup/ShiftDashboard";
import { ShiftDashboard as AccountShiftDashboard } from "./pages/ShiftDashboard";
import { RosterDashboard as AccountRosterDashboard } from "./pages/RosterDashboard";
import { RosterCreatePage } from "./pages/RosterCreatePage";
import { RosterDetailPage } from "./pages/RosterDetailPage";
import { RosterEditPage } from "./pages/RosterEditPage";

// Import Setup User pages
import { FMUserDashboard } from "./pages/setup/FMUserDashboard";
import { AddFMUserDashboard } from "./pages/setup/AddFMUserDashboard";
import { OccupantUsersDashboard } from "./pages/setup/OccupantUsersDashboard";
import { AddOccupantUserDashboard } from "./pages/setup/AddOccupantUserDashboard";
// import { AddUserPage } from "./pages/AddUserPage";
import { ManageUsersPage } from "./pages/ManageUsersPage";
import { ViewManageUserPage } from "./pages/setup/ViewManageUserPage";
import { ManageFlatsPage } from "./pages/setup/ManageFlatsPage";
import EditFlatPage from "./pages/setup/EditFlatPage";
import { SpecialUsersCategoryDashboard } from "./pages/setup/SpecialUsersCategoryDashboard";
import { KYCDetailsDashboard } from "./pages/setup/KYCDetailsDashboard";
import { KYCDetailView } from "./pages/setup/KYCDetailView";
import { HelpdeskSetupDashboard } from "./pages/setup/HelpdeskSetupDashboard";
import { CommunicationSetupDashboard } from "./pages/setup/CommunicationSetupDashboard";

// Import Communication pages
import NoticePage from "./pages/communication/NoticePage";
import AddNoticePage from "./pages/communication/AddNoticePage";
import NoticeDetailPage from "./pages/communication/NoticeDetailPage";
import EventsPage from "./pages/communication/EventsPage";
import CommunicationAddEventPage from "./pages/communication/AddEventPage";
import EventDetailPage from "./pages/communication/EventDetailPage";
import PollsPage from "./pages/communication/PollsPage";
import AddPollPage from "./pages/communication/AddPollPage";
import NotificationsPage from "./pages/communication/NotificationsPage";

// Import User Roasters pages
import { UserRoastersDashboard } from "./pages/setup/UserRoastersDashboard";
import { CreateRosterTemplateDashboard } from "./pages/setup/CreateRosterTemplateDashboard";

// Import Employee pages
import { EmployeesDashboard } from "./pages/setup/EmployeesDashboard";
import { AddEmployeeDashboard } from "./pages/setup/AddEmployeeDashboard";
import { EditEmployeePage } from "./pages/setup/EditEmployeePage";

// Import Check In Margin page
import { CheckInMarginDashboard } from "./pages/setup/CheckInMarginDashboard";

// Import AMC pages
import { AMCDashboard } from "./pages/AMCDashboard";
import { AddAMCPage } from "./pages/AddAMCPage";
import { AMCDetailsPage } from "./pages/AMCDetailsPage";
import { EditAMCPage } from "./pages/EditAMCPage";

// Import Service pages
import { ServiceDashboard } from "./pages/ServiceDashboard";
import { AddServicePage } from "./pages/AddServicePage";
import { ServiceDetailsPage } from "./pages/ServiceDetailsPage";
import EditServicePage from "./pages/EditServicePage";

// Import Attendance pages
import { AttendanceDashboard } from "./pages/AttendanceDashboard";
import { AttendanceDetailsPage } from "./pages/AttendanceDetailsPage";

// Import Roster Calendar page
import { RosterCalendarDashboard } from "./pages/setup/RosterCalendarDashboard";

// Import Export page
import { ExportDashboard } from "./pages/setup/ExportDashboard";

// Import Employee Details page
import { EmployeeDetailsPage } from "./pages/setup/EmployeeDetailsPage";

// Import Permit pages
import { PermitListDashboard } from "./pages/PermitListDashboard";
import { AddPermitPage } from "./pages/AddPermitPage";

// Import Operational Audit pages
import { OperationalAuditScheduledDashboard } from "./pages/OperationalAuditScheduledDashboard";
import { AddOperationalAuditSchedulePage } from "./pages/AddOperationalAuditSchedulePage";
import { OperationalAuditConductedDashboard } from "./pages/OperationalAuditConductedDashboard";
import { OperationalAuditMasterChecklistsDashboard } from "./pages/OperationalAuditMasterChecklistsDashboard";

// Import Vendor Audit pages
import { VendorAuditScheduledDashboard } from "./pages/VendorAuditScheduledDashboard";
import { VendorAuditConductedDashboard } from "./pages/VendorAuditConductedDashboard";
import { AddVendorAuditSchedulePage } from "./pages/AddVendorAuditSchedulePage";
import { AddVendorAuditPage } from "./pages/AddVendorAuditPage";
import { ViewVendorAuditPage } from "./pages/ViewVendorAuditPage";

// Import Asset Audit pages
import { AssetAuditDashboard } from "./pages/AssetAuditDashboard";
import { AddAssetAuditPage } from "./pages/AddAssetAuditPage";
import { EditAssetAuditPage } from "./pages/EditAssetAuditPage";
import { AssetAuditDetailsPage } from "./pages/AssetAuditDetailsPage";
import { AssetAuditReportPage } from "./pages/AssetAuditReportPage";

// Import Master Checklist page
import { AddMasterChecklistPage } from "./pages/AddMasterChecklistPage";

// Import Checklist Master pages
import { ChecklistMasterDashboard } from "./pages/ChecklistMasterDashboard";
import { AddChecklistMasterPage } from "./pages/AddChecklistMasterPage";
import { ChecklistListPage } from "./pages/ChecklistListPage";
import { ChecklistMasterPage } from "./pages/ChecklistMasterPage";

// Import Master User pages
import { FMUserMasterDashboard } from "./pages/master/FMUserMasterDashboard";
import { OccupantUserMasterDashboard } from "./pages/master/OccupantUserMasterDashboard";
import { AddFMUserPage } from "./pages/master/AddFMUserPage";
import { EditFMUserPage } from "./pages/master/EditFMUserPage";
import { ViewFMUserPage } from "./pages/master/ViewFMUserPage";

// Import Material Master page
import { MaterialMasterPage } from "./pages/MaterialMasterPage";

// Import RVehiclesInDashboard and RVehiclesOutDashboard
import { RVehiclesInDashboard } from "./pages/RVehiclesInDashboard";
import { RVehiclesOutDashboard } from "./pages/RVehiclesOutDashboard";

// Import Finance pages
import { MaterialPRDashboard } from "./pages/MaterialPRDashboard";
import { MaterialPRDetailsPage } from "./pages/MaterialPRDetailsPage";
import { CloneMaterialPRPage } from "./pages/CloneMaterialPRPage";
import { MaterialPRFeedsPage } from "./pages/MaterialPRFeedsPage";
import { ServicePRDashboard } from "./pages/ServicePRDashboard";
import { AddMaterialPRDashboard } from "./pages/AddMaterialPRDashboard";
import { AddServicePRDashboard } from "./pages/AddServicePRDashboard";
import { EditServicePRPage } from "./pages/EditServicePRPage";
import { ServicePRDetailsPage } from "./pages/ServicePRDetailsPage";
import { CloneServicePRPage } from "./pages/CloneServicePRPage";
import { ServicePRFeedsPage } from "./pages/ServicePRFeedsPage";
import { PODashboard } from "./pages/PODashboard";
import { AddPODashboard } from "./pages/AddPODashboard";
import { PODetailsPage } from "./pages/PODetailsPage";
import { POFeedsPage } from "./pages/POFeedsPage";
import { WODashboard } from "./pages/WODashboard";
import { WODetailsPage } from "./pages/WODetailsPage";
import { AutoSavedPRDashboard } from "./pages/AutoSavedPRDashboard";
import { GRNSRNDashboard } from "./pages/GRNSRNDashboard";
import { AddGRNDashboard } from "./pages/AddGRNDashboard";
import { GRNDetailsPage } from "./pages/GRNDetailsPage";
import { GRNFeedsPage } from "./pages/GRNFeedsPage";
import { InvoicesDashboard } from "./pages/InvoicesDashboard";
import { InvoicesSESDashboard } from "./pages/InvoicesSESDashboard";
import { BillBookingDashboard } from "./pages/BillBookingDashboard";
import { AddBillPage } from "./pages/AddBillPage";
import { PendingApprovalsDashboard } from "./pages/PendingApprovalsDashboard";
import InvoiceDashboard from "./pages/InvoiceDashboard";

// Import WBS page
import { WBSElementDashboard } from "./pages/WBSElementDashboard";

// Import Work Order pages

// Import Settings pages
import { FMUsersDashboard } from "./pages/settings/FMUsersDashboard";
import { CloneRolePage } from "./pages/settings/CloneRolePage";
import { AccountDashboard } from "./pages/settings/AccountDashboard";

// Import Approval Matrix pages
import { ApprovalMatrixDashboard } from "./pages/settings/ApprovalMatrixDashboard";
import { AddApprovalMatrixDashboard } from "./pages/settings/AddApprovalMatrixDashboard";
import { EditApprovalMatrixDashboard } from "./pages/settings/EditApprovalMatrixDashboard";

// Import Department Dashboard for Settings
import { DepartmentDashboard } from "./pages/settings/DepartmentDashboard";

// Import Role Dashboard for Settings
import { RoleDashboard } from "./pages/settings/RoleDashboard";
import { AddRolePage } from "./pages/settings/AddRolePage";

// Import AddNewBillDashboard
import { AddNewBillDashboard } from "./pages/AddNewBillDashboard";

// Import Edit FM User Details page
import { EditFMUserDetailsPage } from "./pages/settings/EditFMUserDetailsPage";

// Import Energy Asset Routes
import { EnergyAssetDetailsPage } from "./pages/EnergyAssetDetailsPage";
import { EditEnergyAssetPage } from "./pages/EditEnergyAssetPage";

// Import Water Asset Details Route
import { WaterAssetDetailsPage } from "./pages/WaterAssetDetailsPage";

// Import Edit Material PR page
import { EditMaterialPRDashboard } from "./pages/EditMaterialPRDashboard";
import { GRNDashboard } from "./pages/GRNDashboard";

// Import Edit GRN page
import { EditGRNDashboard } from "./pages/EditGRNDashboard";
import { AddInventoryPage } from "./pages/AddInventoryPage";
import { EditAssetDetailsPage } from "./pages/EditAssetDetailsPage";

// Import M Safe pages

import { MSafeDashboard } from "./pages/MSafeDashboard";
import { MSafeUserDetail } from "./pages/MSafeUserDetail";
import { ExternalUserDetail } from "./pages/ExternalUserDetail";
import { EditExternalUserPage } from "./pages/EditExternalUserPage";
import { NonFTEUsersDashboard } from "./pages/NonFTEUsersDashboard";
import { ExternalUsersDashboard } from "./pages/ExternalUsersDashboard";
import { KRCCFormListDashboard } from "./pages/KRCCFormListDashboard";
import { KRCCFormDetail } from "./pages/KRCCFormDetail";

// Import Edit Roster Template page
import { EditRosterTemplatePage } from "./pages/setup/EditRosterTemplatePage";

// Import Accounting Dashboard

// Import Loyalty Rule Engine Dashboard
import { LoyaltyRuleEngineDashboard } from "./pages/LoyaltyRuleEngineDashboard";
import { LoyaltyDashboard } from "./pages/LoyaltyDashboard";
import WalletManagement from "./pages/WalletManagement";
import { LoyaltyCustomers } from "./pages/LoyaltyCustomers";
import { LoyaltyCustomerDetails } from "./pages/LoyaltyCustomerDetails";
import { LoyaltyInventorySection } from "./pages/LoyaltyInventorySection";

// Import OSR pages
import { OSRDashboard } from "./pages/OSRDashboard";
import { OSRDetailsPage } from "./pages/OSRDetailsPage";

// Import OSR Generate Receipt page
import { OSRGenerateReceiptPage } from "./pages/OSRGenerateReceiptPage";

// Import Market Place Accounting pages
import { MarketPlaceAccountingPage } from "./pages/MarketPlaceAccountingPage";
import { MarketPlaceAccountingDetailsPage } from "./pages/MarketPlaceAccountingDetailsPage";
import { MarketPlaceAccountingEditPage } from "./pages/MarketPlaceAccountingEditPage";

// Import Market Place Cost Center page
import { MarketPlaceCostCenterPage } from "./pages/MarketPlaceCostCenterPage";

// Import CRM Campaign pages
import { CRMCampaignPage } from "./pages/CRMCampaignPage";
import { AddLeadPage } from "./pages/AddLeadPage";
import { LeadDetailsPage } from "./pages/LeadDetailsPage";
import { CRMEventsPage } from "./pages/CRMEventsPage";
import { CRMEventDetailsPage } from "./pages/CRMEventDetailsPage";
import { AddEventPage } from "./pages/AddEventPage";

// Import CRM Groups page
import CRMGroupsPage from "./pages/CRMGroupsPage";
import CRMGroupDetailsPage from "./pages/CRMGroupDetailsPage";

// Import Broadcast page
import { BroadcastDashboard } from "./pages/BroadcastDashboard";
import { AddBroadcastPage } from "./pages/AddBroadcastPage";
import { BroadcastDetailsPage } from "./pages/BroadcastDetailsPage";

// Import Notice pages
import NoticePageList from "./pages/communication/NoticePageList";
import NoticePageCreate from "./pages/communication/NoticePageCreate";
import NoticePageEdit from "./pages/communication/NoticePageEdit";
import NoticePageDetails from "./pages/communication/NoticePageDetails";

// Import Communication Event pages
import EventCommunicationList from "./pages/communication/EventCommunicationList";
import EventCommunicationCreate from "./pages/communication/EventCommunicationCreate";
import EventCommunicationEdit from "./pages/communication/EventCommunicationEdit";
import EventCommunicationDetails from "./pages/communication/EventCommunicationDetails";

// Import Redemption Marketplace page
import { RedemptionMarketplacePage } from "./pages/RedemptionMarketplacePage";
import { HotelRewardsPage } from "./pages/HotelRewardsPage";
import { TicketDiscountsPage } from "./pages/TicketDiscountsPage";

// Import Hotel Details page
import { HotelDetailsPage } from "./pages/HotelDetailsPage";

// Import Hotel Booking page
import { HotelBookingPage } from "./pages/HotelBookingPage";

// Import CRM Polls page
import CRMPollsPage from "./pages/CRMPollsPage";

// Import CRM Occupant User Detail page
import { CRMOccupantUserDetailPage } from "./pages/CRMOccupantUserDetailPage";
import { CRMOccupantUserEditPage } from "./pages/CRMOccupantUserEditPage";

// Import Market Place All page
import MarketPlaceAllPage from "./pages/MarketPlaceAllPage";

// Import Market Place Installed page
import { MarketPlaceInstalledPage } from "./pages/MarketPlaceInstalledPage";

// Import Market Place Updates page
import { MarketPlaceUpdatesPage } from "./pages/MarketPlaceUpdatesPage";

// Import Lease Management Detail page
import LeaseManagementDetailPage from "./pages/LeaseManagementDetailPage";

// Import Loyalty Rule Engine Detail page
import LoyaltyRuleEngineDetailPage from "./pages/LoyaltyRuleEngineDetailPage";

// Import Cloud Telephony Detail page
import CloudTelephonyDetailPage from "./pages/CloudTelephonyDetailPage";

// Import Accounting Detail page
import AccountingDetailPage from "./pages/AccountingDetailPage";

// Import Rule List page
import { RuleListPage } from "./pages/RuleListPage";
import { TrainingListDashboard } from "./pages/TrainingListDashboard";
import { AddTrainingRecordDashboard } from "./pages/AddTrainingRecordDashboard";
import { TrainingRecordDetailsPage } from "./pages/TrainingRecordDetailsPage";

// Import Edit Checklist Master page
import { EditChecklistMasterPage } from "./pages/EditChecklistMasterPage";

// Import View Checklist Master page
import { ViewChecklistMasterPage } from "./pages/ViewChecklistMasterPage";

// Import Unit Master page
import { UnitMasterPage } from "./pages/UnitMasterPage";

// Import Location Master pages
import { BuildingPage } from "./pages/master/BuildingPage";
import { WingPage } from "./pages/master/WingPage";
import { AreaPage } from "./pages/master/AreaPage";
import { FloorPage } from "./pages/master/FloorPage";
import { UnitPage } from "./pages/master/UnitPage";
import { RoomPage } from "./pages/master/RoomPage";
import { OpsAccountPage } from "./pages/master/OpsAccountPage";

// Import Address Master page
import { AddressMasterPage } from "./pages/AddressMasterPage";

// Import new master pages
import { UnitMasterByDefaultPage } from "./pages/UnitMasterByDefaultPage";
import { CommunicationTemplatePage } from "./pages/CommunicationTemplatePage";

// Import Add Address page
import { AddAddressPage } from "./pages/AddAddressPage";

// Import Edit Address page
import { EditAddressPage } from "./pages/EditAddressPage";

// Import ChecklistGroupDashboard for setup and settings
import { ChecklistGroupDashboard } from "./pages/setup/ChecklistGroupDashboard";

// Import Booking Setup Dashboard
import { BookingSetupDashboard } from "./pages/BookingSetupDashboard";
import { BookingSetupDetailPage } from "./pages/BookingSetupDetailPage";
import { AddBookingSetupPage } from "./pages/AddBookingSetupPage";

// Import Add Facility Booking page
import { AddFacilityBookingPage } from "./pages/AddFacilityBookingPage";
import { AssetGroupsDashboard } from "./pages/setup/AssetGroupsDashboard";

import ApprovalMatrixSetupPage from "./pages/settings/ApprovalMatrixSetupPage";
import AddApprovalMatrixPage from "./pages/settings/AddApprovalMatrixPage";

import MobileAdminOrderDetailsPage from "./pages/MobileAdminOrderDetailsPage";
import { MobileSurveyPage } from "./pages/mobile/MobileSurveyPage";

import { MobileOrderPlaced } from "./components/mobile/MobileOrderPlaced";
import { ExternalFlowTester } from "./components/mobile/ExternalFlowTester";
import { EmailRuleSetupPage } from "./pages/maintenance/EmailRuleSetupPage";
import { TaskEscalationPage } from "./pages/maintenance/TaskEscalationPage";
import { TicketManagementSetupPage } from "./pages/maintenance/TicketManagementSetupPage";
import { MobileTicketsPage } from "./pages/mobile/MobileTicketsPage";
import { TicketListPage } from "./pages/TicketListPage";
import { MobileRestaurantPage } from "./pages/mobile/MobileRestaurantPage";
import { MobileAssetPage } from "./pages/mobile/MobileAssetPage";
import { MobileOwnerCostAssetPage } from "./pages/mobile/MobileOwnerCostAssetPage";
import { MobileOrdersPage } from "./components/mobile/MobileOrdersPage";
import { QRTestPage } from "./pages/QRTestPage";

import { EscalationMatrixPage } from "./pages/maintenance/EscalationMatrixPage";

// Import Setup pages
import { PermitSetupDashboard } from "./pages/PermitSetupDashboard";
import { IncidentSetupDashboard } from "./pages/IncidentSetupDashboard";
import { IncidentNewDetails } from "./pages/IncidentNewDetails";

// Import Holiday Calendar page
import { HolidayCalendarPage as SettingsHolidayCalendarPage } from "./pages/settings/HolidayCalendarPage";
import { HolidayCalendarPage } from "./pages/HolidayCalendarPage";

import { LoginPage } from "@/pages/LoginPage";
import { OTPVerificationPage } from "@/pages/OTPVerificationPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ForgotPasswordOTPPage } from "@/pages/ForgotPasswordOTPPage";
import { NewPasswordPage } from "@/pages/NewPasswordPage";
import { LoginSuccessPage } from "@/pages/LoginSuccessPage";
import { PasswordResetSuccessPage } from "@/pages/PasswordResetSuccessPage";
import { isAuthenticated } from "@/utils/auth";
import { BookingDetailsPage } from "./pages/BookingDetailsPage";
import { RestaurantOrdersTable } from "./components/RestaurantOrdersTable";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { useEffect, useState } from "react";
import { getCurrency } from "./store/slices/currencySlice";
import { EditBookingSetupPage } from "./pages/setup/EditBookingSetupPage";
import { MobileAdminOrdersPage } from "./pages/MobileAdminOrdersPage";
import DesignInsightsSetupDashboard from "./pages/DesignInsightsSetupDashboard";
import CRMOccupantUsersDashboard from "./pages/CRMOccupantUsersDashboard";
import CRMFMUserDashboard from "./pages/CRMFMUserDashboard";
import CRMCustomersDashboard from "./pages/CRMCustomersDashboard";
import { PatrollingDetailPage } from "./pages/PatrollingDetailPage";
import { WorkOrderAddPage } from "./pages/WorkOrderAddPage";
import LMCDashboard from "./pages/LMCDashboard";
import LMCUserDetail from "./pages/LMCUserDetail";
import TrainingDashboard from "./pages/TrainingDashboard";
import TrainingUserDetailPage from "./pages/TrainingUserDetailPage";
import TrainingDetailPage from "./pages/TrainingDetailPage";
import SMTDashboard from "./pages/SMTDashboard";
import SMTDetailPage from "./pages/SMTDetailPage";
import { RoleConfigList } from "./pages/settings/RoleConfigList";
import { RoleConfigView } from "./pages/settings/RoleConfigView";
import { RoleConfigEdit } from "./pages/settings/RoleConfigEdit";
import { LockFunctionList } from "./pages/settings/LockFunctionList";
import { LockFunctionView } from "./pages/settings/LockFunctionView";
import { LockFunctionEdit } from "./pages/settings/LockFunctionEdit";
import { LockModuleList } from "./pages/settings/LockModuleList";
import { LockSubFunctionList } from "./pages/settings/LockSubFunctionList";
import { LockSubFunctionView } from "./pages/settings/LockSubFunctionView";
import { LockSubFunctionEdit } from "./pages/settings/LockSubFunctionEdit";
import { CrmCustomerDetails } from "./pages/CrmCustomerDetails";
import { EditCrmCustomer } from "./pages/EditCrmCustomer";
import MultipleUserDeletePage from "./pages/MultipleUserDeletePage";
import ReporteesReassignPage from "./pages/ReporteesReassignPage";
import { InvoiceDetails } from "./pages/InvoiceDetails";
import VehicleDetails from "./components/VehicleDetails";
import VehicleCheckIn from "./components/VehicleCheckIn";
import UpdateVehicleHistoryPage from "./pages/UpdateVehicleHistoryPage";
import SacHsn from "./pages/SacHsn";
import DetailPageSacHsn from "./pages/DetailPageSacHsn";
import AddSacHsn from "./pages/AddSacHsn";
import { WOFeedsPage } from "./pages/WOFeedsPage";
import { VendorPage } from "./pages/VendorPage";
import { AddVendorPage } from "./pages/AddVendorPage";
import MsafeReportDownload from "./pages/MsafeReportDownload";
import MsafeDetailReportDownload from "./pages/MsafeDetailReportDownload";
import DetailsVendorPage from "./pages/DetailsVendorPage";
import { EditPODashboard } from "./pages/EditPODashboard";
import { EditWODashboard } from "./pages/EditWODashboard";
import GateNumberPage from "./pages/master/GateNumberPage";
import GatePassTypePage from "./pages/master/GatePassTypePage";
import InventoryTypePage from "./pages/master/InventoryTypePage";
import InventorySubTypePage from "./pages/master/InventorySubTypePage";
import AddGateNumberPage from "./pages/master/AddGateNumberPage";
import AddGatePassTypePage from "./pages/master/AddGatePassTypePage";
import EditGateNumberPage from "./pages/master/EditGateNumberPage";
import EditGatePassTypePage from "./pages/master/EditGatePassTypePage";
import CommunicationTemplateListPage from "./pages/master/CommunicationTemplateListPage";
import AddCommunicationTemplatePage from "./pages/master/AddCommunicationTemplatePage";
import EditCommunicationTemplatePage from "./pages/master/EditCommunicationTemplatePage";

// Import Template pages
import RootCauseAnalysisListPage from "./pages/master/template/RootCauseAnalysisListPage";
import AddRootCauseAnalysisPage from "./pages/master/template/AddRootCauseAnalysisPage";
import EditRootCauseAnalysisPage from "./pages/master/template/EditRootCauseAnalysisPage";
import PreventiveActionListPage from "./pages/master/template/PreventiveActionListPage";
import AddPreventiveActionPage from "./pages/master/template/AddPreventiveActionPage";
import EditPreventiveActionPage from "./pages/master/template/EditPreventiveActionPage";
import ShortTermImpactListPage from "./pages/master/template/ShortTermImpactListPage";
import AddShortTermImpactPage from "./pages/master/template/AddShortTermImpactPage";
import EditShortTermImpactPage from "./pages/master/template/EditShortTermImpactPage";
import LongTermImpactListPage from "./pages/master/template/LongTermImpactListPage";
import AddLongTermImpactPage from "./pages/master/template/AddLongTermImpactPage";
import EditLongTermImpactPage from "./pages/master/template/EditLongTermImpactPage";
import CorrectiveActionListPage from "./pages/master/template/CorrectiveActionListPage";
import AddCorrectiveActionPage from "./pages/master/template/AddCorrectiveActionPage";
import EditCorrectiveActionPage from "./pages/master/template/EditCorrectiveActionPage";

import AddInventoryTypePage from "./pages/master/AddInventoryTypePage";
import EditInventoryTypePage from "./pages/master/EditInventoryTypePage";
import AddInventorySubTypePage from "./pages/master/AddInventorySubTypePage";
import EditInventorySubTypePage from "./pages/master/EditInventorySubTypePage";
import AddOccupantUserPage from "./pages/master/AddOccupantUserPage";
import EditOccupantUserPage from "./pages/master/EditOccupantUserPage";
import { AddCRMCustomerPage } from "./pages/AddCRMCustomerPage";
import CheckHierarchy from "./components/CheckHierarchy";
import { InvoiceFeeds } from "./pages/InvoiceFeeds";
import EditApprovalMatrixPage from "./pages/settings/EditApprovalMatrixPage";
import AllContent from "./components/fm-pdf/AllContent";
import DailyReport from "./components/DailyReport";
import PDFDownloadPage from "./components/PDFDownloadPage";
import PermissionDemo from "./components/PermissionDemo";
import CRMWalletList from "./pages/CRMWalletList";
import CRMWalletPointExpiry from "./pages/CRMWalletPointExpiry";
import CRMWalletDetails from "./pages/CRMWalletDetails";
import EditCRMWalletPointExpiry from "./pages/EditCRMWalletPointExpiry";
import EmployeeDeletionHistory from "./components/EmployeeDeletionHistory";
import AddAddressMaster from "./pages/master/AddAddressMaster";
import EditAddressMaster from "./pages/master/EditAddressMaster";
import MobileLMCPage from "./pages/MobileLMCPage";
import { CompanyPartnersSetupDashboard } from "./pages/CompanyPartnersSetupDashboard";
import { TestimonialsSetupDashboard } from "./pages/TestimonialsSetupDashboard";
import BannerSetupDashboard from "./pages/BannerSetupDashboard";
import AmenitySetupDashboard from "./pages/AmenitySetupDashboard";
import TestimonialDetailsPage from "./pages/TestimonialDetailsPage";
import BannerDetailsPage from "./pages/BannerDetailsPage";
import AmenityDetailsPage from "./pages/AmenityDetailsPage";
import { ViewOccupantUserPage } from "./pages/master/ViewOccupantUserPage";
import WeeklyReport from "./components/WeeklyReport";
import useRouteLogger from "./hooks/useRouteLogger";
import { LocationAccountPage } from "./pages/master/LocationAccountPage";
import LMCPage from "./pages/LMCPage";
import { ChannelsLayout } from "./pages/ChannelsLayout";
import DMConversation from "./pages/DMConversation";
import { TaskSubmissionPage } from "./pages/TaskSubmissionPage";
import { AdminUsersDashboard } from "./pages/admin/AdminUsersDashboard";
import { CreateAdminUserPage } from "./pages/admin/CreateAdminUserPage";
import GroupConversation from "./components/GroupConversation";
import ChannelTasksAll from "./pages/ChannelTasksAll";
import ChatTaskDetailsPage from "./pages/ChatTaskDetailsPage";
import TabularResponseDetailsPage from "./pages/TabularResponseDetailsPage";
import CurrencyPage from "./pages/CurrencyPage";
import { LockedUsersDashboard } from "./pages/settings/LockedUsersDashboard";
import { PRDeletionRequests } from "./pages/PRDeletionRequests";
import { DirectPDFDownloadPage } from "./pages/DirectPDFDownloadPage";
import { DirectPDFDownloadAPIPage } from "./pages/DirectPDFDownloadAPIPage";
import { DeletedPRs } from "./pages/DeletedPRs";
import MsafeDashboardVI from "./pages/MsafeDashboardVI";
import { DashboardMobile } from "./pages/DashboardMobile";
import SafetyCheckAudit from "./pages/SafetyCheckAudit";
import MsafeCirlce from "./pages/MsafeCirlce";
import { TicketJobSheetPage } from "./pages/TicketJobSheetPage";
import Sitemap from "./pages/Sitemap";
import BookingList from "./pages/BookingList";
import IframeDashboardMsafe from "./pages/IframeDashboardMsafe";
import { ProjectsDashboard } from "./pages/ProjectsDashboard";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import ProjectMilestones from "./pages/ProjectMilestones";
import ProjectTasksPage from "./pages/ProjectTasksPage";
import ProjectTaskDetailsPage from "./pages/ProjectTaskDetailsPage";
import { SprintDashboard } from "./pages/SprintDashboard";
import SprintDetailsPage from "./pages/SprintDetailsPage";
import MilestoneDetailsPage from "./pages/MilestoneDetailsPage";
import ProjectTaskDetails from "./pages/ProjectTaskDetails";

// Import Fitout pages (newer ones)
import FitoutChecklists from "./pages/FitoutChecklists";
import FitoutRequests from "./pages/FitoutRequests";
import FitoutRequestAdd from "./pages/FitoutRequestAdd";

import { setupMemberRoutes } from "./routes/setupMemberRoutes";
import { ViewUserPage } from "./pages/ViewUserPage";
import FioutMobileView from "./pages/FioutMobileView";
import FitoutRequestDetailsPageMobile from "./pages/FitoutRequestDetailsPageMobile";
// import RouteLogger from "./components/RouteLogger";

const queryClient = new QueryClient();

function App() {
  const dispatch = useAppDispatch();
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem("baseUrl"));
  const [token, setToken] = useState(localStorage.getItem("token"));
  const hostname = window.location.hostname;
  // Check if it's Oman site
  const isOmanSite = hostname.includes("oig.gophygital.work");
  useRouteLogger();

  // Initialize global MUI Select search enhancer
  useEffect(() => {
    console.log(
      "🚀 Initializing Global MUI Select Search Enhancer from App.tsx"
    );
    const cleanup = initializeGlobalMUISelectSearchEnhancer();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // Check authentication and fetch currency when site is available
  const selectedSite = useAppSelector((s) => s.site.selectedSite);
  useEffect(() => {
    if (!baseUrl || !token) return;
    const urlSiteId =
      new URLSearchParams(window.location.search).get("site_id") || "";
    const id =
      (selectedSite?.id ? String(selectedSite.id) : "") ||
      urlSiteId ||
      localStorage.getItem("selectedSiteId") ||
      "";
    if (!id) return;

    const fetchCurrency = async () => {
      try {
        const response: any = await dispatch(
          getCurrency({ baseUrl, token, id })
        ).unwrap();
        const currency =
          Array.isArray(response) && response[0]?.currency
            ? response[0].currency
            : "INR";
        const currencySymbol =
          Array.isArray(response) && response[0]?.symbol
            ? response[0].symbol
            : "₹";
        if (currency) localStorage.setItem("currency", currency);
        if (currencySymbol)
          localStorage.setItem("currencySymbol", currencySymbol);
      } catch (error) {
        console.log(error);
      }
    };

    fetchCurrency();
  }, [baseUrl, token, selectedSite?.id, dispatch]);

  return (
    <>
      {/* <Router> */}
      <QueryClientProvider client={queryClient}>
        <EnhancedSelectProvider>
          <LayoutProvider>
            <PermissionsProvider>
              <Routes>
                {/* Admin Routes */}
                <Route
                  path="/ops-console"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="master/location/account"
                    element={<OpsAccountPage />}
                  />
                  <Route path="admin/users" element={<AdminUsersDashboard />} />
                  <Route
                    path="admin/create-admin-user"
                    element={<CreateAdminUserPage />}
                  />

                  <Route
                    path="master/user/fm-users"
                    element={<FMUserMasterDashboard />}
                  />
                  <Route
                    path="master/user/fm-users/add"
                    element={<AddFMUserPage />}
                  />
                  <Route
                    path="master/user/fm-users/edit/:id"
                    element={<EditFMUserPage />}
                  />
                  <Route
                    path="master/user/fm-users/view/:id"
                    element={<ViewFMUserPage />}
                  />
                  <Route
                    path="settings/roles/role"
                    element={<RoleDashboard />}
                  />
                  <Route
                    path="settings/roles/role/add"
                    element={<AddRolePage />}
                  />
                  <Route
                    path="settings/account/lock-module"
                    element={<LockModuleList />}
                  />
                  {/* <Route
                      path="settings/account/lock-module/view/:id"
                      element={<LockModuleView />}
                    />
                    <Route
                      path="settings/account/lock-module/edit/:id"
                      element={<LockModuleEdit />}
                    /> */}
                  <Route
                    path="settings/account/lock-function"
                    element={<LockFunctionList />}
                  />
                  <Route
                    path="settings/account/lock-function/view/:id"
                    element={<LockFunctionView />}
                  />
                  <Route
                    path="settings/account/lock-function/edit/:id"
                    element={<LockFunctionEdit />}
                  />
                  {/* <Route
                      path="settings/account/lock-function/create"
                      element={<LockFunctionCreate />}
                    /> */}
                  <Route
                    path="settings/account/lock-sub-function"
                    element={<LockSubFunctionList />}
                  />
                  <Route
                    path="settings/account/lock-sub-function/view/:id"
                    element={<LockSubFunctionView />}
                  />
                  <Route
                    path="settings/account/lock-sub-function/edit/:id"
                    element={<LockSubFunctionEdit />}
                  />
                  <Route
                    path="settings/account/locked-users"
                    element={<LockedUsersDashboard />}
                  />
                  {/* <Route
                      path="settings/account/lock-sub-function/create"
                      element={<LockSubFunctionCreate />}
                    /> */}
                </Route>

                {/* Login Route */}
                <Route path="/thepdf" element={<AllContent />} />
                <Route path="/dailypdf" element={<DailyReport />} />
                <Route path="/weeklypdf" element={<WeeklyReport />} />
                <Route
                  path="/fiout_form/:mappingId"
                  element={<FioutMobileView />}
                />

                <Route
                  path="/login"
                  element={
                    isAuthenticated() ? (
                      <Navigate to="/" replace />
                    ) : (
                      <LoginPage setBaseUrl={setBaseUrl} setToken={setToken} />
                    )
                  }
                />
                <Route
                  path="/otp-verification"
                  element={<OTPVerificationPage />}
                />
                <Route
                  path="/forgot-password"
                  element={<ForgotPasswordPage />}
                />
                <Route
                  path="/forgot-password-otp"
                  element={<ForgotPasswordOTPPage />}
                />
                <Route path="/new-password" element={<NewPasswordPage />} />
                <Route path="/login-success" element={<LoginSuccessPage />} />
                <Route
                  path="/password-reset-success"
                  element={<PasswordResetSuccessPage />}
                />

                <Route
                  path="/direct-pdf-download/:taskId"
                  element={<DirectPDFDownloadPage />}
                />
                <Route
                  path="/app/direct-pdf-download/:taskId"
                  element={<DirectPDFDownloadAPIPage />}
                />
                <Route path="/dashboard-mobile" element={<DashboardMobile />} />
                <Route path="/sitemap" element={<Sitemap />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/msafe-dashboard"
                  element={
                    <ProtectedRoute>
                      <IframeDashboardMsafe />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/dashboard-executive"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/permissions-test"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PermissionsTestPage />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route path="/PermissionDemo" element={<PermissionDemo />} />

                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <TicketDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets/add"
                  element={
                    <ProtectedRoute>
                      <AddTicketDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets/details/:id"
                  element={
                    <ProtectedRoute>
                      <TicketDetailsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets/edit/:id"
                  element={
                    <ProtectedRoute>
                      <UpdateTicketsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tickets/:id/feeds"
                  element={
                    <ProtectedRoute>
                      <TicketFeedsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/visitors"
                  element={
                    <ProtectedRoute>
                      <VisitorsDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <BookingList />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bookings/add"
                  element={
                    <ProtectedRoute>
                      <AddFacilityBookingPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/bookings/:id"
                  element={
                    <ProtectedRoute>
                      <BookingDetailsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cost-approval/:approvalId/:userId"
                  element={
                    <ProtectedRoute>
                      <CostApprovalStandalonePage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div />
                      </Layout>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Index />} />
                  <Route path="/vas/channels" element={<ChannelsLayout />}>
                    <Route
                      index
                      element={
                        <div
                          className={`flex justify-center items-center h-[calc(100vh-112px)] w-[calc(100vw-32rem)]`}
                        >
                          Select a Chat/Group to view messages
                        </div>
                      }
                    />
                    <Route
                      path="/vas/channels/messages/:id"
                      element={<DMConversation />}
                    />
                    <Route
                      path="/vas/channels/groups/:id"
                      element={<GroupConversation />}
                    />
                  </Route>
                  <Route
                    path="/vas/channels/tasks"
                    element={<ChannelTasksAll />}
                  />
                  <Route
                    path="/vas/channels/tasks/:id"
                    element={<ChatTaskDetailsPage />}
                  />

                  {/* Dashboard Routes */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/dashboard/configuration"
                    element={<DashboardConfiguration />}
                  />

                  {/* Holiday Calendar Route */}
                  <Route
                    path="/holiday-calendar"
                    element={<HolidayCalendarPage />}
                  />
                  <Route path="/sitemap" element={<Sitemap />} />

                  {/* Rule Engine Routes */}
                  <Route
                    path="/rule-engine/rule-list"
                    element={<RuleListPage />}
                  />
                  <Route
                    path="/loyalty/dashboard"
                    element={<LoyaltyDashboard />}
                  />
                  <Route
                    path="/loyalty/wallet-management"
                    element={<WalletManagement />}
                  />
                  <Route
                    path="/loyalty/customers"
                    element={<LoyaltyCustomers />}
                  />
                  <Route
                    path="/loyalty/customers/:id"
                    element={<LoyaltyCustomerDetails />}
                  />
                  <Route
                    path="/loyalty/inventory-section"
                    element={<LoyaltyInventorySection />}
                  />
                  <Route
                    path="/loyalty-rule-engine"
                    element={<LoyaltyRuleEngineDashboard />}
                  />

                  {/* Settings Routes */}
                  <Route
                    path="/settings/users"
                    element={<FMUsersDashboard />}
                  />
                  <Route
                    path="/settings/users/edit-details/:id"
                    element={<EditFMUserDetailsPage />}
                  />
                  <Route
                    path="/settings/users/clone-role"
                    element={<CloneRolePage />}
                  />
                  <Route
                    path="/settings/account"
                    element={<AccountDashboard />}
                  />
                  <Route
                    path="/settings/approval-matrix"
                    element={<ApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/approval-matrix/add"
                    element={<AddApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/approval-matrix/edit/:id"
                    element={<EditApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/account/report-setup"
                    element={<PDFDownloadPage />}
                  />
                  <Route
                    path="/settings/roles/department"
                    element={<DepartmentDashboard />}
                  />
                  <Route
                    path="/settings/roles/role"
                    element={<RoleDashboard />}
                  />
                  <Route
                    path="/settings/roles/role/add"
                    element={<AddRolePage />}
                  />
                  <Route
                    path="/settings/users/edit-details/:id"
                    element={<EditFMUserDetailsPage />}
                  />
                  <Route
                    path="/settings/users/clone-role"
                    element={<CloneRolePage />}
                  />
                  <Route
                    path="/settings/account"
                    element={<AccountDashboard />}
                  />
                  <Route
                    path="/settings/account/holiday-calendar"
                    element={<SettingsHolidayCalendarPage />}
                  />
                  <Route
                    path="/settings/account/shift"
                    element={<AccountShiftDashboard />}
                  />
                  <Route
                    path="/settings/account/roster"
                    element={<AccountRosterDashboard />}
                  />
                  <Route
                    path="/settings/account/roster/create"
                    element={<RosterCreatePage />}
                  />

                  <Route
                    path="/settings/account/roster/detail/:id"
                    element={<RosterDetailPage />}
                  />
                  <Route
                    path="/settings/account/roster/edit/:id"
                    element={<RosterEditPage />}
                  />
                  <Route
                    path="/settings/approval-matrix"
                    element={<ApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/approval-matrix/add"
                    element={<AddApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/approval-matrix/edit/:id"
                    element={<EditApprovalMatrixDashboard />}
                  />
                  <Route
                    path="/settings/roles/department"
                    element={<DepartmentDashboard />}
                  />
                  <Route
                    path="/settings/roles/role"
                    element={<RoleDashboard />}
                  />
                  <Route
                    path="/settings/roles/role/add"
                    element={<AddRolePage />}
                  />

                  {/* Settings Asset Setup Routes */}
                  <Route
                    path="/settings/asset-setup/approval-matrix"
                    element={<InvoiceApprovalsPage />}
                  />
                  <Route
                    path="/settings/asset-setup/asset-groups"
                    element={<AssetGroupsPageNew />}
                  />

                  {/* Settings Checklist Setup Routes */}
                  <Route
                    path="/settings/checklist-setup/groups"
                    element={<ChecklistGroupsPage />}
                  />

                  <Route path="/settings/currency" element={<CurrencyPage />} />

                  <Route
                    path="/master/checklist"
                    element={<ChecklistListPage />}
                  />
                  <Route
                    path="/master/checklist-master"
                    element={<ChecklistMasterDashboard />}
                  />
                  <Route
                    path="/master/checklist-master/add"
                    element={<ChecklistMasterPage />}
                  />
                  <Route
                    path="/master/checklist-master/edit/:id"
                    element={<EditChecklistMasterPage />}
                  />
                  <Route
                    path="/master/checklist-master/view/:id"
                    element={<ViewChecklistMasterPage />}
                  />
                  <Route
                    path="/master/checklist/create"
                    element={<ChecklistMasterPage />}
                  />
                  <Route
                    path="/master/checklist/edit/:id"
                    element={<ChecklistMasterPage />}
                  />
                  <Route
                    path="/settings/masters/unit"
                    element={<UnitMasterPage />}
                  />
                  <Route
                    path="/settings/masters/address"
                    element={<AddressMasterPage />}
                  />
                  <Route
                    path="/settings/masters/address/add"
                    element={<AddAddressPage />}
                  />
                  <Route
                    path="/settings/masters/address/edit"
                    element={<EditAddressPage />}
                  />

                  {/* Master Routes */}
                  <Route
                    path="/master/checklist"
                    element={<ChecklistListPage />}
                  />
                  <Route
                    path="/master/checklist/create"
                    element={<ChecklistMasterPage />}
                  />
                  <Route
                    path="/master/checklist/edit/:id"
                    element={<ChecklistMasterPage />}
                  />
                  <Route
                    path="/master/address"
                    element={<AddressMasterPage />}
                  />
                  <Route
                    path="/master/address/add"
                    element={<AddAddressMaster />}
                  />
                  <Route
                    path="/master/address/edit/:id"
                    element={<EditAddressMaster />}
                  />
                  <Route
                    path="/master/unit-default"
                    element={<UnitMasterByDefaultPage />}
                  />

                  <Route
                    path="/master/user/occupant-users/add"
                    element={<AddOccupantUserPage />}
                  />
                  <Route
                    path="/master/user/occupant-users/view/:id"
                    element={<ViewOccupantUserPage />}
                  />
                  <Route
                    path="/master/user/occupant-users/edit/:id"
                    element={<EditOccupantUserPage />}
                  />

                  {/* Setup - Manage Users Route */}
                  <Route
                    path="/settings/manage-users"
                    element={<ManageUsersPage />}
                  />

                  <Route
                    path="/settings/manage-users/view-user/:id"
                    element={<ViewUserPage />}
                  />
                  {/* <Route
                    path="/settings/manage-users/add"
                    element={<AddUserPage />}
                  /> */}
                  <Route
                    path="/settings/manage-users/view/:id"
                    element={<ViewManageUserPage />}
                  />

                  {/* Setup - Special Users Category Route */}
                  <Route
                    path="/settings/special-users-category"
                    element={<SpecialUsersCategoryDashboard />}
                  />

                  {/* Setup - KYC Details Route */}
                  <Route
                    path="/settings/kyc-details"
                    element={<KYCDetailsDashboard />}
                  />

                  {/* Setup - KYC Detail View Route */}
                  <Route
                    path="/kyc-details/:id"
                    element={<KYCDetailView />}
                  />

                  {/* Setup - Helpdesk Setup Route */}
                  <Route
                    path="/settings/helpdesk-setup"
                    element={<HelpdeskSetupDashboard />}
                  />

                  {/* Setup - Communication Setup Route */}
                  <Route
                    path="/settings/communication"
                    element={<CommunicationSetupDashboard />}
                  />



                  {/* <Route
                    path="/communication/events"
                    element={<EventsPage />}
                  />
                  <Route
                    path="/communication/events/add"
                    element={<CommunicationAddEventPage />}
                  />
                  <Route
                    path="/communication/events/view/:id"
                    element={<EventDetailPage />}
                  /> */}
                  <Route
                    path="/communication/polls"
                    element={<PollsPage />}
                  />
                  <Route
                    path="/communication/polls/add"
                    element={<AddPollPage />}
                  />
                  <Route
                    path="/communication/notifications"
                    element={<NotificationsPage />}
                  />

                  {/* Setup Member Routes */}
                  {setupMemberRoutes}

                  {/* Setup - Manage Flats Route */}
                  <Route
                    path="/settings/manage-flats"
                    element={<ManageFlatsPage />}
                  />
                  <Route
                    path="/settings/manage-flats/edit/:flatId"
                    element={<EditFlatPage />}
                  />

                  {/* CRM Routes */}
                  <Route path="/crm/campaign" element={<CRMCampaignPage />} />
                  <Route path="/crm/campaign/add" element={<AddLeadPage />} />
                  <Route
                    path="/crm/campaign/details/:id"
                    element={<LeadDetailsPage />}
                  />
                  <Route
                    path="/crm/customers"
                    element={<CRMCustomersDashboard />}
                  />
                  <Route
                    path="/crm/fm-users"
                    element={<CRMFMUserDashboard />}
                  />
                  <Route
                    path="/crm/occupant-users"
                    element={<CRMOccupantUsersDashboard />}
                  />
                  <Route path="/crm/events" element={<CRMEventsPage />} />
                  <Route path="/crm/events/add" element={<AddEventPage />} />
                  <Route
                    path="/crm/events/details/:id"
                    element={<CRMEventDetailsPage />}
                  />
                  <Route
                    path="/crm/broadcast"
                    element={<BroadcastDashboard />}
                  />
                  <Route
                    path="/crm/broadcast/add"
                    element={<AddBroadcastPage />}
                  />
                  <Route
                    path="/crm/broadcast/details/:id"
                    element={<BroadcastDetailsPage />}
                  />
                  <Route
                    path="/communication/notice"
                    element={<NoticePageList />}
                  />
                  <Route
                    path="/communication/notice/create"
                    element={<NoticePageCreate />}
                  />
                  <Route
                    path="/communication/notice/edit/:id"
                    element={<NoticePageEdit />}
                  />
                  <Route
                    path="/communication/notice/details/:id"
                    element={<NoticePageDetails />}
                  />
                  <Route
                    path="/communication/events"
                    element={<EventCommunicationList />}
                  />
                  <Route
                    path="/communication/events/create"
                    element={<EventCommunicationCreate />}
                  />
                  <Route
                    path="/communication/events/edit/:id"
                    element={<EventCommunicationEdit />}
                  />
                  <Route
                    path="/communication/events/details/:id"
                    element={<EventCommunicationDetails />}
                  />
                  <Route path="/crm/polls" element={<CRMPollsPage />} />
                  <Route path="/crm/polls/add" element={<AddPollPage />} />
                  <Route
                    path="/crm/groups/details/:id"
                    element={<CRMGroupDetailsPage />}
                  />
                  <Route
                    path="/crm/occupant-users/:id"
                    element={<CRMOccupantUserDetailPage />}
                  />
                  <Route
                    path="/crm/occupant-users/:id/edit"
                    element={<CRMOccupantUserEditPage />}
                  />
                  <Route
                    path="/crm/customers/add"
                    element={<AddCRMCustomerPage />}
                  />
                  <Route
                    path="/crm/customers/:id"
                    element={<CrmCustomerDetails />}
                  />
                  <Route
                    path="/crm/customers/edit/:id"
                    element={<EditCrmCustomer />}
                  />
                  <Route path="/crm/wallet-list" element={<CRMWalletList />} />
                  <Route
                    path="/crm/wallet-list/:id"
                    element={<CRMWalletDetails />}
                  />

                  <Route
                    path="/msafedashboard"
                    element={<MsafeDashboardVI />}
                  />

                  <Route
                    path="/crm/point-expiry"
                    element={<CRMWalletPointExpiry />}
                  />
                  <Route
                    path="/crm/point-expiry/edit"
                    element={<EditCRMWalletPointExpiry />}
                  />

                  {/* Snagging Routes */}
                  <Route
                    path="/transitioning/snagging"
                    element={<SnaggingDashboard />}
                  />
                  <Route
                    path="/transitioning/snagging/details/:id"
                    element={<SnaggingDetailsPage />}
                  />
                  <Route
                    path="/transitioning/hoto"
                    element={<HOTODashboard />}
                  />

                  {/* Design Insights Routes */}
                  <Route
                    path="/transitioning/design-insight"
                    element={<DesignInsightsDashboard />}
                  />
                  <Route
                    path="/transitioning/design-insight/add"
                    element={<AddDesignInsightDashboard />}
                  />
                  <Route
                    path="/transitioning/design-insight/details/:id"
                    element={<DesignInsightDetailsDashboard />}
                  />
                  <Route
                    path="/transitioning/design-insight/edit/:id"
                    element={<EditDesignInsightDashboard />}
                  />

                  {/* Fitout Routes */}
                  <Route
                    path="/transitioning/fitout/setup"
                    element={<FitoutSetupDashboard />}
                  />
                  <Route
                    path="/transitioning/fitout/request"
                    element={<FitoutRequestListDashboard />}
                  />
                  <Route
                    path="/transitioning/fitout/add-project"
                    element={<AddProjectDashboard />}
                  />
                  <Route
                    path="/transitioning/fitout/checklist"
                    element={<FitoutChecklistDashboard />}
                  />
                  <Route
                    path="/transitioning/fitout/checklist/add"
                    element={<AddChecklistDashboard />}
                  />
                  <Route
                    path="/transitioning/fitout/violation"
                    element={<FitoutViolationDashboard />}
                  />

                  {/* Ticket Routes */}
                  <Route
                    path="/maintenance/ticket"
                    element={<TicketDashboard />}
                  />
                  <Route
                    path="/maintenance/ticket/add"
                    element={<AddTicketDashboard />}
                  />
                  <Route
                    path="/maintenance/ticket/assign"
                    element={<AssignTicketsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/update/:id"
                    element={<UpdateTicketsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/debls/:id"
                    element={<TicketDetailsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/:id/feeds"
                    element={<TicketFeedsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/:id/tag-vendor"
                    element={<TicketTagVendorPage />}
                  />
                  <Route
                    path="/maintenance/ticket/:id/job-sheet"
                    element={<TicketJobSheetPage />}
                  />
                  <Route
                    path="/maintenance/ticket"
                    element={<TicketDashboard />}
                  />
                  <Route path="/tickets" element={<TicketListPage />} />
                  <Route
                    path="/maintenance/ticket/add"
                    element={<AddTicketDashboard />}
                  />
                  <Route
                    path="/maintenance/ticket/assign"
                    element={<AssignTicketsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/update/:id"
                    element={<UpdateTicketsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/details/:id"
                    element={<TicketDetailsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/:id/feeds"
                    element={<TicketFeedsPage />}
                  />
                  <Route
                    path="/maintenance/ticket/:id/tag-vendor"
                    element={<TicketTagVendorPage />}
                  />

                  {/* Task Routes */}
                  <Route
                    path="/maintenance/task"
                    element={<ScheduledTaskDashboard />}
                  />
                  <Route
                    path="/maintenance/task/submit/:id"
                    element={<TaskSubmissionPage />}
                  />

                  <Route
                    path="/maintenance/task/details/:id"
                    element={<TaskDetailsPage />}
                  />

                  <Route
                    path="/maintenance/task/job-sheet/:id"
                    element={<JobSheetPage />}
                  />

                  {/* Safety Routes */}
                  <Route
                    path="/safety/incident"
                    element={<IncidentDashboard />}
                  />
                  <Route
                    path="/safety/incident/add"
                    element={<AddIncidentPage />}
                  />
                  <Route
                    path="/safety/incident/:id"
                    element={<IncidentDetailsPage />}
                  />
                  <Route
                    path="/safety/incident/new-details/:id"
                    element={<IncidentNewDetails />}
                  />
                  <Route
                    path="/safety/incident/edit/:id"
                    element={<EditIncidentDetailsPage />}
                  />
                  <Route
                    path="/safety/permit"
                    element={<PermitToWorkDashboard />}
                  />
                  <Route
                    path="/safety/permit/add"
                    element={<AddPermitPage />}
                  />
                  <Route
                    path="/safety/permit/checklist"
                    element={<PermitChecklistList />}
                  />
                  <Route
                    path="/safety/permit/checklist/details/:id"
                    element={<PermitChecklistDetails />}
                  />
                  <Route
                    path="/safety/permit/checklist/edit/:id"
                    element={<EditPermitChecklist />}
                  />
                  <Route
                    path="/safety/permit-checklist/add"
                    element={<AddPermitChecklist />}
                  />
                  <Route
                    path="/safety/permit/details/:id"
                    element={<PermitDetails />}
                  />
                  <Route
                    path="/safety-check-audit"
                    element={<SafetyCheckAudit />}
                  />

                  <Route
                    path="/safety/permit/edit/:id"
                    element={
                      <ProtectedRoute>
                        <EditPermitPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety/permit/safety-check-form"
                    element={<PermitSafetyCheckForm />}
                  />
                  <Route
                    path="/safety/permit/vendor-form/:id?"
                    element={<VendorPermitForm />}
                  />
                  <Route
                    path="/safety/permit/fill-form/:id?"
                    element={<FillForm />}
                  />
                  <Route
                    path="/safety/permit/fill-jsa-form/:id?"
                    element={<FillJSAForm />}
                  />
                  <Route
                    path="/safety/permit/pending-approvals"
                    element={<PermitPendingApprovalsDashboard />}
                  />
                  {/* <Route path="/safety/m-safe" element={<MSafeDashboard />} /> */}
                  <Route
                    path="/safety/m-safe/non-fte-users"
                    element={<NonFTEUsersDashboard />}
                  />
                  <Route
                    path="/safety/m-safe/krcc-form-list"
                    element={<KRCCFormListDashboard />}
                  />
                  <Route
                    path="/safety/training-list"
                    element={<TrainingListDashboard />}
                  />
                  <Route
                    path="/safety/training-list/add"
                    element={<AddTrainingRecordDashboard />}
                  />
                  <Route
                    path="/safety/training-list/:id"
                    element={<TrainingRecordDetailsPage />}
                  />
                  <Route
                    path="/safety/training-list/edit/:id"
                    element={<AddTrainingRecordDashboard />}
                  />

                  {/* New Training User Detail route (distinct from existing training detail) */}
                  <Route
                    path="/safety/m-safe/training-list/training-user-details/:id"
                    element={<TrainingUserDetailPage />}
                  />

                  {/* M-Safe Routes */}
                  <Route
                    path="/safety/m-safe/internal"
                    element={<MSafeDashboard />}
                  />

                  <Route
                    path="/safety/m-safe/external"
                    element={<ExternalUsersDashboard />}
                  />
                  <Route
                    path="/safety/m-safe/user/:userId"
                    element={<MSafeUserDetail />}
                  />
                  <Route
                    path="/safety/m-safe/external/user/:userId"
                    element={<ExternalUserDetail />}
                  />
                  <Route
                    path="/safety/m-safe/external/user/:userId/edit"
                    element={<EditExternalUserPage />}
                  />
                  <Route
                    path="/safety/m-safe/external/user/:userId/lmc-manager"
                    element={<LMCPage />}
                  />
                  <Route
                    path="/safety/m-safe/non-fte-users"
                    element={<NonFTEUsersDashboard />}
                  />
                  <Route
                    path="/safety/m-safe/krcc-list"
                    element={<KRCCFormListDashboard />}
                  />
                  <Route
                    path="/safety/m-safe/krcc-list/:id"
                    element={<KRCCFormDetail />}
                  />
                  <Route path="/safety/m-safe/lmc" element={<LMCDashboard />} />
                  <Route
                    path="/safety/m-safe/lmc/:id"
                    element={<LMCUserDetail />}
                  />
                  <Route
                    path="/safety/m-safe/training-list"
                    element={<TrainingDashboard />}
                  />
                  <Route
                    path="/safety/m-safe/training-list/:id"
                    element={<TrainingDetailPage />}
                  />
                  <Route path="/safety/m-safe/smt" element={<SMTDashboard />} />
                  <Route
                    path="/safety/m-safe/smt/:id"
                    element={<SMTDetailPage />}
                  />
                  <Route
                    path="/safety/m-safe/external-users/multiple-delete"
                    element={<MultipleUserDeletePage />}
                  />
                  <Route
                    path="/safety/m-safe/reportees-reassign"
                    element={<ReporteesReassignPage />}
                  />
                  <Route
                    path="/safety/vi-miles/vehicle-details"
                    element={<VehicleDetails />}
                  />
                  <Route
                    path="/safety/vi-miles/vehicle-check-in"
                    element={<VehicleCheckIn />}
                  />
                  <Route
                    path="/vehicle-history/update"
                    element={<UpdateVehicleHistoryPage />}
                  />

                  {/* Market Place Routes */}
                  <Route
                    path="/market-place/all"
                    element={<MarketPlaceAllPage />}
                  />
                  <Route
                    path="/market-place/installed"
                    element={<MarketPlaceInstalledPage />}
                  />
                  <Route
                    path="/market-place/updates"
                    element={<MarketPlaceUpdatesPage />}
                  />
                  <Route
                    path="/market-place/lease-management"
                    element={<LeaseManagementDetailPage />}
                  />
                  <Route
                    path="/market-place/loyalty-rule-engine"
                    element={<LoyaltyRuleEngineDetailPage />}
                  />
                  <Route
                    path="/market-place/cloud-telephony"
                    element={<CloudTelephonyDetailPage />}
                  />
                  <Route
                    path="/market-place/accounting"
                    element={<AccountingDetailPage />}
                  />

                  {/* VAS Booking Routes */}
                  <Route path="/vas/booking/list" element={<BookingList />} />
                  <Route
                    path="/vas/booking/add"
                    element={<AddFacilityBookingPage />}
                  />
                  <Route
                    path="/vas/bookings/details/:id"
                    element={<BookingDetailsPage />}
                  />
                  {/* <Route path="/vas/booking/setup" element={<BookingSetupDashboard />} /> */}
                  <Route
                    path="/vas/booking/setup/details/:id"
                    element={<BookingSetupDetailPage />}
                  />

                  {/* Master Location Routes */}
                  <Route
                    path="/master/location/building"
                    element={<BuildingPage />}
                  />
                  <Route path="/master/location/wing" element={<WingPage />} />
                  <Route path="/master/location/area" element={<AreaPage />} />
                  <Route
                    path="/master/location/floor"
                    element={<FloorPage />}
                  />
                  <Route path="/master/location/unit" element={<UnitPage />} />
                  <Route path="/master/location/room" element={<RoomPage />} />
                  <Route
                    path="/master/location/account"
                    element={<LocationAccountPage />}
                  />

                  {/* Master User Routes */}
                  <Route
                    path="/master/user/fm-users"
                    element={<FMUserMasterDashboard />}
                  />
                  <Route
                    path="/master/user/fm-users/add"
                    element={<AddFMUserPage />}
                  />
                  <Route
                    path="/master/user/fm-users/edit/:id"
                    element={<EditFMUserPage />}
                  />
                  <Route
                    path="/master/user/fm-users/view/:id"
                    element={<ViewFMUserPage />}
                  />
                  <Route
                    path="/master/user/occupant-users"
                    element={<OccupantUserMasterDashboard />}
                  />

                  {/* Material Master Route */}
                  <Route
                    path="/master/material-ebom"
                    element={<MaterialMasterPage />}
                  />
                  <Route
                    path="/master/gate-number"
                    element={<GateNumberPage />}
                  />
                  <Route
                    path="/master/gate-number/add"
                    element={<AddGateNumberPage />}
                  />
                  <Route
                    path="/master/gate-number/edit/:id"
                    element={<EditGateNumberPage />}
                  />
                  <Route
                    path="/master/communication-template"
                    element={<CommunicationTemplateListPage />}
                  />
                  <Route
                    path="/master/communication-template/add"
                    element={<AddCommunicationTemplatePage />}
                  />
                  <Route
                    path="/master/communication-template/edit/:id"
                    element={<EditCommunicationTemplatePage />}
                  />

                  {/* Template Routes - Root Cause Analysis */}
                  <Route
                    path="/master/template/root-cause-analysis"
                    element={<RootCauseAnalysisListPage />}
                  />
                  <Route
                    path="/master/template/root-cause-analysis/add"
                    element={<AddRootCauseAnalysisPage />}
                  />
                  <Route
                    path="/master/template/root-cause-analysis/edit/:id"
                    element={<EditRootCauseAnalysisPage />}
                  />

                  {/* Template Routes - Preventive Action */}
                  <Route
                    path="/master/template/preventive-action"
                    element={<PreventiveActionListPage />}
                  />
                  <Route
                    path="/master/template/preventive-action/add"
                    element={<AddPreventiveActionPage />}
                  />
                  <Route
                    path="/master/template/preventive-action/edit/:id"
                    element={<EditPreventiveActionPage />}
                  />

                  {/* Template Routes - Short-term Impact */}
                  <Route
                    path="/master/template/short-term-impact"
                    element={<ShortTermImpactListPage />}
                  />
                  <Route
                    path="/master/template/short-term-impact/add"
                    element={<AddShortTermImpactPage />}
                  />
                  <Route
                    path="/master/template/short-term-impact/edit/:id"
                    element={<EditShortTermImpactPage />}
                  />

                  {/* Template Routes - Long-term Impact */}
                  <Route
                    path="/master/template/long-term-impact"
                    element={<LongTermImpactListPage />}
                  />
                  <Route
                    path="/master/template/long-term-impact/add"
                    element={<AddLongTermImpactPage />}
                  />
                  <Route
                    path="/master/template/long-term-impact/edit/:id"
                    element={<EditLongTermImpactPage />}
                  />

                  {/* Template Routes - Corrective Action */}
                  <Route
                    path="/master/template/corrective-action"
                    element={<CorrectiveActionListPage />}
                  />
                  <Route
                    path="/master/template/corrective-action/add"
                    element={<AddCorrectiveActionPage />}
                  />
                  <Route
                    path="/master/template/corrective-action/edit/:id"
                    element={<EditCorrectiveActionPage />}
                  />

                  {/* Master Fitout Routes */}
                  <Route
                    path="/master/fitout-checklists"
                    element={<FitoutChecklists />}
                  />
                  <Route
                    path="/master/fitout-requests"
                    element={<FitoutRequests />}
                  />
                  <Route
                    path="/master/fitout-requests/add"
                    element={<FitoutRequestAdd />}
                  />

                  <Route
                    path="/master/gate-pass-type"
                    element={<GatePassTypePage />}
                  />
                  <Route
                    path="/master/gate-pass-type/add"
                    element={<AddGatePassTypePage />}
                  />
                  <Route
                    path="/master/gate-pass-type/edit/:id"
                    element={<EditGatePassTypePage />}
                  />
                  <Route
                    path="/master/inventory-type"
                    element={<InventoryTypePage />}
                  />
                  <Route
                    path="/master/inventory-type/add"
                    element={<AddInventoryTypePage />}
                  />
                  <Route
                    path="/master/inventory-type/edit/:id"
                    element={<EditInventoryTypePage />}
                  />
                  <Route
                    path="/settings/inventory-management/inventory-type"
                    element={<InventoryTypePage />}
                  />
                  <Route
                    path="/settings/inventory-management/inventory-type/add"
                    element={<AddInventoryTypePage />}
                  />
                  <Route
                    path="/settings/inventory-management/inventory-type/edit/:id"
                    element={<EditInventoryTypePage />}
                  />
                  <Route
                    path="/master/inventory-sub-type"
                    element={<InventorySubTypePage />}
                  />
                  <Route
                    path="/master/inventory-sub-type/add"
                    element={<AddInventorySubTypePage />}
                  />
                  <Route
                    path="/master/inventory-sub-type/edit/:id"
                    element={<EditInventorySubTypePage />}
                  />

                  <Route
                    path="/maintenance/waste/generation/add"
                    element={<AddWasteGenerationPage />}
                  />
                  <Route
                    path="/maintenance/task"
                    element={<ScheduledTaskDashboard />}
                  />
                  <Route
                    path="/maintenance/task/task-details/:id"
                    element={<TaskDetailsPage />}
                  />

                  <Route
                    path="/maintenance/task/job-sheet/:id"
                    element={<JobSheetPage />}
                  />

                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* Settings Routes */}

                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <div />
                      </Layout>
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/settings/approval-matrix/setup"
                    element={<ApprovalMatrixSetupPage />}
                  />
                  <Route
                    path="/settings/approval-matrix/setup/add"
                    element={<AddApprovalMatrixPage />}
                  />
                  <Route
                    path="/settings/invoice-approvals/add"
                    element={<AddInvoiceApprovalsPage />}
                  />
                  <Route
                    path="/settings/design-insights/setup"
                    element={<DesignInsightsSetupDashboard />}
                  />
                  <Route
                    path="/settings/checklist-setup/group"
                    element={<ChecklistGroupsPage />}
                  />
                  <Route
                    path="/settings/checklist-setup/email-rule"
                    element={<EmailRuleSetupPage />}
                  />
                  <Route
                    path="/settings/checklist-setup/task-escalation"
                    element={<TaskEscalationPage />}
                  />
                  <Route
                    path="/settings/ticket-management/setup"
                    element={<TicketManagementSetupPage />}
                  />
                  <Route
                    path="/settings/ticket-management/escalation-matrix"
                    element={<EscalationMatrixPage />}
                  />
                  <Route
                    path="/settings/ticket-management/cost-approval"
                    element={<CostApprovalPage />}
                  />
                  <Route
                    path="/settings/inventory-management/sac-hsn-code"
                    element={<SacHsn />}
                  />
                  <Route
                    path="/settings/inventory-management/sac-hsn-code/add"
                    element={<AddSacHsn />}
                  />
                  <Route
                    path="/settings/inventory-management/sac-hsn-code/:id"
                    element={<DetailPageSacHsn />}
                  />
                  <Route
                    path="/settings/safety/permit"
                    element={<div>Safety Permit</div>}
                  />
                  <Route
                    path="/settings/safety/permit-setup"
                    element={<PermitSetupDashboard />}
                  />
                  <Route
                    path="/settings/safety/incident"
                    element={<IncidentSetupDashboard />}
                  />
                  <Route
                    path="/settings/safety/setup"
                    element={<IncidentSetupDashboard />}
                  />
                  <Route
                    path="/settings/vas/fnb/setup"
                    element={<FnBRestaurantDashboard />}
                  />
                  <Route
                    path="/settings/vas/fnb/add"
                    element={<AddRestaurantPage />}
                  />
                  <Route
                    path="/settings/vas/fnb/details/:id"
                    element={<FnBRestaurantDetailsPage />}
                  />
                  <Route
                    path="/settings/vas/booking/setup"
                    element={<BookingSetupDashboard />}
                  />
                  <Route
                    path="/settings/vas/booking/setup/add"
                    element={<AddBookingSetupPage />}
                  />
                  <Route
                    path="/settings/vas/booking/setup/details/:id"
                    element={<BookingSetupDetailPage />}
                  />
                  <Route
                    path="/settings/vas/booking/setup/edit/:id"
                    element={<EditBookingSetupPage />}
                  />
                  <Route
                    path="/settings/vas/parking-management/parking-category"
                    element={<ParkingCategoryPage />}
                  />
                  <Route
                    path="/settings/vas/parking-management/slot-configuration"
                    element={<SlotConfigurationPage />}
                  />
                  <Route
                    path="/settings/vas/parking-management/slot-configuration/add"
                    element={<AddSlotConfigurationPage />}
                  />
                  <Route
                    path="/settings/vas/parking-management/slot-configuration/edit/:id"
                    element={<EditSlotConfigurationPage />}
                  />
                  <Route
                    path="/settings/vas/parking-management/time-slot-setup"
                    element={<TimeSlotSetupPage />}
                  />
                  <Route
                    path="/settings/waste-management/setup"
                    element={<UtilityWasteGenerationSetupDashboard />}
                  />
                  <Route
                    path="/settings/account/role-config"
                    element={<RoleConfigList />}
                  />
                  <Route
                    path="/settings/account/role-config/view/:id"
                    element={<RoleConfigView />}
                  />
                  <Route
                    path="/settings/account/role-config/edit/:id"
                    element={<RoleConfigEdit />}
                  />
                  <Route
                    path="/settings/account/lock-module"
                    element={<LockModuleList />}
                  />
                  <Route
                    path="/settings/account/lock-function"
                    element={<LockFunctionList />}
                  />
                  <Route
                    path="/settings/account/lock-function/view/:id"
                    element={<LockFunctionView />}
                  />
                  <Route
                    path="/settings/account/lock-function/edit/:id"
                    element={<LockFunctionEdit />}
                  />
                  <Route
                    path="/settings/account/lock-sub-function"
                    element={<LockSubFunctionList />}
                  />
                  <Route
                    path="/settings/account/lock-sub-function/view/:id"
                    element={<LockSubFunctionView />}
                  />
                  <Route
                    path="/settings/account/lock-sub-function/edit/:id"
                    element={<LockSubFunctionEdit />}
                  />
                  <Route
                    path="/settings/community-modules/testimonial-setup"
                    element={<TestimonialsSetupDashboard />}
                  />
                  <Route
                    path="/settings/community-modules/testimonial-setup/:id"
                    element={<TestimonialDetailsPage />}
                  />
                  <Route
                    path="/settings/community-modules/company-partner-setup"
                    element={<CompanyPartnersSetupDashboard />}
                  />
                  <Route
                    path="/settings/community-modules/banner-setup"
                    element={<BannerSetupDashboard />}
                  />
                  <Route
                    path="/settings/community-modules/banner-setup/:id"
                    element={<BannerDetailsPage />}
                  />
                  <Route
                    path="/settings/community-modules/amenity-setup"
                    element={<AmenitySetupDashboard />}
                  />
                  <Route
                    path="/settings/community-modules/amenity-setup/:id"
                    element={<AmenityDetailsPage />}
                  />
                  <Route path="/settings/groups" element={<CRMGroupsPage />} />
                </Route>

                {/* Setup Routes - Outside of settings parent route */}
                <Route
                  path="/settings/permit"
                  element={
                    <ProtectedRoute>
                      <PermitSetupDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/incident"
                  element={
                    <ProtectedRoute>
                      <IncidentSetupDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Setup User Management Routes */}
                <Route
                  path="/settings/fm-users"
                  element={
                    <ProtectedRoute>
                      <FMUserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/fm-users/add"
                  element={
                    <ProtectedRoute>
                      <AddFMUserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/occupant-users"
                  element={
                    <ProtectedRoute>
                      <OccupantUsersDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/occupant-users/add"
                  element={
                    <ProtectedRoute>
                      <AddOccupantUserDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route path="/mobile/lmc" element={<MobileLMCPage />} />

                {/* Mobile Routes */}
                <Route path="/mobile/tickets" element={<MobileTicketsPage />} />
                <Route path="/mobile/orders" element={<MobileOrdersPage />} />
                <Route
                  path="/mobile/admin/orders"
                  element={<MobileAdminOrdersPage />}
                />
                <Route
                  path="/mobile/admin/orders/:orderId"
                  element={<MobileAdminOrderDetailsPage />}
                />
                {/* External Flow Tester */}
                <Route path="/test-external" element={<ExternalFlowTester />} />
                {/* Mobile Restaurant Routes */}
                <Route
                  path="/mr/:restaurant/:orgId"
                  element={<MobileRestaurantPage />}
                />
                <Route
                  path="/mobile/restaurant/:action"
                  element={<MobileRestaurantPage />}
                />
                <Route
                  path="/mobile/restaurant/:restaurantId/:action"
                  element={<MobileRestaurantPage />}
                />
                {/* Mobile Restaurant Routes */}
                <Route
                  path="/mobile/restaurant"
                  element={<MobileRestaurantPage />}
                />
                <Route
                  path="/mobile/restaurant/:action"
                  element={<MobileRestaurantPage />}
                />
                <Route
                  path="/mobile/restaurant/:restaurantId/:action"
                  element={<MobileRestaurantPage />}
                />
                {/* Mobile Survey Routes */}
                <Route
                  path="/mobile/survey/:mappingId"
                  element={<MobileSurveyPage />}
                />
                <Route
                  path="/mobile/survey/:mappingId/:action"
                  element={<MobileSurveyPage />}
                />
                <Route
                  path="/survey_mappings/:mappingId/survey"
                  element={<MobileSurveyPage />}
                />
                {/* Mobile Asset Routes */}
                <Route path="/mobile/assets" element={<MobileAssetPage />} />
                <Route
                  path="/mobile/assets/:assetId"
                  element={<MobileAssetPage />}
                />
                <Route
                  path="/mobile/assets/:assetId/breakdown"
                  element={<MobileAssetPage />}
                />
                {/* Mobile Owner Cost Routes */}
                <Route
                  path="/mobile/owner-cost/:assetId"
                  element={<MobileOwnerCostAssetPage />}
                />
                <Route
                  path="/mo/:assetId"
                  element={<MobileOwnerCostAssetPage />}
                />
                <Route
                  path="/fitout-details-mobile/:id"
                  element={<FitoutRequestDetailsPageMobile />}
                />
                {/* QR Test Route */}
                <Route path="/qr-test" element={<QRTestPage />} />

                {/* Mail Inbound Routes */}

              </Routes>
              <Toaster />
              <SonnerToaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "white",
                    border: "1px solid #e5e7eb",
                    color: "#374151",
                  },
                }}
              />{" "}
            </PermissionsProvider>
          </LayoutProvider>
        </EnhancedSelectProvider>
      </QueryClientProvider>
      {/* </Router> */}
    </>
  );
}

export default App;