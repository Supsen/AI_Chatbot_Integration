import React from "react";

export function Dialog({ open, children }) {
  if (!open) return null;
  return <div className="dialog-overlay">{children}</div>;
}

export function DialogContent({ children }) {
  return <div className="dialog-content">{children}</div>;
}

export function DialogHeader({ children }) {
  return <div className="dialog-header">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="dialog-title">{children}</h2>;
}