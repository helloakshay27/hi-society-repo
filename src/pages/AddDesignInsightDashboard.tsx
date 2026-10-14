
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BasicDetailsSection } from '@/components/BasicDetailsSection';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { ActionButtons } from '@/components/ActionButtons';
import { ArrowLeft, ChevronRight } from 'lucide-react';


export const AddDesignInsightDashboard = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [subCategories, setSubCategories] = useState<{ id: number; name: string; parent_id: number | null }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const baseUrl = localStorage.getItem('baseUrl');
        const token = localStorage.getItem('token');
        if (!baseUrl || !token) return;
        const res = await fetch(`https://${baseUrl}/pms/design_input_tags.json`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        const cats = (data.data || []).filter((item: any) => item.parent_id === null && item.tag_type === 'DesignInputCategory');
        const subCats = (data.data || []).filter((item: any) => item.parent_id !== null && item.tag_type === 'DesignInputsSubCategory');
        setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
        setSubCategories(subCats.map((sc: any) => ({ id: sc.id, name: sc.name, parent_id: sc.parent_id })));
      } catch (err) {
        setCategories([]);
        setSubCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const [site, setSite] = useState('');
  const [location, setLocation] = useState('');
  const [categorization, setCategorization] = useState('');
  const [observation, setObservation] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [tag, setTag] = useState('');
  const [mustHave, setMustHave] = useState(false);
  const [siteList, setSiteList] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const baseUrl = localStorage.getItem('baseUrl');
        const token = localStorage.getItem('token');
        if (!baseUrl || !token) return;
        const res = await fetch(`https://${baseUrl}/sitelist.json`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch sites');
        const data = await res.json();
        setSiteList(data.sites || []);
      } catch (err) {
        setSiteList([]);
      }
    };
    fetchSites();
  }, []);

  const onAttachmentsChange = (files: File[]) => {
    setAttachments(files);
  };

  const handleSave = async () => {
    console.log("clicked")
    try {
      const baseUrl = localStorage.getItem('baseUrl');
      const token = localStorage.getItem('token');
      if (!baseUrl || !token) throw new Error('Missing baseUrl or token');

      const formData = new FormData();
      formData.append('pms_design_input[category_id]', category);
      formData.append('pms_design_input[sub_category_id]', subCategory);
      formData.append('pms_design_input[sub_location_name]', location);
      formData.append('pms_design_input[categorization]', categorization);
      formData.append('pms_design_input[observation]', observation);
      formData.append('pms_design_input[recommendation]', recommendation);
      formData.append('pms_design_input[tag]', tag);
      formData.append('pms_design_input[must_have]', mustHave ? '1' : '0');
      formData.append('pms_design_input[site_id]', site);
      // Append attachments
      attachments.forEach((file) => {
        formData.append('designinput[]', file);
      });

      const res = await fetch(`https://${baseUrl}/pms/design_inputs.json`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const responseBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('POST error:', responseBody);
        throw new Error(responseBody?.error || 'Failed to save Design Insight');
      }
      console.log('POST success:', responseBody);
      toast.success('Design Insight saved successfully!');
      navigate('/transitioning/design-insight');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Design Insight');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMustHaveChange = (checked: boolean | "indeterminate") => {
    setMustHave(checked === true);
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen design-insight-add-page">
      <style>{`
        /* ---- Reference design: canvas, card, fields ---- */
        html body #root .design-insight-add-page {
          background-color: #FDFDFB !important;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-root {
          min-height: 44px;
          border-radius: 12px !important;
          background-color: #FFFFFF !important;
          font-size: 13.5px !important;
          font-weight: 500;
          color: #1A1A18;
          transition: box-shadow 0.16s ease;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.08) !important;
          border-radius: 12px !important;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
          border-color: rgba(26, 26, 24, 0.28) !important;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
          border-color: #1A1A18 !important;
          border-width: 1px !important;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-root.Mui-focused {
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
        }
        html body #root .design-insight-add-page .MuiOutlinedInput-input::placeholder,
        html body #root .design-insight-add-page textarea::placeholder {
          color: rgba(26, 26, 24, 0.3) !important;
          opacity: 1 !important;
        }
        html body #root .design-insight-add-page .MuiInputLabel-root {
          color: rgba(26, 26, 24, 0.68) !important;
          font-weight: 600 !important;
        }
        html body #root .design-insight-add-page textarea:focus {
          border-color: #1A1A18 !important;
          box-shadow: 0 0 0 4px rgba(26, 26, 24, 0.1) !important;
          outline: none;
        }
      `}</style>
      {/* Header */}
      {/* <div className="mb-6">
        <p className="text-gray-600 mb-2 text-sm">Design Insight &gt; NEW Design Insight</p>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] uppercase">NEW DESIGN INSIGHT</h1>
      </div> */}
      {/* Header */}
      <div className="mb-[22px]">
        <div className="flex items-center gap-2 text-[13px] font-medium mb-3" style={{ color: "rgba(26, 26, 24, 0.48)" }}>
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#F5F4F0] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span>Design Insight List</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold" style={{ color: "#1A1A18" }}>Create New Design Insight</span>
        </div>
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]" style={{ color: "#1A1A18" }}>New Design Insight</h1>
      </div>


      {/* Basic Details Section */}
      <BasicDetailsSection
        category={category}
        setCategory={setCategory}
        subCategory={subCategory}
        setSubCategory={setSubCategory}
        site={site}
        setSite={setSite}
        location={location}
        setLocation={setLocation}
        categorization={categorization}
        setCategorization={setCategorization}
        observation={observation}
        setObservation={setObservation}
        recommendation={recommendation}
        setRecommendation={setRecommendation}
        tag={tag}
        setTag={setTag}
        mustHave={mustHave}
        handleMustHaveChange={handleMustHaveChange}
        siteList={siteList}
        categories={categories}
        subCategories={subCategories}
        attachments={attachments}
        onAttachmentsChange={onAttachmentsChange}
      />
      {/* Action Buttons */}
      <ActionButtons onSave={handleSave} onBack={handleBack} />
    </div>
  );
};

export default AddDesignInsightDashboard;
