import React from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

export default function ErrorCard({ title, message, onRetry }) {
  return (
    <div className="card p-7 border-error/20 bg-error/5 animate-fade-in-up flex items-start gap-4" role="alert">
      <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0">
        <HiOutlineExclamationTriangle size={20} />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-ink">{title || "Something went wrong"}</p>
        <p className="text-body text-muted mt-1">{message}</p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="text-caption font-semibold text-accent mt-3 hover:underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
