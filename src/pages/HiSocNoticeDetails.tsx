import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { getFullUrl, getAuthHeader } from "@/config/apiConfig";

const HiSocNoticeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [broadcastData, setBroadcastData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBroadcastDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(getFullUrl(`/crm/admin/noticeboards/${id}.json`), {
          headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
          },
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 400;
          },
        });
        
        console.log("API Response:", response.data);
        // The API returns the data directly, not nested
        setBroadcastData(response.data);
      } catch (error) {
        console.error("Error fetching broadcast details:", error);
        if (error.response?.status === 302 || error.response?.status === 401) {
          toast.error("Session expired. Please login again.");
          // Optionally redirect to login
          // navigate("/login");
        } else {
          toast.error("Failed to load broadcast details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBroadcastDetails();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const decodeUrl = (url) => {
    if (!url) return "";
    try {
      // Decode the URL-encoded string
      let decodedUrl = decodeURIComponent(url);
      
      // If it starts with //, add https:
      if (decodedUrl.startsWith("//")) {
        decodedUrl = `https:${decodedUrl}`;
      }
      // If it starts with /, it's a relative path, add the full domain
      else if (decodedUrl.startsWith("/")) {
        decodedUrl = `https:${decodedUrl}`;
      }
      // If it doesn't start with http, assume it needs https://
      else if (!decodedUrl.startsWith("http")) {
        decodedUrl = `https://${decodedUrl}`;
      }
      
      return decodedUrl;
    } catch (error) {
      console.error("Error decoding URL:", error);
      return url;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p>Loading broadcast details...</p>
        </div>
      </div>
    );
  }

  if (!broadcastData || Object.keys(broadcastData).length === 0) {
    return (
      <div className="p-6 bg-gray-50 h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No broadcast data found</p>
          <button
            onClick={() => navigate("/bms/hisoc-notice-list")}
            className="btn-primary mt-4 h-9 px-4 text-sm font-medium"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen overflow-y-auto scrollbar-thin pb-28 hi-soc-notice-details-page">
      <style>
        {`
          /* ---- Reference design ---- */
          html body #root .hi-soc-notice-details-page {
            background-color: #FDFDFB !important;
          }
          html body #root .hi-soc-notice-details-page .ref-back {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            border: none;
            background: transparent;
            padding: 0;
            color: rgba(26, 26, 24, 0.48);
            font-size: 12.5px;
            font-weight: 600;
            transition: color 0.16s ease;
          }
          html body #root .hi-soc-notice-details-page .ref-back:hover {
            color: #1A1A18;
          }
          html body #root .hi-soc-notice-details-page .ref-card {
            border: 1px solid rgba(26, 26, 24, 0.09) !important;
            border-radius: 16px !important;
            box-shadow: none !important;
            background-color: #FFFFFF !important;
            overflow: hidden;
          }
          html body #root .hi-soc-notice-details-page .ref-card h3 {
            font-size: 14px !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            color: #1A1A18 !important;
          }
          html body #root .hi-soc-notice-details-page .ref-kv-label {
            font-size: 11px;
            font-weight: 500;
            color: rgba(26, 26, 24, 0.48);
          }
          html body #root .hi-soc-notice-details-page .ref-kv-value {
            font-size: 13.5px;
            font-weight: 500;
            color: #1A1A18;
          }

          .tbl-container {
            overflow-x: auto;
            border: 1px solid rgba(26, 26, 24, 0.09);
            border-radius: 12px;
          }

          .tbl-container table {
            width: 100%;
            border-collapse: collapse;
            background: white;
          }

          .tbl-container th {
            background-color: #E6E2D8;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #1A1A18;
            border-right: 1px solid white;
          }

          .tbl-container th:last-child {
            border-right: none;
          }

          .tbl-container td {
            padding: 12px 16px;
            border-bottom: 1px solid rgba(26, 26, 24, 0.06);
            font-size: 13px;
            color: #1A1A18;
          }

          .tbl-container tbody tr:hover {
            background-color: #FAF9F7;
          }

          .tbl-container tbody tr:last-child td {
            border-bottom: none;
          }

          html body #root .hi-soc-notice-details-page .ref-file-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 8px;
            background-color: #F5F4F0;
            color: #1A1A18;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: background-color 0.16s ease;
          }
          html body #root .hi-soc-notice-details-page .ref-file-link:hover {
            background-color: #EDEAE3;
          }
          html body #root .hi-soc-notice-details-page .ref-file-link svg {
            color: #1A1A18 !important;
            fill: currentColor;
          }
        `}
      </style>

      <div className="mb-[22px]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="ref-back"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Back to Notice List
        </button>
        <h1 className="mt-[14px] text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>
          {broadcastData.notice_heading || "Notice Details"}
        </h1>
      </div>

      <div className="space-y-5">
        {/* Broadcast Details Section */}
        <div className="ref-card w-full">
          <div className="px-6 pt-[22px]">
            <h3>Notice Details</h3>
          </div>

          <div className="px-6 pt-4 pb-[22px]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-[18px] gap-x-6">
              {/* Notice Heading */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Notice Heading
                </div>
                <div className="ref-kv-value break-words">
                  {broadcastData.notice_heading || "-"}
                </div>
              </div>

              {/* Notice Type */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Notice Type
                </div>
                <div className="ref-kv-value">
                  {broadcastData.notice_type
                    ? broadcastData.notice_type.charAt(0).toUpperCase() + broadcastData.notice_type.slice(1).toLowerCase()
                    : "General"}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Status
                </div>
                <div className="ref-kv-value">
                  {broadcastData.active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Mark Important */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Mark Important
                </div>
                <div className="ref-kv-value">
                  {broadcastData.is_important ? "Yes" : "No"}
                </div>
              </div>

              {/* Send Email */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Send Email
                </div>
                <div className="ref-kv-value">
                  {broadcastData.email_trigger_enabled ? "Yes" : "No"}
                </div>
              </div>

              {/* Expiry Date & Time */}
              <div className="flex flex-col gap-1">
                <div className="ref-kv-label">
                  Expiry Date & Time
                </div>
                <div className="ref-kv-value">
                  {formatDate(broadcastData.expire_time)}
                </div>
              </div>

              {/* Share With */}
              {/* <div className="flex items-start col-span-1 md:col-span-2 gap-6">
                <div className="ref-kv-label">
                  Share With
                </div>
                <div className="ref-kv-value">
                  {(() => {
                    const shared = broadcastData.shared;
                    // Determine selected option
                    const hasUsers =
                      (broadcastData.noticeboard_users && broadcastData.noticeboard_users.length > 0) ||
                      (broadcastData.swusers && broadcastData.swusers.length > 0) ||
                      (broadcastData.user_societies && broadcastData.user_societies.length > 0);
                    const hasGroups =
                      (broadcastData.noticeboard_groups && broadcastData.noticeboard_groups.length > 0) ||
                      (broadcastData.cp_groups && broadcastData.cp_groups.length > 0) ||
                      (broadcastData.usergroups && broadcastData.usergroups.length > 0);

                    if (shared === 0 || shared === "0" || (!hasUsers && !hasGroups)) {
                      return (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          All
                        </span>
                      );
                    }

                    if (hasGroups) {
                      const groups =
                        broadcastData.noticeboard_groups ||
                        broadcastData.cp_groups ||
                        broadcastData.usergroups ||
                        [];
                      return (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mb-2">
                            Groups
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {groups.map((g: any, i: number) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                {g.name || g.group_name || g}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    if (hasUsers) {
                      const users =
                        broadcastData.noticeboard_users ||
                        broadcastData.swusers ||
                        broadcastData.user_societies ||
                        [];
                      return (
                        <div className="space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
                            Individuals
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {users.map((u: any, i: number) => {
                              const name =
                                u.full_name ||
                                (u.user
                                  ? `${u.user.firstname || ""} ${u.user.lastname || ""}`.trim()
                                  : null) ||
                                u.name ||
                                u.firstname ||
                                u;
                              return (
                                <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return "-";
                  })()}
                </div>
              </div> */}

              {/* Notice Text - Full Width */}
              <div className="flex flex-col gap-1 md:col-span-2 lg:col-span-3">
                <div className="ref-kv-label">
                  Notice Text
                </div>
                <div className="ref-kv-value whitespace-pre-wrap">
                  {broadcastData.notice_text || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Attachments Section */}
        <div className="ref-card w-full">
          <div className="px-6 pt-[22px]">
            <h3>Notice Attachments</h3>
          </div>
          <div className="px-6 pt-4 pb-[22px]">
            <div className="space-y-6">
              {/* Broadcast Cover Image */}
              <div>
                <h5 className="text-[13px] font-semibold text-[#1A1A18] mb-3">Notice Cover Image</h5>
                <div className="tbl-container">
                  <table>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>File Type</th>
                        <th>Ratio</th>
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcastData.image && broadcastData.image.document_url ? (
                        <tr>
                          <td>{broadcastData.image.document_file_name || "Cover Image"}</td>
                          <td>{broadcastData.image.document_content_type || "image/jpeg"}</td>
                          <td>16:9</td>
                          <td>
                            <img
                              src={decodeUrl(broadcastData.image.document_url)}
                              alt="Cover"
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "contain",
                                display: "block",
                                borderRadius: "4px",
                              }}
                              onError={(e) => {
                                console.error("Failed to load image:", decodeUrl(broadcastData.image.document_url));
                                e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EImage%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                            No Cover Image
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h5 className="text-[13px] font-semibold text-[#1A1A18] mb-3">Notice Attachment</h5>
                <div className="tbl-container">
                  <table>
                    <thead>
                      <tr>
                        <th>File Name</th>
                        <th>File Type</th>
                        <th>Ratio</th>
                        <th>Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcastData.attached_files && broadcastData.attached_files.length > 0 ? (
                        broadcastData.attached_files.map((file, index) => {
                          const fileUrl = decodeUrl(file.document_url);
                          const fileName = file.document_file_name || `Attachment ${index + 1}`;
                          const fileType = file.document_content_type || "";
                          
                          // Check if it's a video file
                          const isVideo = fileUrl.toLowerCase().includes('.mp4') || 
                                         fileUrl.toLowerCase().includes('.webm') || 
                                         fileUrl.toLowerCase().includes('.mov') ||
                                         fileType.includes('video');
                          
                          // Check if it's a PDF file
                          const isPDF = fileUrl.toLowerCase().includes('.pdf') || fileType.includes('pdf');
                          
                          // Check if it's an image
                          const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                                         fileType.includes('image');
                          
                          return (
                            <tr key={index}>
                              <td>{fileName}</td>
                              <td>{fileType || (isVideo ? "video/mp4" : isPDF ? "application/pdf" : "image/jpeg")}</td>
                              <td>16:9</td>
                              <td>
                                {isPDF ? (
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ref-file-link"
                                  >
                                    <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                    </svg>
                                    View PDF
                                  </a>
                                ) : isVideo ? (
                                  <video
                                    controls
                                    style={{
                                      width: "200px",
                                      height: "100px",
                                      objectFit: "contain",
                                      display: "block",
                                      borderRadius: "4px",
                                      backgroundColor: "#000",
                                    }}
                                    onError={(e) => {
                                      console.error("Failed to load video:", fileUrl);
                                    }}
                                  >
                                    <source src={fileUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                  </video>
                                ) : isImage ? (
                                  <img
                                    src={fileUrl}
                                    alt={fileName}
                                    style={{
                                      width: "100px",
                                      height: "100px",
                                      objectFit: "contain",
                                      display: "block",
                                      borderRadius: "4px",
                                    }}
                                    onError={(e) => {
                                      console.error("Failed to load image:", fileUrl);
                                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='12'%3EImage%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                ) : (
                                  <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ref-file-link"
                                  >
                                    <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Download File
                                  </a>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                            No Attached Files
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HiSocNoticeDetails;
