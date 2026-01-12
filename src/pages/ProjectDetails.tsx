import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";

import "../styles/mor.css";
import { useParams, useNavigate } from "react-router-dom";
import { API_CONFIG, getFullUrl, getAuthHeader } from "../config/apiConfig";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@mui/material";
import { Settings as SettingsOutlinedIcon, ArrowLeft } from "lucide-react";


const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  console.log("id", id);

  const [isExpanded, setIsExpanded] = useState(false);

  const [formData, setFormData] = useState({
    property_type: "",
    SFDC_Project_Id: "",
    building_type: "",
    status: "",
    configurations: [],
    project_name: "",
    project_address: "",
    project_description: "",
    price: "",
    project_size_sq_mtr: "",
    project_size_sq_ft: "",
    development_area_sqft: "",
    development_area_sqmt: "",
    rera_carpet_area_sq_mtr: "",
    rera_carpet_area_sqft: "",
    Rera_Sellable_Area: "",
    no_of_towers: "",
    no_of_floors: "",
    no_of_apartments: "",
    rera_number_multiple: [],
    amenities: [],
    specifications: [],
    land_area: "",
    land_uom: "",
    project_tag: "",
    virtual_tour_url_multiple: [],
    map_url: "",
    image: [],
    location: {
      address: "",
      addressLine1: "",
      address_line_two: "",
      addressLine3: "",
      city: "",
      state: "",
      pin_code: "",
      country: "",
    },
    brochure: null, // file input for brochure
    two_d_images: [], // array of file inputs for 2D images
    videos: [],
    gallery_image: [],
    fetched_gallery_image: [],
    Project_PPT: [],
    fetched_Project_PPT: [],
    ProjectPPT: [],
    project_creatives: [],
    project_creative_generics: [],
    project_creative_offers: [],
    project_interiors: [],
    project_exteriors: [],
    project_emailer_templetes: [],
    project_layout: [],
    project_sales_type: "",
    order_no: null,
    video_preview_image_url: [],
    enable_enquiry: false,
    rera_url: "",
    isDay: true,
    video_url: "",
    // Visibility
    show_on_home: false,
    show_on_project_detail_page: false,
    show_on_booking_page: false,
    featured_projects: false,
    // Banner Images (ratio-based)
    image_1_by_1: null,
    image_9_by_16: null,
    image_3_by_2: null,
    image_16_by_9: null,
    // Cover Images (ratio-based)
    cover_images_1_by_1: [],
    cover_images_9_by_16: [],
    cover_images_3_by_2: [],
    cover_images_16_by_9: [],
    // Gallery Images (ratio-based)
    gallery_image_1_by_1: [],
    gallery_image_9_by_16: [],
    gallery_image_3_by_2: [],
    gallery_image_16_by_9: [],
    // Floor Plan / 2D Images (ratio-based)
    project_2d_image_1_by_1: [],
    project_2d_image_9_by_16: [],
    project_2d_image_3_by_2: [],
    project_2d_image_16_by_9: [],
    project_qrcode_image: [],
  });

  console.log("formdata", formData);

  const [projectsType, setProjectsType] = useState([]);
  const [configurations, setConfigurations] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Project ID is missing");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          getFullUrl(`/projects/${id}.json`),
          {
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
          }
        );

        const project = response.data;
        console.log("Project Data:", project);

        if (project) {
          setFormData({
            property_type: project.property_type || "",
            SFDC_Project_Id: project.SFDC_Project_Id || "",
            building_type: project.building_type || "",
            status: project.Project_Construction_Status || project.project_construction_status || "",
            configurations: project.configurations || [],
            project_name: project.project_name || "",
            project_address: project.project_address || "",
            project_description: project.project_description || "",
            price: project.price_onward || project.price || "",
            project_size_sq_mtr: project.project_size_sq_mtr || "",
            project_size_sq_ft: project.project_size_sq_ft || "",
            development_area_sqft: project.development_area_sqft || "",
            development_area_sqmt: project.development_area_sqmt || "",
            rera_carpet_area_sq_mtr: project.rera_carpet_area_sq_mtr || "",
            rera_carpet_area_sqft: project.rera_carpet_area_sqft || "",
            Rera_Sellable_Area: project.rera_sellable_area || "",
            no_of_towers: project.no_of_towers || "",
            no_of_floors: project.no_of_floors || "",
            no_of_apartments: project.no_of_apartments || "",
            rera_number_multiple: project.rera_number_multiple || [],
            amenities: project.amenities || [],
            specifications: project.specifications || [],
            land_area: project.land_area || "",
            land_uom: project.land_uom || "",
            project_tag: project.project_tag || "",
            project_disclaimer: project.project_disclaimer || "",
            virtual_tour_url_multiple: project.virtual_tour_url_multiple || [],
            map_url: project.map_url || "",
            image: project.image || [],
            location: project.location || {
              address: project.project_address || "",
              addressLine1: "",
              address_line_two: "",
              addressLine3: "",
              city: "",
              state: "",
              pin_code: "",
              country: "",
            },
            brochure: project.brochure || null,
            two_d_images: project.two_d_images || [],
            videos: project.videos || [],
            gallery_image: project.gallery_image || [],
            fetched_gallery_image: project.fetched_gallery_image || [],
            Project_PPT: project.project_ppt || project.Project_PPT || [],
            fetched_Project_PPT: project.fetched_Project_PPT || [],
            ProjectPPT: project.ProjectPPT || [],
            project_creatives: project.project_creatives || [],
            project_creative_generics: project.project_creative_generics || [],
            project_creative_offers: project.project_creative_offers || [],
            project_interiors: project.project_interiors || [],
            project_exteriors: project.project_exteriors || [],
            project_emailer_templetes: project.project_emailer_templetes || [],
            project_layout: project.project_layout || [],
            project_sales_type: project.project_sales_type || "",
            order_no: project.order_no || null,
            video_preview_image_url: project.video_preview_image_url || [],
            enable_enquiry: project.enable_enquiry || false,
            rera_url: project.rera_url || "",
            isDay: project.isDay !== undefined ? project.isDay : true,
            video_url: project.video_url || "",
            // Visibility
            show_on_home: project.show_on_home || false,
            show_on_project_detail_page: project.show_on_project_detail_page || false,
            show_on_booking_page: project.show_on_booking_page || false,
            featured_projects: project.featured_projects || false,
            // Banner Images (ratio-based)
            image_1_by_1: project.image_1_by_1 || null,
            image_9_by_16: project.image_9_by_16 || null,
            image_3_by_2: project.image_3_by_2 || null,
            image_16_by_9: project.image_16_by_9 || null,
            // Cover Images (ratio-based)
            cover_images_1_by_1: project.cover_images_1_by_1 || [],
            cover_images_9_by_16: project.cover_images_9_by_16 || [],
            cover_images_3_by_2: project.cover_images_3_by_2 || [],
            cover_images_16_by_9: project.cover_images_16_by_9 || [],
            // Gallery Images (ratio-based)
            gallery_image_1_by_1: project.gallery_image?.[0]?.gallery_image_1_by_1 || [],
            gallery_image_9_by_16: project.gallery_image?.[0]?.gallery_image_9_by_16 || [],
            gallery_image_3_by_2: project.gallery_image?.[0]?.gallery_image_3_by_2 || [],
            gallery_image_16_by_9: project.gallery_image?.[0]?.gallery_image_16_by_9 || [],
            // Floor Plan / 2D Images (ratio-based)
            project_2d_image_1_by_1: project.project_2d_image_1_by_1 || [],
            project_2d_image_9_by_16: project.project_2d_image_9_by_16 || [],
            project_2d_image_3_by_2: project.project_2d_image_3_by_2 || [],
            project_2d_image_16_by_9: project.project_2d_image_16_by_9 || [],
            project_qrcode_image: project.project_qrcode_images || [],
          });
        } else {
          setError("Project not found");
        }
      } catch (error) {
        setError("Error fetching project data");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C72030] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Project</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 h-screen overflow-y-auto scrollbar-thin pb-28">
      <style>
        {`
          .form-disabled input,
          .form-disabled textarea,
          .form-disabled select {
            pointer-events: none;
            background-color: #f9f9f9;
            color: #6c757d;
            border: 1px solid #ccc;
            background-image: none;
          }
          .form-disabled input[type="file"] {
            display: none;
          }

          .form-disabled label {
            font-weight: bold;
          }
        `}
      </style>
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Back to Project List</span>
        </div>
      </div>
      <div>
        <div className="w-full bg-white rounded-lg shadow-sm border mt-3">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                <svg className="w-6 h-6 text-[#C72030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold uppercase text-black">
                Project Details
              </h3>
            </div>
          </div>
          
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-8 mx-6">
                {/* <div className="col-lg-6 col-md-6 col-sm-12 row px-3 ">
                  <div className="col-6">
                    <label>Project Banner Image</label>
                  </div>
                  <div className="col-6 d-flex">
                    <span className="me-2">:</span>
                    <img
                      src={formData.image_url}
                      alt="Image"
                      className="img-fluid"
                      style={{
                        width: "100px",
                        height: "100px",
                        //objectFit: "contain",
                        //display: "block",
                      }}
                    />
                  </div>
                </div> */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Type
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.property_type || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Building Type
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.building_type || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Construction Status
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.status || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Configuration Type
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.configurations?.map((config, index) => (
                      <span key={index}>
                        {config.name}
                        {index !== formData.configurations.length - 1 ? ", " : ""}
                      </span>
                    )) || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">                    Project Name
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_name || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    SFDC Project ID
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.SFDC_Project_Id || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Location
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_address || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Tag
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_tag || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Description
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_description ? (
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: isExpanded ? "unset" : 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "pointer",
                        }}
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        {formData.project_description}
                        {!isExpanded && formData.project_description.length > 100 && (
                          <span className="text-gray-600"> ...</span>
                        )}
                      </span>
                    ) : "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Price Onwards
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.price || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Size (Sq. Mtr.)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_size_sq_mtr || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Size (Sq. Ft.)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_size_sq_ft || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Development Area (Sq. Mtr.)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.development_area_sqmt || "-"}
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Development Area (Sq. Ft.)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.development_area_sqft || "-"}
                  </div>
                </div>

                {/* Rera Carpet Area (Sq. M) */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Rera Carpet Area (Sq. M)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.rera_carpet_area_sq_mtr || "-"}
                  </div>
                </div>

                {/* Rare Carpet Area (Sq. Ft.) */}
                <div className="flex items-start gap-6 ">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Rare Carpet Area (Sq. Ft.)
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.rera_carpet_area_sqft || "-"}
                  </div>
                </div>

                {/* Number of Towers */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Number of Towers
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.no_of_towers || "-"}
                  </div>
                </div>

                {/* Number of Floors */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Number of Floors
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.no_of_floors || "-"}
                  </div>
                </div>

                {/* Number of Units */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Number of Units
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.no_of_apartments || "-"}
                  </div>
                </div>

                {/* <div className="col-lg-6 col-md-6 col-sm-12 row px-3 ">
                  <div className="col-6 ">
                    <label>Specifications</label>
                  </div>
                  <div className="col-6">
                    <label className="text">
                      <span className="me-3">
                        <span className="text-dark">
                          :{" "}
                          {formData.specifications?.map((spec, index) => (
                            <span key={index}>
                              {spec.name}
                              {index !== formData.specifications.length - 1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                        </span>
                      </span>
                    </label>
                  </div>
                </div> */}

                {/* Land Area */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Land Area
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.land_area || "-"}
                  </div>
                </div>

                {/* Land UOM */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Land UOM
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.land_uom || "-"}
                  </div>
                </div>

                {/* Project Sales Type */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project Sales Type
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_sales_type || "-"}
                  </div>
                </div>

                {/* Order Number */}
                <div className="flex items-start gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Order Number
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.order_no || "-"}
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="flex items-start col-span-1 md:col-span-2 gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Disclaimer
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.project_disclaimer ? (
                      <p
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: isExpanded ? "unset" : 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: isExpanded ? "normal" : "nowrap",
                          cursor: "pointer",
                        }}
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        {formData.project_disclaimer}{" "}
                        {!isExpanded && (
                          <span style={{ color: "black", cursor: "pointer" }}>
                            ...
                          </span>
                        )}
                      </p>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                {/* Project QR Code Image */}
                <div className="flex items-start col-span-1 md:col-span-2 gap-6">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Project QR Code Image
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData?.project_qrcode_images?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.project_qrcode_images.map((img, index) => (
                          <img
                            key={index}
                            src={img.document_url}
                            alt={`QR Code ${index + 1}`}
                            className="object-contain"
                            style={{
                              width: "100px",
                              height: "100px",
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      "-"
                    )}
                  </div>
                </div>

                {/* Enable Enquiry */}
                <div className="flex items-start gap-4">
                  <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                    Enable Enquiry
                  </div>
                  <div className="text-[14px] font-semibold text-gray-900 flex-1">
                    {formData.enable_enquiry ? "Yes" : "No"}
                  </div>
                </div>

                {/* <div className="col-lg-6 col-md-6 col-sm-12 row px-3">
                  <div className="col-6">
                    <label>Virtual Tour URL</label>
                  </div>
                  <div className="col-6">
                    <p
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: isExpanded ? "unset" : 1, 
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "normal",
                        cursor: "pointer",
                      }}
                    >
                      {isExpanded ? (
                        <a
                          href={formData.virtual_tour_url_multiple}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-dark"
                          style={{ textDecoration: "none" }}
                        >
                          {formData.virtual_tour_url_multiple}
                        </a>
                      ) : (
                        <>
                          {formData.virtual_tour_url_multiple.substring(0, 30)}{" "}
                         
                          <span
                            onClick={(e) => {
                              e.stopPropagation(); 
                              setIsExpanded(true);
                            }}
                            style={{
                              color: "black",
                              cursor: "pointer",
                              fontWeight: "bold",
                            }}
                          >
                            ...
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        {/* RERA Number Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                RERA Number
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="space-y-6 mx-6">
              {formData?.rera_number_multiple?.length > 0 ? (
                formData.rera_number_multiple.map((rera, idx) => {
                  // Filter QR codes for this RERA number
                  const qrCodesForRera = formData.project_qrcode_image.filter(
                    (qr) => qr.file_name === rera.rera_number || qr.title === rera.rera_number
                  );
                  
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="text-[14px] leading-relaxed text-gray-900">
                        <span className="font-semibold">Tower Name :</span>
                        <span className="font-semibold">{rera.tower_name}</span>
                        {", "}
                        <span className="font-semibold">Rera Number :</span>
                        <span className="font-semibold">{rera.rera_number}</span>
                        {", "}
                        <a
                          href={rera.rera_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-black-600 hover:text-black-800 underline font-semibold"
                        >
                          Rera URL : {rera.rera_url}
                        </a>
                      </div>
                      
                      {/* QR Code Images Section */}
                      {qrCodesForRera.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Project QR Code Images</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {qrCodesForRera.map((qrImage, qrIdx) => (
                              <div key={qrIdx} className="border border-gray-200 rounded-lg p-2 bg-white">
                                <img
                                  src={qrImage.document_url}
                                  alt={qrImage.document_file_name || 'QR Code'}
                                  className="w-full h-32 object-contain rounded"
                                />
                                <p className="text-xs text-gray-600 mt-2 text-center truncate" title={qrImage.document_file_name}>
                                  {rera.rera_number || 'QR Code'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="9"></line>
                  <line x1="9" y1="15" x2="15" y2="15"></line>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Amenities
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="flex items-start mx-6">
              <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                Amenities
              </div>
              <div className="text-[14px] font-semibold text-gray-900 flex-1">
                {formData.amenities && formData.amenities.length > 0
                  ? formData.amenities.map((amenity, index) => (
                      <span key={index}>
                        {amenity.name}
                        {index !== formData.amenities.length - 1 ? ", " : ""}
                      </span>
                    ))
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Address
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-y-4 gap-x-8 mx-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Address
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData?.location?.address || "—"}
                </div>
              </div>

              {/* City */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  City
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.location?.city || "—"}
                </div>
              </div>

              {/* State */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  State
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.location?.state || "—"}
                </div>
              </div>

              {/* Pin Code */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Pin Code
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.location?.pin_code || "—"}
                </div>
              </div>

              {/* Country */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Country
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.location?.country || "—"}
                </div>
              </div>

              {/* Map URL */}
              <div className="flex items-start gap-4">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Map URL
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1 min-w-0">
                  {formData.map_url ? (
                    <a
                      href={formData.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black-600 hover:text-black-800 underline break-all"
                      style={{
                        wordBreak: "break-all",
                        overflowWrap: "break-word"
                      }}
                    >
                      {formData.map_url}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {(API_CONFIG.BASE_URL === "https://dev-panchshil-super-app.lockated.com/" || API_CONFIG.BASE_URL === "https://rustomjee-live.lockated.com/") && (
          /* Plans Section */
          <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Plans
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="mt-4">
              <h5 className="text-[15px] font-semibold text-gray-900 mb-3">Project Plans</h5>
              <div className="tbl-container">
                <table className="w-100">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>File Name</th>
                      <th>File Type</th>
                      <th>Updated At</th>
                      <th>Image</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData?.plans?.length > 0 ? (
                      formData.plans.map((plan, planIdx) => (
                        <React.Fragment key={`plan-${planIdx}`}>
                          {plan.images?.length > 0 ? (
                            plan.images.map((img, imgIdx) => (
                              <tr key={`plan-${planIdx}-img-${imgIdx}`}>
                                <td>{plan.name}</td>
                                <td>{img.document_file_name}</td>
                                <td>{img.document_content_type}</td>
                                <td>{img.document_updated_at}</td>
                                <td>
                                  <img
                                    src={img.document_url}
                                    alt={`Plan Image ${imgIdx}`}
                                    style={{
                                      width: "100px",
                                      height: "100px",
                                      objectFit: "contain",
                                      display: "block",
                                    }}
                                    className="img-fluid rounded"
                                  />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr key={`plan-${planIdx}-no-img`}>
                              <td>{plan.name}</td>
                              <td
                                colSpan="4"
                                className="text-center text-muted"
                              >
                                No images available for this plan.
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          No Plans Available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Document Attachment Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Document Attachment
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="row ">
              {/* <div className="col-md-12 mt-2">
                <h5 className=" ">Gallery Images</h5>
                {loading ? (
                  <div className="text-center">
                    <div
                      className="spinner-border"
                      role="status"
                      style={{ color: "var(--red)" }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 tbl-container">
                    <table className="   w-100">
                      <thead>
                        <tr>
                          <th>Category Type</th>
                          <th>File Name</th>

                          <th>File Type</th>
                          <th>updated at</th>
                          <th>Image</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.gallery_image?.map((file, index) =>
                          file.attachfiles?.map((attachment, idx) => (
                            <tr key={`fetched-${index}-${idx}`}>
                              <td>{file.gallery_type || "N/A"}</td>
                              <td>{attachment.document_file_name || "N/A"}</td>
                              <td>{attachment.document_content_type}</td>
                              <td>{attachment.document_updated_at}</td>
                              <td>
                                <a href={`${attachment.document_url}`}>
                                  {" "}
                                  <svg
                                    width="15"
                                    height="16"
                                    viewBox="0 0 22 23"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M20.8468 22.9744H1.1545C0.662189 22.9744 0.333984 22.6462 0.333984 22.1538V15.5897C0.333984 15.0974 0.662189 14.7692 1.1545 14.7692C1.6468 14.7692 1.97501 15.0974 1.97501 15.5897V21.3333H20.0263V15.5897C20.0263 15.0974 20.3545 14.7692 20.8468 14.7692C21.3391 14.7692 21.6673 15.0974 21.6673 15.5897V22.1538C21.6673 22.6462 21.3391 22.9744 20.8468 22.9744ZM11.0007 18.0513C10.9186 18.0513 10.7545 18.0513 10.6724 17.9692C10.5904 17.9692 10.5083 17.8872 10.4263 17.8051L3.86219 11.241C3.53398 10.9128 3.53398 10.4205 3.86219 10.0923C4.19039 9.7641 4.6827 9.7641 5.01091 10.0923L10.1801 15.2615V0.820513C10.1801 0.328205 10.5083 0 11.0007 0C11.493 0 11.8212 0.328205 11.8212 0.820513V15.2615L16.9904 10.0923C17.3186 9.7641 17.8109 9.7641 18.1391 10.0923C18.4673 10.4205 18.4673 10.9128 18.1391 11.241L11.575 17.8051C11.493 17.8872 11.4109 17.9692 11.3289 17.9692C11.2468 18.0513 11.0827 18.0513 11.0007 18.0513Z"
                                      fill="#c72030"
                                    ></path>
                                  </svg>
                                </a>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div> */}
              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Banner Images</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {(() => {
                        const eventGroups = [
                          formData.image_1_by_1,
                          formData.image_9_by_16,
                          formData.image_3_by_2,
                          formData.image_16_by_9,
                        ];

                        const allEventImages = eventGroups
                          .filter((img) => img && img.document_url)
                          .map((img) => img);

                        return allEventImages.length > 0 ? (
                          allEventImages.map((file, index) => (
                            <TableRow key={`event-${index}`} className="hover:bg-gray-50">
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                              <TableCell className="py-3 px-4">
                                <img
                                  src={file.document_url}
                                  alt={`Banner ${index}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                              No Banner Images
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="col-md-12 mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Cover Images</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {(() => {
                        const coverGroups = [
                          formData.cover_images_1_by_1,
                          formData.cover_images_9_by_16,
                          formData.cover_images_3_by_2,
                          formData.cover_images_16_by_9,
                        ];

                        const normalizedImages = coverGroups
                          .map((group) =>
                            Array.isArray(group)
                              ? group
                              : group && typeof group === "object"
                              ? [group]
                              : []
                          )
                          .flat()
                          .filter((img) => img?.document_url);

                        return normalizedImages.length > 0 ? (
                          normalizedImages.map((file, index) => (
                            <TableRow key={`cover-${index}`} className="hover:bg-gray-50">
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                              <TableCell className="py-3 px-4">
                                <img
                                  src={file.document_url}
                                  alt={`Cover ${index}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                              No Cover Images
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="col-md-12 mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Gallery Images</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {(() => {
                        const eventGroups = [
                          formData.gallery_image_1_by_1,
                          formData.gallery_image_9_by_16,
                          formData.gallery_image_3_by_2,
                          formData.gallery_image_16_by_9,
                        ];

                        const allEventImages = eventGroups
                          .filter(
                            (group) => Array.isArray(group) && group.length > 0
                          )
                          .flat()
                          .filter((img) => img?.document_url);

                        return allEventImages.length > 0 ? (
                          allEventImages.map((file, index) => (
                            <TableRow key={`gallery-${index}`} className="hover:bg-gray-50">
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                              <TableCell className="py-3 px-4">
                                <img
                                  src={file.document_url}
                                  alt={`Gallery ${index}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                              No Gallery Images
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="col-md-12 mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Layouts & Floor Plans</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {(() => {
                        const eventGroups = [
                          formData.project_2d_image_1_by_1,
                          formData.project_2d_image_9_by_16,
                          formData.project_2d_image_3_by_2,
                          formData.project_2d_image_16_by_9,
                        ];

                        const allEventImages = eventGroups
                          .filter(
                            (group) => Array.isArray(group) && group.length > 0
                          )
                          .flat()
                          .filter((img) => img?.document_url);

                        return allEventImages.length > 0 ? (
                          allEventImages.map((file, index) => (
                            <TableRow key={`floor-plan-${index}`} className="hover:bg-gray-50">
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                              <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                              <TableCell className="py-3 px-4">
                                <img
                                  src={file.document_url}
                                  alt={`Floor Plan ${index}`}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                              No Floor Plan Images
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Brochure</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.brochure && formData.brochure.document_url ? (
                        <TableRow className="hover:bg-gray-50">
                          <TableCell className="text-gray-900 py-3 px-4">{formData.brochure?.document_file_name}</TableCell>
                          <TableCell className="text-gray-900 py-3 px-4">{formData.brochure?.document_content_type}</TableCell>
                          <TableCell className="text-gray-900 py-3 px-4">{formData.brochure?.document_updated_at}</TableCell>
                          <TableCell className="py-3 px-4">
                            <a href={formData.brochure?.document_url} className="text-black-600 hover:underline">Download</a>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Brochure Available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project PPT</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.ProjectPPT && formData.ProjectPPT.document_url ? (
                        <TableRow className="hover:bg-gray-50">
                          <TableCell className="text-gray-900 py-3 px-4">{formData.ProjectPPT?.document_file_name}</TableCell>
                          <TableCell className="text-gray-900 py-3 px-4">{formData.ProjectPPT?.document_content_type}</TableCell>
                          <TableCell className="text-gray-900 py-3 px-4">{formData.ProjectPPT?.document_updated_at}</TableCell>
                          <TableCell className="py-3 px-4">
                            <a href={formData.ProjectPPT?.document_url} className="text-black-600 hover:underline">Download</a>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project PPT Available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div> */}

              {/* <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Layouts & Floor Plans</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.two_d_images.length > 0 ? (
                        formData.two_d_images.map((file, index) => (
                          <TableRow key={`two-d-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Floor Plan ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Floor Plan Images
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div> */}

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Offers</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_creative_offers.length > 0 ? (
                        formData.project_creative_offers.map((file, index) => (
                          <TableRow key={`offers-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Offer ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Creatives Offers
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Videos</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.videos.length > 0 ? (
                        formData.videos.map((file, index) => (
                          <TableRow key={`video-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Video ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Videos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Layout</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_layout.length > 0 ? (
                        formData.project_layout.map((file, index) => (
                          <TableRow key={`layout-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Layout ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Layout Images
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Creatives</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_creatives.length > 0 ? (
                        formData.project_creatives.map((file, index) => (
                          <TableRow key={`creatives-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Creative ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Creatives
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Creatives Generics</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_creative_generics.length > 0 ? (
                        formData.project_creative_generics.map((file, index) => (
                          <TableRow key={`generics-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Generic ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Creatives Generics
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Interiors</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_interiors.length > 0 ? (
                        formData.project_interiors.map((file, index) => (
                          <TableRow key={`interiors-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Interior ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Interiors
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Exteriors</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_exteriors.length > 0 ? (
                        formData.project_exteriors.map((file, index) => (
                          <TableRow key={`exteriors-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{file.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <img src={file.document_url} alt={`Exterior ${index}`} className="w-20 h-20 object-cover rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Project Exteriors
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-base font-semibold text-gray-900 mb-3">Project Emailer Template</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow style={{ backgroundColor: '#E6E2D8' }}>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Name</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">File Type</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4 border-r border-white">Updated At</TableHead>
                        <TableHead className="font-semibold text-gray-900 py-3 px-4">Download</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-white">
                      {formData.project_emailer_templetes && formData.project_emailer_templetes.length > 0 ? (
                        formData.project_emailer_templetes.map((doc, index) => (
                          <TableRow key={`emailer-${index}`} className="hover:bg-gray-50">
                            <TableCell className="text-gray-900 py-3 px-4">{doc.document_file_name}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{doc.document_content_type}</TableCell>
                            <TableCell className="text-gray-900 py-3 px-4">{doc.document_updated_at}</TableCell>
                            <TableCell className="py-3 px-4">
                              <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-black-600 hover:underline">Download</a>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-gray-600">
                            No Emailer Templates
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              
              {/* <div className="col-md-12 mt-2">
                <h5 className="">
                  Video Preview Image Url :{" "}
                  <a
                    href={formData.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark"
                    style={{
                      textDecoration: "underline",
                      fontWeight: "500",
                      color: "var(--red)",
                    }}
                  >
                    Check Here
                  </a>
                </h5>
              </div> */}
            </div>
          </div>
        </div>

        {/* Virtual Tour Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E5E0D3] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C72030" strokeWidth="2">
                  <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path>
                  <line x1="2" y1="20" x2="2.01" y2="20"></line>
                </svg>
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Virtual Tour
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="space-y-3 mx-6">
              {formData?.virtual_tour_url_multiple?.length > 0 ? (
                formData.virtual_tour_url_multiple.map((virtual, idx) => (
                  <div key={idx} className="text-[14px] leading-relaxed">
                    <strong className="text-gray-900">{virtual.virtual_tour_name}:</strong>{" "}
                    <a
                      href={virtual.virtual_tour_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-black-600 hover:text-black-800 underline"
                    >
                      {virtual.virtual_tour_url}
                    </a>
                  </div>
                ))
              ) : (
                <span className="text-gray-500">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Visibility Section */}
        <div className="w-full bg-white rounded-lg shadow-sm border mt-4">
          <div className="flex items-center justify-between gap-3 bg-[#F6F4EE] py-3 px-4 border border-[#D9D9D9]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E5E0D3]">
                <SettingsOutlinedIcon className="w-5 h-5 text-[#C72030]" />
              </div>
              <h3 className="text-[16px] font-bold text-gray-900 tracking-wide">
                Visibility
              </h3>
            </div>
          </div>
          <div className="bg-[#FBFBFA] border border-t-0 border-[#D9D9D9] px-5 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 mx-6">
              {/* Show on Home Page */}
              <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Show on Home Page
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.show_on_home ? "Yes" : "No"}
                </div>
              </div>

              {/* Show on Project Detail Page */}
              {/* <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Show on Project Detail Page
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.show_on_project_detail_page ? "Yes" : "No"}
                </div>
              </div> */}

              {/* Show on Booking Page */}
              {/* <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Show on Booking Page
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.show_on_booking_page ? "Yes" : "No"}
                </div>
              </div> */}

              {/* Featured Projects */}
              {/* <div className="flex items-start gap-6">
                <div className="w-[180px] text-[14px] leading-tight text-gray-500 tracking-wide flex-shrink-0 whitespace-nowrap">
                  Featured Projects
                </div>
                <div className="text-[14px] font-semibold text-gray-900 flex-1">
                  {formData.featured_projects ? "Yes" : "No"}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
