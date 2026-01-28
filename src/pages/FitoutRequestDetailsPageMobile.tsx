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
import baseClient from "@/utils/withoutTokenBase";
import { toast } from "sonner";

interface FitoutRequestCategory {
    id: number;
    fitout_category_id: number;
    category_name: string;
    status_name: string | null;
    complaint_status_id: number | null;
    amount: number | null;
    documents: Array<{ id: number; title: string; thumbnail: string }>;
}

interface FitoutRequest {
    id: number;
    fitout_number: string;
    status_name: string;
    created_at: string;
    requested_at: string;
    updated_at: string;
    description: string;
    documents: Array<{ id: number; title: string; thumbnail: string }>;
    comments: Array<{ id: number; author: string; dateTime: string; text: string }>;
    annexure_statuses: Array<{ label: string; status: string; colorClass: string; textColor: string }>;
    fitout_request_categories?: FitoutRequestCategory[];
}

const FitoutRequestDetailsPageMobile: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    // Extract token and org_id from URL parameters
    const token = searchParams.get("token");
    const orgId = searchParams.get("org_id") || searchParams.get("organization_id");

    const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
    const [commentText, setCommentText] = useState("");
    const [fitoutData, setFitoutData] = useState<FitoutRequest | null>(null);
    const [fitoutResponses, setFitoutResponses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFitoutRequest = async () => {
            try {
                setLoading(true);
                setError(null);
                // Check if token is available
                if (!token) {
                    throw new Error("No authentication token found in URL");
                }

                const response = await baseClient.get(
                    `/crm/admin/fitout_requests/${id}.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setFitoutData(response.data);
                console.log("✅ Fitout request loaded:", response.data);
            } catch (err) {
                console.error("❌ Error fetching fitout request:", err);
                setError(err.response?.data?.error || "Failed to load fitout request details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchFitoutRequest();
        }
    }, [id]);

    // Fetch fitout responses for annexure statuses and comments
    useEffect(() => {
        const fetchFitoutResponses = async () => {
            try {
                if (!token) {
                    throw new Error("No authentication token found in URL");
                }

                const response = await baseClient.get(
                    `/crm/admin/fitout_requests/${id}/fitout_responses.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setFitoutResponses(response.data);
                console.log("✅ Fitout responses loaded:", response.data);
            } catch (err) {
                console.error("❌ Error fetching fitout responses:", err);
                // Don't set error - this is secondary data
            }
        };

        if (id && token) {
            fetchFitoutResponses();
        }
    }, [id, token]);

    // Function to get status color based on status name
    const getStatusColor = (statusName: string | null): string => {
        if (!statusName) return "bg-[#999999]";

        const statusLower = statusName.toLowerCase();

        if (statusLower.includes("pending") || statusLower.includes("received")) {
            return "bg-[#FFC928]";
        } else if (statusLower.includes("review") || statusLower.includes("under review")) {
            return "bg-[#01B5D8]";
        } else if (statusLower.includes("approved") || statusLower.includes("completed")) {
            return "bg-[#00A650]";
        } else if (statusLower.includes("rejected")) {
            return "bg-[#FF3B30]";
        }

        return "bg-[#0257E7]";
    };

    // Map fitout responses to annexure statuses
    const annexureStatuses = fitoutResponses && fitoutResponses.length > 0
        ? fitoutResponses.map((response) => ({
            label: response.name || "ANNEXURE",
            status: response.status || response.complaint_status_name || "Pending",
            colorClass: response.status_color ? "" : getStatusColor(response.status),
            backgroundColor: response.status_color || undefined,
            textColor: "text-white",
        }))
        : fitoutData?.fitout_request_categories?.map((category) => ({
            label: category.category_name || "ANNEXURE",
            status: category.status_name || "Pending",
            colorClass: getStatusColor(category.status_name),
            backgroundColor: undefined,
            textColor: "text-white",
        })) || [
            {
                label: "ANNEXURE-2(STATEMENTOF",
                status: "Fitout Request Received",
                colorClass: "bg-[#FFC928]",
                backgroundColor: undefined,
                textColor: "text-white",
            },
        ];

    // Map documents from all categories
    const documents = fitoutData?.fitout_request_categories?.reduce(
        (acc: any[], category) => [
            ...acc,
            ...(category.documents || []).map((doc: any) => ({
                id: doc.id,
                title: doc.title || category.category_name || "Document",
                thumbnail: doc.thumbnail || "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=400&h=300&fit=crop&crop=center",
            })),
        ],
        []
    ) || [];

    // Helper function to format comment date
    const formatCommentDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            const time = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
            const formattedDate = date.toLocaleDateString("en-IN");
            return `${formattedDate} ${time}`;
        } catch {
            return dateString;
        }
    };

    // Helper function to map comment fields
    const mapCommentFields = (comment: any) => ({
        id: comment.id,
        author: comment.commentor_name || comment.author || "Unknown",
        dateTime: comment.created_at ? formatCommentDate(comment.created_at) : comment.dateTime || "Unknown date",
        text: comment.body || comment.text || "",
    });

    // Map comments grouped by annexure
    const annexureWithComments = fitoutResponses && fitoutResponses.length > 0
        ? fitoutResponses.map((response) => ({
            id: response.id,
            name: response.name || "ANNEXURE",
            comments: (response.comments || []).map(mapCommentFields),
        }))
        : fitoutData?.fitout_request_categories?.map((category) => ({
            id: category.id,
            name: category.category_name || "ANNEXURE",
            comments: (fitoutData?.comments || []).map(mapCommentFields),
        })) || [];

    const handlePostComment = async () => {
        // Validate inputs
        if (!commentText.trim()) return;
        if (!selectedCategory) {
            alert("Please select a category first");
            return;
        }

        try {
            // Extract index from selectedCategory value (e.g., "category-0" -> 0)
            const categoryIndex = parseInt(selectedCategory.replace("category-", ""));
            const selectedAnnexure = annexureWithComments[categoryIndex];

            if (!selectedAnnexure || !selectedAnnexure.id) {
                alert("Invalid category selected");
                return;
            }

            if (!token) {
                alert("No authentication token found");
                return;
            }

            // Make API call to post comment
            const response = await baseClient.put(
                `/fitout_request_categories/${selectedAnnexure.id}.json`,
                {
                    id: selectedAnnexure.id.toString(),
                    comment: {
                        body: commentText,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            console.log("✅ Comment posted successfully:", response.data);
            setCommentText("");
        } catch (err) {
            console.error("❌ Error posting comment:", err);
            toast.error("Failed to post comment. Please try again.");
        }
    };

    return (
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
                    Fitout Request Details
                </h1>
                {/* spacer to balance back button */}
                <div className="w-6" />
            </Card>

            {loading && (
                <div className="flex items-center justify-center min-h-[400px]">
                    <p className="text-gray-600">Loading fitout request details...</p>
                </div>
            )}

            {error && (
                <div className="px-4 py-4 m-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="px-4 pb-6 pt-4 space-y-6">
                    {/* Main Card */}
                    <Card className="rounded-2xl shadow-sm overflow-hidden">
                        {/* Status Ribbon */}
                        <div className="relative">
                            <div className="flex justify-end">
                                <div className="flex items-center">
                                    <Badge className="rounded-l-none rounded-tr-[10px] rounded-br-none bg-[#00A650] px-6 py-1.5 text-xs font-semibold tracking-wide text-white">
                                        {fitoutData?.status_name || "PENDING"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-5">
                            <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                Fitout <span className="font-normal text-gray-700">(#{fitoutData?.fitout_number || "951"})</span>
                            </h2>

                            <div>
                                {annexureStatuses.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between gap-3 rounded-xl py-2"
                                    >
                                        <p className="flex-1 text-[11px] font-medium text-gray-800 leading-snug line-clamp-2">
                                            {item.label}
                                        </p>
                                        <Badge
                                            className={`flex-shrink-0 rounded-[5px] px-3 py-1 text-[11px] font-semibold text-center shadow-sm whitespace-nowrap ${item.colorClass} ${item.textColor}`}
                                            style={item.backgroundColor ? { backgroundColor: item.backgroundColor } : undefined}
                                        >
                                            {item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-1">
                                <div className="bg-[#f4f4f4] rounded-xl px-2 py-2 text-center">
                                    <p className="text-[11px] font-medium text-gray-500">
                                        Created On
                                    </p>
                                    <p className="text-xs font-semibold text-gray-900 mt-1">
                                        {fitoutData?.created_at ? new Date(fitoutData.created_at).toLocaleDateString("en-IN") : "21/02/2023"}
                                    </p>
                                </div>
                                <div className="bg-[#f4f4f4] rounded-xl px-2 py-2 text-center">
                                    <p className="text-[11px] font-medium text-gray-500">
                                        Requested On
                                    </p>
                                    <p className="text-xs font-semibold text-gray-900 mt-1">
                                        {fitoutData?.requested_at ? new Date(fitoutData.requested_at).toLocaleDateString("en-IN") : "-"}
                                    </p>
                                </div>
                                <div className="bg-[#f4f4f4] rounded-xl px-2 py-2 text-center">
                                    <p className="text-[11px] font-medium text-gray-500">
                                        Updated On
                                    </p>
                                    <p className="text-xs font-semibold text-gray-900 mt-1">
                                        {fitoutData?.updated_at ? new Date(fitoutData.updated_at).toLocaleDateString("en-IN") : "06/06/2023"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Description */}
                    <Card className="rounded-2xl shadow-sm px-4 py-3">
                        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                            Description
                        </h3>
                        <p className="text-sm text-gray-700">{fitoutData?.description || "No description available"}</p>
                    </Card>

                    {/* Documents */}
                    <Card className="rounded-2xl shadow-sm px-4 py-3">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                            Documents
                        </h3>

                        {documents && documents.length > 0 ? (
                            <div className="space-y-4">
                                {documents.map((doc) => (
                                    <div key={doc.id}>
                                        <p className="text-xs font-semibold text-gray-800 mb-2">
                                            {doc.title}
                                        </p>
                                        <div className="w-32 h-24 rounded-xl overflow-hidden border border-gray-200">
                                            <img
                                                src={doc.thumbnail}
                                                alt={doc.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No documents available</p>
                        )}
                    </Card>

                    {/* Comments & Annexures */}
                    <Card className="rounded-2xl shadow-sm px-4 py-4 space-y-4">
                        {/* Category select */}
                        <Select
                            value={selectedCategory}
                            onValueChange={(value) => setSelectedCategory(value)}
                        >
                            <SelectTrigger className="w-full h-11 rounded-xl border-gray-300 bg-white text-[13px]">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {annexureWithComments && annexureWithComments.length > 0 ? (
                                    annexureWithComments.map((annexure, idx) => (
                                        <SelectItem key={idx} value={`category-${idx}`}>
                                            {annexure.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <>
                                        <SelectItem value="">No categories available</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>

                        {/* Comment input + Post */}
                        <div className="flex gap-3 items-center rounded-2xl overflow-hidden border border-[#e8e8e8] bg-white px-4 py-3">
                            <Textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Leave a comment..."
                                className="min-h-[40px] flex-1 resize-none border-none rounded-lg text-[13px] px-0 py-0 bg-white focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            <Button
                                type="button"
                                onClick={handlePostComment}
                                variant="ghost"
                                className="h-[40px] min-w-[70px] rounded-[5px] bg-[#d4a574] hover:bg-[#c49460] text-white text-sm font-semibold border-none flex-shrink-0"
                            >
                                Post
                            </Button>
                        </div>

                        {/* Comments heading */}
                        <h3 className="text-base font-semibold text-gray-900 pt-2">
                            Comments
                        </h3>

                        {/* Comments grouped by annexure */}
                        {annexureWithComments && annexureWithComments.length > 0 ? (
                            <div className="space-y-6 pt-3">
                                {annexureWithComments.map((annexure, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <p className="text-sm font-semibold text-gray-800">
                                            {annexure.name}
                                        </p>
                                        {annexure.comments && annexure.comments.length > 0 ? (
                                            <div className="space-y-3">
                                                {annexure.comments.map((comment) => (
                                                    <Card
                                                        key={comment.id}
                                                        className="border border-[#f0f0f0] bg-white shadow-sm px-4 py-3 rounded-2xl"
                                                    >
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5">
                                                            <span className="font-semibold text-[#d49a23]">
                                                                {comment.author}
                                                            </span>
                                                            <span className="text-gray-400">•</span>
                                                            <span>{comment.dateTime}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-900">
                                                            {comment.text}
                                                        </p>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No comments yet</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 pt-3">No comments available</p>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
};

export default FitoutRequestDetailsPageMobile;