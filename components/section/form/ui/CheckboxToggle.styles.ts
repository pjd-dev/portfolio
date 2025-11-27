import { styled } from "@/stitches.config";

export const ToggleWrapper = styled("div", {
  display: "inline-flex",
  alignItems: "center",
  // Base design tokens for the switch
  "--toggle-accent": "var(--success-rgb)",
  "--toggle-track-off": "rgba(var(--background-rgb), 0.08)",
  "--toggle-track-on": "rgba(var(--toggle-accent), 0.9)",
  "--toggle-label-off": "#a1a1aa",
});

export const ToggleInput = styled("input", {
  // Hide the native checkbox
  display: "none",
  fontFamily: "var(--font-sans)",
  // checked state tweaks the label + pseudo-elements
  "&:checked + label": {
    background: "var(--toggle-track-on)",
  },

  "&:checked + label::after": {
    left: "56.5%",
  },

  "&:checked + label::before": {
    content: '"Yes"',
    left: "6px",
    color: "#fff",
  },
});

export const ToggleLabel = styled("label", {
  outline: 0,
  display: "block",
  width: "56px",
  height: "28px",
  position: "relative",
  cursor: "pointer",
  userSelect: "none",
  fontSize: "11px",
  fontWeight: 500,
  color: "#fff",
  fontFamily: "var(--font-sans)",

  // track base (off state)
  borderRadius: "999px",
  padding: "1px",
  background: "var(--toggle-track-off)",
  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.6) inset",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  transition: "background 0.25s ease, box-shadow 0.25s ease",

  // knob
  "&::after": {
    position: "relative",
    display: "block",
    content: '""',
    width: "44%",
    height: "100%",
    left: 0,
    borderRadius: "999px",
    background: "#fff",
    transition:
      "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), padding 0.3s ease, margin 0.3s ease",
    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.35)",
  },

  // label text (No/Yes)
  "&::before": {
    position: "absolute",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    content: '"No"',
    width: "44%",
    height: "100%",
    top: 0,
    left: "28px",
    color: "var(--toggle-label-off)",
    transition: "left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease",
  },

  "&:active": {
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.7) inset",
  },

  "&:active::after": {
    paddingRight: "0.25em",
  },
});
