import posthog from 'posthog-js';

export const useMaintenanceEvents = () => {
    const getBaseProperties = () => {
        return {
            project_id: "HS-101",
            project_code: "HS-01",
            company_id: (() => { const v = localStorage.getItem('companyId') || localStorage.getItem('company_id'); return v && !isNaN(Number(v)) ? Number(v) : undefined; })(),
            company_name: localStorage.getItem('selectedCompany') || localStorage.getItem('company_name') || undefined,
            site_id: (() => { const v = localStorage.getItem('selectedSiteId') || localStorage.getItem('site_id'); return v && !isNaN(Number(v)) ? Number(v) : undefined; })(),
            site_name: localStorage.getItem('selectedSiteName') || localStorage.getItem('site_name') || undefined,
            organization_id: (() => { const v = localStorage.getItem('selectedOrgId') || localStorage.getItem('organization_id') || localStorage.getItem('org_id'); return v && !isNaN(Number(v)) ? Number(v) : undefined; })(),
            organization_name: localStorage.getItem('selectedOrg') || localStorage.getItem('organization_name') || undefined,
            user_id: (() => { const v = localStorage.getItem('userId') || localStorage.getItem('user_id'); return v && !isNaN(Number(v)) ? Number(v) : undefined; })(),
            role: localStorage.getItem('role') || localStorage.getItem('userRole'),
            release_version: '1.0',
            is_test: false,
            timestamp: new Date().toISOString()
        };
    };

    const safeCapture = (eventName: string, properties: any = {}) => {
        const baseProps = getBaseProperties();
        
        // Skip tracking if essential properties are missing
        if (!baseProps.company_id || !baseProps.site_id || !baseProps.user_id) {
            console.warn(`PostHog: Skipped '${eventName}' due to missing session context.`);
            return;
        }

        // Data-quality guard
        if (properties.maintenance_name && properties.maintenance_name.match(/test|tesr|oiuytdftyj/i)) {
             console.warn(`PostHog: Skipped '${eventName}' due to test name.`);
             return;
        }

        posthog.capture(eventName, {
            ...baseProps,
            ...properties
        });
    };

    const onMaintenanceCreated = (properties: {
        maintenance_id: string;
        type?: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('Maintenance Created', properties);
    };

    const onMaintenanceUpdated = (properties: {
        maintenance_id: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('Maintenance Updated', properties);
    };

    const onMaintenanceDeleted = (properties: {
        maintenance_id: string;
        reason?: string;
        [key: string]: any;
    }) => {
        safeCapture('Maintenance Deleted', properties);
    };

    const onMaintenanceViewed = (properties: {
        maintenance_id: string;
        [key: string]: any;
    }) => {
        safeCapture('Maintenance Viewed', properties);
    };

    return {
        onMaintenanceCreated,
        onMaintenanceUpdated,
        onMaintenanceDeleted,
        onMaintenanceViewed
    };
};
