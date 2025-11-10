export const SharedButton = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.35rem",
  padding: "0.5rem 1.2rem",
  fontSize: "0.6rem",
  fontWeight: 500,
  textAlign: "center",
  borderRadius: "9999px",
  textDecoration: "none",
  cursor: "pointer",
  borderWidth: "1px",
  borderStyle: "solid",
  transition: "all 0.25s ease",

  "@md": { fontSize: "0.8rem", padding: "0.5rem 1rem" },
  "@lg": { fontSize: "0.9rem", padding: ".8rem 1rem" },

  variants: {
    // mapped from CTA variant: primary → solid, secondary → outline, link → link
    variant: {
      // GLASS BUTTON
      solid: {
        // base = .glassButton
        background: "rgba(var(--foreground-rgb), 0.08)",
        borderColor: "rgba(var(--foreground-rgb), 0.18)",
        boxShadow:
          "0 1px 2px rgba(var(--background-rgb), 0.25), 0 0 0 1px rgba(var(--foreground-rgb), 0.05) inset",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",

        "&:hover": {
          background: "rgba(var(--foreground-rgb), 0.16)",
          borderColor: "rgba(var(--foreground-rgb), 0.25)",
          transform: "translateY(-1px)",
          boxShadow:
            "0 3px 6px rgba(var(--background-rgb), 0.35), 0 0 0 1px rgba(var(--foreground-rgb), 0.08) inset",
        },

        "&:active": {
          transform: "translateY(0)",
          background: "rgba(var(--foreground-rgb), 0.24)",
          borderColor: "rgba(var(--foreground-rgb), 0.3)",
        },

        "&:focus-visible": {
          outline: "2px solid rgba(var(--foreground-rgb), 0.4)",
          outlineOffset: "2px",
        },
      },

      outline: {
        backgroundColor: "transparent",
        color: "$accent",
        borderColor: "$accent",
        "&:hover": { backgroundColor: "$accentA3" },
        "&:focus-visible": {
          outline: "2px solid $accent",
          outlineOffset: "2px",
        },
      },

      ghost: {
        backgroundColor: "transparent",
        color: "$accent",
        borderColor: "transparent",
        "&:hover": { backgroundColor: "$accentA2" },
        "&:focus-visible": {
          outline: "2px solid $accent",
          outlineOffset: "2px",
        },
      },

      link: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        padding: 0,
        borderRadius: 0,
        fontWeight: 500,
        textDecoration: "underline",
        textUnderlineOffset: "0.18em",
        color: "$accent",
        "&:hover": { opacity: 0.8 },
        "&:focus-visible": {
          outline: "2px solid $accent",
          outlineOffset: "2px",
        },
      },
    },

    size: {
      sm: {
        fontSize: "0.65rem",
        padding: "0.35rem 0.8rem",
      },
      md: {
        fontSize: "0.75rem",
        padding: "0.5rem 1rem",
      },
      lg: {
        fontSize: "0.9rem",
        padding: "0.7rem 1.3rem",
      },
    },

    fullWidth: {
      true: { width: "100%" },
    },
  },

  defaultVariants: {
    variant: "solid",
    size: "md",
  },
};
