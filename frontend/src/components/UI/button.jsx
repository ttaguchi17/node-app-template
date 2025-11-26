import React from "react";

export function Button({ children, className = "", ...rest }) {
  return (
    <button className={`px-4 py-2 rounded-md ${className}`} {...rest}>
      {children}
    </button>
  );
}
