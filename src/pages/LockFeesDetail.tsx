import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";

// Skeleton Component
const SkeletonField = () => (
    <div className="border-b pb-4 md:border-b-0">
        <div className="h-4 bg-gray-300 rounded w-20 mb-2 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
    </div>
);

const LockFeesDetailSkeleton = () => (
    <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-8">
            <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div>
            </div>
            <div className="h-8 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>

        <div className="space-y-6">
            {/* Card Skeleton */}
            <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse"></div>
                            <div className="h-6 bg-gray-300 rounded w-40 animate-pulse"></div>
                        </div>
                        <div className="flex gap-2">
                            <div className="h-10 bg-gray-300 rounded w-24 animate-pulse"></div>
                            <div className="h-10 bg-gray-300 rounded w-20 animate-pulse"></div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SkeletonField key={i} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
);

const LockFeesDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");

    const [lockFee, setLockFee] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLockFeeDetail = async () => {
            if (!id) {
                toast.error("Lock Fee ID is missing");
                navigate("/setup-admin/lock-fees");
                return;
            }

            setLoading(true);
            try {
                const response = await axios.get(
                    `https://${baseUrl}/admin/lock_fees/${id}.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                setLockFee(response.data.lock_fee || response.data);
            } catch (error: any) {
                console.error("Error fetching lock fee detail:", error);
                const errorMessage = error.response?.data?.error || "Failed to fetch lock fee details";
                toast.error(errorMessage);
                navigate("/setup-admin/lock-fees");
            } finally {
                setLoading(false);
            }
        };

        fetchLockFeeDetail();
    }, [id, baseUrl, token, navigate]);

    const handleBack = () => {
        navigate(-1);
    };

    const handleEdit = () => {
        navigate(`/ops-console/admin/lock-fees/edit/${id}`);
    };

    if (loading) {
        return (
            <LockFeesDetailSkeleton />
        );
    }

    if (!lockFee) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="flex items-center justify-center h-screen">
                    <div className="text-lg text-gray-600">Lock Fee not found</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <button
                        onClick={handleBack}
                        className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <span>Lock Fees List</span>
                    <span>{">"}</span>
                    <span className="text-gray-900 font-medium">Lock Fee Details</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">LOCK FEE DETAILS</h1>
            </div>

            <div className="space-y-6">
                {/* Lock Fee Details Card */}
                <Card className="border-0 shadow-sm ring-1 ring-gray-200">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#C72030]/10 flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 2L10 6L14 6.5L11 9.5L11.5 14L8 12L4.5 14L5 9.5L2 6.5L6 6L8 2Z" fill="#C72030" />
                                    </svg>
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Lock Fee Information
                                </CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleEdit}
                                    variant="outline"
                                    size="icon"
                                >
                                    <Pencil size={18} className="text-[#C72030]" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Module */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Module</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.module || "-"}</p>
                            </div>

                            {/* Display Name */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Display Name</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.display_name || "-"}</p>
                            </div>

                            {/* Fee For */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Fee For</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.fee_for || "-"}</p>
                            </div>

                            {/* Fee For ID */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Fee For ID</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.fee_for_id || "-"}</p>
                            </div>

                            {/* CCA Sub Account */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">CCA Sub Account</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.cca_sub_account || "-"}</p>
                            </div>

                            {/* Maximum Amount */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Maximum Amount</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.maxx || "-"}</p>
                            </div>

                            {/* Start Date */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Start Date</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.start_date || "-"}</p>
                            </div>

                            {/* End Date */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">End Date</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.end_date || "-"}</p>
                            </div>

                            {/* Fee Type */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Fee Type</p>
                                <p className="text-base text-gray-900 font-semibold capitalize">{lockFee.fee_type || "-"}</p>
                            </div>

                            {/* Rate */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Rate</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.rate || "-"}</p>
                            </div>

                            {/* Active Status */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${lockFee.active ? "bg-green-500" : "bg-red-500"}`}
                                    ></div>
                                    <p className="text-base text-gray-900 font-semibold">
                                        {lockFee.active ? "Active" : "Inactive"}
                                    </p>
                                </div>
                            </div>

                            {/* Updated By */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Updated By</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.updated_by_name || lockFee.updated_by || "-"}</p>
                            </div>

                            {/* ID */}
                            <div className="border-b pb-4 md:border-b-0">
                                <p className="text-sm font-medium text-gray-600 mb-1">Lock Fee ID</p>
                                <p className="text-base text-gray-900 font-semibold">{lockFee.id || "-"}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LockFeesDetail;
