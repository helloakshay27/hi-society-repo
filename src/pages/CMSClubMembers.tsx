import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable'
import { Button } from '@/components/ui/button';
import { SelectionPanel } from '@/components/water-asset-details/PannelTab';
import { ColumnConfig } from '@/hooks/useEnhancedTable'
import { Switch } from '@mui/material';
import axios from 'axios';
import { Download, Edit, Plus, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const columns: ColumnConfig[] = [
  {
    key: 'tower',
    label: 'Tower',
    sortable: true,
    draggable: true,
  },
  {
    key: 'flat',
    label: 'Flat',
    sortable: true,
    draggable: true,
  },
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    draggable: true,
  },
  {
    key: 'age',
    label: 'Age',
    sortable: true,
    draggable: true,
  },
  {
    key: 'gender',
    label: 'Gender',
    sortable: true,
    draggable: true,
  },
  {
    key: 'mobile',
    label: 'Mobile',
    sortable: true,
    draggable: true,
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    draggable: true,
  },
  {
    key: 'relation_with_owner',
    label: 'Relation With Owner',
    sortable: true,
    draggable: true,
  },
  {
    key: 'resident_type',
    label: 'Resident Type',
    sortable: true,
    draggable: true,
  },
  {
    key: 'membership_number',
    label: 'Member Number',
    sortable: true,
    draggable: true,
  },
  {
    key: 'start_date',
    label: 'Start Date',
    sortable: true,
    draggable: true,
  },
  {
    key: 'end_date',
    label: 'End Date',
    sortable: true,
    draggable: true,
  },
  {
    key: 'membership_status',
    label: 'Membership Status',
    sortable: true,
    draggable: true,
  },
  {
    key: 'card_allocated',
    label: 'Card Allocated',
    sortable: true,
    draggable: true,
  },
  {
    key: 'access_card_id',
    label: 'Access Card',
    sortable: true,
    draggable: true,
  },
  {
    key: 'created_at',
    label: 'Created On',
    sortable: true,
    draggable: true,
  },
]

const CMSClubMembers = () => {
  const navigate = useNavigate();

  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [members, setMembers] = useState([]);
  const [showActionPanel, setShowActionPanel] = useState(false);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/club_members.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setMembers(response.data.club_members);
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    fetchMembers();
  }, [])

  const handleExport = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/export_club_member.xlsx`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "club_members.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
    }
  }

  const printSocietyQR = async () => {
    try {
      const response = await axios.get(`https://${baseUrl}/crm/admin/club_members/print_society_qr_code.pdf`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "society_qr_code.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error)
    }
  }

  const renderActions = (item: any) => {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="p-1"
          onClick={() => navigate(`edit/${item.id}`)}
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>
    )
  };

  const leftActions = (
    <Button
      onClick={() => setShowActionPanel(true)}
    >
      <Plus className="w-4 h-4" />
      Actions
    </Button>
  )

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "name":
        return item.first_name + " " + item.last_name || "-";
      case "tower":
        return item.tower.name || "-";
      case "flat":
        return item.flat.flat_no || "-";
      case "card_allocated":
        return (
          <Switch
            checked={item.card_allocated === true || item.card_allocated === 'true'}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: '#04A231',
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: '#04A231',
              },
              '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                color: '#C72030',
              },
              '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                backgroundColor: 'rgba(199, 32, 48, 0.5)',
              },
            }}
          />
        );
      case "created_at":
        return item.created_at ? item.created_at.split("T")[0] : "-";
      default:
        return item[columnKey] || "-";
    }
  }

  const actions = [
    {
      label: "Export",
      onClick: handleExport,
      icon: Download,
    },
    {
      label: "Society QR",
      onClick: printSocietyQR,
      icon: QrCode,
    }
  ]

  return (
    <div className='p-6'>
      {showActionPanel && (
        <SelectionPanel
          onAdd={() => navigate('add')}
          actions={actions}
          onClearSelection={() => setShowActionPanel(false)}
        />
      )}
      <EnhancedTable
        data={members}
        columns={columns}
        renderCell={renderCell}
        renderActions={renderActions}
        leftActions={leftActions}
      />
    </div>
  )
}

export default CMSClubMembers