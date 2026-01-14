import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProjectConfigEdit from "@/pages/ProjectConfigEdit";
import LockFunctionEdit from "@/pages/LockFunctionEdit";
import EventDetails from "@/pages/EventDetails";

const ViewUserPage = lazy(() => import("@/pages/ViewUserPage"));
const BroadcastCreate = lazy(() => import("@/pages/BroadcastCreate"));
const NewTier = lazy(() => import("@/pages/NewTier"));
const DepartmentCreate = lazy(() => import("@/pages/DepartmentCreate"));
const DepartmentList = lazy(() => import("@/pages/DepartmentList"));
const ProjectBuildingType = lazy(() => import("@/pages/ProjectBuildingType"));
const ProjectBuildingTypeEdit = lazy(() => import("@/pages/ProjectBuildingTypeEdit"));
const ProjectBuildingTypeList = lazy(() => import("@/pages/ProjectBuildingTypeList"));
const PlusServicesList = lazy(() => import("@/pages/PlusServiceList"));
const PlusServicesCreate = lazy(() => import("@/pages/PlusServiceCreate"));
const EditAmenities = lazy(() => import("@/pages/EditAmenities"));
const ConnectivityTypeList = lazy(() => import("@/pages/ConnectivityTypeList"));
const ConnectivityTypeCreate = lazy(() => import("@/pages/ConnectivityTypeCreate"));
const ConnectivityTypeEdit = lazy(() => import("@/pages/ConnectivityTypeEdit"));

// Lazy load all setup member pages
const AddMISPage = lazy(() => import("@/pages/AddMISPage"));
const AddUserPage = lazy(() => import("@/pages/AddUserPage"));
const AddQuarantinePage = lazy(() => import("@/pages/AddQuarantinePage"));
const AddOfferPage = lazy(() => import("@/pages/AddOfferPage"));
const AddOffersPage = lazy(() => import("@/pages/AddOffersPage"));
const AddBusinessDirectoryPage = lazy(() => import("@/pages/AddBusinessDirectoryPage"));
const OfferViewPage = lazy(() => import("@/pages/OfferViewPage"));
const TemplateList = lazy(() => import("@/pages/TemplateList"));
const AddTemplatePage = lazy(() => import("@/pages/AddTemplatePage"));
const TemplateView = lazy(() => import("@/pages/TemplateView"));
const Amenities = lazy(() => import("@/pages/Amenities"));
const AmenitiesList = lazy(() => import("@/pages/AmenitiesList"));
const BankDetailsCreate = lazy(() => import("@/pages/BankDetailsCreate"));
const BankDetailsEdit = lazy(() => import("@/pages/BankDetailsEdit"));
const BankDetailsList = lazy(() => import("@/pages/BankDetailsList"));
const Banks = lazy(() => import("@/pages/Banks"));
const BanksList = lazy(() => import("@/pages/BanksList"));
const BanksCreate = lazy(() => import("@/pages/BankDetailsCreate"));
const BannerAdd = lazy(() => import("@/pages/BannerAdd"));
const BannerEdit = lazy(() => import("@/pages/BannerEdit"));
const BannerList = lazy(() => import("@/pages/BannerList"));
const CategoryTypes = lazy(() => import("@/pages/CategoryTypes"));
const CategoryTypesEdit = lazy(() => import("@/pages/CategoryTypesEdit"));
const CategoryTypesList = lazy(() => import("@/pages/CategoryTypesList"));
const CommonFiles = lazy(() => import("@/pages/CommonFiles"));
const CompanyCreate = lazy(() => import("@/pages/CompanyCreate"));
const CompanyEdit = lazy(() => import("@/pages/CompanyEdit"));
const CompanyList = lazy(() => import("@/pages/CompanyList"));
const ConstructionStatus = lazy(() => import("@/pages/ConstructionStatus"));
const ConstructionStatusEdit = lazy(() => import("@/pages/ConstructionStatusEdit"));
const ConstructionStatusList = lazy(() => import("@/pages/ConstructionStatusList"));
const ConstructionUpdatesCreate = lazy(() => import("@/pages/ConstructionUpdatesCreate"));
const ConstructionUpdatesEdit = lazy(() => import("@/pages/ConstructionUpdatesEdit"));
const ConstructionUpdatesList = lazy(() => import("@/pages/ConstructionUpdatesList"));
const CreateRuleEngine = lazy(() => import("@/pages/CreateRuleEngine"));
const EnquiryList = lazy(() => import("@/pages/EnquiryList"));
const EventCreate = lazy(() => import("@/pages/EventCreate"));
const EventEdit = lazy(() => import("@/pages/EventEdit"));
const EventList = lazy(() => import("@/pages/EventList"));
const OffersList = lazy(() => import("@/pages/OffersList"));
const FaqCategoryForm = lazy(() => import("@/pages/FaqCategoryForm"));
const FaqCategoryList = lazy(() => import("@/pages/FaqCategoryList"));
const FaqCreate = lazy(() => import("@/pages/FaqCreate"));
const FaqEdit = lazy(() => import("@/pages/FaqEdit"));
const FaqList = lazy(() => import("@/pages/FaqList"));
const FaqSubCategory = lazy(() => import("@/pages/FaqSubCategory"));
const FaqSubCategoryList = lazy(() => import("@/pages/FaqSubCategoryList"));
const Gallery = lazy(() => import("@/pages/Gallery"));
const GalleryDetails = lazy(() => import("@/pages/GalleryDetails"));
const GalleryList = lazy(() => import("@/pages/GalleryList"));
const HomeLoanCreate = lazy(() => import("@/pages/HomeLoanCreate"));
const HomeLoanEdit = lazy(() => import("@/pages/HomeLoanEdit"));
const HomeLoanList = lazy(() => import("@/pages/HomeLoanList"));
const ImageConfigCreate = lazy(() => import("@/pages/ImageConfigCreate"));
const ImageConfigEdit = lazy(() => import("@/pages/ImageConfigEdit"));
const ImageConfigList = lazy(() => import("@/pages/ImageConfigList"));
const LoanManagerAdd = lazy(() => import("@/pages/LoanManagerAdd"));
const LoanManagerEdit = lazy(() => import("@/pages/LoanManagerEdit"));
const LoanManagerList = lazy(() => import("@/pages/LoanManagerList"));
const LockFunctionCreate = lazy(() => import("@/pages/LockFunctionCreate"));
const LockFunctionList = lazy(() => import("@/pages/LockFunctionList"));
const LockRoleCreate = lazy(() => import("@/pages/LockRoleCreate"));
const LockRoleList = lazy(() => import("@/pages/LockRoleList"));
const LoyaltyManagersCreate = lazy(() => import("@/pages/LoyaltyManagersCreate"));
const LoyaltyManagersEdit = lazy(() => import("@/pages/LoyaltyManagersEdit"));
const LoyaltyManagersList = lazy(() => import("@/pages/LoyaltyManagersList"));
const NewGallery = lazy(() => import("@/pages/NewGallery"));
const NoticeboardCreate = lazy(() => import("@/pages/NoticeboardCreate"));
const NoticeboardEdit = lazy(() => import("@/pages/NoticeboardEdit"));
const NoticeboardList = lazy(() => import("@/pages/NoticeboardList"));
const NoticeboardDetails = lazy(() => import("@/pages/NoticeboardDetails"));
const BroadcastDetails = lazy(() => import("@/pages/BroadcastDetails"));
const OrganizationCreate = lazy(() => import("@/pages/OrganizationCreate"));
const OrganizationList = lazy(() => import("@/pages/OrganizationList"));
const OrganizationUpdate = lazy(() => import("@/pages/OrganizationUpdate"));
const ProjectDetailsCreate = lazy(() => import("@/pages/ProjectDetailsCreate"));
const ProjectDetailsEdit = lazy(() => import("@/pages/ProjectDetailsEdit"));
const ProjectDetails = lazy(() => import("@/pages/ProjectDetails"));
const ProjectDetailsList = lazy(() => import("@/pages/ProjectDetailsList"));
const PropertyType = lazy(() => import("@/pages/PropertyType"));
const PropertyTypeEdit = lazy(() => import("@/pages/PropertyTypeEdit"));
const PropertyTypeList = lazy(() => import("@/pages/PropertyTypeList"));
const ReferralCreate = lazy(() => import("@/pages/ReferralCreate"));
const ReferralEdit = lazy(() => import("@/pages/ReferralEdit"));
const ReferralList = lazy(() => import("@/pages/ReferralList"));
const ReferralProgramCreate = lazy(() => import("@/pages/ReferralProgramCreate"));
const ReferralProgramEdit = lazy(() => import("@/pages/ReferralProgramEdit"));
const ReferralProgramList = lazy(() => import("@/pages/ReferralProgramList"));
const ServiceCategory = lazy(() => import("@/pages/ServiceCategory"));
const ServiceCategoryList = lazy(() => import("@/pages/ServiceCategoryList"));
const SiteCreate = lazy(() => import("@/pages/SiteCreate"));
const SiteEdit = lazy(() => import("@/pages/SiteEdit"));
const SiteList = lazy(() => import("@/pages/SiteList"));
const SiteVisitCreate = lazy(() => import("@/pages/SiteVisitCreate"));
const SiteVisitEdit = lazy(() => import("@/pages/SiteVisitEdit"));
const SiteVisitList = lazy(() => import("@/pages/SiteVisitList"));
const SiteVisitSlotConfig = lazy(() => import("@/pages/SiteVisitSlotConfig"));
const SiteVisitSlotConfigList = lazy(() => import("@/pages/SiteVisitSlotConfigList"));
const SmtpSettingsEdit = lazy(() => import("@/pages/SmtpSettingsEdit"));
const SmtpSettingsList = lazy(() => import("@/pages/SmtpSettingsList"));
const Specification = lazy(() => import("@/pages/Specification"));
const SpecificationList = lazy(() => import("@/pages/SpecificationList"));
const SpecificationUpdate = lazy(() => import("@/pages/SpecificationUpdate"));
const SupportServiceList = lazy(() => import("@/pages/SupportServiceList"));
const TagAdd = lazy(() => import("@/pages/TagAdd"));
const TdsTutorialsCreate = lazy(() => import("@/pages/TdsTutorialsCreate"));
const TdsTutorialsEdit = lazy(() => import("@/pages/TdsTutorialsEdit"));
const TdsTutorialsList = lazy(() => import("@/pages/TdsTutorialsList"));
const Testimonials = lazy(() => import("@/pages/Testimonials"));
const TestimonialEdit = lazy(() => import("@/pages/TestimonialEdit"));
const TestimonialList = lazy(() => import("@/pages/TestimonialList"));
const UserCreate = lazy(() => import("@/pages/UserCreate"));
const UserDetails = lazy(() => import("@/pages/UserDetails"));
const UserEdit = lazy(() => import("@/pages/UserEdit"));
const UserGroupsCreate = lazy(() => import("@/pages/UserGroupsCreate"));
const UserGroupsEdit = lazy(() => import("@/pages/UserGroupsEdit"));
const UserGroupsList = lazy(() => import("@/pages/UserGroupsList"));
const FMGroupDashboard = lazy(() => import("@/pages/setup/FMGroupDashboard"));
const UserList = lazy(() => import("@/pages/UserList"));
const PressReleasesCreate = lazy(() => import("@/pages/PressReleasesCreate"));
const PressReleasesEdit = lazy(() => import("@/pages/PressReleasesEdit"));
const PressReleasesList = lazy(() => import("@/pages/PressReleasesList"));

// Add lazy imports for loyalty pages
const LoyaltyMembersList = lazy(() => import("@/pages/LoyaltyMembersList"));
const LoyaltyTiersList = lazy(() => import("@/pages/LoyaltyTiersList"));
const RuleEngineList = lazy(() => import("@/pages/RuleEngineList"));
const LockPaymentsList = lazy(() => import("@/pages/LockPaymentsList"));
const HomeLoanRequestsList = lazy(() => import("@/pages/HomeLoanRequestsList"));
const DemandNotesList = lazy(() => import("@/pages/DemandNotesList"));
const OrdersList = lazy(() => import("@/pages/OrdersList"));
const EncashList = lazy(() => import("@/pages/EncashList"));

// Add missing lazy imports
const ProjectConfiguration = lazy(() => import("@/pages/ProjectConfiguraion"));
const ProjectConfigurationList = lazy(() => import("@/pages/ProjectConfiguraionList"));

// BMS Pages
const BMSFeedbacks = lazy(() => import("@/pages/BMSFeedbacks"));
const BMSParking = lazy(() => import("@/pages/BMSParking"));
const BMSGroups = lazy(() => import("@/pages/BMSGroups"));
const BMSQuarantineTracker = lazy(() => import("@/pages/BMSQuarantineTracker"));
const BMSOffers = lazy(() => import("@/pages/BMSOffers"));
const BMSDocumentsFlatRelated = lazy(() => import("@/pages/BMSDocumentsFlatRelated"));
const BMSDocumentsCommonFiles = lazy(() => import("@/pages/BMSDocumentsCommonFiles"));
const BMSBusinessDirectorySetup = lazy(() => import("@/pages/BMSBusinessDirectorySetup"));
const BMSBusinessDirectoryList = lazy(() => import("@/pages/BMSBusinessDirectoryList"));
const BMSMIS = lazy(() => import("@/pages/BMSMIS"));
const BMSHelpdeskReport = lazy(() => import("@/pages/BMSHelpdeskReport"));
const BMSInvoiceReport = lazy(() => import("@/pages/BMSInvoiceReport"));
const BMSHelpdesk = lazy(() => import("@/pages/BMSHelpdesk"));
const BMSCommunicationTemplate = lazy(() => import("@/pages/BMSCommunicationTemplate"));

// CMS Pages
const CMSFacility = lazy(() => import("@/pages/CMSFacility"));
const CMSRules = lazy(() => import("@/pages/CMSRules"));
const CMSClubMembers = lazy(() => import("@/pages/CMSClubMembers"));
const CMSFacilityBookings = lazy(() => import("@/pages/CMSFacilityBookings"));
const CMSPayments = lazy(() => import("@/pages/CMSPayments"));

// Campaigns Pages
const CampaignsReferrals = lazy(() => import("@/pages/CampaignsReferrals"));
const CampaignsReferralSetup = lazy(() => import("@/pages/CampaignsReferralSetup"));
const CampaignsOtherProject = lazy(() => import("@/pages/CampaignsOtherProject"));

// F&B Pages
const FBRestaurants = lazy(() => import("@/pages/FBRestaurants"));
const FBNotifications = lazy(() => import("@/pages/FBNotifications"));

// OSR Pages
const OSRSetup = lazy(() => import("@/pages/OSRSetup"));
const OSRManageBookings = lazy(() => import("@/pages/OSRManageBookings"));

// Accounting Pages
const AccountingDashboard = lazy(() => import("@/pages/AccountingDashboard"));
const AccountingChartOfAccounts = lazy(() => import("@/pages/AccountingChartOfAccounts"));
const AccountingSubgroupSetup = lazy(() => import("@/pages/AccountingSubgroupSetup"));
const AccountingOpeningBalances = lazy(() => import("@/pages/AccountingOpeningBalances"));
const AccountingTaxSetup = lazy(() => import("@/pages/AccountingTaxSetup"));
const AccountingCostCenter = lazy(() => import("@/pages/AccountingCostCenter"));
const AccountingTransactions = lazy(() => import("@/pages/AccountingTransactions"));
const AccountingInvoices = lazy(() => import("@/pages/AccountingInvoices"));
const AccountingReceipts = lazy(() => import("@/pages/AccountingReceipts"));
const AccountingCharges = lazy(() => import("@/pages/AccountingCharges"));
const AccountingBillCycles = lazy(() => import("@/pages/AccountingBillCycles"));
const AccountingUnitsBillCycleMapping = lazy(() => import("@/pages/AccountingUnitsBillCycleMapping"));
const AccountingChargeCalculations = lazy(() => import("@/pages/AccountingChargeCalculations"));
const AccountingCustomSettings = lazy(() => import("@/pages/AccountingCustomSettings"));
const AccountingBalanceSheet = lazy(() => import("@/pages/AccountingBalanceSheet"));
const AccountingProfitLoss = lazy(() => import("@/pages/AccountingProfitLoss"));
const AccountingGSTPayable = lazy(() => import("@/pages/AccountingGSTPayable"));
const AccountingGSTReceivable = lazy(() => import("@/pages/AccountingGSTReceivable"));
const AccountingTaxSummary = lazy(() => import("@/pages/AccountingTaxSummary"));
const AccountingInvoiceReport = lazy(() => import("@/pages/AccountingInvoiceReport"));
const AccountingDownloadReport = lazy(() => import("@/pages/AccountingDownloadReport"));

// Fitout Pages
const FitoutRequests = lazy(() => import("@/pages/FitoutRequests"));
const FitoutRequestAdd = lazy(() => import("@/pages/FitoutRequestAdd"));
const FitoutRequestDetails = lazy(() => import("@/pages/FitoutRequestDetails"));
const FitoutRequestEdit = lazy(() => import("@/pages/FitoutRequestEdit"));
const FitoutSetup = lazy(() => import("@/pages/FitoutSetup"));
const FitoutChecklists = lazy(() => import("@/pages/FitoutChecklists"));
const AddFitoutChecklistPage = lazy(() => import("@/pages/AddFitoutChecklistPage"));
const EditFitoutChecklistPage = lazy(() => import("@/pages/EditFitoutChecklistPage"));
const FitoutChecklistDetailsPage = lazy(() => import("@/pages/FitoutChecklistDetailsPage"));
const FitoutDeviations = lazy(() => import("@/pages/FitoutDeviations"));
const FitoutDeviationDetails = lazy(() => import("@/pages/FitoutDeviationDetails"));
const ViolationDetail = lazy(() => import("@/pages/ViolationDetail"));
const FitoutReport = lazy(() => import("@/pages/FitoutReport"));

// SmartSecure Pages
const SmartSecureVisitorIn = lazy(() => import("@/pages/SmartSecureVisitorIn"));
const SmartSecureVisitorOut = lazy(() => import("@/pages/SmartSecureVisitorOut"));
const SmartSecureVisitorHistory = lazy(() => import("@/pages/SmartSecureVisitorHistory"));
const SmartSecureStaffsAll = lazy(() => import("@/pages/SmartSecureStaffsAll"));
const SmartSecureStaffsIn = lazy(() => import("@/pages/SmartSecureStaffsIn"));
const SmartSecureStaffsOut = lazy(() => import("@/pages/SmartSecureStaffsOut"));
const SmartSecureStaffsHistory = lazy(() => import("@/pages/SmartSecureStaffsHistory"));
const SmartSecureVehiclesOut = lazy(() => import("@/pages/SmartSecureVehiclesOut"));
const SmartSecureVehiclesHistory = lazy(() => import("@/pages/SmartSecureVehiclesHistory"));
const SmartSecureReportsVisitors = lazy(() => import("@/pages/SmartSecureReportsVisitors"));
const SmartSecureReportsStaffs = lazy(() => import("@/pages/SmartSecureReportsStaffs"));
const SmartSecureReportsMemberVehicles = lazy(() => import("@/pages/SmartSecureReportsMemberVehicles"));
const SmartSecureReportsGuestVehicles = lazy(() => import("@/pages/SmartSecureReportsGuestVehicles"));
const SmartSecureReportsPatrolling = lazy(() => import("@/pages/SmartSecureReportsPatrolling"));
const SmartSecurePatrolling = lazy(() => import("@/pages/SmartSecurePatrolling"));
const SmartSecureSetupGeneral = lazy(() => import("@/pages/SmartSecureSetupGeneral"));
const SmartSecureSetupVisitorParking = lazy(() => import("@/pages/SmartSecureSetupVisitorParking"));
const SmartSecureSetupSupportStaff = lazy(() => import("@/pages/SmartSecureSetupSupportStaff"));

// Incidents Pages
const IncidentsSetup = lazy(() => import("@/pages/IncidentsSetup"));
const IncidentsIncidents = lazy(() => import("@/pages/IncidentsIncidents"));
const IncidentsDesignInputs = lazy(() => import("@/pages/IncidentsDesignInputs"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

// Wrapper to add Suspense to lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return () => (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

export const setupMemberRoutes = (
  <>
    {/* Amenities Routes */}
    <Route path="/settings/amenities" Component={withSuspense(Amenities)} />
    <Route path="/settings/amenities-list" Component={withSuspense(AmenitiesList)} />
    <Route path="/settings/amenities-edit/:id" Component={withSuspense(EditAmenities)} />
    
    {/* Connectivity Type Routes */}
    <Route path="/settings/connectivity-type-list" Component={withSuspense(ConnectivityTypeList)} />
    <Route path="/settings/connectivity-type-create" Component={withSuspense(ConnectivityTypeCreate)} />
    <Route path="/settings/connectivity-type-edit/:id" Component={withSuspense(ConnectivityTypeEdit)} />
    
    <Route path="/settings/add-user" Component={withSuspense(AddUserPage)} />
  <Route
                    path="/quarantine-tracker/add"
                    Component={withSuspense(AddQuarantinePage)}
                  />
    {/* Bank Details Routes */}
    <Route path="/settings/bank-details-create" Component={withSuspense(BankDetailsCreate)} />
    <Route path="/settings/bank-details-edit/:id" Component={withSuspense(BankDetailsEdit)} />
    <Route path="/settings/bank-details-list" Component={withSuspense(BankDetailsList)} />

    {/* Banks Routes */}
    <Route path="/settings/banks/:bankId?" Component={withSuspense(Banks)} />
    <Route path="/settings/banks-list" Component={withSuspense(BanksList)} />
    <Route path="/settings/banks/create" Component={withSuspense(BanksCreate)} />

    {/* Banner Routes */}
    <Route path="/maintenance/banner-add" Component={withSuspense(BannerAdd)} />
    <Route path="/maintenance/banner-edit/:id" Component={withSuspense(BannerEdit)} />
    <Route path="/maintenance/banner-list" Component={withSuspense(BannerList)} />

    {/* Category Types Routes */}
    <Route path="/settings/category-types" Component={withSuspense(CategoryTypes)} />
    <Route path="/settings/category-types-edit/:id" Component={withSuspense(CategoryTypesEdit)} />
    <Route path="/settings/category-types-list" Component={withSuspense(CategoryTypesList)} />

    {/* Common Files Routes */}
    <Route path="/settings/common-files" Component={withSuspense(CommonFiles)} />

    {/* Company Routes */}
    <Route path="/maintenance/company-create" Component={withSuspense(CompanyCreate)} />
    <Route path="/maintenance/company-edit/:id" Component={withSuspense(CompanyEdit)} />
    <Route path="/maintenance/company-list" Component={withSuspense(CompanyList)} />

    {/* Construction Status Routes */}
    <Route path="/settings/construction-status" Component={withSuspense(ConstructionStatus)} />
    <Route path="/settings/construction-status-edit/:id" Component={withSuspense(ConstructionStatusEdit)} />
    <Route path="/settings/construction-status-list" Component={withSuspense(ConstructionStatusList)} />

    {/* Construction Updates Routes */}
    <Route path="/settings/construction-updates-create" Component={withSuspense(ConstructionUpdatesCreate)} />
    <Route path="/settings/construction-updates-edit/:id" Component={withSuspense(ConstructionUpdatesEdit)} />
    <Route path="/settings/construction-updates-list" Component={withSuspense(ConstructionUpdatesList)} />

    {/* Rule Engine Routes */}
    <Route path="/loyalty/create-rule-engine" Component={withSuspense(CreateRuleEngine)} />

    {/* Enquiry Routes */}
    <Route path="/settings/enquiry-list" Component={withSuspense(EnquiryList)} />

    {/* Event Routes */}
    <Route path="/maintenance/event-create" Component={withSuspense(EventCreate)} />
    {/* <Route path="/maintenance/event-details/:id" element={<EventDetails />} /> */}
     <Route path="/maintenance/event-details/:id" element={<EventDetails />} />
    <Route path="/maintenance/event-edit/:id" Component={withSuspense(EventEdit)} />
    <Route path="/maintenance/event-list" Component={withSuspense(EventList)} />

    <Route path="/maintenance/offers-list" Component={withSuspense(OffersList)} />

    {/* Noticeboard Routes (Broadcast) */}
    <Route path="/maintenance/noticeboard-list" Component={withSuspense(NoticeboardList)} />
    <Route path="/maintenance/noticeboard-create" Component={withSuspense(BroadcastCreate)} />
    <Route path="/maintenance/noticeboard-edit/:id" Component={withSuspense(NoticeboardEdit)} />
    <Route path="/maintenance/noticeboard-details/:id" Component={withSuspense(BroadcastDetails)} />

    {/* FAQ Routes */}
    <Route path="/settings/faq-category-form" Component={withSuspense(FaqCategoryForm)} />
    <Route path="/settings/faq-category-form/:faqId" Component={withSuspense(FaqCategoryForm)} />
    <Route path="/settings/faq-category-list" Component={withSuspense(FaqCategoryList)} />
    <Route path="/maintenance/faq-create" Component={withSuspense(FaqCreate)} />
    <Route path="/maintenance/faq-edit/:id" Component={withSuspense(FaqEdit)} />
    <Route path="/maintenance/faq-list" Component={withSuspense(FaqList)} />
    <Route path="/settings/faq-subcategory" Component={withSuspense(FaqSubCategory)} />
    <Route path="/settings/faq-subcategory/:faqSubId" Component={withSuspense(FaqSubCategory)} />
    <Route path="/settings/faq-subcategory/:faqSubId/edit" Component={withSuspense(FaqSubCategory)} />
    <Route path="/settings/faq-subcategory-list" Component={withSuspense(FaqSubCategoryList)} />

    {/* Gallery Routes */}
    <Route path="/setup-member/gallery" Component={withSuspense(Gallery)} />
    <Route path="/setup-member/gallery-details/:id" Component={withSuspense(GalleryDetails)} />
    <Route path="/setup-member/gallery-list" Component={withSuspense(GalleryList)} />
    <Route path="/setup-member/new-gallery" Component={withSuspense(NewGallery)} />

    {/* Home Loan Routes */}
    <Route path="/settings/home-loan-create" Component={withSuspense(HomeLoanCreate)} />
    <Route path="/settings/home-loan-edit/:id" Component={withSuspense(HomeLoanEdit)} />
    <Route path="/settings/home-loan-list" Component={withSuspense(HomeLoanList)} />

    {/* Image Config Routes */}
    <Route path="/settings/image-config-create" Component={withSuspense(ImageConfigCreate)} />
    <Route path="/settings/image-config-edit/:id" Component={withSuspense(ImageConfigEdit)} />
    <Route path="/settings/image-config-list" Component={withSuspense(ImageConfigList)} />

    {/* Loan Manager Routes */}
    <Route path="/settings/loan-manager-add" Component={withSuspense(LoanManagerAdd)} />
    <Route path="/settings/loan-manager-edit/:id" Component={withSuspense(LoanManagerEdit)} />
    <Route path="/settings/loan-manager-list" Component={withSuspense(LoanManagerList)} />
    
    {/* Department Routes */}
    <Route path="/settings/department-list" Component={withSuspense(DepartmentList)} />
    <Route path="/settings/department-create" Component={withSuspense(DepartmentCreate)} />

    {/* Lock Function Routes */}
    <Route path="/settings/lock-function-create" Component={withSuspense(LockFunctionCreate)} />
    <Route path="/settings/lock-function-list" Component={withSuspense(LockFunctionList)} />
    <Route path="/settings/lock-function-edit/:id" element={<LockFunctionEdit />} />

    {/* Lock Role Routes */}
    <Route path="/settings/lock-role-create" Component={withSuspense(LockRoleCreate)} />
    <Route path="/settings/lock-role-list" Component={withSuspense(LockRoleList)} />

    {/* Loyalty Manager Routes */}
    <Route path="/loyalty/loyalty-managers-create" Component={withSuspense(LoyaltyManagersCreate)} />
    <Route path="/loyalty/loyalty-managers-edit/:id" Component={withSuspense(LoyaltyManagersEdit)} />
    <Route path="/loyalty/loyalty-managers-list" Component={withSuspense(LoyaltyManagersList)} />



    {/* Organization Routes */}
    <Route path="/maintenance/organization-create" Component={withSuspense(OrganizationCreate)} />
    <Route path="/maintenance/organization-list" Component={withSuspense(OrganizationList)} />
    <Route path="/maintenance/organization-update/:id" Component={withSuspense(OrganizationUpdate)} />

    {/* Project Details Routes */}
    <Route path="/maintenance/project-details-create" Component={withSuspense(ProjectDetailsCreate)} />
    <Route path="/maintenance/project-details-edit/:id" Component={withSuspense(ProjectDetailsEdit)} />
    <Route path="/maintenance/project-details-view/:id" Component={withSuspense(ProjectDetails)} />
    <Route path="/maintenance/project-details-list" Component={withSuspense(ProjectDetailsList)} />


    <Route path="/settings/project-building-type" Component={withSuspense(ProjectBuildingType)} />
    <Route path="/settings/project-building-type-edit/:id" Component={withSuspense(ProjectBuildingTypeEdit)} />
    <Route path="/settings/project-building-type-list" Component={withSuspense(ProjectBuildingTypeList)} />

     <Route path="/settings/project-details-create" Component={withSuspense(ProjectDetailsCreate)} />
    <Route path="/settings/project-details-edit/:id" Component={withSuspense(ProjectDetailsEdit)} />
    <Route path="/settings/project-details-view/:id" Component={withSuspense(ProjectDetails)} />
    <Route path="/settings/project-details-list" Component={withSuspense(ProjectDetailsList)} />


    {/* Property Type Routes */}
    <Route path="/settings/property-type" Component={withSuspense(PropertyType)} />
    <Route path="/settings/property-type-edit/:id" Component={withSuspense(PropertyTypeEdit)} />
    <Route path="/settings/property-type-list" Component={withSuspense(PropertyTypeList)} />

    {/* Referral Routes */}
    <Route path="/loyalty/referral-create" Component={withSuspense(ReferralCreate)} />
    <Route path="/loyalty/referral-edit/:id" Component={withSuspense(ReferralEdit)} />
    <Route path="/loyalty/referral-list" Component={withSuspense(ReferralList)} />

    {/* Referral Program Routes */}
    <Route path="/maintenance/referral-program-create" Component={withSuspense(ReferralProgramCreate)} />
    <Route path="/maintenance/referral-program-edit/:id" Component={withSuspense(ReferralProgramEdit)} />
    <Route path="/maintenance/referral-program-list" Component={withSuspense(ReferralProgramList)} />

    {/* Service Category Routes */}
    <Route path="/settings/service-category" Component={withSuspense(ServiceCategory)} />
    <Route path="/settings/service-category/:serviceId" Component={withSuspense(ServiceCategory)} />
    <Route path="/settings/service-category-list" Component={withSuspense(ServiceCategoryList)} />

    {/* Site Routes */}
    <Route path="/maintenance/site-create" Component={withSuspense(SiteCreate)} />
    <Route path="/maintenance/site-edit/:id" Component={withSuspense(SiteEdit)} />
    <Route path="/maintenance/site-list" Component={withSuspense(SiteList)} />

    {/* Site Visit Routes */}
    <Route path="/settings/site-visit-create" Component={withSuspense(SiteVisitCreate)} />
    <Route path="/settings/site-visit-edit/:id" Component={withSuspense(SiteVisitEdit)} />
    <Route path="/settings/site-visit-list" Component={withSuspense(SiteVisitList)} />

    {/* Site Visit Slot Config Routes */}
    <Route path="/settings/site-visit-slot-config" Component={withSuspense(SiteVisitSlotConfig)} />
    <Route path="/settings/site-visit-slot-config-list" Component={withSuspense(SiteVisitSlotConfigList)} />

    {/* SMTP Settings Routes */}
    <Route path="/settings/smtp-settings-edit/:id" Component={withSuspense(SmtpSettingsEdit)} />
    <Route path="/settings/smtp-settings-list" Component={withSuspense(SmtpSettingsList)} />

    {/* Specification Routes */}
    <Route path="/maintenance/specification" Component={withSuspense(Specification)} />
    <Route path="/maintenance/specification-list" Component={withSuspense(SpecificationList)} />
    <Route path="/maintenance/specification-update/:id" Component={withSuspense(SpecificationUpdate)} />

    {/* Support Service Routes */}
    <Route path="/settings/support-service-list" Component={withSuspense(SupportServiceList)} />

    {/* Tag Routes */}
    <Route path="/settings/tag-add" Component={withSuspense(TagAdd)} />

    {/* TDS Tutorials Routes */}
    <Route path="/settings/tds-tutorials-create" Component={withSuspense(TdsTutorialsCreate)} />
    <Route path="/settings/tds-tutorials-edit/:id" Component={withSuspense(TdsTutorialsEdit)} />
    <Route path="/settings/tds-tutorials-list" Component={withSuspense(TdsTutorialsList)} />

    {/* Testimonial Routes */}
    <Route path="/maintenance/testimonials" Component={withSuspense(Testimonials)} />
    <Route path="/maintenance/testimonial-edit/:id" Component={withSuspense(TestimonialEdit)} />
    <Route path="/maintenance/testimonial-list" Component={withSuspense(TestimonialList)} />

    {/* User Routes */}
    <Route path="/settings/user-create" Component={withSuspense(UserCreate)} />
    <Route path="/settings/user-details/:id" Component={withSuspense(UserDetails)} />
    <Route path="/settings/user-edit/:id" Component={withSuspense(UserEdit)} />
    <Route path="/settings/user-list" Component={withSuspense(UserList)} />

    {/* User Groups Routes */}
    <Route path="/settings/user-groups-create" Component={withSuspense(UserGroupsCreate)} />
    <Route path="/settings/user-groups-edit/:id" Component={withSuspense(UserGroupsEdit)} />
    <Route path="/settings/user-groups-list" Component={withSuspense(UserGroupsList)} />
    <Route path="/settings/groups-list" Component={withSuspense(FMGroupDashboard)} />

    {/* Press Releases Routes */}
    <Route path="/maintenance/press-releases-create" Component={withSuspense(PressReleasesCreate)} />
    <Route path="/maintenance/press-releases-edit/:id" Component={withSuspense(PressReleasesEdit)} />
    <Route path="/maintenance/press-releases-list" Component={withSuspense(PressReleasesList)} />

    {/* Loyalty Module Routes */}
    <Route path="/loyalty/loyalty-members-list" Component={withSuspense(LoyaltyMembersList)} />
    <Route path="/loyalty/loyalty-tiers-list" Component={withSuspense(LoyaltyTiersList)} />
    <Route path="/loyalty/new-tier" Component={withSuspense(NewTier)} />
    <Route path="/loyalty/rule-engine-list" Component={withSuspense(RuleEngineList)} />
    <Route path="/loyalty/lock-payments-list" Component={withSuspense(LockPaymentsList)} />
    <Route path="/loyalty/home-loan-requests-list" Component={withSuspense(HomeLoanRequestsList)} />
    <Route path="/loyalty/demand-notes-list" Component={withSuspense(DemandNotesList)} />
    <Route path="/loyalty/orders-list" Component={withSuspense(OrdersList)} />
    <Route path="/loyalty/encash-list" Component={withSuspense(EncashList)} />

    {/* Project Configuration Routes */}
    <Route path="/settings/project-configuration" Component={withSuspense(ProjectConfiguration)} />
    <Route path="/settings/project-configuration-list" Component={withSuspense(ProjectConfigurationList)} />
    <Route path="/settings/project-configuration-edit/:id" element={<ProjectConfigEdit />} />

    {/* Plus Services Routes */}
    <Route path="/settings/plus-services-list" Component={withSuspense(PlusServicesList)} />
    <Route path="/settings/plus-services-create" Component={withSuspense(PlusServicesCreate)} />

    {/* BMS Routes */}
    <Route path="/bms/helpdesk" Component={withSuspense(BMSHelpdesk)} />
    <Route path="/bms/communication-template" Component={withSuspense(BMSCommunicationTemplate)} />
    <Route path="/bms/feedbacks" Component={withSuspense(BMSFeedbacks)} />
    <Route path="/bms/parking" Component={withSuspense(BMSParking)} />
    <Route path="/bms/groups" Component={withSuspense(BMSGroups)} />
    <Route path="/bms/quarantine-tracker" Component={withSuspense(BMSQuarantineTracker)} />
    <Route path="/bms/offers" Component={withSuspense(BMSOffers)} />
    <Route path="/bms/documents/flat-related" Component={withSuspense(BMSDocumentsFlatRelated)} />
    <Route path="/bms/documents/common-files" Component={withSuspense(BMSDocumentsCommonFiles)} />
    <Route path="/bms/business-directory/setup" Component={withSuspense(BMSBusinessDirectorySetup)} />
    <Route path="/bms/business-directory/list" Component={withSuspense(BMSBusinessDirectoryList)} />
    <Route path="/bms/mis" Component={withSuspense(BMSMIS)} />
    <Route path="/bms/helpdesk-report" Component={withSuspense(BMSHelpdeskReport)} />
    <Route path="/bms/invoice-report" Component={withSuspense(BMSInvoiceReport)} />

    {/* CMS Routes */}
    <Route path="/cms/facility" Component={withSuspense(CMSFacility)} />
    <Route path="/cms/rules" Component={withSuspense(CMSRules)} />
    <Route path="/cms/club-members" Component={withSuspense(CMSClubMembers)} />
    <Route path="/cms/facility-bookings" Component={withSuspense(CMSFacilityBookings)} />
    <Route path="/cms/payments" Component={withSuspense(CMSPayments)} />

    {/* Campaigns Routes */}
    <Route path="/campaigns/referrals" Component={withSuspense(CampaignsReferrals)} />
    <Route path="/campaigns/referral-setup" Component={withSuspense(CampaignsReferralSetup)} />
    <Route path="/campaigns/other-project" Component={withSuspense(CampaignsOtherProject)} />

    {/* F&B Routes */}
    <Route path="/fb/restaurants" Component={withSuspense(FBRestaurants)} />
    <Route path="/fb/notifications" Component={withSuspense(FBNotifications)} />

    {/* OSR Routes */}
    <Route path="/osr/setup" Component={withSuspense(OSRSetup)} />
    <Route path="/osr/manage-bookings" Component={withSuspense(OSRManageBookings)} />

    {/* Accounting Routes */}
    <Route path="/accounting/dashboard" Component={withSuspense(AccountingDashboard)} />
    <Route path="/accounting/chart-of-accounts" Component={withSuspense(AccountingChartOfAccounts)} />
    <Route path="/accounting/subgroup-setup" Component={withSuspense(AccountingSubgroupSetup)} />
    <Route path="/accounting/opening-balances" Component={withSuspense(AccountingOpeningBalances)} />
    <Route path="/accounting/tax-setup" Component={withSuspense(AccountingTaxSetup)} />
    <Route path="/accounting/cost-center" Component={withSuspense(AccountingCostCenter)} />
    <Route path="/accounting/transactions" Component={withSuspense(AccountingTransactions)} />
    <Route path="/accounting/invoices" Component={withSuspense(AccountingInvoices)} />
    <Route path="/accounting/receipts" Component={withSuspense(AccountingReceipts)} />
    <Route path="/accounting/charges" Component={withSuspense(AccountingCharges)} />
    <Route path="/accounting/bill-cycles" Component={withSuspense(AccountingBillCycles)} />
    <Route path="/accounting/units-bill-cycle-mapping" Component={withSuspense(AccountingUnitsBillCycleMapping)} />
    <Route path="/accounting/charge-calculations" Component={withSuspense(AccountingChargeCalculations)} />
    <Route path="/accounting/custom-settings" Component={withSuspense(AccountingCustomSettings)} />
    <Route path="/accounting/balance-sheet" Component={withSuspense(AccountingBalanceSheet)} />
    <Route path="/accounting/profit-loss" Component={withSuspense(AccountingProfitLoss)} />
    <Route path="/accounting/gst-payable" Component={withSuspense(AccountingGSTPayable)} />
    <Route path="/accounting/gst-receivable" Component={withSuspense(AccountingGSTReceivable)} />
    <Route path="/accounting/tax-summary" Component={withSuspense(AccountingTaxSummary)} />
    <Route path="/accounting/invoice-report" Component={withSuspense(AccountingInvoiceReport)} />
    <Route path="/accounting/download-report" Component={withSuspense(AccountingDownloadReport)} />

    {/* Fitout Routes */}
    <Route path="/fitout/setup" Component={withSuspense(FitoutSetup)} />
    <Route path="/fitout/requests" Component={withSuspense(FitoutRequests)} />
    <Route path="/fitout/requests/add" Component={withSuspense(FitoutRequestAdd)} />
    <Route path="/fitout/requests/details/:id" Component={withSuspense(FitoutRequestDetails)} />
    <Route path="/fitout/requests/edit/:id" Component={withSuspense(FitoutRequestEdit)} />
    <Route path="/fitout/checklists" Component={withSuspense(FitoutChecklists)} />
    <Route path="/fitout/checklists/add" Component={withSuspense(AddFitoutChecklistPage)} />
    <Route path="/fitout/checklists/edit/:id" Component={withSuspense(EditFitoutChecklistPage)} />
    <Route path="/fitout/checklists/details/:id" Component={withSuspense(FitoutChecklistDetailsPage)} />
    <Route path="/fitout/deviations" Component={withSuspense(FitoutDeviations)} />
    <Route path="/maintenance/fitout-deviations" Component={withSuspense(FitoutDeviations)} />
    <Route path="/maintenance/fitout-deviation-details/:flat_id" Component={withSuspense(FitoutDeviationDetails)} />
    <Route path="/maintenance/fitout-deviation-detail/:deviation_id" Component={withSuspense(ViolationDetail)} />
    <Route path="/fitout/report" Component={withSuspense(FitoutReport)} />

    {/* SmartSecure Routes */}
    <Route path="/smartsecure/visitor-in" Component={withSuspense(SmartSecureVisitorIn)} />
    <Route path="/smartsecure/visitor-out" Component={withSuspense(SmartSecureVisitorOut)} />
    <Route path="/smartsecure/visitor-history" Component={withSuspense(SmartSecureVisitorHistory)} />
    <Route path="/smartsecure/staffs/all" Component={withSuspense(SmartSecureStaffsAll)} />
    <Route path="/smartsecure/staffs/in" Component={withSuspense(SmartSecureStaffsIn)} />
    <Route path="/smartsecure/staffs/out" Component={withSuspense(SmartSecureStaffsOut)} />
    <Route path="/smartsecure/staffs/history" Component={withSuspense(SmartSecureStaffsHistory)} />
    <Route path="/smartsecure/vehicles/out" Component={withSuspense(SmartSecureVehiclesOut)} />
    <Route path="/smartsecure/vehicles/history" Component={withSuspense(SmartSecureVehiclesHistory)} />
    <Route path="/smartsecure/reports/visitors" Component={withSuspense(SmartSecureReportsVisitors)} />
    <Route path="/smartsecure/reports/staffs" Component={withSuspense(SmartSecureReportsStaffs)} />
    <Route path="/smartsecure/reports/member-vehicles" Component={withSuspense(SmartSecureReportsMemberVehicles)} />
    <Route path="/smartsecure/reports/guest-vehicles" Component={withSuspense(SmartSecureReportsGuestVehicles)} />
    <Route path="/smartsecure/reports/patrolling" Component={withSuspense(SmartSecureReportsPatrolling)} />
    <Route path="/smartsecure/patrolling" Component={withSuspense(SmartSecurePatrolling)} />
    <Route path="/smartsecure/setup/general" Component={withSuspense(SmartSecureSetupGeneral)} />
    <Route path="/smartsecure/setup/visitor-parking" Component={withSuspense(SmartSecureSetupVisitorParking)} />
    <Route path="/smartsecure/setup/support-staff" Component={withSuspense(SmartSecureSetupSupportStaff)} />

    {/* Incidents Routes */}
    <Route path="/incidents/setup" Component={withSuspense(IncidentsSetup)} />
    <Route path="/incidents/incidents" Component={withSuspense(IncidentsIncidents)} />
    <Route path="/incidents/design-inputs" Component={withSuspense(IncidentsDesignInputs)} />

    {/* Offers Routes */}
    <Route path="/offers/add" Component={withSuspense(AddOffersPage)} />
    <Route path="/offer/add" Component={withSuspense(AddOfferPage)} />
    <Route path="/offer/add/:id" Component={withSuspense(AddOfferPage)} />
    <Route path="/offer/view/:id" Component={withSuspense(OfferViewPage)} />
    <Route path="/business-directory/add" Component={withSuspense(AddBusinessDirectoryPage)} />
    <Route path="/mis/add" Component={withSuspense(AddMISPage)} />

    {/* Template Routes */}
    <Route path="/settings/template-list" Component={withSuspense(TemplateList)} />
    <Route path="/settings/template/list" Component={withSuspense(TemplateList)} />
    <Route path="/settings/template/add" Component={withSuspense(AddTemplatePage)} />
    <Route path="/settings/template/edit/:id" Component={withSuspense(AddTemplatePage)} />
    <Route path="/settings/template/view/:id" Component={withSuspense(TemplateView)} />
  </>
);
