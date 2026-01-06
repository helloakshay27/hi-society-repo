# Event Create Multi-Step UI Implementation Guide

## Overview
This guide provides the complete implementation for converting the Event Create page into a multi-step form UI similar to the AMC page design with 4 steps:
1. Event Details
2. Invite CPs  
3. QR Code Generation
4. Event Related Images

## Step 1: Add Required Imports

Add these imports at the top of EventCreate.tsx:

```typescript
import { Box, Avatar } from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { X, Plus } from "lucide-react";
```

## Step 2: Add Step Management State

After the existing state declarations, add:

```typescript
// Step management state
const [currentStep, setCurrentStep] = useState(0);
const [completedSteps, setCompletedSteps] = useState<number[]>([]);
const [showPreviousSections, setShowPreviousSections] = useState(false);
const [isPreviewMode, setIsPreviewMode] = useState(false);
const totalSteps = 4;
```

## Step 3: Add Step Navigation Functions

Add these functions before the return statement:

```typescript
// Step navigation functions
const goToNextStep = () => {
  if (!completedSteps.includes(currentStep)) {
    setCompletedSteps(prev => [...prev, currentStep]);
  }
  if (currentStep < totalSteps - 1) {
    setCurrentStep(currentStep + 1);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToPreviousStep = () => {
  if (currentStep > 0) {
    setCurrentStep(currentStep - 1);
    setShowPreviousSections(true);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const goToStep = (step: number) => {
  if (step <= currentStep || completedSteps.includes(step)) {
    setCurrentStep(step);
    setShowPreviousSections(true);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleStepClick = (step: number) => {
  if (isPreviewMode) {
    const ids = ['section-event-details', 'section-invite-cps', 'section-qr-code', 'section-event-images'];
    const target = document.getElementById(ids[step]);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return;
  }

  if (step > currentStep) {
    for (let i = 0; i < step; i++) {
      if (!completedSteps.includes(i)) {
        toast.error(`Please complete step ${i + 1} before proceeding to step ${step + 1}.`);
        return;
      }
    }
  }

  if (step > currentStep) {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
  }
  setCurrentStep(step);
  setShowPreviousSections(false);
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 100);
};

const handleProceedToSave = () => {
  if (!completedSteps.includes(currentStep)) {
    setCompletedSteps(prev => [...prev, currentStep]);
  }

  if (currentStep === totalSteps - 1) {
    setIsPreviewMode(true);
    setShowPreviousSections(true);
  } else {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
    setShowPreviousSections(false);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleSaveToDraft = () => {
  if (!completedSteps.includes(currentStep)) {
    setCompletedSteps(prev => [...prev, currentStep]);
  }

  if (currentStep < totalSteps - 1) {
    setCurrentStep(currentStep + 1);
  }
  setShowPreviousSections(true);
  toast.success("Progress saved to draft successfully!");
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

## Step 4: Add Stepper Component

```typescript
const StepperComponent = () => {
  const steps = ['Event Details', 'Invite CPs', 'QR Code Generation', 'Event Related Images'];

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        gap: 0
      }}>
        {steps.map((label, index) => (
          <Box key={`step-${index}`} sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: '213px',
                height: '50px',
                padding: '5px',
                borderRadius: '4px',
                boxShadow: '0px 4px 14.2px 0px rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Box
                onClick={() => handleStepClick(index)}
                sx={{
                  cursor: (index > currentStep && !completedSteps.includes(index - 1)) ? 'not-allowed' : 'pointer',
                  width: '187px',
                  height: '40px',
                  backgroundColor: (index === currentStep || completedSteps.includes(index)) ? '#C72030' :
                    (index > currentStep && !completedSteps.includes(index - 1)) ? 'rgba(245, 245, 245, 1)' : 'rgba(255, 255, 255, 1)',
                  color: (index === currentStep || completedSteps.includes(index)) ? 'white' :
                    (index > currentStep && !completedSteps.includes(index - 1)) ? 'rgba(150, 150, 150, 1)' : 'rgba(196, 184, 157, 1)',
                  border: (index === currentStep || completedSteps.includes(index)) ? '2px solid #C72030' :
                    (index > currentStep && !completedSteps.includes(index - 1)) ? '1px solid rgba(200, 200, 200, 1)' : '1px solid rgba(196, 184, 157, 1)',
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: index === currentStep ? '0 2px 4px rgba(199, 32, 48, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Work Sans, sans-serif',
                  position: 'relative',
                  borderRadius: '4px',
                  '&:hover': {
                    opacity: (index > currentStep && !completedSteps.includes(index - 1)) ? 1 : 0.9
                  },
                  '&::before': completedSteps.includes(index) && index !== currentStep ? {
                    content: '"✓"',
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  } : {}
                }}
              >
                {label}
              </Box>
            </Box>
            {index < steps.length - 1 && (
              <Box
                sx={{
                  width: '60px',
                  height: '0px',
                  border: '1px dashed rgba(196, 184, 157, 1)',
                  borderWidth: '1px',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(196, 184, 157, 1)',
                  opacity: 1,
                  margin: '0 0px',
                  '@media (max-width: 1200px)': {
                    width: '40px'
                  },
                  '@media (max-width: 900px)': {
                    width: '30px'
                  },
                  '@media (max-width: 600px)': {
                    width: '20px'
                  }
                }}
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
```

## Step 5: Update Return Statement Structure

Replace the entire return statement with this structure:

```tsx
return (
  <div className="p-6 bg-gray-50 min-h-screen" style={{ backgroundColor: '#FAF9F7' }}>
    {/* Stepper Component - Hide in preview mode */}
    {!isPreviewMode && <StepperComponent />}

    {/* Preview Mode - Show all sections */}
    {isPreviewMode && (
      <div className="px-4 md:px-6 py-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center mb-6">
          <span className="font-bold text-orange-600">Preview</span>
        </div>

        {/* All completed sections shown here in preview */}
        {/* Step 1: Event Details Preview */}
        {/* Step 2: Invite CPs Preview */}
        {/* Step 3: QR Code Preview */}
        {/* Step 4: Images Preview */}

        {/* Preview Mode Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={() => setIsPreviewMode(false)}
            className="px-6 py-2 font-medium bg-white text-[#C72030] border border-[#C72030] rounded"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 font-medium bg-[#C72030] text-white rounded"
          >
            {loading ? 'Saving...' : 'Proceed to Save'}
          </button>
        </div>
      </div>
    )}

    {/* Step 1: Event Details */}
    {currentStep === 0 && !isPreviewMode && (
      <>
        <div className="flex items-center mb-4">
          <Avatar sx={{
            bgcolor: '#C72030',
            color: 'white',
            width: 32,
            height: 32,
            mr: 2,
            fontSize: '16px'
          }}>
            <SettingsOutlinedIcon fontSize="small" />
          </Avatar>
          <h2 className="text-[#C72030]" style={{
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 600,
            fontSize: '26px',
            lineHeight: '100%',
            letterSpacing: '0%'
          }}>
            Event Details
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6" style={{
          boxShadow: '0 4px 14.2px 0 rgba(0, 0, 0, 0.10)'
        }}>
          <div className="px-6 py-3 border-b border-gray-200" style={{ backgroundColor: '#F6F4EE' }}>
            <h3 className="text-lg font-medium text-gray-900">Event Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Your existing Event Details form fields */}
          </div>
        </div>
      </>
    )}

    {/* Step 2: Invite CPs */}
    {currentStep === 1 && !isPreviewMode && (
      <>
        <div className="flex items-center mb-4">
          <Avatar sx={{
            bgcolor: '#C72030',
            color: 'white',
            width: 32,
            height: 32,
            mr: 2,
            fontSize: '16px'
          }}>
            <SettingsOutlinedIcon fontSize="small" />
          </Avatar>
          <h2 className="text-[#C72030]" style={{
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 600,
            fontSize: '26px',
            lineHeight: '100%',
            letterSpacing: '0%'
          }}>
            Invite CPs
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6" style={{
          boxShadow: '0 4px 14.2px 0 rgba(0, 0, 0, 0.10)'
        }}>
          <div className="p-6 space-y-6">
            {/* CP Selection and CSV Upload */}
          </div>
        </div>
      </>
    )}

    {/* Step 3: QR Code Generation */}
    {currentStep === 2 && !isPreviewMode && (
      <>
        <div className="flex items-center mb-4">
          <Avatar sx={{
            bgcolor: '#C72030',
            color: 'white',
            width: 32,
            height: 32,
            mr: 2,
            fontSize: '16px'
          }}>
            <SettingsOutlinedIcon fontSize="small" />
          </Avatar>
          <h2 className="text-[#C72030]" style={{
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 600,
            fontSize: '26px',
            lineHeight: '100%',
            letterSpacing: '0%'
          }}>
            QR Code Generation
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6" style={{
          boxShadow: '0 4px 14.2px 0 rgba(0, 0, 0, 0.10)'
        }}>
          <div className="p-6">
            {/* QR Code generation interface */}
          </div>
        </div>
      </>
    )}

    {/* Step 4: Event Related Images */}
    {currentStep === 3 && !isPreviewMode && (
      <>
        <div className="flex items-center mb-4">
          <Avatar sx={{
            bgcolor: '#C72030',
            color: 'white',
            width: 32,
            height: 32,
            mr: 2,
            fontSize: '16px'
          }}>
            <SettingsOutlinedIcon fontSize="small" />
          </Avatar>
          <h2 className="text-[#C72030]" style={{
            fontFamily: 'Work Sans, sans-serif',
            fontWeight: 600,
            fontSize: '26px',
            lineHeight: '100%',
            letterSpacing: '0%'
          }}>
            Event Related Images
          </h2>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6" style={{
          boxShadow: '0 4px 14.2px 0 rgba(0, 0, 0, 0.10)'
        }}>
          <div className="p-6">
            {/* Cover Image and Event Gallery uploads */}
          </div>
        </div>
      </>
    )}

    {/* Step Navigation Buttons - Hide in preview mode */}
    {!isPreviewMode && (
      <div className="flex gap-4 justify-center mt-8">
        {currentStep < totalSteps - 1 ? (
          <>
            <button
              type="button"
              onClick={handleProceedToSave}
              className="px-6 py-2 font-medium bg-[#C72030] text-white border-none rounded"
            >
              Proceed to save
            </button>
            <button
              type="button"
              onClick={handleSaveToDraft}
              className="px-6 py-2 font-medium bg-white text-[#C72030] border border-[#C72030] rounded"
            >
              Save to draft
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                if (!completedSteps.includes(currentStep)) {
                  setCompletedSteps([...completedSteps, currentStep]);
                }
                setIsPreviewMode(true);
                setShowPreviousSections(true);
              }}
              className="px-6 py-2 font-medium bg-[#C72030] text-white border-none rounded"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={handleSaveToDraft}
              className="px-6 py-2 font-medium bg-white text-[#C72030] border border-[#C72030] rounded"
            >
              Save to draft
            </button>
          </>
        )}
      </div>
    )}

    {/* Progress indicator - Hide in preview mode */}
    {!isPreviewMode && (
      <div className="text-center mt-4 text-sm text-gray-600">
        You've completed {completedSteps.length} out of {totalSteps} steps.
      </div>
    )}
  </div>
);
```

## Key Features Implemented

1. **4-Step Process**: Event Details → Invite CPs → QR Code Generation → Event Related Images
2. **Visual Stepper**: Matching AMC page design with color-coded steps
3. **Step Navigation**: Click on completed steps to navigate
4. **Progress Tracking**: Visual indicators for completed steps
5. **Preview Mode**: Review all data before final submission
6. **Draft Saving**: Save progress and continue later
7. **Responsive Design**: Adapts to different screen sizes

## Color Scheme

- Active Step: `#C72030` (Red)
- Completed Step: `#C72030` with checkmark
- Future Step: Gray (`rgba(245, 245, 245, 1)`)
- Background: `#FAF9F7`
- Card Header: `#F6F4EE`

## Next Steps

1. Move existing form sections into their respective steps
2. Add validation for each step
3. Implement draft save/load functionality with localStorage
4. Add preview mode content for all steps
5. Test navigation and data persistence

This implementation follows the exact same pattern as the AMC page for consistency across the application.
