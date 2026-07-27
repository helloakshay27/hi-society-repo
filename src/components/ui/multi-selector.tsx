import React from "react";
import Select from "react-select";

export default function MultiSelectBox({
  options,
  value,
  onChange,
  placeholder,
  disabled = false
}) {
  const customStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "35px", // Reduce the height of the box
      // height: "30px", // Explicit height control
      padding: "0px 4px",
      //overflowY: "auto",
      position: "relative",
      zIndex: 10,
      border: "1px solid #ccc",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(128, 189, 255, 0.5)" : base.boxShadow,


    }),

    valueContainer: (base) => ({
      ...base,
      overflowY: "auto",
      //padding: "0px 6px", // Reduce padding inside the box
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "32px", // Match the control height
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      position: "absolute",
      top: "100%",
      padding: "5px",
    }),
    option: (base, state) => ({
      ...base,
      zIndex: 9999,
      backgroundColor: state.isSelected
        ? "#D3D3D3"
        : state.isFocused
          ? "#ED820E"
          : "transparent",
      color: state.isSelected ? "#333" : state.isFocused ? "white" : "black",
      cursor: "pointer",
      padding: "10px",
      borderRadius: "4px",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#333",
      backgroundColor: "transparent",
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#e5e7eb",
      color: "#374151",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "#374151",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#6b7280",
      cursor: "pointer",
      ":hover": {
        backgroundColor: "#d1d5db",
        color: "#374151",
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "hsl(0, 0%, 80%)",
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "hsl(0, 0%, 80%)",
    }),
  };

  return (
    <Select
      isMulti
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="basic-multi-select"
      classNamePrefix="select"
      styles={customStyles}
      isDisabled={disabled}
    />
  );
}
