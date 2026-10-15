import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable";
import { Eye, Download, Filter, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG, getFullUrl } from "@/config/apiConfig";

interface Feedback {
  id: string;
  tower: string;
  flat: string;
  // question text -> answer, parsed from questions_with_answers
  answers: Record<string, string>;
  comment: string;
  submittedOn: string;
  submittedBy: string;
}

interface QuestionAnswer {
  q: string;
  ans: string;
}

// Normalise question text so the same question always maps to the same column
const cleanQuestion = (q: string) =>
  q.replace(/\s+/g, " ").replace(/^['"]|['"]$/g, "").replace(/\s*\?\s*$/, "").trim();

// questions_with_answers arrives as a string in one of two server formats:
//   newer: [#<ActionController::Parameters {"q"=>"…", "ans"=>"3"} permitted: false>, …]
//   older: YAML list with `q: …` / `ans: '3'` entries
// (an actual array is also accepted, in case the API is fixed later)
const parseQuestionsWithAnswers = (raw: any): QuestionAnswer[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((x: any) => ({ q: cleanQuestion(String(x?.q ?? "")), ans: String(x?.ans ?? "") }))
      .filter((x) => x.q);
  }
  const text = String(raw);
  const pairs: QuestionAnswer[] = [];

  const rubyPattern = /"q"=>"((?:[^"\\]|\\.)*)",\s*"ans"=>"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = rubyPattern.exec(text))) {
    pairs.push({ q: cleanQuestion(m[1]), ans: m[2] });
  }
  if (pairs.length) return pairs;

  const yamlPattern = /\bq:\s*([\s\S]*?)\n\s*ans:\s*['"]?([^'"\n]*)['"]?/g;
  while ((m = yamlPattern.exec(text))) {
    pairs.push({ q: cleanQuestion(m[1]), ans: m[2].trim() });
  }
  return pairs;
};

const formatDateTime = (value: any) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Stable column key for a question
const questionKey = (q: string) => "q_" + q.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

// React can't render plain objects; if the API sends a nested object
// (e.g. { id, name }) for a field, show its readable name instead of crashing.
const toText = (value: any, fallback = "-"): string => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") {
    const readable = value.name ?? value.title ?? value.label ?? value.value ?? value.full_name;
    return readable !== undefined && readable !== null && typeof readable !== "object"
      ? String(readable)
      : fallback;
  }
  return String(value);
};

const BMSFeedbacks: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Mock data query (replace with actual API call)
  const {
    data: feedbacksData,
    isLoading,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["feedbacks", debouncedSearchQuery, currentPage, pageSize],
    queryFn: async () => {
      const token = API_CONFIG.TOKEN || ""; // or get from storage/context if needed
      const url = getFullUrl(
        `/crm/feedbacks.json?token=${token}&page=${currentPage}&per_page=${pageSize}&search=${encodeURIComponent(debouncedSearchQuery)}`
      );
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch feedbacks");
      const data = await response.json();

      // Map API response to Feedback[] (field names as returned by /crm/feedbacks.json)
      const questions: string[] = [];
      const feedbacks: Feedback[] = (data.lead_project_feedbacks || []).map((item: any) => {
        const answers: Record<string, string> = {};
        parseQuestionsWithAnswers(item.questions_with_answers).forEach(({ q, ans }) => {
          answers[q] = ans;
          if (!questions.includes(q)) questions.push(q);
        });
        return {
          id: toText(item.id, ""),
          tower: toText(item.block_no ?? item.tower),
          flat: toText(item.flat_no ?? item.flat),
          answers,
          comment: toText(item.comment, ""),
          submittedOn: formatDateTime(item.created_at ?? item.submitted_on),
          submittedBy: toText(item.submitted_by?.full_name ?? item.submitted_by),
        };
      });

      return {
        feedbacks,
        questions,
        pagination: {
          total_count: data.count || feedbacks.length,
          total_pages: data.total_pages || 1,
          current_page: data.current_page || 1,
        },
      };
    },
    retry: 2,
    staleTime: 30000,
    gcTime: 60000,
  });

  const feedbacks: Feedback[] = feedbacksData?.feedbacks || [];
  const totalCount = feedbacksData?.pagination?.total_count || 0;
  const totalPages = feedbacksData?.pagination?.total_pages || 1;

  // Rating columns are built from the questions present in the data
  const questions: string[] = feedbacksData?.questions || [];
  const questionByKey: Record<string, string> = Object.fromEntries(questions.map((q) => [questionKey(q), q]));

  const columns = [
    { key: "tower", label: "Tower", sortable: true },
    { key: "flat", label: "Flat", sortable: true },
    ...questions.map((q) => ({ key: questionKey(q), label: q, sortable: true })),
    { key: "comment", label: "Comment", sortable: true },
    { key: "submittedOn", label: "Submitted On", sortable: true },
    { key: "submittedBy", label: "Submitted By", sortable: true },
  ];

  // Flatten answers onto each row so table sorting/search can read them by column key
  const rows = feedbacks.map((f) => ({
    ...f,
    ...Object.fromEntries(questions.map((q) => [questionKey(q), f.answers[q] ?? "-"])),
  }));

  const handleViewFeedback = (item: Feedback) => {
    navigate(`/feedbacks/view/${item.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Feedbacks refreshed");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Exporting feedbacks...");
  };

  const renderCell = (item: Feedback, columnKey: string) => {
    if (questionByKey[columnKey]) {
      return (
        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded bg-gray-100 font-medium text-sm">
          {item.answers[questionByKey[columnKey]] ?? "-"}
        </span>
      );
    }
    switch (columnKey) {
      case "tower":
        return <span className="font-medium">{item.tower}</span>;
      case "flat":
        return <span>{item.flat}</span>;
      case "comment":
        return <span className="text-sm text-gray-600">{item.comment || "-"}</span>;
      case "submittedOn":
        return <span className="text-sm">{item.submittedOn}</span>;
      case "submittedBy":
        return <span className="text-sm font-medium">{item.submittedBy}</span>;
      default:
        return toText((item as any)[columnKey]);
    }
  };

  // Render pagination items
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Always show first page
      items.push(
        <PaginationItem key={1} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis or middle pages
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i} className="cursor-pointer">
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
              aria-disabled={isLoading}
              className={isLoading ? "pointer-events-none opacity-50" : ""}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }

      // Always show last page
      items.push(
        <PaginationItem key={totalPages} className="cursor-pointer">
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            aria-disabled={isLoading}
            className={isLoading ? "pointer-events-none opacity-50" : ""}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // Render custom right actions
  const renderRightActions = () => (
    <div className="flex gap-2">
      {/* <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-9"
      >
        <RefreshCw className={`w-4 h-4 text-[#C72030]${isLoading ? "animate-spin" : ""}`} />
      </Button> */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        className="h-9 rounded-lg"
      >
        <Download className="w-4 h-4 text-[#C72030]" />
      </Button>
    </div>
  );

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">Feedbacks</h1>
      </div>

      <EnhancedTable
        data={rows}
        columns={columns}
        renderCell={renderCell}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search feedbacks..."
        enableSearch={true}
        rightActions={renderRightActions()}
        emptyMessage="No feedbacks found"
        loading={isLoading}
        pagination={false}
        storageKey="bms-feedbacks-table"
      />

      {/* Custom Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages || isLoading
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Error state */}
      {!isLoading && isError && (
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error loading feedbacks</p>
            <p className="text-sm text-gray-500 mt-1">{error?.message || "Please try again"}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2 text-[#C72030]" />
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BMSFeedbacks;
