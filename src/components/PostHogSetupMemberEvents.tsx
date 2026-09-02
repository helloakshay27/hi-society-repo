import posthog from 'posthog-js';

export const useSetupMemberEvents = () => {
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
        if (properties.setupmember_name && properties.setupmember_name.match(/test|tesr|oiuytdftyj/i)) {
             console.warn(`PostHog: Skipped '${eventName}' due to test name.`);
             return;
        }

        posthog.capture(eventName, {
            ...baseProps,
            ...properties
        });
    };

    const onSetupMemberCreated = (properties: {
        setupmember_id: string;
        type?: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('SetupMember Created', properties);
    };

    const onSetupMemberUpdated = (properties: {
        setupmember_id: string;
        status?: string;
        [key: string]: any;
    }) => {
        safeCapture('SetupMember Updated', properties);
    };

    const onSetupMemberDeleted = (properties: {
        setupmember_id: string;
        reason?: string;
        [key: string]: any;
    }) => {
        safeCapture('SetupMember Deleted', properties);
    };

    const onSetupMemberViewed = (properties: {
        setupmember_id: string;
        [key: string]: any;
    }) => {
        safeCapture('SetupMember Viewed', properties);
    };

    return {
        onSetupMemberCreated,
        onSetupMemberUpdated,
        onSetupMemberDeleted,
        onSetupMemberViewed
    };
};
