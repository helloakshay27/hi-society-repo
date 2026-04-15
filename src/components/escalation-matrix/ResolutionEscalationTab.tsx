import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Edit, Trash2, Plus, Filter, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createResolutionEscalation,
  fetchResolutionEscalations,
  updateResolutionEscalation,
  deleteResolutionEscalation,
  clearState,
} from "@/store/slices/resolutionEscalationSlice";
import { fetchHelpdeskCategories } from "@/store/slices/helpdeskCategoriesSlice";
import { toast } from "sonner";
import ReactSelect from "react-select";
import {
  ticketManagementAPI,
  UserAccountResponse,
} from "@/services/ticketManagementAPI";
import { API_CONFIG } from "@/config/apiConfig";

const resolutionEscalationSchema = z.object({
  categoryIds: z.array(z.number()).optional().default([]),
  escalationLevels: z.object({
    e1: z.object({
      users: z.array(z.number()),
      copyTo: z.array(z.number()),
      priorities: z.object({
        p1: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p2: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p3: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p4: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p5: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
      }),
    }),
    e2: z.object({
      users: z.array(z.number()),
      copyTo: z.array(z.number()),
      priorities: z.object({
        p1: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p2: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p3: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p4: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p5: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
      }),
    }),
    e3: z.object({
      users: z.array(z.number()),
      copyTo: z.array(z.number()),
      priorities: z.object({
        p1: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p2: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p3: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p4: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p5: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
      }),
    }),
    e4: z.object({
      users: z.array(z.number()),
      copyTo: z.array(z.number()),
      priorities: z.object({
        p1: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p2: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p3: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p4: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p5: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
      }),
    }),
    e5: z.object({
      users: z.array(z.number()),
      copyTo: z.array(z.number()),
      priorities: z.object({
        p1: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p2: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p3: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p4: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
        p5: z.object({
          days: z.number().min(0),
          hours: z.number().min(0).max(23),
          minutes: z.number().min(0).max(59),
        }),
      }),
    }),
  }),
});

type ResolutionEscalationFormData = z.infer<typeof resolutionEscalationSchema>;

interface AssignRule {
  id: number;
  issue_type_id: number | null;
  category_id: number | null;
  assign_to: string[] | null;
  issue_type?: string | { id: number; name: string };
  category?: string | { id: number; name: string };
  category_type?: string;
  rule_number?: number;
  service_engineer_name?: string;
}

export const ResolutionEscalationTab: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    loading,
    error,
    success,
    data: resolutionEscalations,
    fetchLoading,
    updateLoading,
    deleteLoading,
  } = useAppSelector((state) => state.resolutionEscalation);

  const { data: categories, loading: categoriesLoading } = useAppSelector(
    (state) => state.helpdeskCategories
  );

  const [userAccount, setUserAccount] = useState<UserAccountResponse | null>(
    null
  );
  const [escalationUsers, setEscalationUsers] = useState<
    { id: number; full_name: string }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Sub-tab states
  const [activeResolutionTab, setActiveResolutionTab] = useState<
    "assign-rule" | "escalation-rule"
  >("assign-rule");
  const [activeFmProjectTab, setActiveFmProjectTab] = useState<
    "fm" | "project"
  >("fm");

  // Assign Rule states
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [isAddAssignRuleOpen, setIsAddAssignRuleOpen] = useState(false);
  const [assignRuleForm, setAssignRuleForm] = useState({
    issueType: "",
    categoryType: "",
    engineer: "",
  });

  // Assign Rule data
  const [assignRules, setAssignRules] = useState<AssignRule[]>([]);
  const [assignRulesLoading, setAssignRulesLoading] = useState(false);
  const [assignRulesPagination, setAssignRulesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    perPage: 10,
  });
  // Filter state for assign rules
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filterIssueTypeId, setFilterIssueTypeId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterAssignTo, setFilterAssignTo] = useState("");
  // Pending filter values (applied only on clicking Apply)
  const [pendingFilterIssueTypeId, setPendingFilterIssueTypeId] = useState("");
  const [pendingFilterCategoryId, setPendingFilterCategoryId] = useState("");
  const [pendingFilterAssignTo, setPendingFilterAssignTo] = useState("");
  const ASSIGN_RULES_PER_PAGE = 10;
  const [issueTypeOptions, setIssueTypeOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [categoryDropdownOptions, setCategoryDropdownOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [serviceEngineerOptions, setServiceEngineerOptions] = useState<
    { id: number; full_name: string }[]
  >([]);

  // Edit Assign Rule state
  const [editingAssignRule, setEditingAssignRule] = useState<AssignRule | null>(
    null
  );
  const [isEditAssignRuleOpen, setIsEditAssignRuleOpen] = useState(false);
  const [editAssignRuleForm, setEditAssignRuleForm] = useState({
    issueType: "",
    categoryType: "",
    engineer: "",
  });
  const [assignRuleSubmitting, setAssignRuleSubmitting] = useState(false);

  // Escalation Rule filter states
  const [escalationIssueTypeFilter, setEscalationIssueTypeFilter] =
    useState("");
  const [escalationCategoryTypeFilter, setEscalationCategoryTypeFilter] =
    useState("");

  // Escalation Rule form - Issue Type & Category Type selection
  const [escalationFormIssueTypeId, setEscalationFormIssueTypeId] =
    useState("");
  const [escalationFormCategoryTypeId, setEscalationFormCategoryTypeId] =
    useState("");

  // Edit Escalation Rule dialog - Issue Type & Category Type selection
  const [editEscalationIssueTypeId, setEditEscalationIssueTypeId] =
    useState("");
  const [editEscalationCategoryTypeId, setEditEscalationCategoryTypeId] =
    useState("");

  // Escalation Rule list data (from /crm/admin/assign_escalation.json)
  const [escalationRulesList, setEscalationRulesList] = useState<any[]>([]);
  const [escalationRulesLoading, setEscalationRulesLoading] = useState(false);
  const [escalationRulesPagination, setEscalationRulesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    perPage: 10,
  });
  const ESCALATION_RULES_PER_PAGE = 10;

  // Escalation rule filter states
  const [escalationFilterIssueTypeId, setEscalationFilterIssueTypeId] =
    useState("");
  const [escalationFilterCategoryId, setEscalationFilterCategoryId] =
    useState("");
  const [isEscalationFilterDialogOpen, setIsEscalationFilterDialogOpen] =
    useState(false);
  const [
    pendingEscalationFilterIssueTypeId,
    setPendingEscalationFilterIssueTypeId,
  ] = useState("");
  const [
    pendingEscalationFilterCategoryId,
    setPendingEscalationFilterCategoryId,
  ] = useState("");

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    register,
  } = useForm<ResolutionEscalationFormData>({
    resolver: zodResolver(resolutionEscalationSchema),
    defaultValues: {
      categoryIds: [],
      escalationLevels: {
        e1: {
          users: [],
          copyTo: [],
          priorities: {
            p1: { days: 0, hours: 0, minutes: 0 },
            p2: { days: 0, hours: 0, minutes: 0 },
            p3: { days: 0, hours: 0, minutes: 0 },
            p4: { days: 0, hours: 0, minutes: 0 },
            p5: { days: 0, hours: 0, minutes: 0 },
          },
        },
        e2: {
          users: [],
          copyTo: [],
          priorities: {
            p1: { days: 0, hours: 0, minutes: 0 },
            p2: { days: 0, hours: 0, minutes: 0 },
            p3: { days: 0, hours: 0, minutes: 0 },
            p4: { days: 0, hours: 0, minutes: 0 },
            p5: { days: 0, hours: 0, minutes: 0 },
          },
        },
        e3: {
          users: [],
          copyTo: [],
          priorities: {
            p1: { days: 0, hours: 0, minutes: 0 },
            p2: { days: 0, hours: 0, minutes: 0 },
            p3: { days: 0, hours: 0, minutes: 0 },
            p4: { days: 0, hours: 0, minutes: 0 },
            p5: { days: 0, hours: 0, minutes: 0 },
          },
        },
        e4: {
          users: [],
          copyTo: [],
          priorities: {
            p1: { days: 0, hours: 0, minutes: 0 },
            p2: { days: 0, hours: 0, minutes: 0 },
            p3: { days: 0, hours: 0, minutes: 0 },
            p4: { days: 0, hours: 0, minutes: 0 },
            p5: { days: 0, hours: 0, minutes: 0 },
          },
        },
        e5: {
          users: [],
          copyTo: [],
          priorities: {
            p1: { days: 0, hours: 0, minutes: 0 },
            p2: { days: 0, hours: 0, minutes: 0 },
            p3: { days: 0, hours: 0, minutes: 0 },
            p4: { days: 0, hours: 0, minutes: 0 },
            p5: { days: 0, hours: 0, minutes: 0 },
          },
        },
      },
    },
  });

  // Helper function to convert day/hour/minute to total minutes
  const convertToMinutes = (
    days: number,
    hours: number,
    minutes: number
  ): number => {
    return days * 24 * 60 + hours * 60 + minutes;
  };

  // Helper function to convert total minutes to day/hour/minute
  const convertFromMinutes = (totalMinutes: number) => {
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    return { days, hours, minutes };
  };

  // Load user account data
  const loadUserAccount = async () => {
    try {
      console.log("Loading user account data...");
      const userAccountData = await ticketManagementAPI.getUserAccount();
      setUserAccount(userAccountData);
      console.log("User account loaded:", userAccountData);
    } catch (error) {
      console.error("Error loading user account:", error);
      toast.error("Failed to load user account data!");
    }
  };

  // Load escalation users
  const loadEscalationUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await ticketManagementAPI.getEscalationUsers();
      setEscalationUsers(response.users || []);
      console.log("Escalation users loaded:", response.users);
    } catch (error) {
      console.error("Error loading escalation users:", error);
      toast.error("Failed to load escalation users!");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load assign escalation rules
  const loadAssignRules = async (
    page = 1,
    issueTypeId = filterIssueTypeId,
    categoryId = filterCategoryId,
    assignTo = filterAssignTo
  ) => {
    setAssignRulesLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: ASSIGN_RULES_PER_PAGE,
      };
      if (issueTypeId) params["q[issue_type_id_eq]"] = issueTypeId;
      if (categoryId) params["q[category_id_eq]"] = categoryId;
      if (assignTo) params["q[assign_to_cont]"] = assignTo;

      const data = await ticketManagementAPI.getAssignRules(params);
      setAssignRules(data.assign_rules || []);
      if (data.pagination) {
        setAssignRulesPagination({
          currentPage: data.pagination.current_page,
          totalPages: data.pagination.total_pages,
          totalEntries: data.pagination.total_entries,
          perPage: data.pagination.per_page,
        });
      }
    } catch (error) {
      console.error("Error loading assign rules:", error);
      toast.error("Failed to load assign rules!");
    } finally {
      setAssignRulesLoading(false);
    }
  };

  // Load dropdowns for assign rule modals
  const loadAssignRuleDropdowns = async () => {
    try {
      const [issueTypesData, categoriesData, engineersData] = await Promise.all(
        [
          ticketManagementAPI.getIssueTypesDropdown(),
          ticketManagementAPI.getCategoriesDropdown(),
          ticketManagementAPI.getServiceEngineers(),
        ]
      );
      setIssueTypeOptions(issueTypesData.issue_types || []);
      setCategoryDropdownOptions(categoriesData.categories || []);
      setServiceEngineerOptions(engineersData.service_engineers || []);
    } catch (error) {
      console.error("Error loading assign rule dropdowns:", error);
    }
  };

  // Load escalation rules from /crm/admin/assign_escalation.json
  // Load escalation rules from /crm/admin/escalation_rule.json
  const loadEscalationRules = async (
    page = 1,
    issueTypeId = escalationFilterIssueTypeId,
    categoryId = escalationFilterCategoryId
  ) => {
    setEscalationRulesLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        per_page: ESCALATION_RULES_PER_PAGE,
        issue_related_to: activeFmProjectTab === "fm" ? "FM" : "Project",
      };
      if (issueTypeId) params["q[issue_type_id_eq]"] = issueTypeId;
      if (categoryId) params["q[category_id_eq]"] = categoryId;

      const data =
        await ticketManagementAPI.getResolutionEscalationRules(params);
      setEscalationRulesList(data.escalation_rules || []);
      if (data.pagination) {
        setEscalationRulesPagination({
          currentPage: data.pagination.current_page,
          totalPages: data.pagination.total_pages,
          totalEntries: data.pagination.total_entries,
          perPage: data.pagination.per_page,
        });
      }
    } catch (error) {
      console.error("Error loading escalation rules:", error);
      toast.error("Failed to load escalation rules!");
    } finally {
      setEscalationRulesLoading(false);
    }
  };

  // Handle Create Assign Rule
  const handleCreateAssignRule = async () => {
    if (
      !assignRuleForm.issueType ||
      !assignRuleForm.categoryType ||
      !assignRuleForm.engineer
    ) {
      toast.error("Please fill all fields!");
      return;
    }
    setAssignRuleSubmitting(true);
    try {
      await ticketManagementAPI.createComplaintWorker({
        complaint_worker: {
          esc_type: "",
          of_phase: "post_possession",
          issue_type_id: assignRuleForm.issueType,
          category_id: assignRuleForm.categoryType,
          assign_to: [assignRuleForm.engineer],
        },
      });
      toast.success("Assign rule created successfully!");
      setIsAddAssignRuleOpen(false);
      setAssignRuleForm({ issueType: "", categoryType: "", engineer: "" });
      loadAssignRules(1, filterIssueTypeId, filterCategoryId, filterAssignTo);
    } catch (error) {
      console.error("Error creating assign rule:", error);
      toast.error("Failed to create assign rule!");
    } finally {
      setAssignRuleSubmitting(false);
    }
  };

  // Handle Edit Assign Rule open
  const handleOpenEditAssignRule = async (rule: AssignRule) => {
    try {
      const data = await ticketManagementAPI.getAssignRuleById(rule.id);
      const fullRule = data.assign_rule;
      setEditingAssignRule(fullRule);
      setEditAssignRuleForm({
        issueType: fullRule.issue_type_id?.toString() || "",
        categoryType: fullRule.category_id?.toString() || "",
        engineer: fullRule.assign_to?.[0] || "",
      });
      setIsEditAssignRuleOpen(true);
    } catch (error) {
      console.error("Error fetching assign rule details:", error);
      toast.error("Failed to fetch rule details!");
    }
  };

  // Handle Update Assign Rule
  const handleUpdateAssignRule = async () => {
    if (!editingAssignRule) return;
    if (
      !editAssignRuleForm.issueType ||
      !editAssignRuleForm.categoryType ||
      !editAssignRuleForm.engineer
    ) {
      toast.error("Please fill all fields!");
      return;
    }
    setAssignRuleSubmitting(true);
    try {
      await ticketManagementAPI.updateComplaintWorker({
        id: editingAssignRule.id.toString(),
        complaint_worker: {
          issue_type_id: editAssignRuleForm.issueType,
          category_id: editAssignRuleForm.categoryType,
          assign_to: [editAssignRuleForm.engineer],
        },
      });
      toast.success("Assign rule updated successfully!");
      setIsEditAssignRuleOpen(false);
      setEditingAssignRule(null);
      loadAssignRules(
        assignRulesPagination.currentPage,
        filterIssueTypeId,
        filterCategoryId,
        filterAssignTo
      );
    } catch (error) {
      console.error("Error updating assign rule:", error);
      toast.error("Failed to update assign rule!");
    } finally {
      setAssignRuleSubmitting(false);
    }
  };

  // Handle Delete Assign Rule
  const handleDeleteAssignRule = async (id: number) => {
    try {
      await ticketManagementAPI.deleteComplaintWorker(id.toString());
      toast.success("Assign rule deleted successfully!");
      loadAssignRules(
        assignRulesPagination.currentPage,
        filterIssueTypeId,
        filterCategoryId,
        filterAssignTo
      );
    } catch (error) {
      console.error("Error deleting assign rule:", error);
      toast.error("Failed to delete assign rule!");
    }
  };

  // Load initial data
  useEffect(() => {
    dispatch(fetchHelpdeskCategories());
    dispatch(fetchResolutionEscalations());
    loadUserAccount();
    loadEscalationUsers();
    loadAssignRules(1, "", "", "");
    loadAssignRuleDropdowns();
    loadEscalationRules(1, "", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // Reload escalation rules when FM/Project tab changes
  useEffect(() => {
    loadEscalationRules(
      1,
      escalationFilterIssueTypeId,
      escalationFilterCategoryId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFmProjectTab]);

  // Handle success/error states
  useEffect(() => {
    if (success) {
      toast.success("Resolution escalation saved successfully!");
      reset();
      setEscalationFormIssueTypeId("");
      setEscalationFormCategoryTypeId("");
      dispatch(clearState());
      dispatch(fetchResolutionEscalations());
      loadEscalationRules(1, "", "");
    }
    // if (error) {
    //   // Ensure error is a string for toast display
    //   const errorMessage = typeof error === 'string' ? error : 'An error occurred while processing your request';
    //   toast.error(errorMessage + '!');
    //   dispatch(clearState());
    // }
  }, [success, error, reset, dispatch]);

  const formatTimeForPayload = (p: {
    days: number;
    hours: number;
    minutes: number;
  }) => {
    return convertToMinutes(p.days, p.hours, p.minutes);
  };

  const onSubmit = async (data: ResolutionEscalationFormData) => {
    try {
      if (!escalationFormIssueTypeId) {
        toast.error("Please select an Issue Type!");
        return;
      }
      if (!escalationFormCategoryTypeId) {
        toast.error("Please select a Category Type!");
        return;
      }

      const escalationMatrixPayload: any = {};
      const levels = ["e1", "e2", "e3", "e4", "e5"] as const;
      levels.forEach((level) => {
        const levelData = data.escalationLevels[level];
        escalationMatrixPayload[level] = {
          name: level,
          escalate_to_users: levelData.users,
          copy_to: levelData.copyTo,
          p1: formatTimeForPayload(levelData.priorities.p1),
          p2: formatTimeForPayload(levelData.priorities.p2),
          p3: formatTimeForPayload(levelData.priorities.p3),
          p4: formatTimeForPayload(levelData.priorities.p4),
          p5: formatTimeForPayload(levelData.priorities.p5),
        };
      });

      const payload = {
        complaint_worker: {
          esc_type: "resolution",
          issue_related_to: activeFmProjectTab === "fm" ? "FM" : "Project",
          of_phase: "post_possession",
          issue_type_id: escalationFormIssueTypeId,
          category_id: escalationFormCategoryTypeId,
        },
        escalation_matrix: escalationMatrixPayload,
      };

      await ticketManagementAPI.createResolutionEscalationRule(payload);
      toast.success("Resolution escalation created successfully!");
      reset();
      setEscalationFormIssueTypeId("");
      setEscalationFormCategoryTypeId("");
      loadAssignRules(1, "", "", "");
      loadEscalationRules(1, "", "");
    } catch (error: any) {
      console.error("Error creating resolution escalation:", error);
    }
  };

  const handleEdit = async (ruleListItem: any) => {
    try {
      // Fetch fresh details from API
      const response =
        await ticketManagementAPI.getResolutionEscalationRuleById(
          ruleListItem.id
        );
      const rule = response.escalation_rule;
      setEditingRule(rule);

      // Helper function to safely parse escalate_to_users
      const safeParseUsers = (users: any): number[] => {
        if (!users) return [];
        try {
          let userArray: any[] = [];
          if (typeof users === "string") {
            userArray = JSON.parse(users);
          } else if (Array.isArray(users)) {
            userArray = users;
          }
          // Recursively handle cases like ["[\"216\"]"]
          return userArray
            .flatMap((item) => {
              if (typeof item === "string" && item.startsWith("[")) {
                try {
                  return JSON.parse(item).map(Number);
                } catch {
                  return [parseInt(item)];
                }
              }
              return [Number(item)];
            })
            .filter((id) => !isNaN(id));
        } catch (error) {
          console.error("Error parsing users in edit:", error);
        }
        return [];
      };

      // Support both old format (escalations) and new API format (escalation_matrix)
      const escalations = rule.escalations || [];
      const escalationMatrix = rule.escalation_matrix || {};

      const findLevelData = (levelName: string) => {
        const oldFormat = escalations.find(
          (e: any) => (e.name || "").toUpperCase() === levelName.toUpperCase()
        );
        if (oldFormat) return oldFormat;
        const newFormat = escalationMatrix.find(
          (e: any) => (e.level || "").toUpperCase() === levelName.toUpperCase()
        );
        return newFormat || null;
      };

      const parseTime = (timeFieldValue: any) => {
        if (!timeFieldValue) return { days: 0, hours: 0, minutes: 0 };
        if (typeof timeFieldValue === "number")
          return convertFromMinutes(timeFieldValue);
        if (typeof timeFieldValue !== "string")
          return { days: 0, hours: 0, minutes: 0 };

        const days = parseInt(timeFieldValue.match(/(\d+)\s*day/)?.[1] || "0");
        const hours = parseInt(
          timeFieldValue.match(/(\d+)\s*hour/)?.[1] || "0"
        );
        const minutes = parseInt(
          timeFieldValue.match(/(\d+)\s*minute/)?.[1] || "0"
        );
        return { days, hours, minutes };
      };

      const getLevelUsersList = (levelName: string): number[] => {
        const level = findLevelData(levelName);
        if (!level) return [];
        // Support newest escalate_to_ids format
        if (level.escalate_to_ids) return safeParseUsers(level.escalate_to_ids);
        if (level.escalate_to_users)
          return safeParseUsers(level.escalate_to_users);
        return [];
      };

      const getLevelCopyToList = (levelName: string): number[] => {
        const level = findLevelData(levelName);
        if (!level) return [];
        // Support newest copy_to_ids format
        if (level.copy_to_ids) return safeParseUsers(level.copy_to_ids);
        if (level.copy_to) return safeParseUsers(level.copy_to);
        return [];
      };

      const getLevelTime = (levelName: string, priority: string) => {
        const level = findLevelData(levelName);
        if (!level) return { days: 0, hours: 0, minutes: 0 };
        return parseTime(level[priority]);
      };

      // Pre-populate form
      const formData: ResolutionEscalationFormData = {
        categoryIds: [rule.category_id],
        escalationLevels: {
          e1: {
            users: getLevelUsersList("E1"),
            copyTo: getLevelCopyToList("E1"),
            priorities: {
              p1: getLevelTime("E1", "p1"),
              p2: getLevelTime("E1", "p2"),
              p3: getLevelTime("E1", "p3"),
              p4: getLevelTime("E1", "p4"),
              p5: getLevelTime("E1", "p5"),
            },
          },
          e2: {
            users: getLevelUsersList("E2"),
            copyTo: getLevelCopyToList("E2"),
            priorities: {
              p1: getLevelTime("E2", "p1"),
              p2: getLevelTime("E2", "p2"),
              p3: getLevelTime("E2", "p3"),
              p4: getLevelTime("E2", "p4"),
              p5: getLevelTime("E2", "p5"),
            },
          },
          e3: {
            users: getLevelUsersList("E3"),
            copyTo: getLevelCopyToList("E3"),
            priorities: {
              p1: getLevelTime("E3", "p1"),
              p2: getLevelTime("E3", "p2"),
              p3: getLevelTime("E3", "p3"),
              p4: getLevelTime("E3", "p4"),
              p5: getLevelTime("E3", "p5"),
            },
          },
          e4: {
            users: getLevelUsersList("E4"),
            copyTo: getLevelCopyToList("E4"),
            priorities: {
              p1: getLevelTime("E4", "p1"),
              p2: getLevelTime("E4", "p2"),
              p3: getLevelTime("E4", "p3"),
              p4: getLevelTime("E4", "p4"),
              p5: getLevelTime("E4", "p5"),
            },
          },
          e5: {
            users: getLevelUsersList("E5"),
            copyTo: getLevelCopyToList("E5"),
            priorities: {
              p1: getLevelTime("E5", "p1"),
              p2: getLevelTime("E5", "p2"),
              p3: getLevelTime("E5", "p3"),
              p4: getLevelTime("E5", "p4"),
              p5: getLevelTime("E5", "p5"),
            },
          },
        },
      };

      reset(formData);
      setEditEscalationIssueTypeId(String(rule.issue_type_id || ""));
      setEditEscalationCategoryTypeId(String(rule.category_id || ""));
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error fetching escalation rule details:", error);
      toast.error("Failed to fetch rule details!");
    }
  };

  const handleUpdate = async (data: ResolutionEscalationFormData) => {
    if (!editingRule) return;

    try {
      const levels = ["e1", "e2", "e3", "e4", "e5"] as const;
      const escalationMatrixUpdate: any = {};
      levels.forEach((level) => {
        const levelData = data.escalationLevels[level];
        escalationMatrixUpdate[level] = {
          name: level,
          escalate_to_users: levelData.users,
          copy_to: levelData.copyTo,
          p1: formatTimeForPayload(levelData.priorities.p1),
          p2: formatTimeForPayload(levelData.priorities.p2),
          p3: formatTimeForPayload(levelData.priorities.p3),
          p4: formatTimeForPayload(levelData.priorities.p4),
          p5: formatTimeForPayload(levelData.priorities.p5),
        };
      });

      const payload = {
        id: editingRule.id,
        complaint_worker: {
          esc_type: "resolution",
          issue_related_to: activeFmProjectTab === "fm" ? "FM" : "Project",
          of_phase: "post_possession",
          issue_type_id: editEscalationIssueTypeId,
          category_id: editEscalationCategoryTypeId,
        },
        escalation_matrix: escalationMatrixUpdate,
      };

      await ticketManagementAPI.updateResolutionEscalationRule(payload);
      toast.success("Resolution escalation updated successfully!");
      setIsEditDialogOpen(false);
      setEditingRule(null);
      dispatch(fetchResolutionEscalations());
      loadEscalationRules(
        escalationRulesPagination.currentPage,
        escalationFilterIssueTypeId,
        escalationFilterCategoryId
      );
    } catch (err: any) {
      console.error("Error updating resolution escalation:", err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to update resolution escalation!"
      );
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ticketManagementAPI.deleteComplaintWorker(id.toString());
      toast.success("Resolution escalation deleted successfully!");
      loadEscalationRules(
        escalationRulesPagination.currentPage,
        escalationFilterIssueTypeId,
        escalationFilterCategoryId
      );
    } catch (err) {
      console.error("Error deleting resolution escalation:", err);
      toast.error("Failed to delete resolution escalation. Please try again!");
    }
  };

  // Options for react-select
  const categoryOptions =
    categories?.helpdesk_categories?.map((cat) => ({
      value: cat.id,
      label: cat.name,
    })) || [];
  // Use serviceEngineerOptions (from /dropdown/service_engineers) for escalation dropdowns
  const userOptions =
    serviceEngineerOptions?.map((eng) => ({
      value: eng.id,
      label: eng.full_name,
    })) || [];

  const escalationLevels = ["e1", "e2", "e3", "e4", "e5"] as const;
  const priorities = ["p1", "p2", "p3", "p4", "p5"] as const;

  return (
    <div className="space-y-0">
      {/* Assign Rule / Escalation Rule sub-tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => setActiveResolutionTab("assign-rule")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeResolutionTab === "assign-rule"
              ? "border-[#C72030] text-[#C72030]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Assign Rule
        </button>
        <button
          onClick={() => setActiveResolutionTab("escalation-rule")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeResolutionTab === "escalation-rule"
              ? "border-[#C72030] text-[#C72030]"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Escalation Rule
        </button>
      </div>

      {/* ──────────────── ASSIGN RULE TAB ──────────────── */}
      {activeResolutionTab === "assign-rule" && (
        <div className="p-6 space-y-4 bg-white">
          {/* Toggle + Action buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${!isAutomatic ? "text-[#C72030]" : "text-gray-500"}`}
              >
                Manual
              </span>
              <button
                onClick={() => setIsAutomatic(!isAutomatic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isAutomatic ? "bg-[#C72030]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isAutomatic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${isAutomatic ? "text-[#C72030]" : "text-gray-500"}`}
              >
                Automatic
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddAssignRuleOpen(true)}
                className="bg-[#1a1a2e] hover:bg-[#16213e] text-white flex items-center gap-1 h-9 px-4 text-sm"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1 h-9 px-4 text-sm border-gray-300"
                onClick={() => {
                  setPendingFilterIssueTypeId(filterIssueTypeId);
                  setPendingFilterCategoryId(filterCategoryId);
                  setPendingFilterAssignTo(filterAssignTo);
                  setIsFilterDialogOpen(true);
                }}
              >
                <Filter className="h-4 w-4" />
                Filter
                {(filterIssueTypeId || filterCategoryId || filterAssignTo) && (
                  <span className="ml-1 bg-[#C72030] text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Assign Rule Table */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">
                    Rule
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Issue Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Category Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Service Engineer
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignRulesLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : assignRules.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-10 text-gray-400 text-sm"
                    >
                      No assign rules found
                    </TableCell>
                  </TableRow>
                ) : (
                  assignRules.map((rule) => {
                    const issueTypeName =
                      typeof rule.issue_type === "string"
                        ? rule.issue_type
                        : rule.issue_type?.name;
                    const categoryTypeName =
                      rule.category_type ||
                      (typeof rule.category === "string"
                        ? rule.category
                        : rule.category?.name);

                    return (
                      <TableRow key={rule.id} className="border-b">
                        <TableCell className="font-medium text-gray-700">
                          Rule {rule.rule_number ?? rule.id}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {issueTypeName || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {categoryTypeName || "-"}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {rule.service_engineer_name || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7"
                              onClick={() => handleOpenEditAssignRule(rule)}
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="p-1 h-7 w-7 text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm Delete
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this assign
                                    rule? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteAssignRule(rule.id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!assignRulesLoading && assignRulesPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <p className="text-sm text-gray-500">
                Showing{" "}
                {Math.min(
                  (assignRulesPagination.currentPage - 1) *
                    assignRulesPagination.perPage +
                    1,
                  assignRulesPagination.totalEntries
                )}
                –
                {Math.min(
                  assignRulesPagination.currentPage *
                    assignRulesPagination.perPage,
                  assignRulesPagination.totalEntries
                )}{" "}
                of {assignRulesPagination.totalEntries} rules
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={
                        assignRulesPagination.currentPage === 1
                          ? "pointer-events-none opacity-50 cursor-default"
                          : "cursor-pointer"
                      }
                      onClick={() => {
                        if (assignRulesPagination.currentPage > 1)
                          loadAssignRules(
                            assignRulesPagination.currentPage - 1,
                            filterIssueTypeId,
                            filterCategoryId,
                            filterAssignTo
                          );
                      }}
                    />
                  </PaginationItem>
                  {(() => {
                    const items = [];
                    const { currentPage, totalPages } = assignRulesPagination;
                    const showEllipsis = totalPages > 7;
                    if (showEllipsis) {
                      items.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            className="cursor-pointer"
                            isActive={currentPage === 1}
                            onClick={() =>
                              loadAssignRules(
                                1,
                                filterIssueTypeId,
                                filterCategoryId,
                                filterAssignTo
                              )
                            }
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      if (currentPage <= 3) {
                        for (let i = 2; i <= 4 && i < totalPages; i++) {
                          items.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                className="cursor-pointer"
                                isActive={currentPage === i}
                                onClick={() =>
                                  loadAssignRules(
                                    i,
                                    filterIssueTypeId,
                                    filterCategoryId,
                                    filterAssignTo
                                  )
                                }
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        if (totalPages > 5)
                          items.push(
                            <PaginationItem key="e1">
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                      } else if (currentPage >= totalPages - 2) {
                        items.push(
                          <PaginationItem key="e1">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        for (let i = totalPages - 3; i < totalPages; i++) {
                          if (i > 1)
                            items.push(
                              <PaginationItem key={i}>
                                <PaginationLink
                                  className="cursor-pointer"
                                  isActive={currentPage === i}
                                  onClick={() =>
                                    loadAssignRules(
                                      i,
                                      filterIssueTypeId,
                                      filterCategoryId,
                                      filterAssignTo
                                    )
                                  }
                                >
                                  {i}
                                </PaginationLink>
                              </PaginationItem>
                            );
                        }
                      } else {
                        items.push(
                          <PaginationItem key="e1">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                        for (
                          let i = currentPage - 1;
                          i <= currentPage + 1;
                          i++
                        ) {
                          items.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                className="cursor-pointer"
                                isActive={currentPage === i}
                                onClick={() =>
                                  loadAssignRules(
                                    i,
                                    filterIssueTypeId,
                                    filterCategoryId,
                                    filterAssignTo
                                  )
                                }
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                        items.push(
                          <PaginationItem key="e2">
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      if (totalPages > 1)
                        items.push(
                          <PaginationItem key={totalPages}>
                            <PaginationLink
                              className="cursor-pointer"
                              isActive={currentPage === totalPages}
                              onClick={() =>
                                loadAssignRules(
                                  totalPages,
                                  filterIssueTypeId,
                                  filterCategoryId,
                                  filterAssignTo
                                )
                              }
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        );
                    } else {
                      for (let i = 1; i <= totalPages; i++) {
                        items.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              className="cursor-pointer"
                              isActive={currentPage === i}
                              onClick={() =>
                                loadAssignRules(
                                  i,
                                  filterIssueTypeId,
                                  filterCategoryId,
                                  filterAssignTo
                                )
                              }
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    }
                    return items;
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      className={
                        assignRulesPagination.currentPage ===
                        assignRulesPagination.totalPages
                          ? "pointer-events-none opacity-50 cursor-default"
                          : "cursor-pointer"
                      }
                      onClick={() => {
                        if (
                          assignRulesPagination.currentPage <
                          assignRulesPagination.totalPages
                        )
                          loadAssignRules(
                            assignRulesPagination.currentPage + 1,
                            filterIssueTypeId,
                            filterCategoryId,
                            filterAssignTo
                          );
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── FILTER ASSIGN RULE DIALOG ──────────────── */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Assign Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Issue Type</Label>
              <Select
                value={pendingFilterIssueTypeId}
                onValueChange={setPendingFilterIssueTypeId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issue Types</SelectItem>
                  {issueTypeOptions.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Category Type</Label>
              <Select
                value={pendingFilterCategoryId}
                onValueChange={setPendingFilterCategoryId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Category Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryDropdownOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Engineer</Label>
              <Select
                value={pendingFilterAssignTo}
                onValueChange={setPendingFilterAssignTo}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Engineer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Engineers</SelectItem>
                  {serviceEngineerOptions.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id.toString()}>
                      {eng.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-2">
            <Button
              variant="outline"
              className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/5"
              onClick={() => {
                setPendingFilterIssueTypeId("");
                setPendingFilterCategoryId("");
                setPendingFilterAssignTo("");
                setFilterIssueTypeId("");
                setFilterCategoryId("");
                setFilterAssignTo("");
                setIsFilterDialogOpen(false);
                loadAssignRules(1, "", "", "");
              }}
            >
              Reset
            </Button>
            <Button
              className="bg-[#C72030] hover:bg-[#B01E2F] text-white px-8"
              onClick={() => {
                const it =
                  pendingFilterIssueTypeId === "all"
                    ? ""
                    : pendingFilterIssueTypeId;
                const cat =
                  pendingFilterCategoryId === "all"
                    ? ""
                    : pendingFilterCategoryId;
                const eng =
                  pendingFilterAssignTo === "all" ? "" : pendingFilterAssignTo;
                setFilterIssueTypeId(it);
                setFilterCategoryId(cat);
                setFilterAssignTo(eng);
                setIsFilterDialogOpen(false);
                loadAssignRules(1, it, cat, eng);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── ESCALATION RULE TAB ──────────────── */}
      {activeResolutionTab === "escalation-rule" && (
        <div className="space-y-0">
          {/* FM / Project sub-tabs */}
          <div className="flex border-b border-gray-200 bg-white px-6">
            <button
              onClick={() => setActiveFmProjectTab("fm")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeFmProjectTab === "fm"
                  ? "border-[#C72030] text-[#C72030]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              FM
            </button>
            <button
              onClick={() => setActiveFmProjectTab("project")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeFmProjectTab === "project"
                  ? "border-[#C72030] text-[#C72030]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Project
            </button>
          </div>

          {/* Issue Type + Category Type filter row */}
          {/* <div className="flex gap-3 p-4 bg-white border-b border-gray-200">
            <Select value={escalationIssueTypeFilter} onValueChange={setEscalationIssueTypeFilter}>
              <SelectTrigger className="w-48 h-9 text-sm border-gray-300">
                <SelectValue placeholder="Select Issue Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Issue Types</SelectItem>
              </SelectContent>
            </Select>
            <Select value={escalationCategoryTypeFilter} onValueChange={setEscalationCategoryTypeFilter}>
              <SelectTrigger className="w-48 h-9 text-sm border-gray-300">
                <SelectValue placeholder="Select Category Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.helpdesk_categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}

          <div className="p-6 space-y-6">
            {/* Create Form */}
            <Card>
              <CardHeader>
                <CardTitle>Resolution Escalation Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Issue Type + Category Type + Category Selection row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Issue Type Dropdown */}
                    <div>
                      <Label className="text-sm font-medium">Issue Type</Label>
                      <Select
                        value={escalationFormIssueTypeId}
                        onValueChange={setEscalationFormIssueTypeId}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Issue Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {issueTypeOptions.map((it) => (
                            <SelectItem key={it.id} value={it.id.toString()}>
                              {it.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Type Dropdown */}
                    <div>
                      <Label className="text-sm font-medium">
                        Category Type
                      </Label>
                      <Select
                        value={escalationFormCategoryTypeId}
                        onValueChange={setEscalationFormCategoryTypeId}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select Category Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoryDropdownOptions.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Select Categories (multi-select) */}
                    {/* <div>
                      <Label className="text-sm font-medium">Select Categories</Label>
                      <ReactSelect
                        isMulti
                        options={categoryOptions}
                        value={categoryOptions.filter(option => watch('categoryIds')?.includes(option.value))}
                        onChange={(selected) => {
                          const selectedIds = selected ? selected.map(s => s.value) : [];
                          setValue('categoryIds', selectedIds, { shouldValidate: true });
                        }}
                        className="mt-1"
                        placeholder="Select categories..."
                        isLoading={categoriesLoading}
                      />
                      {errors.categoryIds && (
                        <p className="text-sm text-red-500 mt-1">{errors.categoryIds.message}</p>
                      )}
                    </div> */}
                  </div>

                  {/* Escalation Matrix Table */}
                  <div>
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold text-center border-r">
                            Levels
                          </TableHead>
                          <TableHead className="font-semibold text-center border-r">
                            Escalation To
                          </TableHead>
                          <TableHead className="font-semibold text-center border-r">
                            Copy To
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center border-r"
                            colSpan={3}
                          >
                            P1
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center border-r"
                            colSpan={3}
                          >
                            P2
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center border-r"
                            colSpan={3}
                          >
                            P3
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center border-r"
                            colSpan={3}
                          >
                            P4
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center"
                            colSpan={3}
                          >
                            P5
                          </TableHead>
                        </TableRow>
                        <TableRow className="bg-gray-50">
                          <TableHead className="border-r"></TableHead>
                          <TableHead className="border-r"></TableHead>
                          <TableHead className="border-r"></TableHead>
                          {priorities.map((priority) => (
                            <React.Fragment key={priority}>
                              <TableHead className="text-center text-xs border-r">
                                Day
                              </TableHead>
                              <TableHead className="text-center text-xs border-r">
                                Hrs
                              </TableHead>
                              <TableHead className="text-center text-xs border-r">
                                Min
                              </TableHead>
                            </React.Fragment>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {escalationLevels.map((level) => (
                          <TableRow key={level} className="border-b">
                            <TableCell className="font-medium text-center border-r">
                              {level.toUpperCase()}
                            </TableCell>
                            <TableCell className="p-2 border-r">
                              <ReactSelect
                                isMulti
                                options={userOptions}
                                value={userOptions.filter((option) =>
                                  watch(
                                    `escalationLevels.${level}.users`
                                  )?.includes(option.value)
                                )}
                                onChange={(selected) => {
                                  const selectedIds = selected
                                    ? selected.map((s) => s.value)
                                    : [];
                                  setValue(
                                    `escalationLevels.${level}.users`,
                                    selectedIds,
                                    { shouldValidate: true }
                                  );
                                }}
                                placeholder="Escalate to..."
                                isLoading={serviceEngineerOptions.length === 0}
                                className="min-w-[200px]"
                                menuPlacement="auto"
                                maxMenuHeight={150}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    fontSize: "13px",
                                    border: "none",
                                    boxShadow: "none",
                                  }),
                                  multiValue: (base) => ({
                                    ...base,
                                    fontSize: "11px",
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 50,
                                    position: "relative",
                                  }),
                                  menuList: (base) => ({
                                    ...base,
                                    maxHeight: "150px",
                                    overflowY: "auto",
                                  }),
                                  option: (base, state) => ({
                                    ...base,
                                    fontSize: "13px",
                                    padding: "6px 10px",
                                    backgroundColor: state.isSelected
                                      ? "#3b82f6"
                                      : state.isFocused
                                        ? "#e5e7eb"
                                        : "white",
                                    color: state.isSelected
                                      ? "white"
                                      : "#374151",
                                    cursor: "pointer",
                                  }),
                                }}
                              />
                            </TableCell>
                            <TableCell className="p-2 border-r">
                              <ReactSelect
                                isMulti
                                options={userOptions}
                                value={userOptions.filter((option) =>
                                  watch(
                                    `escalationLevels.${level}.copyTo`
                                  )?.includes(option.value)
                                )}
                                onChange={(selected) => {
                                  const selectedIds = selected
                                    ? selected.map((s) => s.value)
                                    : [];
                                  setValue(
                                    `escalationLevels.${level}.copyTo`,
                                    selectedIds,
                                    { shouldValidate: true }
                                  );
                                }}
                                placeholder="Copy to..."
                                isLoading={serviceEngineerOptions.length === 0}
                                className="min-w-[200px]"
                                menuPlacement="auto"
                                maxMenuHeight={150}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minHeight: "32px",
                                    fontSize: "13px",
                                    border: "none",
                                    boxShadow: "none",
                                  }),
                                  multiValue: (base) => ({
                                    ...base,
                                    fontSize: "11px",
                                  }),
                                  menu: (base) => ({
                                    ...base,
                                    zIndex: 50,
                                    position: "relative",
                                  }),
                                  menuList: (base) => ({
                                    ...base,
                                    maxHeight: "150px",
                                    overflowY: "auto",
                                  }),
                                  option: (base, state) => ({
                                    ...base,
                                    fontSize: "13px",
                                    padding: "6px 10px",
                                    backgroundColor: state.isSelected
                                      ? "#3b82f6"
                                      : state.isFocused
                                        ? "#e5e7eb"
                                        : "white",
                                    color: state.isSelected
                                      ? "white"
                                      : "#374151",
                                    cursor: "pointer",
                                  }),
                                }}
                              />
                            </TableCell>
                            {priorities.map((priority) => (
                              <React.Fragment key={priority}>
                                <TableCell className="p-1 text-center border-r">
                                  <Input
                                    type="number"
                                    min="0"
                                    {...register(
                                      `escalationLevels.${level}.priorities.${priority}.days`,
                                      { valueAsNumber: true }
                                    )}
                                    className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="p-1 text-center border-r">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    {...register(
                                      `escalationLevels.${level}.priorities.${priority}.hours`,
                                      { valueAsNumber: true }
                                    )}
                                    className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                                    placeholder="0"
                                  />
                                </TableCell>
                                <TableCell className="p-1 text-center border-r last:border-r-0">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    {...register(
                                      `escalationLevels.${level}.priorities.${priority}.minutes`,
                                      { valueAsNumber: true }
                                    )}
                                    className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                                    placeholder="0"
                                  />
                                </TableCell>
                              </React.Fragment>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                    >
                      {loading ? "Creating..." : "Submit"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Escalation Rules Display */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Escalation Rules</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-1 h-9 px-4 text-sm border-gray-300"
                    onClick={() => {
                      setPendingEscalationFilterIssueTypeId(
                        escalationFilterIssueTypeId
                      );
                      setPendingEscalationFilterCategoryId(
                        escalationFilterCategoryId
                      );
                      setIsEscalationFilterDialogOpen(true);
                    }}
                  >
                    <Filter className="h-4 w-4" />
                    Filter
                    {(escalationFilterIssueTypeId ||
                      escalationFilterCategoryId) && (
                      <span className="ml-1 bg-[#C72030] text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        !
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {escalationRulesLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading...
                  </div>
                ) : escalationRulesList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No resolution escalation rules found
                  </div>
                ) : (
                  <div className="space-y-0">
                    {escalationRulesList.map((rule, index) => {
                      const categoryName =
                        rule.category_type || rule.category?.name || "Unknown";
                      const issueTypeName =
                        typeof rule.issue_type === "string"
                          ? rule.issue_type
                          : rule.issue_type?.name || "-";
                      return (
                        <div key={rule.id} className="border-b last:border-b-0">
                          <div className="flex items-center justify-between p-4 bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <span className="font-semibold text-purple-600">
                                Rule {index + 1}
                              </span>
                              <div className="flex items-center space-x-4 text-sm">
                                <span>
                                  <strong>Issue Type:</strong> {issueTypeName}
                                </span>
                                <span>
                                  <strong>Category Type:</strong> {categoryName}
                                </span>
                                {/* <span><strong>Service Engineer:</strong> {rule.service_engineer_name || '-'}</span> */}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                                disabled={updateLoading}
                                className="p-1"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={deleteLoading}
                                    className="p-1 text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Confirm Delete
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      resolution escalation rule? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(rule.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>

                          <div className="p-4 bg-white">
                            <Table className="border">
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead className="font-semibold text-center w-20 border-r">
                                    Levels
                                  </TableHead>
                                  <TableHead className="font-semibold text-center border-r">
                                    Escalation To
                                  </TableHead>
                                  <TableHead className="font-semibold text-center border-r">
                                    Copy To
                                  </TableHead>
                                  <TableHead className="font-semibold text-center w-32 border-r">
                                    P1
                                  </TableHead>
                                  <TableHead className="font-semibold text-center w-32 border-r">
                                    P2
                                  </TableHead>
                                  <TableHead className="font-semibold text-center w-32 border-r">
                                    P3
                                  </TableHead>
                                  <TableHead className="font-semibold text-center w-32 border-r">
                                    P4
                                  </TableHead>
                                  <TableHead className="font-semibold text-center w-32">
                                    P5
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {["E1", "E2", "E3", "E4", "E5"].map(
                                  (levelName) => {
                                    const matrixData =
                                      rule.escalation_matrix ||
                                      rule.escalations ||
                                      {};
                                    // Find matching level from API data
                                    const escalation = matrixData.find(
                                      (e: any) =>
                                        (
                                          e.level ||
                                          e.name ||
                                          ""
                                        ).toUpperCase() === levelName
                                    );

                                    let escalationToDisplay = "-";
                                    let copyToDisplay = "-";

                                    if (escalation) {
                                      // Try new display fields first
                                      if (
                                        escalation.escalate_to_display !==
                                        undefined
                                      ) {
                                        escalationToDisplay =
                                          escalation.escalate_to_display || "-";
                                        if (
                                          escalation.escalate_to_more_count > 0
                                        ) {
                                          escalationToDisplay += ` +${escalation.escalate_to_more_count} more`;
                                        }
                                        copyToDisplay =
                                          escalation.copy_to_display || "-";
                                        if (escalation.copy_to_more_count > 0) {
                                          copyToDisplay += ` +${escalation.copy_to_more_count} more`;
                                        }
                                      } else if (
                                        escalation.escalation_to !== undefined
                                      ) {
                                        // Secondary new API format
                                        escalationToDisplay =
                                          escalation.escalation_to || "-";
                                        copyToDisplay =
                                          escalation.copy_to || "-";
                                      } else if (escalation.escalate_to_users) {
                                        // Old API format: resolve user IDs to names
                                        let escalateToUsers: (
                                          | string
                                          | number
                                        )[] = [];
                                        try {
                                          if (
                                            typeof escalation.escalate_to_users ===
                                            "string"
                                          ) {
                                            escalateToUsers = JSON.parse(
                                              escalation.escalate_to_users
                                            );
                                          } else if (
                                            Array.isArray(
                                              escalation.escalate_to_users
                                            )
                                          ) {
                                            escalateToUsers =
                                              escalation.escalate_to_users;
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error parsing escalate_to_users:",
                                            error
                                          );
                                          escalateToUsers = [];
                                        }
                                        escalationToDisplay =
                                          Array.isArray(escalateToUsers) &&
                                          escalateToUsers.length > 0
                                            ? escalateToUsers
                                                .map(
                                                  (userId: string | number) => {
                                                    const userIdNum =
                                                      typeof userId === "string"
                                                        ? parseInt(userId)
                                                        : userId;
                                                    const user =
                                                      escalationUsers?.find(
                                                        (u) =>
                                                          u.id === userIdNum
                                                      );
                                                    return user
                                                      ? user.full_name
                                                      : `User ${userId}`;
                                                  }
                                                )
                                                .join(", ")
                                            : "-";
                                      }
                                    }

                                    const formatPriority = (p: any) => {
                                      if (!p) return "-";
                                      if (typeof p === "string") return p;
                                      if (typeof p === "number") {
                                        const { days, hours, minutes } =
                                          convertFromMinutes(p);
                                        return `${days}d ${hours}h ${minutes}m`;
                                      }
                                      return "-";
                                    };

                                    return (
                                      <TableRow
                                        key={levelName}
                                        className="border-b"
                                      >
                                        <TableCell className="font-medium text-center border-r">
                                          {levelName}
                                        </TableCell>
                                        <TableCell className="text-center border-r">
                                          {escalationToDisplay}
                                        </TableCell>
                                        <TableCell className="text-center border-r">
                                          {copyToDisplay}
                                        </TableCell>
                                        <TableCell className="text-center text-sm border-r">
                                          {formatPriority(escalation?.p1)}
                                        </TableCell>
                                        <TableCell className="text-center text-sm border-r">
                                          {formatPriority(escalation?.p2)}
                                        </TableCell>
                                        <TableCell className="text-center text-sm border-r">
                                          {formatPriority(escalation?.p3)}
                                        </TableCell>
                                        <TableCell className="text-center text-sm border-r">
                                          {formatPriority(escalation?.p4)}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                          {formatPriority(escalation?.p5)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>

              {/* Pagination */}
              {!escalationRulesLoading &&
                escalationRulesPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      {Math.min(
                        (escalationRulesPagination.currentPage - 1) *
                          escalationRulesPagination.perPage +
                          1,
                        escalationRulesPagination.totalEntries
                      )}
                      –
                      {Math.min(
                        escalationRulesPagination.currentPage *
                          escalationRulesPagination.perPage,
                        escalationRulesPagination.totalEntries
                      )}{" "}
                      of {escalationRulesPagination.totalEntries} rules
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            className={
                              escalationRulesPagination.currentPage === 1
                                ? "pointer-events-none opacity-50 cursor-default"
                                : "cursor-pointer"
                            }
                            onClick={() => {
                              if (escalationRulesPagination.currentPage > 1)
                                loadEscalationRules(
                                  escalationRulesPagination.currentPage - 1,
                                  escalationFilterIssueTypeId,
                                  escalationFilterCategoryId
                                );
                            }}
                          />
                        </PaginationItem>
                        {(() => {
                          const items: React.ReactNode[] = [];
                          const { currentPage, totalPages } =
                            escalationRulesPagination;
                          const showEllipsis = totalPages > 7;
                          if (showEllipsis) {
                            items.push(
                              <PaginationItem key={1}>
                                <PaginationLink
                                  isActive={currentPage === 1}
                                  onClick={() =>
                                    loadEscalationRules(
                                      1,
                                      escalationFilterIssueTypeId,
                                      escalationFilterCategoryId
                                    )
                                  }
                                  className="cursor-pointer"
                                >
                                  {1}
                                </PaginationLink>
                              </PaginationItem>
                            );
                            if (currentPage <= 3) {
                              for (let i = 2; i <= 4 && i < totalPages; i++) {
                                items.push(
                                  <PaginationItem key={i}>
                                    <PaginationLink
                                      isActive={currentPage === i}
                                      onClick={() =>
                                        loadEscalationRules(
                                          i,
                                          escalationFilterIssueTypeId,
                                          escalationFilterCategoryId
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      {i}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                              if (totalPages > 5)
                                items.push(
                                  <PaginationItem key="end-ellipsis">
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                );
                            } else if (currentPage >= totalPages - 2) {
                              items.push(
                                <PaginationItem key="start-ellipsis">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                              for (
                                let i = totalPages - 3;
                                i < totalPages;
                                i++
                              ) {
                                items.push(
                                  <PaginationItem key={i}>
                                    <PaginationLink
                                      isActive={currentPage === i}
                                      onClick={() =>
                                        loadEscalationRules(
                                          i,
                                          escalationFilterIssueTypeId,
                                          escalationFilterCategoryId
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      {i}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                            } else {
                              items.push(
                                <PaginationItem key="start-ellipsis">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                              for (
                                let i = currentPage - 1;
                                i <= currentPage + 1;
                                i++
                              ) {
                                items.push(
                                  <PaginationItem key={i}>
                                    <PaginationLink
                                      isActive={currentPage === i}
                                      onClick={() =>
                                        loadEscalationRules(
                                          i,
                                          escalationFilterIssueTypeId,
                                          escalationFilterCategoryId
                                        )
                                      }
                                      className="cursor-pointer"
                                    >
                                      {i}
                                    </PaginationLink>
                                  </PaginationItem>
                                );
                              }
                              items.push(
                                <PaginationItem key="end-ellipsis">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            if (totalPages > 1)
                              items.push(
                                <PaginationItem key={totalPages}>
                                  <PaginationLink
                                    isActive={currentPage === totalPages}
                                    onClick={() =>
                                      loadEscalationRules(
                                        totalPages,
                                        escalationFilterIssueTypeId,
                                        escalationFilterCategoryId
                                      )
                                    }
                                    className="cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                          } else {
                            for (let i = 1; i <= totalPages; i++) {
                              items.push(
                                <PaginationItem key={i}>
                                  <PaginationLink
                                    isActive={currentPage === i}
                                    onClick={() =>
                                      loadEscalationRules(
                                        i,
                                        escalationFilterIssueTypeId,
                                        escalationFilterCategoryId
                                      )
                                    }
                                    className="cursor-pointer"
                                  >
                                    {i}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                          }
                          return items;
                        })()}
                        <PaginationItem>
                          <PaginationNext
                            className={
                              escalationRulesPagination.currentPage ===
                              escalationRulesPagination.totalPages
                                ? "pointer-events-none opacity-50 cursor-default"
                                : "cursor-pointer"
                            }
                            onClick={() => {
                              if (
                                escalationRulesPagination.currentPage <
                                escalationRulesPagination.totalPages
                              )
                                loadEscalationRules(
                                  escalationRulesPagination.currentPage + 1,
                                  escalationFilterIssueTypeId,
                                  escalationFilterCategoryId
                                );
                            }}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
            </Card>
          </div>
        </div>
      )}

      {/* ──────────────── ESCALATION RULE FILTER DIALOG ──────────────── */}
      <Dialog
        open={isEscalationFilterDialogOpen}
        onOpenChange={setIsEscalationFilterDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Escalation Rules</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Issue Type</Label>
              <Select
                value={pendingEscalationFilterIssueTypeId}
                onValueChange={setPendingEscalationFilterIssueTypeId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Issue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issue Types</SelectItem>
                  {issueTypeOptions.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Category Type</Label>
              <Select
                value={pendingEscalationFilterCategoryId}
                onValueChange={setPendingEscalationFilterCategoryId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Category Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categoryDropdownOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-2">
            <Button
              variant="outline"
              className="border-[#C72030] text-[#C72030] hover:bg-[#C72030]/5"
              onClick={() => {
                setPendingEscalationFilterIssueTypeId("");
                setPendingEscalationFilterCategoryId("");
                setEscalationFilterIssueTypeId("");
                setEscalationFilterCategoryId("");
                setIsEscalationFilterDialogOpen(false);
                loadEscalationRules(1, "", "");
              }}
            >
              Reset
            </Button>
            <Button
              className="bg-[#C72030] hover:bg-[#B01E2F] text-white px-8"
              onClick={() => {
                const it =
                  pendingEscalationFilterIssueTypeId === "all"
                    ? ""
                    : pendingEscalationFilterIssueTypeId;
                const cat =
                  pendingEscalationFilterCategoryId === "all"
                    ? ""
                    : pendingEscalationFilterCategoryId;
                setEscalationFilterIssueTypeId(it);
                setEscalationFilterCategoryId(cat);
                setIsEscalationFilterDialogOpen(false);
                loadEscalationRules(1, it, cat);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── ADD ASSIGN RULE MODAL ──────────────── */}
      <Dialog open={isAddAssignRuleOpen} onOpenChange={setIsAddAssignRuleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Assign Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Issue Type</Label>
              <Select
                value={assignRuleForm.issueType}
                onValueChange={(v) =>
                  setAssignRuleForm((f) => ({ ...f, issueType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypeOptions.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Category Type</Label>
              <Select
                value={assignRuleForm.categoryType}
                onValueChange={(v) =>
                  setAssignRuleForm((f) => ({ ...f, categoryType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent>
                  {categoryDropdownOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Service Engineer</Label>
              <Select
                value={assignRuleForm.engineer}
                onValueChange={(v) =>
                  setAssignRuleForm((f) => ({ ...f, engineer: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select Engineer" />
                </SelectTrigger>
                <SelectContent>
                  {serviceEngineerOptions.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id.toString()}>
                      {eng.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                className="bg-[#1a1a2e] hover:bg-[#16213e] text-white px-8"
                disabled={assignRuleSubmitting}
                onClick={handleCreateAssignRule}
              >
                {assignRuleSubmitting ? "Saving..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── EDIT ASSIGN RULE MODAL ──────────────── */}
      <Dialog
        open={isEditAssignRuleOpen}
        onOpenChange={setIsEditAssignRuleOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assign Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm font-medium">Issue Type</Label>
              <Select
                value={editAssignRuleForm.issueType}
                onValueChange={(v) =>
                  setEditAssignRuleForm((f) => ({ ...f, issueType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent>
                  {issueTypeOptions.map((it) => (
                    <SelectItem key={it.id} value={it.id.toString()}>
                      {it.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Category Type</Label>
              <Select
                value={editAssignRuleForm.categoryType}
                onValueChange={(v) =>
                  setEditAssignRuleForm((f) => ({ ...f, categoryType: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select" />
                </SelectTrigger>
                <SelectContent>
                  {categoryDropdownOptions.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Service Engineer</Label>
              <Select
                value={editAssignRuleForm.engineer}
                onValueChange={(v) =>
                  setEditAssignRuleForm((f) => ({ ...f, engineer: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="select Engineer" />
                </SelectTrigger>
                <SelectContent>
                  {serviceEngineerOptions.map((eng) => (
                    <SelectItem key={eng.id} value={eng.id.toString()}>
                      {eng.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditAssignRuleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#1a1a2e] hover:bg-[#16213e] text-white px-8"
                disabled={assignRuleSubmitting}
                onClick={handleUpdateAssignRule}
              >
                {assignRuleSubmitting ? "Saving..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ──────────────── EDIT ESCALATION RULE DIALOG ──────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto overflow-x-visible">
          <DialogHeader>
            <DialogTitle>Edit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
            {/* Issue Type & Category Type Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Issue Type</Label>
                <Select
                  value={editEscalationIssueTypeId}
                  onValueChange={(v) => setEditEscalationIssueTypeId(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Issue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypeOptions.map((issue) => (
                      <SelectItem key={issue.id} value={issue.id.toString()}>
                        {issue.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium">Category Type</Label>
                <Select
                  value={editEscalationCategoryTypeId}
                  onValueChange={(v) => setEditEscalationCategoryTypeId(v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Category Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryDropdownOptions.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Escalation Matrix Table */}
            <div>
              <Table className="border">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-center border-r">
                      Levels
                    </TableHead>
                    <TableHead className="font-semibold text-center border-r">
                      Escalation To
                    </TableHead>
                    <TableHead className="font-semibold text-center border-r">
                      Copy To
                    </TableHead>
                    <TableHead
                      className="font-semibold text-center border-r"
                      colSpan={3}
                    >
                      P1
                    </TableHead>
                    <TableHead
                      className="font-semibold text-center border-r"
                      colSpan={3}
                    >
                      P2
                    </TableHead>
                    <TableHead
                      className="font-semibold text-center border-r"
                      colSpan={3}
                    >
                      P3
                    </TableHead>
                    <TableHead
                      className="font-semibold text-center border-r"
                      colSpan={3}
                    >
                      P4
                    </TableHead>
                    <TableHead
                      className="font-semibold text-center"
                      colSpan={3}
                    >
                      P5
                    </TableHead>
                  </TableRow>
                  <TableRow className="bg-gray-50">
                    <TableHead className="border-r"></TableHead>
                    <TableHead className="border-r"></TableHead>
                    <TableHead className="border-r"></TableHead>
                    {priorities.map((priority) => (
                      <React.Fragment key={priority}>
                        <TableHead className="text-center text-xs border-r">
                          Day
                        </TableHead>
                        <TableHead className="text-center text-xs border-r">
                          Hrs
                        </TableHead>
                        <TableHead className="text-center text-xs border-r">
                          Min
                        </TableHead>
                      </React.Fragment>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {escalationLevels.map((level) => (
                    <TableRow key={level} className="border-b">
                      <TableCell className="font-medium text-center border-r">
                        {level.toUpperCase()}
                      </TableCell>
                      <TableCell className="p-2 border-r">
                        <ReactSelect
                          isMulti
                          options={userOptions}
                          value={userOptions.filter((option) => {
                            const currentUsers =
                              watch(`escalationLevels.${level}.users`) || [];
                            return currentUsers.includes(option.value);
                          })}
                          onChange={(selected) => {
                            const selectedIds = selected
                              ? selected.map((s) => s.value)
                              : [];
                            setValue(
                              `escalationLevels.${level}.users`,
                              selectedIds,
                              { shouldValidate: true }
                            );
                          }}
                          placeholder="Escalate to..."
                          isLoading={serviceEngineerOptions.length === 0}
                          className="min-w-[200px]"
                          menuPlacement="auto"
                          maxMenuHeight={150}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "32px",
                              fontSize: "13px",
                              border: "none",
                              boxShadow: "none",
                            }),
                            multiValue: (base) => ({
                              ...base,
                              fontSize: "11px",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 50,
                              position: "relative",
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: "150px",
                              overflowY: "auto",
                            }),
                            option: (base, state) => ({
                              ...base,
                              fontSize: "13px",
                              padding: "6px 10px",
                              backgroundColor: state.isSelected
                                ? "#3b82f6"
                                : state.isFocused
                                  ? "#e5e7eb"
                                  : "white",
                              color: state.isSelected ? "white" : "#374151",
                              cursor: "pointer",
                            }),
                          }}
                        />
                      </TableCell>
                      <TableCell className="p-2 border-r">
                        <ReactSelect
                          isMulti
                          options={userOptions}
                          value={userOptions.filter((option) => {
                            const currentCopyTo =
                              watch(`escalationLevels.${level}.copyTo`) || [];
                            return currentCopyTo.includes(option.value);
                          })}
                          onChange={(selected) => {
                            const selectedIds = selected
                              ? selected.map((s) => s.value)
                              : [];
                            setValue(
                              `escalationLevels.${level}.copyTo`,
                              selectedIds,
                              { shouldValidate: true }
                            );
                          }}
                          placeholder="Copy to..."
                          isLoading={serviceEngineerOptions.length === 0}
                          className="min-w-[200px]"
                          menuPlacement="auto"
                          maxMenuHeight={150}
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: "32px",
                              fontSize: "13px",
                              border: "none",
                              boxShadow: "none",
                            }),
                            multiValue: (base) => ({
                              ...base,
                              fontSize: "11px",
                            }),
                            menu: (base) => ({
                              ...base,
                              zIndex: 50,
                              position: "relative",
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: "150px",
                              overflowY: "auto",
                            }),
                            option: (base, state) => ({
                              ...base,
                              fontSize: "13px",
                              padding: "6px 10px",
                              backgroundColor: state.isSelected
                                ? "#3b82f6"
                                : state.isFocused
                                  ? "#e5e7eb"
                                  : "white",
                              color: state.isSelected ? "white" : "#374151",
                              cursor: "pointer",
                            }),
                          }}
                        />
                      </TableCell>
                      {priorities.map((priority) => (
                        <React.Fragment key={priority}>
                          <TableCell className="p-1 text-center border-r">
                            <Input
                              type="number"
                              min="0"
                              {...register(
                                `escalationLevels.${level}.priorities.${priority}.days`,
                                { valueAsNumber: true }
                              )}
                              className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="p-1 text-center border-r">
                            <Input
                              type="number"
                              min="0"
                              max="23"
                              {...register(
                                `escalationLevels.${level}.priorities.${priority}.hours`,
                                { valueAsNumber: true }
                              )}
                              className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell className="p-1 text-center border-r last:border-r-0">
                            <Input
                              type="number"
                              min="0"
                              max="59"
                              {...register(
                                `escalationLevels.${level}.priorities.${priority}.minutes`,
                                { valueAsNumber: true }
                              )}
                              className="w-16 h-8 text-center text-xs border-none focus-visible:ring-0"
                              placeholder="0"
                            />
                          </TableCell>
                        </React.Fragment>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
