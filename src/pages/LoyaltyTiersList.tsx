import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, X } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { StatsCard } from '@/components/StatsCard';

const validationSchema = Yup.object({
  name: Yup.string().required('Tier Name is required'),
  exit_points: Yup.number()
    .required('Exit Points are required')
    .positive('Exit Points must be a positive number'),
  multipliers: Yup.number()
    .required('Multipliers are required')
    .positive('Multipliers must be a positive number'),
  welcome_bonus: Yup.number()
    .required('Welcome Bonus is required')
    .positive('Welcome Bonus must be a positive number'),
  point_type: Yup.string()
    .required('Point type is required')
    .oneOf(['lifetime', 'yearly'], 'Invalid point type'),
});

interface LoyaltyTier {
  id: number;
  name: string;
  exit_points: number;
  multipliers: number;
  welcome_bonus: number;
  point_type: 'lifetime' | 'yearly';
  member_count?: number;
}

const LoyaltyTiersList = () => {
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTier, setSelectedTier] = useState<LoyaltyTier | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const itemsPerPage = 10;

  const fetchTiers = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    const storedValue = sessionStorage.getItem('selectedId');
    try {
      // Use only the token in the base URL, no Authorization header
      const response = await fetch("https://runwal-api.lockated.com/loyalty/tiers.json?q[loyalty_type_id_eq]=1&token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tiers: ${response.statusText}`);
      }

      const data = await response.json();
      let tiersData: LoyaltyTier[] = [];
      if (Array.isArray(data)) {
        tiersData = data;
      } else if (data?.tiers && Array.isArray(data.tiers)) {
        tiersData = data.tiers;
      } else if (data?.data && Array.isArray(data.data)) {
        tiersData = data.data;
      }
      
      // Client-side search filtering
      let filteredTiers = tiersData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredTiers = tiersData.filter((tier: LoyaltyTier) =>
          tier.name?.toLowerCase().includes(searchLower) ||
          String(tier.exit_points || '').toLowerCase().includes(searchLower) ||
          String(tier.multipliers || '').toLowerCase().includes(searchLower) ||
          (String(tier.multipliers || '') + 'x').toLowerCase().includes(searchLower) ||
          String(tier.welcome_bonus || '').toLowerCase().includes(searchLower) ||
          tier.point_type?.toLowerCase().includes(searchLower)
        );
      }
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedTiers = filteredTiers.slice(startIndex, endIndex);
      
      setTiers(paginatedTiers);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredTiers.length / itemsPerPage));
      setTotalCount(filteredTiers.length);
      
      // Store all tiers for stats calculation
      sessionStorage.setItem('all_tiers', JSON.stringify(tiersData));
    } catch (error) {
      console.error('Error fetching tiers:', error);
      toast.error('Failed to load tiers');
      setTiers([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchTiers(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchTiers]);

  // Calculate stats from all tiers
  const allTiersData = sessionStorage.getItem('all_tiers');
  const allTiers: LoyaltyTier[] = allTiersData ? JSON.parse(allTiersData) : [];
  const yearlyTier = allTiers.filter((item) => item.point_type === 'yearly').length;
  const lifeTimeTier = allTiers.filter((item) => item.point_type === 'lifetime').length;

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleAdd = () => {
    navigate('/loyalty/new-tier');
  };

  const handleView = (id: number) => {
    navigate(`/setup-member/tier-details/${id}`);
  };

  const handleEditClick = (tier: LoyaltyTier) => {
    setSelectedTier(tier);
    setShowModal(true);
  };

  const handleFormSubmit = async (values: any) => {
    if (selectedTier) {
      try {
        // Use only the token in the base URL, no Authorization header
        const response = await fetch(`https://runwal-api.lockated.com/loyalty/tiers/${selectedTier.id}.json?token=QsUjajggGCYJJGKndHkRidBxJN2cIUC06lr42Vru1EQ`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ loyalty_tier: values }),
        });

        if (!response.ok) {
          throw new Error('Failed to update tier');
        }

        toast.success('Tier updated successfully!');
        await fetchTiers(currentPage, searchTerm);
        handleCloseModal();
      } catch (error) {
        console.error('Error updating tier:', error);
        toast.error('Failed to update tier');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTier(null);
  };

  const columns = [
    { key: 'name', label: 'Tier Name', sortable: true },
    { key: 'exit_points', label: 'Exit Points', sortable: true },
    { key: 'multipliers', label: 'Multipliers', sortable: true },
    { key: 'welcome_bonus', label: 'Welcome Bonus', sortable: true },
    { key: 'member_count', label: 'Member Count', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false },
  ];

  const renderCell = (item: LoyaltyTier, columnKey: string) => {
    switch (columnKey) {
      case 'multipliers':
        return `${item.multipliers}x`;
      case 'welcome_bonus':
        return `${item.welcome_bonus} Points`;
      case 'member_count':
        return item.member_count || 0;
      case 'actions':
        return (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditClick(item)}
              title="Edit Tier"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(item.id)}
              title="View Tier"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return item[columnKey as keyof LoyaltyTier] as React.ReactNode ?? '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button
        onClick={handleAdd}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        New Tier
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={tiers}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="loyalty-tiers"
        storageKey="loyalty-tiers-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search tiers (name, points, multipliers, bonus)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching tiers..." : "Loading tiers..."}
      />
      {!searchTerm && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Total Tiers"
          value={allTiers.length}
          icon={
            <svg
              className="w-6 h-6 text-[#C72030]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Rolling Year Tiers"
          value={yearlyTier}
          icon={
            <svg
              className="w-6 h-6 text-[#C72030]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
        <StatsCard
          title="Life Time Tiers"
          value={lifeTimeTier}
          icon={
            <svg
              className="w-6 h-6 text-[#C72030]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          iconRounded={true}
          valueColor="text-[#C72030]"
        />
      </div>

      {renderListTab()}

      {/* Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Edit Tier</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {selectedTier && (
                  <Formik
                    initialValues={{
                      name: selectedTier.name || '',
                      exit_points: selectedTier.exit_points || 0,
                      multipliers: selectedTier.multipliers || 0,
                      welcome_bonus: selectedTier.welcome_bonus || 0,
                      point_type: selectedTier.point_type || '',
                    }}
                    validationSchema={validationSchema}
                    onSubmit={handleFormSubmit}
                  >
                    {({ values, handleChange }) => (
                      <Form>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Tier Name */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Tier Name
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Field
                              type="text"
                              name="name"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                            />
                            <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                          </div>

                          {/* Exit Points */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Exit Points
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Field
                              type="number"
                              name="exit_points"
                              value={values.exit_points}
                              onChange={handleChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                            />
                            <ErrorMessage name="exit_points" component="div" className="text-red-500 text-xs mt-1" />
                          </div>

                          {/* Multipliers */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Multipliers
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Field
                              type="number"
                              name="multipliers"
                              value={values.multipliers}
                              onChange={handleChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                            />
                            <ErrorMessage name="multipliers" component="div" className="text-red-500 text-xs mt-1" />
                          </div>

                          {/* Welcome Bonus */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Welcome Bonus
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <Field
                              type="number"
                              name="welcome_bonus"
                              value={values.welcome_bonus}
                              onChange={handleChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                            />
                            <ErrorMessage name="welcome_bonus" component="div" className="text-red-500 text-xs mt-1" />
                          </div>

                          {/* Point Type */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Point Type
                              <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                              name="point_type"
                              onChange={handleChange}
                              value={values.point_type}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c72030] focus:border-transparent outline-none transition-all"
                            >
                              <option value="lifetime">Life Time</option>
                              <option value="yearly">Yearly</option>
                            </select>
                            <ErrorMessage name="point_type" component="div" className="text-red-500 text-xs mt-1" />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-center gap-4 mt-8">
                          <button
                            type="submit"
                            className="px-8 py-2.5 bg-[#c72030] text-white rounded-lg hover:bg-[#A01828] transition-colors font-medium"
                          >
                            Submit
                          </button>
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="px-8 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </Form>
                    )}
                  </Formik>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LoyaltyTiersList;
