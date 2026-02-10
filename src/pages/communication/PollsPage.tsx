import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Container,
  Paper,
  InputAdornment,
  Pagination,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import { Download } from "lucide-react";
import { toast } from 'sonner';


const PollsPage = () => {
  const baseUrl = localStorage.getItem('baseUrl')
  const token = localStorage.getItem('token')

  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPollId, setSelectedPollId] = useState<number | null>(null);
  const [polls, setPolls] = useState([])
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";

    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12;

    return `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://${baseUrl}/crm/admin/polls.json`,
          //   {
          //   headers: {
          //     'Authorization': `Bearer ${token}`
          //   }
          // }

          {
            params: {
              token,
              page: currentPage,
              per_page: 10,
            }
          },

        )

        setPolls(response.data.polls)
        setTotalPages(response.data.pagination.total_pages);

      } catch (error) {
        console.log(error)
      }
    }

    fetchData()
  }, [currentPage])

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, pollId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedPollId(pollId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPollId(null);
  };

  const filteredPolls = polls || [].filter(poll =>
    poll.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const PAGE_LIMIT = 2;

  const startPage = Math.floor((currentPage - 1) / PAGE_LIMIT) * PAGE_LIMIT + 1;
  const endPage = Math.min(startPage + PAGE_LIMIT - 1, totalPages);

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      if (currentPage > 4) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 3) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();


  const getVotePercentage = (votesCount: number, totalVotes: number) => {
    if (!totalVotes || totalVotes === 0) return "0%";

    return `${((votesCount / totalVotes) * 100).toFixed(1)}%`;
  };


  const getStatusColor = (status: string) => {
    if (!status) return "default";

    switch (status.toLowerCase()) {
      case "open":
        return "success";   // green
      case "close":
      case "closed":
        return "error";     // red
      default:
        return "default";
    }
  };


  // const handleDownload = async (pollId: number) => {
  //   try {
  //     const url = `https://${baseUrl}/${pollId}/export_poll_users.xlsx?token=${token}`;

  //     // open file download
  //     window.open(url, "_blank");

  //   } catch (error) {
  //     console.error("Download failed", error);
  //     toast.error("Failed to download file");
  //   }
  // };

  const handleDownload = (pollId: number) => {
    try {
      const url = `https://${baseUrl}/${pollId}/export_poll_users.xlsx?token=${token}`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    }
  };

  const handlePublishResults = async (pollId: number) => {
    try {
      await axios.put(
        `https://${baseUrl}/crm/admin/polls/${pollId}/publish.json`,
        {},
        { params: { token } }
      );

      // update UI instantly
      setPolls((prev: any[]) =>
        prev.map((p) =>
          p.id === pollId ? { ...p, publish_results: true } : p
        )
      );

      toast.success("Results published");
    } catch (error) {
      console.error("Publish failed:", error);
      toast.error("Failed to publish results");
    }
  };



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
            Polls
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your polls and surveys
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => navigate('/communication/polls/add')}
          sx={{
            bgcolor: '#C72030',
            '&:hover': { bgcolor: '#B01E2A' },
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            borderRadius: 2
          }}
        >
          Add Poll
        </Button>
      </Box>

      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            All Polls
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              placeholder="Search polls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 280 }}
            />
            <Button
              variant="outlined"
              startIcon={<Filter size={18} />}
              sx={{ textTransform: 'none' }}
            >
              Filter
            </Button>
          </Stack>
        </Box>

        {/* Polls Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {filteredPolls.map((poll) => (
            <Card
              key={poll.id}
              elevation={2}
              sx={{
                height: '100%',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Poll Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1.5 }}>
                      {poll.subject}
                    </Typography>

                    <Stack spacing={1}>
                      <Typography variant="body2" color="text.secondary" className='flex items-center'>
                        <Calendar size={14} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                        Created On: {formatDateTime(poll.created_at)}

                      </Typography>
                      <Typography variant="body2" color="text.secondary" className='flex items-center'>
                        <Clock size={14} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                        Start Date: {formatDateTime(poll.start)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className='flex items-center'>
                        <Clock size={14} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                        End Date: {formatDateTime(poll.end)}
                      </Typography>


                      <Typography variant="body2" color="text.secondary" className='flex items-center'>
                        <Users size={14} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                        Shared with: <strong>{poll.shared}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" className='flex items-center'>
                        <Users size={14} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
                        Total Votes: <strong>{poll.total_votes}</strong>
                      </Typography>

                      <Typography variant="body2" color="text.secondary" className="flex items-center">
                        Publish Status:
                        {/* <Button
                          size="small"
                          variant="contained"
                          sx={{
                            ml: 1,
                            height: 24,
                            fontSize: 12,
                            textTransform: "none",
                            bgcolor: "#1976d2",        // blue
                            "&:hover": {
                              bgcolor: "#115293",      // dark blue
                            },
                          }}
                        >
                          {poll.publish ? "Publish" : "Published"}
                        </Button> */}

                        <Button
                          size="small"
                          variant="contained"
                          // disabled={poll.publish_results}
                          // onClick={() => handlePublishResults(poll.id)}

                          onClick={() => {
                            if (!poll.publish_results) {
                              handlePublishResults(poll.id);
                            }
                          }}
                          sx={{
                            ml: 1,
                            height: 24,
                            fontSize: 12,
                            textTransform: "none",
                            bgcolor: poll.publish_results ? "#9e9e9e" : "#1976d2",
                            "&:hover": {
                              bgcolor: poll.publish_results ? "#9e9e9e" : "#115293",
                            },
                          }}
                        >
                          {poll.publish_results ? "Published" : "Publish"}
                        </Button>

                      </Typography>


                      {/* <Typography variant="body2" color="text.secondary">
                        Shared with: <strong>{poll.shared}</strong>
                      </Typography> */}
                      {poll.publishResults && (
                        <Typography variant="body2" color="text.secondary">
                          Results: <strong>{poll.publishResults}</strong>
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Stack direction="column" alignItems="flex-end" spacing={1}>
                    {/* <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, poll.id)}
                      sx={{ ml: 1 }}
                    >
                      <MoreHorizontal size={18} />
                    </IconButton> */}

                    <IconButton
                      size="small"
                      onClick={() => handleDownload(poll.id)}
                      sx={{
                        color: "#000",
                        "&:hover": { bgcolor: "rgba(25,118,210,0.08)" }
                      }}
                    >
                      <Download size={20} />
                    </IconButton>

                    <Chip
                      label={poll.status}
                      // color={getStatusColor(poll.status) as any}
                      color={getStatusColor(poll.status) as any}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        textTransform: 'capitalize'
                      }}
                    />
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Poll Options */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Poll Options & Results
                  </Typography>

                  {poll.poll_options.length > 0 ? (
                    <List dense sx={{ p: 0 }}>
                      {poll.poll_options.map((option, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            px: 0,
                            py: 0.5,
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <ListItemText
                            primary={option.name}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.primary'
                            }}
                          />
                          <Chip
                            // label={
                            //   poll.total_votes > 0
                            //     ? `${((option.vote_count / poll.total_votes) * 100).toFixed(1)}%`
                            //     : "0%"
                            // }

                            // label={getVotePercentage(option.votes_count, poll.total_votes)}

                            label={
                              poll.publish_results
                                ? getVotePercentage(option.votes_count, poll.total_votes)
                                : "0%"
                            }

                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 50, textAlign: "center" }}
                          />

                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        No options available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-3 mt-10">

            <div className="flex items-center gap-2">

              {/* Left */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 text-gray-600 disabled:text-gray-300"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Numbers */}
              {pages.map((page, index) =>
                page === "..." ? (
                  <span key={index} className="px-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(Number(page))}
                    className={`min-w-[34px] h-[34px] text-sm rounded 
              ${currentPage === page
                        ? "bg-[#C72030] text-white"
                        : "text-gray-800 hover:text-[#C72030]"
                      }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Right */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 text-gray-600 disabled:text-gray-300"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Info text */}
            <div className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages}
            </div>
          </div>
        )}


        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { borderRadius: 2, minWidth: 160 }
          }}
        >
          <MenuItem onClick={handleMenuClose}>
            <Eye size={16} style={{ marginRight: 12 }} />
            View Results
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <Edit size={16} style={{ marginRight: 12 }} />
            Edit Poll
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <Trash2 size={16} style={{ marginRight: 12 }} />
            Delete
          </MenuItem>
        </Menu>
      </Paper>
    </Container>
  );
};

export default PollsPage;
