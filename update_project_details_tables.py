#!/usr/bin/env python3
"""
Script to update all tables in ProjectDetails.tsx to use modern shadcn/ui Table components
"""

import re

# Read the file
with open('src/pages/ProjectDetails.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the table sections we need to update (after Banner Images which is already done)
table_sections = [
    {
        'title': 'Gallery Images',
        'key': 'gallery',
        'data_var': 'formData.gallery_image'
    },
    {
        'title': 'Floor Plan',
        'key': 'floor_plan',
        'data_var': 'formData.project_2d_image'
    },
    {
        'title': 'Brochure',
        'key': 'brochure',
        'data_var': 'formData.brochure',
        'single': True
    },
    {
        'title': 'Project PPT',
        'key': 'ppt',
        'data_var': 'formData.ProjectPPT',
        'single': True
    },
    {
        'title': 'Project Layout',
        'key': 'layout',
        'data_var': 'formData.project_layout'
    },
    {
        'title': 'Project Creatives',
        'key': 'creatives',
        'data_var': 'formData.project_creatives'
    },
    {
        'title': 'Project Creatives Generics',
        'key': 'creatives_generics',
        'data_var': 'formData.project_creative_generics'
    },
    {
        'title': 'Project Creatives Offers',
        'key': 'creatives_offers',
        'data_var': 'formData.project_creative_offers'
    },
    {
        'title': 'Project Interiors',
        'key': 'interiors',
        'data_var': 'formData.project_interiors'
    },
    {
        'title': 'Project Exteriors',
        'key': 'exteriors',
        'data_var': 'formData.project_exteriors'
    },
    {
        'title': 'Project Emailer Template',
        'key': 'emailer',
        'data_var': 'formData.project_emailer_templetes'
    },
    {
        'title': 'Videos',
        'key': 'videos',
        'data_var': 'formData.videos'
    },
]

print("This script will help identify the table patterns.")
print("Manual replacement is recommended for safety.")
print("\nTable sections found:")
for section in table_sections:
    print(f"  - {section['title']}")

print("\nPlease update tables manually using the shadcn/ui Table component pattern.")
print("Pattern to follow:")
print("""
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
      {/* table body content with TableRow, TableCell */}
    </TableBody>
  </Table>
</div>
""")
