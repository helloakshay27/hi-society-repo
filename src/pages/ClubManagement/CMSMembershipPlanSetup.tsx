import { useState } from "react"
import { EnhancedTable } from "@/components/enhanced-table/EnhancedTable"
import { Button } from "@/components/ui/button"
import { ColumnConfig } from "@/hooks/useEnhancedTable"
import { Edit, Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogContentText,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@mui/material"
import axios from "axios"
import { toast } from "sonner"

const columns: ColumnConfig[] = [
    {
        key: 'id',
        label: 'ID',
        sortable: true,
        draggable: true
    },
    {
        key: 'name',
        label: 'Plan Name',
        sortable: true,
        draggable: true
    },
    {
        key: 'price',
        label: 'Price',
        sortable: true,
        draggable: true
    },
    {
        key: 'type',
        label: 'Membership Type',
        sortable: true,
        draggable: true
    },
]

const MEMBERSHIP_TYPE_OPTIONS = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'half-yearly', label: 'Half Yearly' },
    { value: 'yearly', label: 'Yearly' },
];

const fieldStyles = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: '#ddd',
        },
        // '&:hover fieldset': {
        //     borderColor: '#C72030',
        // },
        '&.Mui-focused fieldset': {
            borderColor: '#C72030',
        },
    },
    '& .MuiInputLabel-root': {
        '&.Mui-focused': {
            color: '#C72030',
        },
    },
};

const CMSMembershipPlanSetup = () => {
    const baseUrl = localStorage.getItem("baseUrl")
    const token = localStorage.getItem("token")

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        type: ''
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleClose = () => {
        setOpen(false);
        setFormData({ name: '', price: '', type: '' });
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.type) {
            toast.error("Please fill all the fields")
            return
        }
        const payload = {
            membership_plan: {
                name: formData.name,
                price: formData.price,
                renewal_terms: formData.type
            }
        }

        try {
            await axios.post(`https://${baseUrl}/membership_plans.json`, payload, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            toast.success("Membership plan created successfully")
            handleClose();
        } catch (error) {
            console.log(error)
        }
    };

    const renderActions = (item: any) => (
        <Button
            variant="ghost"
            size="sm"
        >
            <Edit className="w-4 h-4" />
        </Button>
    )

    const leftActions = (
        <Button
            size="sm"
            className="bg-[#C72030] hover:bg-[#C72030]/90 text-white px-4 py-2 rounded-md flex items-center gap-2 border-0"
            onClick={() => setOpen(true)}
        >
            <Plus className="w-4 h-4" />
            Add
        </Button>
    )

    return (
        <div className="p-6">
            <EnhancedTable
                data={[]}
                columns={columns}
                renderActions={renderActions}
                leftActions={leftActions}
            />

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ fontWeight: 600 }}>Add Membership Plan</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Create a new membership plan here. Click save when you're done.
                    </DialogContentText>
                    <div className="flex flex-col gap-4">
                        <TextField
                            label="Plan Name"
                            fullWidth
                            size="small"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            sx={fieldStyles}
                        />
                        <TextField
                            label="Price"
                            fullWidth
                            size="small"
                            type="number"
                            value={formData.price}
                            onChange={(e) => handleInputChange('price', e.target.value)}
                            sx={fieldStyles}
                        />
                        <FormControl fullWidth size="small" sx={fieldStyles}>
                            <InputLabel id="plan-type-label">Membership Type</InputLabel>
                            <Select
                                labelId="plan-type-label"
                                label="Membership Type"
                                value={formData.type}
                                onChange={(e) => handleInputChange('type', e.target.value)}
                            >
                                {MEMBERSHIP_TYPE_OPTIONS.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </div>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button variant="outline" onClick={handleClose} className="border-gray-200 text-gray-700">Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-[#C72030] hover:bg-[#C72030]/90 text-white">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}

export default CMSMembershipPlanSetup