import React from "react";

export function Card({ children, className = "", ...rest }) {
  return (
    <div className={`rounded-2xl p-4 bg-white ${className}`} {...rest}>
      {children}
    </div>
  );
}
