import React from "react";

function Switch({ checked, onCheckedChange }) {
  return (
    <label className="switch">
      <input type="checkbox" checked={checked} onChange={() => onCheckedChange(!checked)} />
      <span className="slider round"></span>
    </label>
  );
}

export default Switch;