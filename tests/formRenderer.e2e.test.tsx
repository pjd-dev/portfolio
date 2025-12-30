import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  vi,
  describe,
  it,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  expect,
} from "vitest";

import { FormRenderer } from "@/components/section/form/FormRenderer";
import type { FormSection } from "@/lib/validation/section";

describe("FormRenderer end-to-end", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const baseMeta = {
    api: {
      endpoint: "/api/form",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    successRedirect: null,
    captcha: false,
    delivery: "mail",
  };

  const originalFetch = globalThis.fetch;
  const fetchMock = vi.fn(async () => ({ ok: true })) as unknown as typeof fetch;

  beforeEach(() => {
    fetchMock.mockClear();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  beforeAll(() => {
    consoleError.mockClear();
    consoleWarn.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });


  it("renders fields and submits values", async () => {
    const config: FormSection = {
      id: "contact_form_en",
      kind: "form",
      title: "Contact",
      description: "Send a message",
      meta: baseMeta,
      messages: {
        submit: "Send message",
        validation: "Please fix the errors.",
      },
      fields: [
        {
          id: "name",
          name: "name",
          label: "Name",
          type: "text",
          width: "full",
          errors: [{ rule: { type: "required" }, message: "Name required" }],
        },
        {
          id: "subject",
          name: "subject",
          label: "Subject",
          type: "select",
          width: "full",
          options: [{ value: "quote", label: "Quotation" }],
          errors: [{ rule: { type: "required" }, message: "Subject required" }],
        },
        {
          id: "message",
          name: "message",
          label: "Message",
          type: "textarea",
          width: "full",
          rows: 4,
          errors: [{ rule: { type: "minLength", value: 5 }, message: "Too short" }],
        },
      ],
      submit: "Send message",
    };

    render(<FormRenderer config={config} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "quote" },
    });
    fireEvent.change(screen.getByLabelText("Message"), {
      target: { value: "Hello there" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [url, options] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/form");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(options.body as string)).toEqual({
      sectionId: "contact_form_en",
      lang: "en",
      page: "/contact",
      values: {
        name: "Jane Doe",
        subject: "quote",
        message: "Hello there",
      },
    });
  });

  it("shows and hides fields based on showWhen", async () => {
    const config: FormSection = {
      id: "conditional_form",
      kind: "form",
      title: "Conditional",
      meta: baseMeta,
      fields: [
        {
          id: "subject",
          name: "subject",
          label: "Subject",
          type: "select",
          width: "full",
          options: [
            { value: "other", label: "Other" },
            { value: "quote", label: "Quotation" },
          ],
          errors: [{ rule: { type: "required" }, message: "Subject required" }],
        },
        {
          id: "details",
          name: "details",
          label: "Details",
          type: "text",
          width: "full",
          showWhen: {
            mode: "and",
            conditions: [{ fieldId: "subject", op: "equals", value: "quote" }],
          },
        },
      ],
      submit: "Send",
    };

    render(<FormRenderer config={config} />);

    expect(screen.queryByLabelText("Details")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "quote" },
    });

    await waitFor(() =>
      expect(screen.getByLabelText("Details")).toBeInTheDocument(),
    );
  });

  it("shows validation and localized copy on errors", () => {
    const config: FormSection = {
      id: "validation_form",
      kind: "form",
      title: "Validation",
      meta: baseMeta,
      messages: {
        submit: "Send now",
        requiredHint: "Fields marked with * are required.",
        validation: "Please fix the errors.",
      },
      fields: [
        {
          id: "name",
          name: "name",
          label: "Name",
          type: "text",
          width: "full",
          errors: [{ rule: { type: "required" }, message: "Name required" }],
        },
      ],
      submit: "Send now",
    };

    render(<FormRenderer config={config} />);

    expect(
      screen.getByText("Fields marked with * are required."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send now" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send now" }));
    expect(screen.getByText("Please fix the errors.")).toBeInTheDocument();

    fireEvent.blur(screen.getByLabelText("Name"));
    expect(screen.getByText("Name required")).toBeInTheDocument();
  });
});
