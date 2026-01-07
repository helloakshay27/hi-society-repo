import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { TextField } from '@mui/material';

const AddNoticePage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expireDate: '',
    expireTime: '',
    markAsImportant: false,
    sendEmail: false,
    shareWith: 'all',
    selectedFile: null as File | null,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        selectedFile: file,
      }));
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    // Here you would typically send the data to your backend
    toast.success('Notice created successfully!');
    navigate('/communication/notice');
  };

  const handleBack = () => {
    navigate('/communication/notice');
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3 px-6 pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-[#1A1A1A]" />
          </Button>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Add Notice</h1>
        </div>

        {/* NOTICE INFO Header */}
        <div className="mb-3 px-6">
          <div className="bg-[#C4B89D54] text-[#1A1A1A] px-4 py-2 rounded font-medium">
            NOTICE INFO
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 mx-6 mb-6">
          {/* Title */}
<div className="p-6">
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">

    
    <TextField
      label="Title"
      name="name"
      placeholder="Title"
      value={formData.title}
      onChange={(e) => handleInputChange('title', e.target.value)}
      fullWidth
      variant="outlined"
    />

    {/* Notice Expire on Date */}
    <TextField
      label="Notice Expire on Date"
      type="date"
      placeholder="Enter date"
      value={formData.expireDate}
      onChange={(e) => handleInputChange('expireDate', e.target.value)}
      fullWidth
      variant="outlined"
    />

    {/* Time */}
    <TextField
      label="Time"
      type="time"
      placeholder="Select Time"
      value={formData.expireTime}
      onChange={(e) => handleInputChange('expireTime', e.target.value)}
      fullWidth
      variant="outlined"
    />

  </div>

{/* Description Field */}
            <div className="mb-8 mt-8 relative">
          <label className="absolute -top-3 left-3 bg-white px-2 text-sm font-medium text-[#1a1a1a]">
            Description
          </label>
      <textarea
           id="notice-description"
           value={formData.description}
           onChange={(e) => handleInputChange('description', e.target.value)}
           className="w-full px-4 py-3 border border-[#D5DbDB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent resize-vertical"
          placeholder="Enter notice description"
          rows={8}
         />
</div>



            {/* Checkboxes */}
            <div className="flex gap-8 mb-6 ml-6">
              <div className="flex items-center gap-2">
              
                <Checkbox
                  id="markAsImportant"
                  checked={formData.markAsImportant}
                  onCheckedChange={(checked) => handleInputChange('markAsImportant', checked)}
                  className="border-gray-400 data-[state=checked]:bg-[#C72030] data-[state=checked]:border-[#C72030]"
                />
                <Label
                  htmlFor="markAsImportant"
                  className="text-sm font-normal text-[#1A1A1A] cursor-pointer"
                >
                  Mark as Important
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onCheckedChange={(checked) => handleInputChange('sendEmail', checked)}
                  className="border-gray-400 data-[state=checked]:bg-[#C72030] data-[state=checked]:border-[#C72030]"
                />
                <Label
                  htmlFor="sendEmail"
                  className="text-sm font-normal text-[#1A1A1A] cursor-pointer"
                >
                  Send Email
                </Label>
              </div>
            </div>
          </div>

           {/* SHARE WITH Section */}
          
            <div className="bg-[#C4B89D54] text-[#1A1A1A] px-4 py-2 rounded font-medium mb-6">
              SHARE WITH
            </div>
            <div className="mb-8 ml-6">
            <RadioGroup
              value={formData.shareWith}
              onValueChange={(value) => handleInputChange('shareWith', value)}
              className="flex gap-8"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="all"
                  id="all"
                  className="border-gray-400 text-[#C72030] focus:ring-[#C72030]"
                />
                <Label
                  htmlFor="all"
                  className="text-sm font-normal text-[#1A1A1A] cursor-pointer"
                >
                  All
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="individuals"
                  id="individuals"
                  className="border-gray-400 text-[#C72030] focus:ring-[#C72030]"
                />
                <Label
                  htmlFor="individuals"
                  className="text-sm font-normal text-[#1A1A1A] cursor-pointer"
                >
                  Individuals
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <RadioGroupItem
                  value="groups"
                  id="groups"
                  className="border-gray-400 text-[#C72030] focus:ring-[#C72030]"
                />
                <Label
                  htmlFor="groups"
                  className="text-sm font-normal text-[#1A1A1A] cursor-pointer"
                >
                  Groups
                </Label>
              </div>
            </RadioGroup>
          </div>

         {/* UPLOAD FILES Section */}
<div className="mb-8">
  <div className="bg-[#C4B89D54] text-[#1A1A1A] px-4 py-2 rounded font-medium mb-6">
    UPLOAD FILES
  </div>

  <div className="border border-gray-300 rounded-md p-6">
    <input
      type="file"
      id="fileUpload"
      className="hidden"
      onChange={handleFileSelect}
    />

    <label
      htmlFor="fileUpload"
      className="inline-flex items-center gap-3 px-5 py-2 bg-[#e0d9c859] rounded cursor-pointer hover:bg-[#EFEFEF]"
    >
      <span className="text-[#1A1A1A] font-medium">
        Upload Files
      </span>

      <Upload className="w-5 h-5 text-[#C72030]" />
    </label>

    {formData.selectedFile && (
      <p className="mt-3 text-sm text-gray-600">
        Selected: {formData.selectedFile.name}
      </p>
    )}
  </div>
</div>


         

          {/* Submit Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleSubmit}
              className="bg-[#C72030] hover:bg-[#A01A26] text-white px-12 py-2 rounded"
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNoticePage;
