import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Heading } from '@/components/ui/heading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryManagement } from './CategoryManagement';
import { SubcategoryManagement } from './SubcategoryManagement';

export const CategorySubcategoryDialog: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('category');

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6" style={{ backgroundColor: '#FAF9F7', minHeight: '100vh' }}>
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Heading level="h1" variant="default">
          Manage Categories & Subcategories
        </Heading>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger
            value="category"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Category
          </TabsTrigger>

          <TabsTrigger
            value="subcategory"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            Subcategory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="mt-6">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="subcategory" className="mt-6">
          <SubcategoryManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategorySubcategoryDialog;
