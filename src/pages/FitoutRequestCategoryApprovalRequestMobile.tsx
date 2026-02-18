import PullToRefresh from "react-simple-pull-to-refresh";
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import baseClient from "@/utils/withoutTokenBase";
import { toast } from "sonner";

interface SnagAnswerDoc {
    id: number;
    relation?: string;
    relation_id?: number;
    document?: string;
    document_url?: string;
    thumbnail?: string;
    document_type?: string;
}

interface SnagAnswer {
    id: number;
    question_id: number;
    ans_descr: string;
    created_at: string;
    docs?: SnagAnswerDoc[];
}

interface SnagQuestion {
    id: number;
    qtype: string;
    descr: string;
    active: number;
    qnumber: number;
}

interface SnagQuestMap {
    id: number;
    question_id: number;
    snag_question: SnagQuestion;
    snag_answers: SnagAnswer[];
}

interface FitoutCategoryDetail {
    id: number;
    category_id: number;
    name: string;
    complaint_status_name: string;
    status: string;
    status_color: string;
    created_at: string;
    updated_at: string;
    comments: any[];
    snag_quest_maps: SnagQuestMap[];
}

const FitoutRequestCategoryApprovalRequestMobile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    // Extract token and org_id from URL parameters
    const token = searchParams.get("token");

    const [fitoutCategoryData, setFitoutCategoryData] = useState<FitoutCategoryDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Approval/Rejection States
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [currentAction, setCurrentAction] = useState<"approve" | "reject" | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [rectifyComments, setRectifyComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const level_id = searchParams.get("level_id");
    const org_id = searchParams.get("org_id");

    console.log(fitoutCategoryData)

    useEffect(() => {
        const fetchFitoutRequestCategory = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!token) {
                    throw new Error("No authentication token found in URL");
                }

                const response = await baseClient.get(
                    `/fitout_request_categories/${id}.json?token=${token}`
                );
                setFitoutCategoryData(response.data);
                console.log("✅ Fitout category request loaded:", response.data);
            } catch (err: any) {
                console.error("❌ Error fetching fitout category request:", err);
                setError(err.response?.data?.error || "Failed to load fitout request details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchFitoutRequestCategory();
        }
    }, [id, token]);

    const handleStatusConfirmation = async () => {
        if (!currentAction || !id || !token) return;

        if (currentAction === "reject" && !rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                level_id: level_id ? parseInt(level_id) : 1,
                approve: currentAction === "approve",
                rejection_reason: currentAction === "reject" ? rejectionReason : null,
                rectify_comments: rectifyComments || null
            };

            await baseClient.post(
                `/fitout_request_categories/${id}/status_confirmation.json?token=${token}&org_id=${org_id || 10}`,
                payload
            );

            toast.success(`Category ${currentAction === "approve" ? "approved" : "rejected"} successfully`);
            setIsActionModalOpen(false);
            // Refresh data or navigate back
            setTimeout(() => navigate(-1), 1500);
        } catch (err: any) {
            console.error("❌ Error confirming status:", err);
            toast.error(err.response?.data?.error || `Failed to ${currentAction} request`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to format date
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            });
        } catch {
            return dateString;
        }
    };

    return (
        <PullToRefresh
            onRefresh={async () => window.location.reload()}
        >
            <div className="min-h-screen bg-[#f5f5f5]">
                {/* Top App Bar */}
                <Card className="flex items-center rounded-none px-4 py-3 border-b bg-white sticky top-0 z-10 shadow-none">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(-1)}
                        className="mr-2 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                    <h1 className="flex-1 text-center text-xl font-semibold text-gray-900">
                        Category Details
                    </h1>
                    <div className="w-6" />
                </Card>

                {loading && (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <p className="text-gray-600">Loading details...</p>
                    </div>
                )}

                {error && (
                    <div className="px-4 py-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {!loading && !error && fitoutCategoryData && (
                    <div className="px-4 pb-32 pt-4 space-y-6">
                        {/* Summary Card */}
                        <Card className="rounded-[24px] shadow-sm overflow-hidden border-none bg-white">
                            <div className="bg-[#fcfcfc] border-b border-gray-100 p-6">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold text-[#d4a574] uppercase tracking-wider">Fitout Category</p>
                                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                                            {fitoutCategoryData.name}
                                        </h2>
                                    </div>
                                    <Badge
                                        className="px-3 py-1.5 text-[10px] font-bold rounded-full text-white shadow-sm whitespace-nowrap uppercase tracking-wide border-none"
                                        style={{ backgroundColor: fitoutCategoryData.status_color || "#C99A31" }}
                                    >
                                        {fitoutCategoryData.status}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                                <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Category ID</p>
                                    <p className="text-sm font-semibold text-gray-900">#{fitoutCategoryData.id}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Reference ID</p>
                                    <p className="text-sm font-semibold text-gray-900">#{fitoutCategoryData.category_id}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">Submission Date</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <p className="text-sm font-semibold text-gray-800">
                                            {formatDate(fitoutCategoryData.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Snag Questions & Answers */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-lg font-bold text-gray-900">Form Details</h3>
                                <Badge variant="outline" className="text-[10px] font-bold text-gray-500 border-gray-200">
                                    {fitoutCategoryData.snag_quest_maps?.length || 0} ITEMS
                                </Badge>
                            </div>

                            {fitoutCategoryData.snag_quest_maps && fitoutCategoryData.snag_quest_maps.length > 0 ? (
                                <div className="space-y-4">
                                    {fitoutCategoryData.snag_quest_maps.map((map, index) => (
                                        <Card key={map.id} className="rounded-[20px] shadow-sm p-0 overflow-hidden border-none bg-white">
                                            <div className="p-5 space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[12px] font-bold text-gray-400 border border-gray-100">
                                                        {map.snag_question.qnumber}
                                                    </div>
                                                    <p className="text-[15px] font-bold text-gray-800 leading-snug pt-1">
                                                        {map.snag_question.descr}
                                                    </p>
                                                </div>

                                                <div className="ml-11 space-y-4">
                                                    {map.snag_answers && map.snag_answers.length > 0 ? (
                                                        map.snag_answers.map((answer, ansIndex) => (
                                                            <div key={answer.id || ansIndex} className="space-y-3">
                                                                {answer.ans_descr && (
                                                                    <div className="bg-[#f9f9f9] rounded-[14px] p-4 border border-gray-50 group transition-all">
                                                                        <p className="text-[13px] text-gray-700 leading-relaxed italic">
                                                                            {answer.ans_descr}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {/* Render attachments for this answer */}
                                                                {answer.docs && answer.docs.length > 0 && (
                                                                    <div className="flex flex-wrap gap-3 mt-1">
                                                                        {answer.docs.map((doc) => {
                                                                            const docUrl = doc.document || doc.document_url || doc.thumbnail;

                                                                            console.log("docUrl", docUrl);
                                                                            if (!docUrl) return null;

                                                                            return (
                                                                                <div key={doc.id} className="relative group">
                                                                                    {doc.document_type?.startsWith("image/") || docUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                                                                                        <div
                                                                                            className="w-24 h-24 rounded-[12px] overflow-hidden border border-gray-100 shadow-sm active:scale-95 transition-all cursor-pointer hover:shadow-md bg-gray-50 flex items-center justify-center"
                                                                                            onClick={() => window.open(docUrl, "_blank")}
                                                                                        >
                                                                                            <img
                                                                                                src={docUrl}
                                                                                                alt="Attachment"
                                                                                                className="w-full h-full object-cover"
                                                                                                onError={(e) => {
                                                                                                    (e.target as any).src = "https://placehold.co/100x100?text=Error";
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            className="h-24 w-24 flex flex-col items-center justify-center gap-1 rounded-[12px] border border-gray-100 bg-gray-50 text-[10px] font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition-all"
                                                                                            onClick={() => window.open(docUrl, "_blank")}
                                                                                        >
                                                                                            <span className="text-2xl">📄</span>
                                                                                            <span className="uppercase tracking-tight truncate w-full px-1">
                                                                                                {doc.document_type?.split('/')[1] || docUrl.split('.').pop() || 'DOC'}
                                                                                            </span>
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                )}

                                                                {/* Fallback if both description and docs are empty but answer object exists */}
                                                                {!answer.ans_descr && (!answer.docs || answer.docs.length === 0) && (
                                                                    <div className="bg-[#f9f9f9] rounded-[14px] p-4 border border-gray-50">
                                                                        <p className="text-[13px] text-gray-400 italic">Answer recorded (no details/docs)</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="bg-[#f9f9f9] rounded-[14px] p-4 border border-gray-50">
                                                            <p className="text-[13px] text-gray-300 italic">No answer provided</p>
                                                        </div>
                                                    )}

                                                    {/* {map.snag_question.qtype && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{map.snag_question.qtype}</p>
                                                        </div>
                                                    )} */}
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center bg-gray-50 rounded-[24px] border-2 border-dashed border-gray-100">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                        <p className="text-xl">📋</p>
                                    </div>
                                    <p className="text-sm text-gray-400 font-medium">No checklist data found for this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sticky Footer Actions */}
                {!loading && !error && fitoutCategoryData && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
                        <Button
                            variant="outline"
                            className="flex-1 h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
                            onClick={() => {
                                setCurrentAction("reject");
                                setIsActionModalOpen(true);
                            }}
                        >
                            Reject
                        </Button>
                        <Button
                            className="flex-1 h-12 rounded-xl bg-[#d4a574] hover:bg-[#c49460] text-white font-bold"
                            onClick={() => {
                                setCurrentAction("approve");
                                setIsActionModalOpen(true);
                            }}
                        >
                            Approve
                        </Button>
                    </div>
                )}

                {/* Action Modal */}
                <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                    <DialogContent className="sm:max-w-[425px] rounded-[24px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900">
                                {currentAction === "approve" ? "Approve Category" : "Reject Category"}
                            </DialogTitle>
                            <DialogDescription>
                                {currentAction === "approve"
                                    ? "Are you sure you want to approve this fitout category?"
                                    : "Please provide a reason for rejecting this category."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            {currentAction === "reject" && (
                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="text-sm font-bold text-gray-700">Rejection Reason *</Label>
                                    <Textarea
                                        id="reason"
                                        placeholder="Enter the reason for rejection..."
                                        className="rounded-xl border-gray-200 focus:ring-[#d4a574]"
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="comments" className="text-sm font-bold text-gray-700">
                                    {currentAction === "approve" ? "Approval Comments (Optional)" : "Rectification Comments (Optional)"}
                                </Label>
                                <Textarea
                                    id="comments"
                                    placeholder="Enter any additional comments..."
                                    className="rounded-xl border-gray-200 focus:ring-[#d4a574]"
                                    value={rectifyComments}
                                    onChange={(e) => setRectifyComments(e.target.value)}
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex !flex-row gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setIsActionModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleStatusConfirmation}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Processing..." : (currentAction === "approve" ? "Approve" : "Reject")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PullToRefresh >
    );
};

export default FitoutRequestCategoryApprovalRequestMobile;