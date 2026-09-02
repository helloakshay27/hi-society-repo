import posthog from 'posthog-js';

export const useCommunityEvents = () => {
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
        if (properties.community_name && properties.community_name.match(/test|tesr|oiuytdftyj/i)) {
             console.warn(`PostHog: Skipped '${eventName}' due to test name.`);
             return;
        }

        posthog.capture(eventName, {
            ...baseProps,
            ...properties
        });
    };

    const onCommunityCreated = (properties: {
        community_id: string;
        type?: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('Community Created', properties);
    };

    const onCommunityUpdated = (properties: {
        community_id: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('Community Updated', properties);
    };

    const onCommunityDeleted = (properties: {
        community_id: string;
        reason?: string;
        [key: string]: any;
    }) => {
        safeCapture('Community Deleted', properties);
    };

    const onCommunityViewed = (properties: {
        community_id: string;
        [key: string]: any;
    }) => {
        safeCapture('Community Viewed', properties);
    };

    return {
        onCommunityCreated,
        onCommunityUpdated,
        onCommunityDeleted,
        onCommunityViewed
    };
};
