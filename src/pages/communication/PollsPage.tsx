
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  Clock,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack
} from "@mui/material";
import { Button } from '@/components/ui/button';

/* ================= TYPES ================= */

interface PollOption {
  name: string;
  vote_count: number;
}

interface Poll {
  id: number;
  title: string;
  status: "Active" | "Closed" | "Draft";
  showcreated: string;
  showstart: string;
  showend: string;
  sharedWith: string;
  publishResults?: string;
  total_votes: number;
  poll_options: PollOption[];
}

const dummyPolls: Poll[] = [
  {
    id: 1,
    title: "Which sports facility should be upgraded next?",
    status: "Active",
    showcreated: "10 Jan 2026",
    showstart: "12 Jan 2026, 10:00 AM",
    showend: "18 Jan 2026, 6:00 PM",
    sharedWith: "All Members",
    publishResults: "After Poll Ends",
    total_votes: 120,
    poll_options: [
      { name: "Swimming Pool", vote_count: 45 },
      { name: "Tennis Court", vote_count: 35 },
      { name: "Gym Equipment", vote_count: 40 },
    ],
  },
  {
    id: 2,
    title: "Preferred timing for Yoga classes?",
    status: "Closed",
    showcreated: "01 Jan 2026",
    showstart: "03 Jan 2026, 7:00 AM",
    showend: "05 Jan 2026, 9:00 PM",
    sharedWith: "Active Members",
    publishResults: "Immediately",
    total_votes: 80,
    poll_options: [
      { name: "Morning (6–8 AM)", vote_count: 50 },
      { name: "Evening (6–8 PM)", vote_count: 30 },
    ],
  },
  {
    id: 3,
    title: "Should we host a New Year celebration event?",
    status: "Draft",
    showcreated: "28 Dec 2025",
    showstart: "-",
    showend: "-",
    sharedWith: "Committee Members",
    total_votes: 0,
    poll_options: [],
  },
];


/* ================= COMPONENT ================= */

const PollsPage = () => {
  const navigate = useNavigate();
  const baseUrl = localStorage.getItem("baseUrl");
  const token = localStorage.getItem("token");

  const [polls, setPolls] = useState<Poll[]>([]);
  // const [polls] = useState</Poll[]>(dummyPolls);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);


  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  /* ================= API ================= */
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
    const fetchPolls = async () => {
      try {
        const res = await axios.get(
          `https://${baseUrl}/crm/admin/polls.json`, {
          params: {
            token,
            page: currentPage,
          },
        }
          // {
          //   headers: {
          //     Authorization: `Bearer ${token}`,
          //   },
          // }
        );
        setPolls(res.data.polls);
        setTotalPages(res.data.pagination.total_pages);
        console.log("res.data:", res.data)
      } catch (err) {
        console.error("Failed to fetch polls", err);
      }
    };

    fetchPolls();
  }, [baseUrl, token, currentPage]);

  /* ================= HELPERS ================= */

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Draft":
        return "bg-yellow-100 text-yellow-700";
      case "Closed":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const getPercentage = (votes: number, total: number) => {
    if (!total) return "0%";
    return `${((votes / total) * 100).toFixed(1)}%`;
  };

  // const filteredPolls = polls.filter((poll) =>
  //   poll.title.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  /* ================= UI ================= */

  return (

    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Polls</h1>
          {/* <p className="text-gray-500">Manage your polls and surveys</p> */}
        </div>

        {/* <button
          onClick={() => navigate("/crm/polls/add")}
          className="flex items-center gap-2 bg-[#C72030] hover:bg-[#B01E2A] text-white px-4 py-2 rounded-md font-semibold"
        >
          <Plus size={18} />
          Add Poll
        </button> */}

        {/* <button
          onClick={() => navigate("/crm/polls/add")}
          className="flex items-center gap-2 bg-[#C72030] hover:bg-[#B01E2A] text-white px-4 py-2 rounded-md font-semibold"
        >
          <Plus size={18} />
          Add Poll
        </button> */}

        <div className="flex items-center">
          <Button
            type="button"
            onClick={() => navigate("/crm/polls/add")}
            className="border-[#C4B89D59] bg-[#C4B89D59] text-white hover:opacity-90 px-4 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Poll
          </Button>
        </div>

      </div>

      {/* Search */}
      {/* <div className="mb-6 flex items-center gap-3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search polls..."
            className="pl-10 pr-4 py-2 border rounded-md w-72 focus:outline-none focus:ring-2 focus:ring-[#C72030]"
          />
        </div>
      </div> */}

      {/* Poll Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPolls.map((poll) => (
          <div
            key={poll.id}
            className="bg-white rounded-xl border shadow-sm hover:shadow-lg transition"
          > */}
      {/* Card Header */}
      {/* <div className="p-5 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  {poll.title}
                </h2>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    Created: {poll.showcreated}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    Duration: {poll.showstart} - {poll.showend}
                  </div>
                  <div>
                    Shared with:{" "}
                    <span className="font-medium">{poll.sharedWith}</span>
                  </div>
                  {poll.publishResults && (
                    <div>
                      Results:{" "}
                      <span className="font-medium">
                        {poll.publishResults}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 relative">
                <button
                  onClick={() =>
                    setMenuOpenId(menuOpenId === poll.id ? null : poll.id)
                  }
                >
                  <MoreHorizontal size={18} />
                </button>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    poll.status
                  )}`}
                >
                  {poll.status}
                </span> */}

      {/* Dropdown */}
      {/* {menuOpenId === poll.id && (
                  <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg w-40 z-10">
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-sm">
                      <Eye size={14} /> View Results
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-sm">
                      <Edit size={14} /> Edit Poll
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 w-full text-sm text-red-600">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div> */}

      {/* Divider */}
      {/* <div className="border-t" /> */}

      {/* Options */}
      {/* <div className="p-5">
              <h3 className="text-sm font-semibold mb-3">
                Poll Options & Results
              </h3>

              {poll.poll_options.length > 0 ? (
                <div className="space-y-2">
                  {poll.poll_options.map((option, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <span>{option.name}</span>
                      <span className="px-2 py-0.5 border rounded-md text-xs">
                        {getPercentage(
                          option.vote_count,
                          poll.total_votes
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  No options available
                </p>
              )}
            </div> */}


      {/* Poll Options & Results */}
      {/* <div className="p-5">
              <h3 className="text-sm font-semibold mb-4">
                Poll Options & Results
              </h3>

              {poll.poll_options.length > 0 ? (
                <ul className="space-y-2">
                  {poll.poll_options.map((option, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-gray-900">
                        {option.name}
                      </span>

                      <span className="text-xs px-2 py-0.5 min-w-[50px] text-center border border-gray-300 rounded-md text-gray-700">
                        {poll.total_votes > 0
                          ? `${(
                            (option.vote_count / poll.total_votes) *
                            100
                          ).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-500">
                    No options available
                  </p>
                </div>
              )}
            </div>

          </div>
        ))}
      </div> */}

      {/* Empty State */}
      {/* {filteredPolls.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No polls available
        </div>
      )} */}



      <Box sx={{}}>
        {/* <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          Polls
        </Typography> */}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3
          }}
        >
          {polls.map((poll) => (
            <Card key={poll.id} elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" mb={2}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {poll.subject}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Created On: {formatDateTime(poll.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start Date: {formatDateTime(poll.start)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      End Date: {formatDateTime(poll.end)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Share with: <strong>{poll.shared}</strong>
                    </Typography>
                  </Box>

                  {/* <Chip
                    label={poll.status}
                    color={
                      poll.status === "Active"
                        ? "success"
                        : poll.status === "Closed"
                          ? "default"
                          : "warning"
                    }
                    size="small"
                  /> */}

                  <Chip
                    label={poll.active === 1 ? "Active" : "Inactive"}
                    color={poll.active === 1 ? "success" : "default"}
                    size="small"
                  />

                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* ✅ EXACT SAME BOX YOU ASKED */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
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
                            display: "flex",
                            justifyContent: "space-between"
                          }}
                        >
                          <ListItemText
                            primary={option.name}
                            primaryTypographyProps={{
                              variant: "body2",
                              color: "text.primary"
                            }}
                          />
                          <Chip
                            label={
                              poll.votes_count > 0
                                ? `${(
                                  (option.vote_count / poll.total_votes) *
                                  100
                                ).toFixed(1)}%`
                                : "0%"
                            }
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 50,
                              textAlign: "center"
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: "center", py: 2 }}>
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
      </Box>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">

          {/* Left Arrow */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="text-gray-700 disabled:text-gray-300"
          >
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`
          min-w-[36px] h-[36px] flex items-center justify-center text-sm font-medium
          ${currentPage === page
                  ? "bg-[#C72030] text-white"
                  : "text-gray-800 hover:text-[#C72030]"
                }
        `}
            >
              {page}
            </button>
          ))}

          {/* Right Arrow */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="text-gray-700 disabled:text-gray-300"
          >
            <ChevronRight size={22} strokeWidth={1.5} />
          </button>

        </div>
      )}
    </div>
  );
};

export default PollsPage;


