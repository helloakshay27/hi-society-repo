import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchHiSocietyUsers, HiSocietyUser } from "@/store/slices/hiSocietyUsersSlice";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Users, Search } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { ColumnConfig } from "@/hooks/useEnhancedTable";
import { debounce } from "lodash";

const columns: ColumnConfig[] = [
  { key: "id", label: "ID", sortable: true, draggable: true },
  { key: "full_name", label: "Full Name", sortable: true, draggable: true },
  { key: "email", label: "Email", sortable: true, draggable: true },
  { key: "mobile", label: "Mobile", sortable: true, draggable: true },
  { key: "firstname", label: "First Name", sortable: true, draggable: true },
  { key: "lastname", label: "Last Name", sortable: true, draggable: true },
];

export const HiSocietyUsersDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { users, pagination, loading } = useAppSelector(
    (state: RootState) => state.hiSocietyUsers
  );

  const [emailSearch, setEmailSearch] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = useCallback(
    (page: number, email: string, mobile: string) => {
      dispatch(fetchHiSocietyUsers({ page, email, mobile }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchUsers(1, "", "");
  }, [fetchUsers]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((page: number, email: string, mobile: string) => {
      fetchUsers(page, email, mobile);
    }, 500),
    [fetchUsers]
  );

  const handleEmailChange = (val: string) => {
    setEmailSearch(val);
    setCurrentPage(1);
    debouncedFetch(1, val, mobileSearch);
  };

  const handleMobileChange = (val: string) => {
    setMobileSearch(val);
    setCurrentPage(1);
    debouncedFetch(1, emailSearch, val);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, emailSearch, mobileSearch);
  };

  const renderCell = (user: HiSocietyUser, key: string): React.ReactNode => {
    const value = user[key as keyof HiSocietyUser];
    if (value === null || value === undefined) return "-";
    return String(value);
  };

  const totalPages = pagination?.total_pages || 0;

  const renderPaginationItems = () => {
    if (!totalPages || totalPages <= 0) return null;
    const items = [];
    const showEllipsis = totalPages > 7;

    if (showEllipsis) {
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink onClick={() => handlePageChange(1)} isActive={currentPage === 1}>1</PaginationLink>
        </PaginationItem>
      );
      if (currentPage > 4) {
        items.push(<PaginationItem key="e1"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = 2; i <= Math.min(3, totalPages - 1); i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage > 3 && currentPage < totalPages - 2) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          items.push(
            <PaginationItem key={i} className="cursor-pointer">
              <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
            </PaginationItem>
          );
        }
      }
      if (currentPage < totalPages - 3) {
        items.push(<PaginationItem key="e2"><PaginationEllipsis /></PaginationItem>);
      } else {
        for (let i = Math.max(totalPages - 2, 2); i < totalPages; i++) {
          if (!items.find((item) => item.key === i.toString())) {
            items.push(
              <PaginationItem key={i} className="cursor-pointer">
                <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
              </PaginationItem>
            );
          }
        }
      }
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>{i}</PaginationLink>
          </PaginationItem>
        );
      }
    }
    return items;
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#C72030]" />
          <h1 className="text-2xl font-semibold text-gray-800">Hi Society Users</h1>
        </div>
        <div className="text-sm text-gray-500">
          Total: {pagination?.total_count || 0} users
        </div>
      </div>

      {/* Search filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by email..."
            value={emailSearch}
            onChange={(e) => handleEmailChange(e.target.value)}
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by mobile..."
            value={mobileSearch}
            onChange={(e) => handleMobileChange(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <EnhancedTable
          data={users}
          columns={columns}
          renderCell={renderCell}
          renderActions={(item: HiSocietyUser) => (
            <div className="flex justify-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/ops-console/master/user/hi-society-users/view/${item.id}`);
                }}
                title="View"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          )}
          storageKey="hi-society-users-table"
          loading={loading}
        />
      </div>

      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages || loading ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};
