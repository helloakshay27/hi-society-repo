import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Banknote, CalendarDays, Edit } from 'lucide-react';
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

export const PaymentPlanDetails = () => {
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
    return <div className="p-10 text-gray-600">Loading payment plan details...</div>;
  }

  if (!plan) {
    return <div className="p-10 text-gray-600">Payment plan not found</div>;
  }

  const totalPercentage = calculateTotalPercentage();

  return (
    <div className="p-[30px] min-h-screen bg-transparent">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 cursor-pointer">
        <button
          onClick={() => navigate('/settings/payment-plan/setup')}
          className="flex items-center gap-1 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
          Payment Plan Details
        </h1>
        {/* <Button
          className="bg-[#C72030] text-white hover:bg-[#C72030]/90"
          onClick={() => navigate(`/settings/payment-plan/edit/${id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Plan
        </Button> */}
      </div>

      {/* Plan Information */}
      <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden">
        <div className="px-6 pt-[22px]">
          <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: '#F5F4F0' }}
            >
              <Banknote size={14} color="#1A1A18" />
            </span>
            PLAN INFORMATION
          </h2>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-3">
          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-gray-500 min-w-[140px]">Plan Name</span>
              <span className="text-gray-500 mx-2">:</span>
              <span className="text-gray-900 font-medium">{plan.name}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-gray-500 min-w-[140px]">Frequency</span>
              <span className="text-gray-500 mx-2">:</span>
              <span className="text-gray-900 font-medium capitalize">
                {plan.frequency}
              </span>
            </div>
          </div>

          {/* <div className="space-y-4">
            <div className="flex items-start">
              <span className="text-gray-500 min-w-[140px]">Duration</span>
              <span className="text-gray-500 mx-2">:</span>
              <span className="text-gray-900 font-medium">
                {plan.duration_in_months} Months
              </span>
            </div>
          </div> */}
          </div>
        </div>
      </div>

      {/* Payment Schedule */}
      <div className="bg-white rounded-2xl border border-[rgba(26,26,24,.09)] overflow-hidden mt-6">
        <div className="px-6 pt-[22px] flex items-center justify-between">
          <h2 className="text-sm font-semibold leading-[1.4] text-[#1A1A18] flex items-center">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              style={{ backgroundColor: '#F5F4F0' }}
            >
              <CalendarDays size={14} color="#1A1A18" />
            </span>
            PAYMENT SCHEDULE
          </h2>
          <div className="text-sm">
            Total:{' '}
            <span
              className={`font-bold text-lg ${
                totalPercentage === 100 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalPercentage.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#E5E0D3]">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Sr No.
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                  Month Number
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody>
              {plan.payment_plan_schedules.map((schedule, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    Month {schedule.month_number}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-right font-medium">
                    {parseFloat(schedule.percentage).toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold">
                <td
                  colSpan={2}
                  className="border border-gray-300 px-4 py-3 text-right"
                >
                  Total
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right">
                  <span
                    className={
                      totalPercentage === 100 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {totalPercentage.toFixed(2)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPlanDetails;
