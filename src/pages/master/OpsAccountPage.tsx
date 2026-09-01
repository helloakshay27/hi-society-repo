import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  OrganizationTab,
  CompanyTab,
  CountryTab,
  RegionTab,
  ZoneTab,
  SiteTab,
  EntityTab,
  UserCategoryTab,
  SocietyTab
} from '@/components/ops-account';

const VALID_TABS = ['organization', 'company', 'country', 'region', 'zone', 'society', 'site'];

export const OpsAccountPage = () => {
  // The active tab lives in the URL (not just component state) so that
  // navigating away to a details/edit page and back (e.g. via the page's
  // "Back" button, which returns to this same base URL) restores the tab
  // the user was actually on, instead of always resetting to Organization.
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'organization';

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab }, { replace: false });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState('25');

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1a1a1a]">ACCOUNT</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-white border border-gray-200">
          <TabsTrigger
            value="organization"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Organization
          </TabsTrigger>
          <TabsTrigger
            value="company"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Company
          </TabsTrigger>
          <TabsTrigger
            value="country"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Headquarter
          </TabsTrigger>
          <TabsTrigger
            value="region"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Region
          </TabsTrigger>
          <TabsTrigger
            value="zone"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Zone
          </TabsTrigger>
          <TabsTrigger
            value="society"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Society
          </TabsTrigger>
          <TabsTrigger
            value="site"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Site
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <OrganizationTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <CompanyTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        <TabsContent value="country" className="space-y-4">
          <CountryTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        <TabsContent value="region" className="space-y-4">
          <RegionTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>
<TabsContent value="society" className="space-y-4">
          <SocietyTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        
        <TabsContent value="zone" className="space-y-4">
          <ZoneTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        <TabsContent value="site" className="space-y-4">
          <SiteTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>
{/* 
        <TabsContent value="entity" className="space-y-4">
          <EntityTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent>

        <TabsContent value="user-category" className="space-y-4">
          <UserCategoryTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            entriesPerPage={entriesPerPage}
            setEntriesPerPage={setEntriesPerPage}
          />
        </TabsContent> */}
      </Tabs>
    </div>
  );
};
