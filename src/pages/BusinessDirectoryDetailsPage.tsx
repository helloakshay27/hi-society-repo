import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image as ImageIcon, MapPin, Phone, Mail, Globe, Building2, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface BusinessDirectoryDetails {
    id: string;
    company_name: string;
    contact_name: string;
    mobile: string;
    landline_1: string;
    landline_2: string;
    extension: string;
    primary_email: string;
    secondary_email: string;
    website: string;
    category: string;
    sub_category: string;
    category_id?: number;
    sub_category_id?: number;
    key_offering: string;
    description: string;
    profile: string;
    address: string;
    active: boolean;
    documents?: any[];
    image?: string;
}

const BusinessDirectoryDetailsPage: React.FC = () => {
    const baseUrl = localStorage.getItem("baseUrl");
    const token = localStorage.getItem("token");
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [data, setData] = useState<BusinessDirectoryDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `https://${baseUrl}/crm/admin/business_directories/${id}.json`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const directoryData = response.data.business_directory || response.data;
                setData(directoryData);
            } catch (error) {
                console.error(error);
                toast.error("Failed to fetch business details");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id, baseUrl, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <Card className="border-0 shadow-sm ring-1 ring-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="space-y-8">
                                <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                    <div className="space-y-4">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50/50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Business Not Found
                    </h2>
                    <Button
                        variant="link"
                        onClick={() => navigate(-1)}
                        className="mt-2 text-[#C72030]"
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="h-9 w-9 rounded-full bg-white border-gray-200 hover:bg-gray-100 hover:text-gray-900 shadow-sm"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                                Business Details
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                View complete information about {data.company_name}
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant={data.active ? "default" : "secondary"}
                        className={
                            data.active
                                ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }
                    >
                        {data.active ? "Active" : "Inactive"}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info Card */}
                    <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-gray-200 bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-[#C72030]/10 flex items-center justify-center">
                                    <Building2 className="h-4 w-4 text-[#C72030]" />
                                </div>
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Company Information
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Company Name</span>
                                    <p className="text-base font-semibold text-gray-900">{data.company_name}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Contact Person</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span>{data.contact_name || "-"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Primary Email</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${data.primary_email}`} className="hover:text-[#C72030] hover:underline">
                                            {data.primary_email}
                                        </a>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Secondary Email</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        {data.secondary_email ? (
                                            <a href={`mailto:${data.secondary_email}`} className="hover:text-[#C72030] hover:underline">
                                                {data.secondary_email}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Mobile</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span>+91 {data.mobile}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Landlines</span>
                                    <div className="flex flex-col gap-1 text-gray-900">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            <span>{data.landline_1 || "-"}</span>
                                        </div>
                                        {data.landline_2 && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                <span>{data.landline_2}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Website</span>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Globe className="h-4 w-4 text-gray-400" />
                                        {data.website ? (
                                            <a
                                                href={data.website.startsWith("http") ? data.website : `https://${data.website}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:text-[#C72030] hover:underline"
                                            >
                                                {data.website}
                                            </a>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm font-medium text-gray-500">Category / Sub-category</span>
                                    <p className="text-sm text-gray-900">
                                        <Badge variant="outline" className="mr-2">{data.category || "-"}</Badge>
                                        {data.sub_category && <Badge variant="outline" className="bg-gray-50">{data.sub_category}</Badge>}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <MapPin className="h-4 w-4" /> Address
                                </span>
                                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {data.address || "-"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <FileText className="h-4 w-4" /> Description
                                </span>
                                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {data.description || "-"}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <FileText className="h-4 w-4" /> Profile
                                </span>
                                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {data.profile || "-"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <FileText className="h-4 w-4" /> Key Offerings
                                </span>
                                <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {data.key_offering || "-"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar - Logo & Gallery */}
                    <div className="space-y-6">
                        <Card className="border-0 shadow-sm ring-1 ring-gray-200 bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                                <CardTitle className="text-base font-semibold text-gray-900">Company Logo</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 flex justify-center">
                                <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-50 flex items-center justify-center">
                                    {data.image ? (
                                        <img
                                            src={data.image}
                                            alt="Company Logo"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageIcon className="h-16 w-16 text-gray-300" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm ring-1 ring-gray-200 bg-white overflow-hidden">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                                <CardTitle className="text-base font-semibold text-gray-900">Gallery</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                {data.documents && data.documents.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {data.documents.map((doc, idx) => (
                                            <div key={idx} className="aspect-square rounded-md overflow-hidden border border-gray-100 bg-gray-50">
                                                <img src={doc.url} alt={`Gallery ${idx}`} className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6">
                                        <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">No gallery images</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessDirectoryDetailsPage;
