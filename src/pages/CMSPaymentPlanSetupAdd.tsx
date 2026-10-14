import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronRight, CreditCard, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { TextField, MenuItem } from '@mui/material';

interface PaymentSchedule {
    month_number: number;
    percentage: string;
}

const FREQUENCY_OPTIONS = [
    { value: 'monthly', label: 'Monthly', months: 12 },
    { value: 'quarterly', label: 'Quarterly', months: 3 },
    { value: 'half_yearly', label: 'Half Yearly', months: 2 },
    { value: 'yearly', label: 'Yearly', months: 1 },
];

const CMSPaymentPlanSetupAdd = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [planName, setPlanName] = useState('');
    const [frequency, setFrequency] = useState('');
    const [durationInMonths, setDurationInMonths] = useState(12);
    const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
    const [loading, setLoading] = useState(false);

    const baseUrl = localStorage.getItem('baseUrl');
    const token = localStorage.getItem('token');

    // Fetch existing plan data if in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            fetchPlanDetails();
        }
    }, [id, isEditMode]);

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

            const plan = response.data.plans.find((p: any) => p.id === parseInt(id!));
            if (plan) {
                setPlanName(plan.name);
                setFrequency(plan.frequency);
                setDurationInMonths(plan.duration_in_months);
                setSchedules(
                    plan.payment_plan_schedules.map((s: any) => ({
                        month_number: s.month_number,
                        percentage: s.percentage?.toString() ?? '',
                    }))
                );
            }
        } catch (error) {
            console.error('Error fetching plan details:', error);
            toast.error('Failed to fetch plan details');
        } finally {
            setLoading(false);
        }
    };

    // Generate schedules based on frequency
    const handleFrequencyChange = (selectedFrequency: string) => {
        setFrequency(selectedFrequency);
        const frequencyOption = FREQUENCY_OPTIONS.find(
            (opt) => opt.value === selectedFrequency
        );

        if (frequencyOption) {
            const monthsCount = frequencyOption.months;
            const newSchedules: PaymentSchedule[] = [];

            // Generate schedules starting from month 1
            for (let i = 1; i <= monthsCount; i++) {
                newSchedules.push({
                    month_number: i,
                    percentage: '',
                });
            }

            setSchedules(newSchedules);
        }
    };

    const handlePercentageChange = (index: number, value: string) => {
        // Prevent values above 100
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 100) {
            return;
        }
        const updatedSchedules = [...schedules];
        updatedSchedules[index].percentage = value;
        setSchedules(updatedSchedules);
    };

    const calculateTotalPercentage = () => {
        return schedules.reduce((sum, schedule) => {
            const num = parseFloat(schedule.percentage);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
    };

    const handleSubmit = async () => {
        // Validation
        if (!planName.trim()) {
            toast.error('Please enter a plan name');
            return;
        }

        if (!frequency) {
            toast.error('Please select a frequency');
            return;
        }

        const totalPercentage = calculateTotalPercentage();
        if (totalPercentage !== 100) {
            toast.error(`Total percentage must be 100%. Current total: ${totalPercentage}%`);
            return;
        }

        setLoading(true);
        const loadingToast = toast.loading(
            isEditMode ? 'Updating payment plan...' : 'Creating payment plan...'
        );

        try {
            const payload = {
                payment_plan: {
                    name: planName,
                    frequency: frequency,
                    duration_in_months: durationInMonths,
                    payment_plan_schedules_attributes: schedules.map((schedule) => ({
                        month_number: schedule.month_number,
                        percentage: parseFloat(schedule.percentage) || 0,
                    })),
                },
            };

            if (isEditMode) {
                await axios.put(
                    `https://${baseUrl}/payment_plans/${id}.json`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                toast.success('Payment plan updated successfully', { id: loadingToast });
            } else {
                await axios.post(
                    `https://${baseUrl}/payment_plans.json`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                toast.success('Payment plan created successfully', { id: loadingToast });
            }

            navigate(-1);
        } catch (error) {
            console.error('Error saving payment plan:', error);
            toast.error('Failed to save payment plan', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const totalPercentage = calculateTotalPercentage();

    const totalTone =
        totalPercentage === 100 ? 'is-success' : totalPercentage > 100 ? 'is-danger' : 'is-warning';

    return (
        <div className="p-6 min-h-screen cms-payment-plan-setup-add-page">
            <style>{`
                html body #root .cms-payment-plan-setup-add-page {
                    background-color: #FDFDFB !important;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-card {
                    background: #FFFFFF;
                    border: 1px solid rgba(26, 26, 24, 0.09);
                    border-radius: 16px;
                    overflow: hidden;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-card + .ref-card {
                    margin-top: 16px;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-card-head {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 22px 24px 0;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-card-head h2 {
                    flex: 1;
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #1A1A18;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-chip {
                    width: 32px;
                    height: 32px;
                    flex: none;
                    border-radius: 9999px;
                    background: #F5F4F0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-chip svg {
                    width: 14px;
                    height: 14px;
                    color: #1A1A18 !important;
                    stroke: #1A1A18 !important;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-card-body {
                    padding: 20px 24px 22px;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-pill.is-success {
                    background: rgba(121, 140, 94, 0.18);
                    color: #56683F;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-pill.is-danger {
                    background: rgba(231, 132, 142, 0.18);
                    color: #A63D49;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-pill.is-warning {
                    background: rgba(237, 196, 136, 0.3);
                    color: #85621F;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    border: 1px solid rgba(26, 26, 24, 0.09);
                    border-radius: 12px;
                    overflow: hidden;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-table th {
                    background: #F5F4F0 !important;
                    color: rgba(26, 26, 24, 0.68) !important;
                    font-size: 12px;
                    font-weight: 600;
                    text-align: left;
                    padding: 10px 16px;
                    border-bottom: 1px solid rgba(26, 26, 24, 0.09);
                }
                html body #root .cms-payment-plan-setup-add-page .ref-table td {
                    padding: 8px 16px;
                    font-size: 13.5px;
                    font-weight: 500;
                    color: #1A1A18;
                    border-bottom: 1px solid rgba(26, 26, 24, 0.06);
                    background: #FFFFFF;
                }
                html body #root .cms-payment-plan-setup-add-page .ref-table tr:last-child td {
                    border-bottom: none;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiOutlinedInput-root {
                    min-height: 44px;
                    border-radius: 12px !important;
                    background-color: #FFFFFF !important;
                    font-size: 13.5px !important;
                    font-weight: 500;
                    color: #1A1A18;
                    transition: box-shadow 0.16s ease;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiOutlinedInput-notchedOutline {
                    border-color: rgba(26, 26, 24, 0.08) !important;
                    border-radius: 12px !important;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiOutlinedInput-root:not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
                    border-color: rgba(26, 26, 24, 0.28) !important;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
                    border-color: #1A1A18 !important;
                    border-width: 1px !important;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiOutlinedInput-root.Mui-focused {
                    box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiInputLabel-root {
                    color: rgba(26, 26, 24, 0.68) !important;
                    -webkit-text-fill-color: rgba(26, 26, 24, 0.68) !important;
                    font-weight: 600 !important;
                }
                html body #root .cms-payment-plan-setup-add-page .MuiFormLabel-asterisk {
                    color: #ef4444 !important;
                    -webkit-text-fill-color: #ef4444 !important;
                }
                html body #root .cms-payment-plan-setup-add-page input::placeholder {
                    color: rgba(26, 26, 24, 0.3) !important;
                    opacity: 1;
                }
            `}</style>

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[#1A1A18] hover:bg-[#F5F4F0] transition-colors"
                        aria-label="Back"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[13px] text-[rgba(26,26,24,0.55)]">Payment Plan Setup</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[rgba(26,26,24,0.4)]" />
                    <span className="text-[13px] font-semibold text-[#1A1A18]">
                        {isEditMode ? 'Edit Payment Plan' : 'Add Payment Plan'}
                    </span>
                </div>
                <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em] text-[#1A1A18]">
                    {isEditMode ? 'Edit Payment Plan' : 'New Payment Plan'}
                </h1>
            </div>

            {/* Plan Details */}
            <div className="ref-card">
                <div className="ref-card-head">
                    <span className="ref-chip">
                        <CreditCard />
                    </span>
                    <h2>Plan Details</h2>
                </div>
                <div className="ref-card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                        label="Plan Name"
                        placeholder="Enter plan name"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                        disabled={loading}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <TextField
                        label="Frequency"
                        select
                        value={frequency}
                        onChange={(e) => handleFrequencyChange(e.target.value)}
                        fullWidth
                        required
                        variant="outlined"
                        disabled={loading}
                        slotProps={{ inputLabel: { shrink: true } }}
                        SelectProps={{
                            displayEmpty: true,
                            renderValue: (selected) =>
                                selected
                                    ? FREQUENCY_OPTIONS.find((opt) => opt.value === selected)?.label
                                    : <span style={{ color: 'rgba(26,26,24,0.3)' }}>Select frequency</span>,
                        }}
                    >
                        <MenuItem value="">
                            <span style={{ color: 'rgba(26,26,24,0.3)' }}>Select frequency</span>
                        </MenuItem>
                        {FREQUENCY_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </div>
            </div>

            {/* Payment Schedule */}
            {schedules.length > 0 && (
                <div className="ref-card">
                    <div className="ref-card-head">
                        <span className="ref-chip">
                            <CalendarDays />
                        </span>
                        <h2>Payment Schedule</h2>
                        <span className={`ref-pill ${totalTone}`}>
                            Total {totalPercentage.toFixed(2)}%
                        </span>
                    </div>
                    <div className="ref-card-body">
                        {totalPercentage !== 100 && (
                            <p className="mb-3 text-[12px] text-[rgba(26,26,24,0.55)]">
                                Percentages must add up to 100%.
                            </p>
                        )}
                        <div className="overflow-x-auto">
                            <table className="ref-table">
                                <thead>
                                    <tr>
                                        <th className="w-1/3">Month</th>
                                        <th>Percentage (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {schedules.map((schedule, index) => (
                                        <tr key={index}>
                                            <td>Month {schedule.month_number}</td>
                                            <td>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    placeholder="0"
                                                    value={schedule.percentage}
                                                    onChange={(e) => handlePercentageChange(index, e.target.value)}
                                                    inputProps={{ min: 0, max: 100, step: 0.01 }}
                                                    disabled={loading}
                                                    variant="outlined"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/settings/payment-plan/setup')}
                    disabled={loading}
                    className="btn-cancel h-9 px-4 text-sm font-medium bg-white border border-[#da7756] text-[#da7756] hover:bg-gray-100"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    className="btn-primary h-9 px-4 text-sm font-medium disabled:opacity-60"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {isEditMode ? 'Update Plan' : 'Create Plan'}
                </Button>
            </div>
        </div>
    );
};

export default CMSPaymentPlanSetupAdd;
