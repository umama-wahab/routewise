import React, { useEffect, useRef, useState } from "react";
import { suggestLocations } from "../api/client.js";

let idCounter = 0;
function useStableId(prefix) {
  const ref = useRef(null);
  if (ref.current === null) {
    idCounter += 1;
    ref.current = `${prefix}-${idCounter}`;
  }
  return ref.current;
}

const DEBOUNCE_MS = 350;
const MIN_CHARS = 3;

/**
 * A text field that suggests real addresses as the person types (min 3
 * characters), similar to Google Maps. Selecting a suggestion fills the
 * field with its full label; the parent only ever receives plain strings.
 */
export default function LocationAutocomplete({ icon, label, placeholder, value, onChange, error }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const abortControllerRef = useRef(null);
  const listboxId = useStableId("location-listbox");

  useEffect(() => {
    const query = (value || "").trim();

    if (query.length < MIN_CHARS) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(async () => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const results = await suggestLocations(query, controller.signal);
      if (controller.signal.aborted) return;

      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
      setIsLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion) {
    onChange(suggestion.label);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  function handleKeyDown(event) {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      if (highlightedIndex >= 0) {
        event.preventDefault();
        selectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label" htmlFor={listboxId}>
        {label}
      </label>

      <div className={`input-shell ${error ? "border-error focus-within:border-error focus-within:ring-error/15" : ""}`}>
        <span className="input-shell-icon">{icon}</span>
        <input
          id={listboxId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${listboxId}-list`}
          autoComplete="off"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        />
        {isLoading && (
          <span
            className="mr-3.5 w-4 h-4 shrink-0 rounded-full border-2 border-border border-t-accent animate-spin"
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={`${listboxId}-list`}
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 card p-1.5 max-h-64 overflow-auto animate-fade-in-up"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.lat}-${suggestion.lon}-${index}`}
              role="option"
              aria-selected={index === highlightedIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`px-3.5 py-2.5 rounded-[14px] text-body cursor-pointer transition-colors ${
                index === highlightedIndex ? "bg-accent/10 text-accent" : "text-ink hover:bg-bg"
              }`}
            >
              {suggestion.label}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-caption text-error mt-1.5">{error}</p>}
    </div>
  );
}
