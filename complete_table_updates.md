# Remaining Table Updates for ProjectDetails.tsx

The following tables still need to be updated to use shadcn/ui Table components:

## Tables Already Updated ✅
1. Project Banner Images
2. Project Cover Images  
3. Gallery Images
4. Floor Plan (first occurrence)

## Tables Remaining to Update:

### 5. Brochure
### 6. Project PPT
### 7. Floor Plan (second occurrence - two_d_images)
### 8. Project Layout
### 9. Project Creatives
### 10. Project Creatives Generics
### 11. Project Creatives Offers
### 12. Project Interiors
### 13. Project Exteriors
### 14. Project Emailer Template
### 15. Videos

## Standard Pattern for Each Table:

Replace:
```tsx
<div className="col-md-12 mt-2">
  <h5 className=" ">Table Title</h5>
  <div className="mt-4 tbl-container">
    <table className="w-100">
      <thead>
        <tr>
          <th>File Name</th>
          <th>File Type</th>
          <th>updated at</th>
          <th>Image</th>
        </tr>
      </thead>
      <tbody>
        {/* table body content */}
      </tbody>
    </table>
  </div>
</div>
```

With:
```tsx
<div className="mt-4">
  <h4 className="text-base font-semibold text-gray-900 mb-3">Table Title</h4>
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
        {/* updated table body content */}
      </TableBody>
    </Table>
  </div>
</div>
```

## Table Body Pattern:

Replace `<tr>` with `<TableRow className="hover:bg-gray-50">`
Replace `<td>` with `<TableCell className="text-gray-900 py-3 px-4">` or `<TableCell className="py-3 px-4">` for images
Replace images with: `<img src={url} alt={alt} className="w-20 h-20 object-cover rounded" />`

Remove all download button SVG code - keep only image display.

## Empty State Pattern:

```tsx
<TableRow>
  <TableCell colSpan={4} className="text-center py-8 text-gray-600">
    No [Table Name] Available
  </TableCell>
</TableRow>
```
