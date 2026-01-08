# Noticeboard/Broadcast File Upload Improvements

## Summary
Simplified file upload process for Noticeboard/Broadcast forms by removing the cropping modal requirement and expanding file type support to include PDFs and other document formats.

## Changes Made

### 1. BroadcastCreate.tsx

#### Broadcast Cover Image
- **Removed**: ImageCropUploader modal functionality (setShowCoverUploader)
- **Added**: Direct file input with hidden input element (id="coverImageInput")
- **Modified**: Add button now triggers direct file selection via `document.getElementById('coverImageInput')?.click()`
- **File Validation**: 
  - Maximum size: 3MB for images
  - File type: image/* only
  - Multiple file selection supported
- **User Feedback**: Toast notifications for file size errors and successful uploads
- **Cursor Fix**: Changed cursor-help to cursor-pointer for info icon tooltip

#### Broadcast Attachment
- **Removed**: ImageCropUploader modal functionality (setShowBroadcastUploader)
- **Added**: Direct file input with expanded file type support (id="broadcastAttachmentInput")
- **Modified**: Add button now triggers direct file selection
- **File Types Supported**:
  - Images: image/* (3MB max)
  - Videos: video/* (10MB max)
  - PDFs: application/pdf (10MB max)
  - Documents: .doc, .docx, .xls, .xlsx, .txt (10MB max)
- **File Validation**: 
  - Different size limits based on file type
  - Type detection for proper handling
- **Preview Enhancement**: 
  - Videos: Video preview with controls
  - Images: Image thumbnail
  - Documents: FileText icon from lucide-react
- **Type Detection**: Added logic to identify document files and display appropriate preview
- **User Feedback**: Toast notifications with specific size limits for each file type
- **Cursor Fix**: Changed cursor-help to cursor-pointer for info icon tooltip

### 2. NoticeboardEdit.tsx

#### Broadcast Cover Image
- **Removed**: ImageCropUploader modal functionality (setShowCoverUploader)
- **Added**: Direct file input with hidden input element (id="editCoverImageInput")
- **Modified**: Upload button now triggers direct file selection
- **File Validation**: 
  - Maximum size: 3MB for images
  - File type: image/* only
  - Multiple file selection supported
- **User Feedback**: Toast notifications for file size errors and successful uploads

#### Broadcast Attachment
- **Removed**: ImageCropUploader modal functionality (setShowBroadcastUploader)
- **Added**: Direct file input with expanded file type support (id="editBroadcastAttachmentInput")
- **Modified**: Upload button now triggers direct file selection
- **File Types Supported**: Same as BroadcastCreate.tsx
  - Images: image/* (3MB max)
  - Videos: video/* (10MB max)
  - PDFs: application/pdf (10MB max)
  - Documents: .doc, .docx, .xls, .xlsx, .txt (10MB max)
- **File Validation**: Same validation logic as create page
- **Preview Enhancement**: 
  - Videos: Video preview with controls
  - Images: Image thumbnail
  - Documents: FileText icon from lucide-react
- **Type Detection**: Added logic to identify document files and display appropriate preview
- **User Feedback**: Toast notifications with specific size limits for each file type

## Technical Details

### File Upload Flow (Cover Image)
1. User clicks "Add" or "+ Upload" button
2. Hidden file input is programmatically clicked
3. User selects image file(s) from their device
4. File size validation (3MB max)
5. Files are added directly to formData with preview URLs
6. Success toast notification shown
7. Files appear in the table with preview

### File Upload Flow (Broadcast Attachment)
1. User clicks "Add" or "+ Upload" button
2. Hidden file input is programmatically clicked
3. User selects file(s) of any supported type
4. File type is detected (image/video/document)
5. Size validation based on file type:
   - Images: 3MB max
   - Videos: 10MB max
   - PDFs/Docs: 10MB max
6. Files are added to formData with appropriate type flag
7. Success toast notification shown
8. Files appear in table with appropriate preview:
   - Images: Thumbnail preview
   - Videos: Video preview
   - Documents: FileText icon

### File Object Structure
```typescript
{
  file: File,              // The actual file object
  name: string,           // File name
  preview: string | null, // Object URL for images/videos, null for documents
  ratio: string,          // Aspect ratio (default '1:1')
  type: 'image' | 'video' | 'document', // File type classification
  id: string             // Unique identifier
}
```

### Preview Display Logic
- **Documents**: Display FileText icon (no preview URL needed)
- **Videos**: Display video element with controls
- **Images**: Display img element with preview URL

## Benefits

1. **Simplified User Experience**: No need to go through cropping interface for images that don't require specific aspect ratios
2. **Expanded File Support**: Users can now attach PDFs and other document formats to broadcasts
3. **Direct Upload**: Faster workflow with immediate file selection
4. **Consistent UX**: Same cursor behavior (pointer) for all tooltips
5. **Clear Feedback**: Toast notifications inform users of file size limits and upload status
6. **Proper Validation**: File size limits enforced based on file type
7. **Visual Clarity**: Document files shown with icon instead of broken image preview

## Files Modified
- `/src/pages/BroadcastCreate.tsx`
- `/src/pages/NoticeboardEdit.tsx`

## Dependencies
- `lucide-react`: FileText icon component (already imported)
- `sonner`: Toast notifications (already in use)

## Testing Recommendations
1. Test uploading images under and over 3MB limit
2. Test uploading PDFs under and over 10MB limit
3. Test uploading videos under and over 10MB limit
4. Test uploading various document formats (.doc, .docx, .xls, .xlsx, .txt)
5. Verify preview displays correctly for each file type
6. Test multiple file selection at once
7. Verify file removal functionality still works
8. Confirm files are properly submitted with form data
9. Test tooltip cursor behavior (should show pointer, not help cursor)
10. Verify toast notifications appear with correct messages

## Notes
- File cropping functionality is bypassed completely for both forms
- All previous file handling logic (formData management, file removal) remains unchanged
- The form submission logic already supports file arrays and doesn't need modification
- FileText icon from lucide-react is used to represent document files in preview
