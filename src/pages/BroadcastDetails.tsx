import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

const BroadcastDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock data for UI display (no API calls)
  const broadcastData = {
    notice_heading: "Water Supply Maintenance Notice",
    notice_type: "Maintenance",
    society_name: "Runwal Garden",
    active: true,
    is_important: true,
    email_trigger_enabled: false,
    expire_time: "2025-11-25T18:30:00",
    notice_text: "Please note that there will be a temporary water supply shutdown in Runwal Garden due to scheduled maintenance work. Residents are requested to store sufficient water in advance.",
    image: {
      document_url: "https://via.placeholder.com/400x225/4A90E2/ffffff?text=Maintenance+Notice",
      document_file_name: "Maintenance_Notice_Runwal_Garden.png"
    },
    attached_files: [
      {
        document_url: "https://via.placeholder.com/400x225/E74C3C/ffffff?text=PDF+Document",
        document_file_name: "Maintenance_Notice_Runwal_Garden.pdf",
        document_content_type: "application/pdf"
      }
    ]
  };

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

  return (
    <div className="p-6 bg-gray-50 h-screen overflow-y-auto scrollbar-thin pb-28">
      <Toaster position="top-right" richColors closeButton />
      
      <style>
        {`
          .tbl-container {
            overflow-x: auto;
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
            font-size: 14px;
            color: #111827;
            border-right: 1px solid white;
          }
          
          .tbl-container th:last-child {
            border-right: none;
          }
          
          .tbl-container td {
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 13px;
            color: #1f2937;
          }
          
          .tbl-container tbody tr:hover {
            background-color: #f9fafb;
          }
          
          .tbl-container tbody tr:last-child td {
            border-bottom: none;
          }
        `}
      </style>
      
      <div>
        {/* Broadcast Details Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-3">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold uppercase text-black">
                Details
              </h3>
            </div>
          </div>
          
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-8 mx-6">
              {/* Notice Heading */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Notice Heading
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1 break-words">
                  {broadcastData.notice_heading || "-"}
                </div>
              </div>

              {/* Notice Type */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Notice Type
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {broadcastData.notice_type
                    ? broadcastData.notice_type.charAt(0).toUpperCase() + broadcastData.notice_type.slice(1).toLowerCase()
                    : "General"}
                </div>
              </div>

              {/* Project Name */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Project Name
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {broadcastData.society_name || "-"}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Status
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {broadcastData.active ? "Active" : "Inactive"}
                </div>
              </div>

              {/* Mark Important */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Mark Important
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {broadcastData.is_important ? "Yes" : "No"}
                </div>
              </div>

              {/* Send Email */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Send Email
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {broadcastData.email_trigger_enabled ? "Yes" : "No"}
                </div>
              </div>

              {/* Expiry Date & Time */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Expiry Date & Time
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formatDate(broadcastData.expire_time)}
                </div>
              </div>

              {/* Notice Text - Full Width */}
              <div className="flex items-start col-span-1 md:col-span-2 gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Notice Text
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1 whitespace-pre-wrap">
                  {broadcastData.notice_text || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notice Attachments Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Notice Attachments
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="space-y-6">
              {/* Broadcast Cover Image */}
              <div className="mt-4">
                <h5 className="text-[15px] font-semibold text-gray-900 mb-3">Broadcast Cover Image</h5>
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
                      {broadcastData.image ? (
                        <tr>
                          <td>{broadcastData.image.document_file_name || "Cover Image"}</td>
                          <td>image/jpeg</td>
                          <td>16:9</td>
                          <td>
                            <img
                              src={broadcastData.image.document_url}
                              alt="Cover"
                              style={{
                                width: "100px",
                                height: "100px",
                                objectFit: "contain",
                                display: "block",
                                borderRadius: "4px",
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
              <div className="mt-4">
                <h5 className="text-[15px] font-semibold text-gray-900 mb-3">File Upload</h5>
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
                        broadcastData.attached_files.map((file, index) => (
                          <tr key={index}>
                            <td>{file.document_file_name || `Attachment ${index + 1}`}</td>
                            <td>{file.document_content_type || "image/jpeg"}</td>
                            <td>16:9</td>
                            <td>
                              {file.document_content_type?.includes('pdf') ? (
                                <a 
                                  href={file.document_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 12px',
                                    backgroundColor: '#fef2f2',
                                    color: '#dc2626',
                                    borderRadius: '4px',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                  }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                >
                                  <svg style={{ width: '16px', height: '16px' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                                  </svg>
                                  View PDF
                                </a>
                              ) : (
                                <img
                                  src={file.document_url}
                                  alt={`Attachment ${index + 1}`}
                                  style={{
                                    width: "100px",
                                    height: "100px",
                                    objectFit: "contain",
                                    display: "block",
                                    borderRadius: "4px",
                                  }}
                                />
                              )}
                            </td>
                          </tr>
                        ))
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

export default BroadcastDetails;
