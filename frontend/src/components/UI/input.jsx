import React from "react";

export function Input({ className = "", ...rest }) {
  return (
    <input
      className={`border rounded px-3 py-2 ${className}`}
      {...rest}
    />
  );
}
