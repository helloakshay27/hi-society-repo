import { EnhancedTable } from '@/components/enhanced-table/EnhancedTable'
import { Button } from '@/components/ui/button';
import { SelectionPanel } from '@/components/water-asset-details/PannelTab';
import { ColumnConfig } from '@/hooks/useEnhancedTable'
import { Switch } from '@mui/material';
import axios from 'axios';
import { Download, Edit, Eye, Plus, QrCode, Users } from 'lucide-react';
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
    key: 'members',
    label: 'Members',
    sortable: true,
    draggable: true,
  },
  {
    key: 'member_names',
    label: 'Member Names',
    sortable: true,
    draggable: true,
  },
  {
    key: 'emails',
    label: 'Emails',
    sortable: true,
    draggable: true,
  },
  {
    key: 'mobiles',
    label: 'Mobiles',
    sortable: true,
    draggable: true,
  },
  {
    key: 'membership_plan',
    label: 'Membership Plan',
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
    key: 'status',
    label: 'Status',
    sortable: true,
    draggable: true,
  },
  {
    key: 'created_on',
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
  const [isLoading, setIsLoading] = useState(false)
  const [modalData, setModalData] = useState<{ isOpen: boolean, title: string, items: string[] }>({ isOpen: false, title: '', items: [] });

  const fetchMembers = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`https://${baseUrl}/club_member_allocations.json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setMembers(response.data.club_member_allocations);
    } catch (error) {
      console.log(error)
    } finally {
      setIsLoading(false)
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
          onClick={() => navigate(`view/${item.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
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
      case "flat":
        return item?.flat?.flat_no || "-";
      case "tower":
        return item?.tower?.name || "-";
      case 'members':
        return (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C72030]" />
            <span className="font-medium">{item.club_members?.length || 0}</span>
          </div>
        );

      case "member_names":
        const names = item.club_members?.map(m => m.first_name + " " + m.last_name).filter(Boolean);
        if (!names || names.length === 0) return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {names.slice(0, 2).map((name, idx) => (
              <span key={idx} className="text-sm">{name}</span>
            ))}
            {names.length > 2 && (
              <span
                className="text-xs text-blue-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: 'Member Names',
                    items: names
                  });
                }}
              >
                +{names.length - 2} more
              </span>
            )}
          </div>
        );

      case "emails":
        const emails = item.club_members?.map(m => m.email).filter(Boolean);
        if (!emails || emails.length === 0) return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {emails.slice(0, 2).map((email, idx) => (
              <span key={idx} className="text-sm">{email}</span>
            ))}
            {emails.length > 2 && (
              <span
                className="text-xs text-blue-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: 'Member Emails',
                    items: emails
                  });
                }}
              >
                +{emails.length - 2} more
              </span>
            )}
          </div>
        );

      case "mobiles":
        const mobiles = item.club_members?.map(m => m.mobile).filter(Boolean);
        if (!mobiles || mobiles.length === 0) return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-col gap-1">
            {mobiles.slice(0, 2).map((mobile, idx) => (
              <span key={idx} className="text-sm">{mobile}</span>
            ))}
            {mobiles.length > 2 && (
              <span
                className="text-xs text-blue-600 cursor-pointer hover:underline"
                onClick={() => {
                  setModalData({
                    isOpen: true,
                    title: 'Member Mobiles',
                    items: mobiles
                  });
                }}
              >
                +{mobiles.length - 2} more
              </span>
            )}
          </div>
        );

      case "membership_plan":
        return item?.membership_plan?.name || "-";

      case "start_date":
        if (!item?.start_date) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.start_date))

      case "end_date":
        if (!item?.end_date) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.end_date))

      case "created_on":
        if (!item?.created_at) return "-";
        return new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(item.created_at))

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
        loading={isLoading}
      />
    </div>
  )
}

export default CMSClubMembers