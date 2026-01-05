import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext } from '@/components/ui/pagination';
import { getFullUrl, getAuthHeader } from '@/config/apiConfig';

interface RuleCondition {
  condition_attribute: string;
  condition_attribute_display_name: string;
  operator: string;
  compare_value: string;
}

interface RuleAction {
  action_method: string;
  parameters: string;
}

interface RuleEngine {
  id: number;
  name: string;
  description: string;
  active: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
}

const RuleEngineList = () => {
  const navigate = useNavigate();
  const [ruleEngine, setRuleEngine] = useState<RuleEngine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const itemsPerPage = 10;

  // Helper functions
  const formatFieldName = (fieldName: string): string => {
    if (!fieldName) return '';
    return fieldName
      .replace(/_/g, ' ')
      .replace(/::/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const snakeToCapitalized = (str: string): string => {
    if (!str) return '';
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchRules = useCallback(async (page: number, search: string) => {
    setLoading(true);
    setIsSearching(!!search);
    try {
      const response = await fetch(getFullUrl('/rule_engine/rules.json'), {
        method: 'GET',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rules: ${response.statusText}`);
      }

      const data = await response.json();
      let rulesData: RuleEngine[] = [];
      if (Array.isArray(data)) {
        rulesData = data;
      } else if (data?.rules && Array.isArray(data.rules)) {
        rulesData = data.rules;
      } else if (data?.data && Array.isArray(data.data)) {
        rulesData = data.data;
      }
      
      // Client-side search filtering
      let filteredRules = rulesData;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredRules = rulesData.filter((rule: RuleEngine) => {
          const ruleMatch = [
            rule.name,
            rule.description,
            String(rule.id || ''),
            rule.active ? 'active' : 'inactive'
          ].some(field => 
            field && field.toString().toLowerCase().includes(searchLower)
          );

          const conditionsMatch = rule.conditions?.some(condition => 
            [
              condition.condition_attribute,
              condition.condition_attribute_display_name,
              condition.operator,
              condition.compare_value,
            ].some(field => 
              field && field.toString().toLowerCase().includes(searchLower)
            )
          );

          return ruleMatch || conditionsMatch;
        });
      }
      
      // Client-side pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedRules = filteredRules.slice(startIndex, endIndex);
      
      setRuleEngine(paginatedRules);
      setCurrentPage(page);
      setTotalPages(Math.ceil(filteredRules.length / itemsPerPage));
      setTotalCount(filteredRules.length);
    } catch (error) {
      console.error('Error fetching rule engine:', error);
      toast.error('Failed to load rules');
      setRuleEngine([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchRules(currentPage, searchTerm);
  }, [currentPage, searchTerm, fetchRules]);

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
    navigate('/loyalty/create-rule-engine');
  };

  const handleView = (id: number) => {
    navigate(`/loyalty/view-rule-engine/${id}`);
  };

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(getFullUrl(`/rule_engine/rules/${id}.json`), {
        method: 'PATCH',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rule_engine_rule: { active: isActive } }),
      });

      if (!response.ok) {
        throw new Error('Failed to update rule status');
      }

      toast.success('Status updated successfully!');
      fetchRules(currentPage, searchTerm);
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update status');
    }
  };

  // Flatten rules with conditions for table display
  const flattenedRules = ruleEngine.flatMap(rule => {
    const conditions = rule.conditions || [];
    const actions = rule.actions || [];
    
    if (conditions.length === 0) {
      return [{
        ...rule,
        condition: null,
        conditionIndex: 0,
        totalConditions: 0,
        action: actions[0] || null,
      }];
    }

    return conditions.map((condition, index) => ({
      ...rule,
      condition,
      conditionIndex: index,
      totalConditions: conditions.length,
      action: actions[0] || null,
    }));
  });

  const columns = [
    { key: 'name', label: 'Rule Name', sortable: true },
    { key: 'attribute', label: 'Attribute', sortable: false },
    { key: 'condition_operator', label: 'Condition', sortable: false },
    { key: 'action_value', label: 'Action', sortable: false },
    { key: 'outcome', label: 'Outcome', sortable: false },
    { key: 'reward', label: 'Reward', sortable: false },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'actions', label: 'View', sortable: false },
  ];

  const renderCell = (item: any, columnKey: string) => {
    // Only show these cells for the first condition row
    const isFirstCondition = item.conditionIndex === 0;
    
    switch (columnKey) {
      case 'name':
        return isFirstCondition ? item.name : null;
      case 'attribute':
        return item.condition?.condition_attribute_display_name || '-';
      case 'condition_operator':
        return item.condition ? snakeToCapitalized(item.condition.operator) : '-';
      case 'action_value':
        return item.condition ? snakeToCapitalized(item.condition.compare_value) : '-';
      case 'outcome':
        return isFirstCondition ? (item.action ? formatFieldName(item.action.action_method) : '-') : null;
      case 'reward':
        if (!isFirstCondition) return null;
        if (!item.action?.parameters) return '-';
        const suffix = item.action.action_method === 'credit_points' ? ' pts' : 
                      item.action.action_method === 'percentage_credit' ? ' %' : '';
        return `${item.action.parameters}${suffix}`;
      case 'status':
        if (!isFirstCondition) return null;
        return (
          <div className="flex justify-center">
            <button
              onClick={() => handleToggle(item.id, !item.active)}
              className="text-gray-600 hover:opacity-80 transition-opacity"
            >
              {item.active ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#28a745" viewBox="0 0 16 16">
                  <path d="M5 3a5 5 0 0 0 0 10h6a5 5 0 0 0 0-10zm6 9a4 4 0 1 1 0-8 4 4 0 0 1 0 8" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="24" fill="#6c757d" viewBox="0 0 16 16">
                  <path d="M11 4a4 4 0 0 1 0 8H8a5 5 0 0 0 2-4 5 5 0 0 0-2-4zM5 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8M0 8a5 5 0 0 0 5 5h6a5 5 0 0 0 0-10H5a5 5 0 0 0-5 5" />
                </svg>
              )}
            </button>
          </div>
        );
      case 'actions':
        if (!isFirstCondition) return null;
        return (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(item.id)}
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        );
      default:
        return '-';
    }
  };

  const renderCustomActions = () => (
    <div className="flex flex-wrap">
      <Button
        onClick={handleAdd}
        className="bg-[#C72030] text-white hover:bg-[#C72030]/90 h-9 px-4 text-sm font-medium"
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        New Rule
      </Button>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4">
      <EnhancedTable
        data={flattenedRules}
        columns={columns}
        renderCell={renderCell}
        pagination={false}
        enableExport={true}
        exportFileName="rule-engine"
        storageKey="rule-engine-table"
        enableGlobalSearch={true}
        onGlobalSearch={handleGlobalSearch}
        searchPlaceholder="Search rules (name, conditions, actions)..."
        leftActions={renderCustomActions()}
        loading={isSearching || loading}
        loadingMessage={isSearching ? "Searching rules..." : "Loading rules..."}
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
      <Toaster />
      {renderListTab()}
    </div>
  );
};

export default RuleEngineList;
