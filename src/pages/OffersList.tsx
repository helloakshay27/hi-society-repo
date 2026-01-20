import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Filter, Eye, Pencil, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Button as MuiButton } from '@mui/material';
import { toast, Toaster } from 'sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { useNavigate } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Column } from 'jspdf-autotable';
import axios from 'axios';

interface ApiOffer {
  id: number;
  title: string;
  description: string;
  expiry: string;
  active: number;
  start_date: string;
  created_at: string;
  updated_at: string;
  project_id: number;
  featured: boolean;
  show_on_home: boolean | null;
  image_1_by_1: any;
  image_9_by_16: any;
  image_3_by_2: any;
  image_16_by_9: any;
  offer_applicable_projects: Array<{
    id: number;
    project_id: number;
    project_name: string;
  }>;
}

interface ApiResponse {
  code: number;
  offers: ApiOffer[];
}

interface Offer {
  id: number;
  offerId: string;
  offerTitle: string;
  description: string;
  offerType: string;
  applicableProjects: string;
  startDate: string;
  endDate: string;
  status: string;
  featured: boolean;
  showOnHome: boolean;
  createdAt: string;
  lastDateUpdated: string;
  imageUrl: string;
}

export default function OffersList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('offers');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffers, setSelectedOffers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // LocalStorage keys (must match AddOfferPage)
  const STORAGE_KEYS = {
    FORM_DATA: 'addOffer_formData',
    UPLOADED_IMAGES: 'addOffer_uploadedImages',
    ACTIVE_STEP: 'addOffer_activeStep',
    COMPLETED_STEPS: 'addOffer_completedSteps',
  };

  // Check if draft exists in localStorage
  const checkDraftExists = () => {
    try {
      const savedFormData = localStorage.getItem(STORAGE_KEYS.FORM_DATA);
      const savedActiveStep = localStorage.getItem(STORAGE_KEYS.ACTIVE_STEP);
      return !!(savedFormData || savedActiveStep);
    } catch (error) {
      console.error('Error checking draft:', error);
      return false;
    }
  };

  // Clear all draft data from localStorage
  const clearDraft = () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  // Stats
  const [totalOffers, setTotalOffers] = useState(0);
  const [activeOffers, setActiveOffers] = useState(0);
  const [expiredOffers, setExpiredOffers] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Cleanup body overflow styles when component mounts (fixes scroll-lock from modals)
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.body.style.paddingRight = '0px';
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, []);

  // Mock data - Replace with actual API calls
  useEffect(() => {
    fetchOffers();
  }, [currentPage]);

  // Helper function to format date from API to DD/MM/YYYY
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to determine offer status
  const getOfferStatus = (active: number, expiryDate: string): string => {
    if (active === 0) return 'Inactive';
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today ? 'Expired' : 'Active';
  };

  // Helper function to get project names from offer_applicable_projects array
  const getProjectNames = (offerApplicableProjects: any[]): string => {
    if (!offerApplicableProjects || !Array.isArray(offerApplicableProjects) || offerApplicableProjects.length === 0) {
      return '-';
    }
    return offerApplicableProjects.map((oap: any) => oap.project_name || `Project ${oap.project_id}`).join(', ');
  };

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get<ApiResponse>(
        'https://uat-hi-society.lockated.com/crm/offers.json',
        {
          params: {
            token: 'bfa5004e7b0175622be8f7e69b37d01290b737f82e078414'
          }
        }
      );

      if (response.data.code === 200 && response.data.offers) {
        const mappedOffers: Offer[] = response.data.offers.map((apiOffer: any) => {
          const status = getOfferStatus(apiOffer.active, apiOffer.expiry);
          return {
            id: apiOffer.id,
            offerId: `OFF-${String(apiOffer.id).padStart(4, '0')}`,
            offerTitle: apiOffer.title,
            description: apiOffer.description || '-',
            offerType: apiOffer.offer_type || '-',
            applicableProjects: getProjectNames(apiOffer.offer_applicable_projects),
            startDate: formatDate(apiOffer.start_date),
            endDate: formatDate(apiOffer.expiry),
            status: status,
            featured: apiOffer.featured,
            showOnHome: apiOffer.show_on_home || false,
            createdAt: formatDate(apiOffer.created_at),
            lastDateUpdated: formatDate(apiOffer.updated_at),
            imageUrl: apiOffer.image_1_by_1?.document_url || ''
          };
        });

        setOffers(mappedOffers);
        
        // Calculate stats
        const activeCount = mappedOffers.filter(o => o.status === 'Active').length;
        const expiredCount = mappedOffers.filter(o => o.status === 'Expired').length;
        const totalCount = mappedOffers.length;
        
        setTotalOffers(totalCount);
        setActiveOffers(activeCount);
        setExpiredOffers(expiredCount);
        setTotalCount(totalCount);
        setTotalPages(Math.ceil(totalCount / 10)); // Assuming 10 items per page
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
      // You may want to show an error toast here
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleSearch = (value: string) => {
    setSearchLoading(true);
    // Implement search logic
    setTimeout(() => {
      setSearchLoading(false);
    }, 500);
  };

  const handleOfferSelection = (itemId: string) => {
    const id = parseInt(itemId);
    setSelectedOffers(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedOffers(offers.map(o => o.id));
    } else {
      setSelectedOffers([]);
    }
  };

  const handleExport = () => {
    // Implement export logic
    console.log('Exporting offers...');
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // All columns from API
  const columns = [
    { key: 'srNo', label: 'Sr. No.', sortable: false },
    { key: 'actions', label: 'Actions', sortable: false },
    { key: 'offerId', label: 'Offer ID', sortable: true },
    { key: 'image', label: 'Image', sortable: false },
    { key: 'offerTitle', label: 'Offer Title', sortable: true },
    { key: 'offerType', label: 'Offer Type', sortable: true },
    { key: 'applicableProjects', label: 'Applicable Project(s)', sortable: true },
    { key: 'startDate', label: 'Start Date', sortable: true },
    { key: 'endDate', label: 'End Date', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'featured', label: 'Featured', sortable: true },
    { key: 'showOnHome', label: 'Show on Home', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'lastDateUpdated', label: 'Last Updated', sortable: true }
  ];

  // Render cell function for EnhancedTable
  const renderCell = (item: Offer, columnKey: string, index?: number) => {
    switch (columnKey) {
      case 'srNo':
        const itemIndex = index !== undefined ? index : offers.findIndex(o => o.id === item.id);
        return itemIndex !== -1 ? itemIndex + 1 : '-';
      
      case 'offerId':
        return item.offerId;
      
      case 'image':
        return item.imageUrl ? (
          <div className="w-16 h-16 rounded overflow-hidden border border-gray-200">
            <img 
              src={item.imageUrl} 
              alt={item.offerTitle}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center border border-gray-200">
            <span className="text-xs text-gray-400">No Image</span>
          </div>
        );
      
      case 'offerTitle':
        return item.offerTitle;

      case 'offerType':
        return item.offerType;
      
      case 'description':
        return item.description;
      
      case 'applicableProjects':
        return item.applicableProjects;
      
      case 'startDate':
        return item.startDate;
      
      case 'endDate':
        return item.endDate;
      
      case 'status':
        return (
          <div
            className="inline-flex px-auto text-center text-xs font-medium"
            style={{ width: 200, maxWidth: 200 }}
          >
            <div className={ ` py-2.5
              ${item.status === 'Active'
                ? 'bg-[#d5dbdb] w-full'
                : item.status === 'Inactive'
                ? 'bg-[#e4626f] w-full'
                : 'bg-[#d5dbdb] w-full'}
            `}>
              <p className="text-center mx-auto">
                {item.status === 'Active' ? 'Active' : item.status === 'Inactive' ? 'Expired' : 'Expired'}
              </p>
            </div>
          </div>
        );
      
      case 'featured':
        return item.featured ? 'Yes' : 'No';
      
      case 'showOnHome':
        return item.showOnHome ? 'Yes' : 'No';
      
      case 'createdAt':
        return item.createdAt;
      
      case 'lastDateUpdated':
        return item.lastDateUpdated;
      
      case 'actions':
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/offer/view/${item.id}`)}
              title="View"
            >
              <Eye className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/offer/add/${item.id}`)}
              title="Edit"
            >
              <Pencil className="w-4 h-4 text-gray-700" />
            </Button>
          </div>
        );
      
      default:
        return String(item[columnKey as keyof Offer] ?? "-");
    }
  };

  const handleAddOffer = () => {
    // Check if draft exists before navigating
    if (checkDraftExists()) {
      setShowDraftModal(true);
    } else {
      navigate('/offer/add');
    }
  };

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    navigate('/offer/add');
    // The AddOfferPage will handle loading the draft
  };

  const handleStartFresh = () => {
    clearDraft();
    setShowDraftModal(false);
    navigate('/offer/add');
    toast.info('Starting fresh! Previous draft has been cleared.', {
      duration: 3000,
    });
  };

  const renderCustomActions = () => {
    return (
      <div className="flex gap-2">
        <Button 
          onClick={handleAddOffer}
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> 
          Add
        </Button>
        {selectedOffers.length > 0 && (
          <Button
            variant="outline"
            onClick={() => console.log('Bulk action')}
            className="bg-white hover:bg-gray-50"
          >
            Actions ({selectedOffers.length})
          </Button>
        )}
      </div>
    );
  };
  console.log('Rendered OffersList with offers:', offers);

  return (
    <div className="p-2 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Draft Detection Modal */}
      <Dialog open={showDraftModal} onClose={() => setShowDraftModal(false)}>
        <DialogTitle sx={{ fontFamily: 'Work Sans, sans-serif', fontWeight: 600 }}>
          Draft Found
        </DialogTitle>
        <DialogContent sx={{ fontFamily: 'Work Sans, sans-serif' }}>
          We found a saved draft for creating an offer. Would you like to continue where you left off or start fresh?
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <MuiButton
            onClick={handleStartFresh}
            sx={{
              backgroundColor: '#e7e3d9',
              color: '#C72030',
              borderRadius: 0,
              textTransform: 'none',
              padding: '8px 16px',
              fontFamily: 'Work Sans, sans-serif',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#d9d5c9',
              },
            }}
          >
            Start Fresh
          </MuiButton>
          <MuiButton
            onClick={handleContinueDraft}
            sx={{
              backgroundColor: '#C72030',
              color: 'white',
              borderRadius: 0,
              textTransform: 'none',
              padding: '8px 16px',
              fontFamily: 'Work Sans, sans-serif',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(199, 32, 48, 0.2)',
              '&:hover': {
                backgroundColor: '#B8252F',
                boxShadow: '0 4px 8px rgba(199, 32, 48, 0.3)',
              },
            }}
          >
            Continue Draft
          </MuiButton>
        </DialogActions>
      </Dialog>

      <Tabs defaultValue="offers" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 bg-white border border-gray-200">
          <TabsTrigger
            value="offers"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              className="lucide lucide-tag w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
            >
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <path d="M7 7h.01" />
            </svg>
            Offers List
          </TabsTrigger>

          <TabsTrigger
            value="analytics"
            className="group flex items-center gap-2 data-[state=active]:bg-[#EDEAE3] data-[state=active]:text-[#C72030] data-[state=inactive]:bg-white data-[state=inactive]:text-black border-none font-semibold"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={2}
              className="lucide lucide-chart-column w-4 h-4 stroke-black group-data-[state=active]:stroke-[#C72030]"
            >
              <path d="M3 3v16a2 2 0 0 0 2 2h16" />
              <path d="M18 17V9" />
              <path d="M13 17V5" />
              <path d="M8 17v-3" />
            </svg>
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4 sm:space-y-4 mt-4">
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="outline"
              onClick={() => console.log('Filter analytics')}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-gray-300"
            >
              <Calendar className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                2025-01-01 - 2025-12-31
              </span>
              <Filter className="w-4 h-4 text-gray-600" />
            </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 min-h-[calc(100vh-200px)]">
            <div className="xl:col-span-12">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Coming Soon</h3>
                <p className="text-gray-600">Offer analytics and insights will be displayed here.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4 sm:space-y-4 mt-4 sm:mt-6">
          {/* Offer Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mb-6">
            {[{
              label: 'Total Offers',
              value: totalOffers,
              icon: Settings,
              type: 'total',
              clickable: true
            }, {
              label: 'Active',
              value: activeOffers,
              icon: Settings,
              type: 'active',
              clickable: true
            }, {
              label: 'Expired',
              value: expiredOffers,
              icon: Settings,
              type: 'expired',
              clickable: true
            }].map((item, i) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={i}
                  className={`bg-[#F6F4EE] p-6 rounded-lg shadow-[0px_1px_8px_rgba(45,45,45,0.05)] flex items-center gap-4 ${item.clickable ? "cursor-pointer hover:shadow-lg transition-shadow" : ""}`}
                  onClick={() => item.clickable && console.log(`Filter by ${item.type}`)}
                >
                  <div className="w-14 h-14 bg-[#C4B89D54] flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-[#C72030]" />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-[#1A1A1A]">
                      {item.value}
                    </div>
                    <div className="text-sm font-medium text-[#1A1A1A]">
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Offers Table */}
          <div className="overflow-x-auto animate-fade-in">
            {searchLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-center">
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Searching offers...</span>
                </div>
              </div>
            )}
            {/* Pass columns and data from state to EnhancedTable */}
            <EnhancedTable
              data={offers}
              columns={columns}
              renderCell={renderCell}
              pagination={false}
              enableExport={true}
              exportFileName="offers"
              handleExport={handleExport}
              storageKey="offers-table"
              enableSelection={true}
              selectedItems={selectedOffers.map(id => id.toString())}
              onSelectItem={handleOfferSelection}
              onSelectAll={handleSelectAll}
              getItemId={offer => offer.id.toString()}
              leftActions={
                // <div className="flex gap-3">
                  renderCustomActions()
                // </div>
              }
              onFilterClick={() => setIsFilterOpen(true)}
              rightActions={null}
              searchPlaceholder="Search Offers"
              onSearchChange={handleSearch}
              hideTableExport={false}
              hideColumnsButton={false}
              className="transition-all duration-500 ease-in-out"
              loading={loading}
              loadingMessage="Loading offers..."
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: Math.min(totalPages, 10) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    {totalPages > 10 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-center mt-2 text-sm text-gray-600">
                  Showing page {currentPage} of {totalPages} ({totalCount} total offers)
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
