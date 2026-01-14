import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryTab } from '@/components/fitout-setup/CategoryTab';
import { StatusTab } from '@/components/fitout-setup/StatusTab';
import { FitoutGuideTab } from '@/components/fitout-setup/FitoutGuideTab';
import { DeviationStatusTab } from '@/components/fitout-setup/DeviationStatusTab';

const FitoutSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState('category');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fitout Setup</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200">
          <TabsTrigger
            value="category"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Category
          </TabsTrigger>

          <TabsTrigger
            value="status"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Status
          </TabsTrigger>

          <TabsTrigger
            value="fitout-guide"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Fitout Guide
          </TabsTrigger>

          <TabsTrigger
            value="deviation-status"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Deviation Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="mt-6">
          <CategoryTab />
        </TabsContent>

        <TabsContent value="status" className="mt-6">
          <StatusTab />
        </TabsContent>

        <TabsContent value="fitout-guide" className="mt-6">
          <FitoutGuideTab />
        </TabsContent>

        <TabsContent value="deviation-status" className="mt-6">
          <DeviationStatusTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FitoutSetup;
