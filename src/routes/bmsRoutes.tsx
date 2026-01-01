import { Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load all BMS pages
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

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  </div>
);

// Wrapper to add Suspense to lazy components
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<LoadingFallback />}>
    <Component />
  </Suspense>
);

export const bmsRoutes = (
  <>
    {/* Helpdesk Routes */}
    <Route path="/bms/helpdesk" element={withSuspense(BMSHelpdesk)} />
    <Route path="/bms/communication-template" element={withSuspense(BMSCommunicationTemplate)} />

    {/* Feedbacks Route */}
    <Route path="/bms/feedbacks" element={withSuspense(BMSFeedbacks)} />

    {/* Parking Route */}
    <Route path="/bms/parking" element={withSuspense(BMSParking)} />

    {/* Groups Route */}
    <Route path="/bms/groups" element={withSuspense(BMSGroups)} />

    {/* Quarantine Tracker Route */}
    <Route path="/bms/quarantine-tracker" element={withSuspense(BMSQuarantineTracker)} />

    {/* Offers Route */}
    <Route path="/bms/offers" element={withSuspense(BMSOffers)} />

    {/* Documents Routes */}
    <Route path="/bms/documents/flat-related" element={withSuspense(BMSDocumentsFlatRelated)} />
    <Route path="/bms/documents/common-files" element={withSuspense(BMSDocumentsCommonFiles)} />

    {/* Business Directory Routes */}
    <Route path="/bms/business-directory/setup" element={withSuspense(BMSBusinessDirectorySetup)} />
    <Route path="/bms/business-directory/list" element={withSuspense(BMSBusinessDirectoryList)} />

    {/* MIS Route */}
    <Route path="/bms/mis" element={withSuspense(BMSMIS)} />

    {/* Reports Routes */}
    <Route path="/bms/helpdesk-report" element={withSuspense(BMSHelpdeskReport)} />
    <Route path="/bms/invoice-report" element={withSuspense(BMSInvoiceReport)} />
  </>
);
