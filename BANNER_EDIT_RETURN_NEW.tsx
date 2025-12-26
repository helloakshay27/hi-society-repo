  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 transition-colors mr-2"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span>Banner List</span>
          <span>{">"}</span>
          <span className="text-gray-900 font-medium">Edit Banner</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">EDIT BANNER</h1>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-6">
        {/* Section: Banner Information */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="w-8 h-8 text-white rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#E5E0D3' }}>
                <FileText size={16} color="#C72030" />
              </span>
              Banner Information
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading banner data...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Title Input */}
                  <TextField
                    label="Title"
                    placeholder="Enter title"
                    value={formData.title}
                    onChange={handleChange}
                    name="title"
                    required
                    fullWidth
                    variant="outlined"
                    error={!!errors.title}
                    helperText={errors.title}
                    slotProps={{
                      inputLabel: {
                        shrink: true,
                      },
                    }}
                    InputProps={{
                      sx: fieldStyles,
                    }}
                  />

                  {/* Project Select */}
                  <FormControl
                    fullWidth
                    variant="outlined"
                    required
                    error={!!errors.project_id}
                    sx={{ '& .MuiInputBase-root': fieldStyles }}
                  >
                    <InputLabel shrink>Project</InputLabel>
                    <MuiSelect
                      value={formData.project_id}
                      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                      label="Project"
                      notched
                      displayEmpty
                    >
                      <MenuItem value="">Select Project</MenuItem>
                      {projects.map((project) => (
                        <MenuItem key={project.id} value={project.id}>
                          {project.project_name}
                        </MenuItem>
                      ))}
                    </MuiSelect>
                    {errors.project_id && (
                      <span className="text-red-500 text-xs mt-1">{errors.project_id}</span>
                    )}
                  </FormControl>

                  {/* Banner Attachment Upload */}
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Banner Attachment{" "}
                      <span
                        className="relative inline-block cursor-help"
                        onMouseEnter={() => setShowVideoTooltip(true)}
                        onMouseLeave={() => setShowVideoTooltip(false)}
                      >
                        <span className="text-blue-500">[i]</span>
                        {showVideoTooltip && (
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded whitespace-nowrap z-10">
                            Supports 1:1, 9:16, 16:9, 3:2 aspect ratios
                          </span>
                        )}
                      </span>
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowUploader(true)}
                      className="h-[45px] px-3 border border-gray-300 rounded-md text-left bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-gray-500 text-sm">Choose file</span>
                      <span className="text-xs text-gray-400">No file chosen</span>
                    </button>

                    {showUploader && (
                      <ProjectImageVideoUpload
                        onClose={() => setShowUploader(false)}
                        includeInvalidRatios={false}
                        selectedRatioProp={selectedRatios}
                        showAsModal={true}
                        label={dynamicLabel}
                        description={dynamicDescription}
                        onContinue={handleCropComplete}
                        allowVideos={true}
                      />
                    )}
                  </div>
                </div>

                {/* Media Table */}
                <div className="mt-6">
                  <div
                    className="rounded-lg border border-gray-200 overflow-hidden"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    <Table className="border-separate">
                      <TableHeader
                        className="sticky top-0 z-10"
                        style={{ backgroundColor: "#e6e2d8" }}
                      >
                        <TableRow className="hover:bg-gray-50">
                          <TableHead
                            className="font-semibold text-gray-900 py-3 px-4 border-r"
                            style={{ borderColor: "#fff" }}
                          >
                            File Name
                          </TableHead>
                          <TableHead
                            className="font-semibold text-gray-900 py-3 px-4 border-r"
                            style={{ borderColor: "#fff" }}
                          >
                            Preview
                          </TableHead>
                          <TableHead
                            className="font-semibold text-gray-900 py-3 px-4 border-r"
                            style={{ borderColor: "#fff" }}
                          >
                            Ratio
                          </TableHead>
                          <TableHead
                            className="font-semibold text-gray-900 py-3 px-4"
                            style={{ borderColor: "#fff" }}
                          >
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {project_banner.map(({ key, label }) => {
                          const files = Array.isArray(formData[key])
                            ? formData[key]
                            : formData[key]
                            ? [formData[key]]
                            : [];

                          return files.map((file, index) => {
                            const preview = file.preview || file.document_url || "";
                            const name = file.name || file.document_file_name || "Unnamed";
                            const isVideo =
                              file.type === "video" ||
                              file.file?.type?.startsWith("video/") ||
                              preview.endsWith(".mp4") ||
                              preview.endsWith(".webm") ||
                              preview.endsWith(".gif") ||
                              preview.endsWith(".ogg");

                            return (
                              <TableRow
                                key={`${key}-${index}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <TableCell className="py-3 px-4 font-medium">
                                  {name}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {isVideo ? (
                                    <video
                                      controls
                                      className="rounded border border-gray-200"
                                      style={{ maxWidth: 100, maxHeight: 100 }}
                                    >
                                      <source
                                        src={preview}
                                        type={
                                          file.file?.type ||
                                          `video/${preview.split(".").pop()}`
                                        }
                                      />
                                      Your browser does not support the video tag.
                                    </video>
                                  ) : (
                                    <img
                                      className="rounded border border-gray-200"
                                      style={{ maxWidth: 100, maxHeight: 100 }}
                                      src={preview}
                                      alt={name}
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  {file.ratio || label}
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <button
                                    type="button"
                                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleFetchedDiscardGallery(key, index, file.id)}
                                  >
                                    ×
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })}
                        {project_banner.every(
                          ({ key }) =>
                            !formData[key] ||
                            (Array.isArray(formData[key]) && formData[key].length === 0)
                        ) && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-12 text-gray-500"
                            >
                              No files uploaded yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#C72030] hover:bg-[#B8252F] text-white px-8 py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
