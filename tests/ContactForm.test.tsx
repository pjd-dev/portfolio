import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import ContactForm from "@/components/form/ContactForm";
import { contactDict } from "./__fixtures__/contactDict";

// Mock Stitches to avoid CSSOM issues in jsdom
vi.mock("@/stitches.config", () => ({
  styled: (tag: string) => {
    const StyledComponent = (props: any) => {
      const { children, hasError, ...rest } = props;
      return React.createElement(tag, rest, children);
    };
    return StyledComponent;
  },
  css: () => "",
  theme: {},
  config: {},
  getCssText: () => "",
}));

// Mock fetch
global.fetch = vi.fn();

describe("ContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all base fields", () => {
    render(<ContactForm dictionary={contactDict.en} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
  });

  it("should show freelance fields when freelance is selected", async () => {
    render(<ContactForm dictionary={contactDict.en} />);

    const subjectSelect = screen.getByLabelText("Subject") as HTMLSelectElement;
    fireEvent.change(subjectSelect, { target: { value: "freelance" } });

    await waitFor(() => {
      expect(screen.getByLabelText("Company")).toBeInTheDocument();
      expect(screen.getByLabelText("Budget")).toBeInTheDocument();
      expect(screen.getByLabelText("Deadline")).toBeInTheDocument();
    });
  });

  it("should show collab fields when collab is selected", async () => {
    render(<ContactForm dictionary={contactDict.en} />);

    const subjectSelect = screen.getByLabelText("Subject") as HTMLSelectElement;
    fireEvent.change(subjectSelect, { target: { value: "collab" } });

    await waitFor(() => {
      expect(screen.getByLabelText("Project Link")).toBeInTheDocument();
      expect(screen.getByLabelText("Project Goal")).toBeInTheDocument();
    });
  });

  it("should not show extra fields for recruitment subject", () => {
    render(<ContactForm dictionary={contactDict.en} />);

    const subjectSelect = screen.getByLabelText("Subject") as HTMLSelectElement;
    fireEvent.change(subjectSelect, { target: { value: "recruitment" } });

    expect(screen.queryByLabelText("Company")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Project Link")).not.toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    render(<ContactForm dictionary={contactDict.en} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "recruitment" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "I am interested in working with you." },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: expect.stringContaining("John Doe"),
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Message sent successfully!")).toBeInTheDocument();
    });
  });

  it("should display error message on submission failure", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, error: "Server error" }),
    } as Response);

    render(<ContactForm dictionary={contactDict.en} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "recruitment" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Test message for failure." },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Failed to send message.")).toBeInTheDocument();
    });
  });

  it("should clear field error when user types", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: false,
        issues: [{ path: "name", message: "Name is too short" }],
      }),
    } as Response);

    render(<ContactForm dictionary={contactDict.en} />);

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "J" } });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "recruitment" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Test message" },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Name is too short")).toBeInTheDocument();
    });

    // Type in the field to clear the error
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    await waitFor(() => {
      expect(screen.queryByText("Name is too short")).not.toBeInTheDocument();
    });
  });

  it("should disable submit button while sending", async () => {
    vi.mocked(global.fetch).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ ok: true }),
              } as Response),
            100
          )
        )
    );

    render(<ContactForm dictionary={contactDict.en} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "recruitment" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Test message for button state." },
    });

    const submitButton = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Sending...")).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });
});
