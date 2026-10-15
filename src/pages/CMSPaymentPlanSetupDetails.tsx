import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface PaymentPlanSchedule {
    month_number: number;
    percentage: string;
}

interface PaymentPlan {
    id?: number;
    name: string;
    frequency: string;
    duration_in_months: number;
    payment_plan_schedules: PaymentPlanSchedule[];
}

const CMSPaymentPlanSetupDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [plan, setPlan] = useState<PaymentPlan | null>(null);
    const [loading, setLoading] = useState(false);

    const baseUrl = localStorage.getItem('baseUrl');
    const token = localStorage.getItem('token');

    const fetchPlanDetails = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `https://${baseUrl}/payment_plans/${id}.json`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data) {
                setPlan(response.data);
            } else {
                toast.error('Payment plan not found');
                navigate('/settings/payment-plan/setup');
            }
        } catch (error) {
            console.error('Error fetching plan details:', error);
            toast.error('Failed to fetch plan details');
            navigate('/settings/payment-plan/setup');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPlanDetails();
        }
    }, [id]);

    const calculateTotalPercentage = () => {
        if (!plan?.payment_plan_schedules) return 0;
        return plan.payment_plan_schedules.reduce(
            (sum, schedule) => sum + parseFloat(schedule.percentage),
            0
        );
    };

    if (loading) {
        return (
            <div className="bg-gray-50 h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment plan details...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return <div className="p-10 text-gray-600">Payment plan not found</div>;
    }

    const totalPercentage = calculateTotalPercentage();

    const totalClass = totalPercentage === 100 ? 'text-[#0E7F3F]' : 'text-[#A32126]';

    return (
        <div className="p-6 min-h-screen bg-[#FDFDFB]">
            {/* Back link + title */}
            <div className="mb-[22px]">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[rgba(26,26,24,0.48)] hover:text-[#1A1A18] transition-colors"
                >
                    <ArrowLeft className="w-[18px] h-[18px]" />
                    Back to Payment Plans
                </button>
                <h1 className="mt-[14px] text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                    Payment Plan Details
                </h1>
                {/* <Button
          className="bg-[#C72030] hover:bg-[#A01020] text-white"
          onClick={() => navigate(`/settings/payment-plan/edit/${id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Plan
        </Button> */}
            </div>

            {/* Plan Information */}
            <div className="bg-white rounded-2xl border border-[rgba(26,26,24,0.09)] px-6 py-[22px]">
                <div className="flex items-center gap-3 mb-4">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F4F0] text-[#1A1A18]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="w-[14px] h-[14px]"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                            />
                        </svg>
                    </span>
                    <h3 className="text-[14px] leading-[1.4] font-semibold text-[#1A1A18]">
                        Plan Information
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-[18px]">
                    <div>
                        <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-1">Plan Name</div>
                        <div className="text-[13.5px] font-medium text-[#1A1A18]">{plan.name}</div>
                    </div>

                    <div>
                        <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-1">Frequency</div>
                        <div className="text-[13.5px] font-medium text-[#1A1A18] capitalize">{plan.frequency}</div>
                    </div>

                    {/* <div>
            <div className="text-[11px] font-medium text-[rgba(26,26,24,0.48)] mb-1">Duration</div>
            <div className="text-[13.5px] font-medium text-[#1A1A18]">{plan.duration_in_months} Months</div>
          </div> */}
                </div>
            </div>

            {/* Payment Schedule */}
            <div className="bg-white rounded-2xl border border-[rgba(26,26,24,0.09)] px-6 py-[22px] mt-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F5F4F0] text-[#1A1A18]">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className="w-[14px] h-[14px]"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                                />
                            </svg>
                        </span>
                        <h3 className="text-[14px] leading-[1.4] font-semibold text-[#1A1A18]">
                            Payment Schedule
                        </h3>
                    </div>
                    <div className="text-[12px] font-semibold text-[rgba(26,26,24,0.68)]">
                        Total:{' '}
                        <span className={`text-[13.5px] ${totalClass}`}>
                            {totalPercentage.toFixed(2)}%
                        </span>
                    </div>
                </div>

                <div className="rounded-xl border border-[rgba(26,26,24,0.09)] overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Sr No.</th>
                                <th className="text-left">Month Number</th>
                                <th className="text-right">Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plan.payment_plan_schedules.map((schedule, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>Month {schedule.month_number}</td>
                                    <td className="text-right">
                                        {parseFloat(schedule.percentage).toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-[#F5F4F0]">
                                <td colSpan={2} className="px-4 py-3 text-right text-[12.5px] font-semibold text-[#1A1A18]">
                                    Total
                                </td>
                                <td className={`px-4 py-3 text-right text-[12.5px] font-semibold ${totalClass}`}>
                                    {totalPercentage.toFixed(2)}%
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CMSPaymentPlanSetupDetails;
