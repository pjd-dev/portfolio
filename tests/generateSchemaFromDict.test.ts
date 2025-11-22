import { generateSchemaFromDict } from "@/lib/validation/generateSchemaFromDict";
import type { FormSection } from "@/lib/validation/section";
import { describe, expect, it } from "vitest";

import { z } from "zod";

describe("generateSchemaFromDict", () => {
  it("should throw error for invalid FormSection missing fields", () => {
    const invalidDict = {} as FormSection;
    expect(() => generateSchemaFromDict(invalidDict)).toThrow(
      "Invalid FormSection: missing fields array",
    );
  });

  it("should throw error for invalid FormSection with non-array fields", () => {
    const invalidDict = { fields: "not an array" } as any;
    expect(() => generateSchemaFromDict(invalidDict)).toThrow(
      "Invalid FormSection: missing fields array",
    );
  });

  it("should generate schema for string fields with required rule", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          width: "full",
          errors: [{ rule: { type: "required" }, message: "Name is required" }],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ name: "John" })).toEqual({ name: "John" });
    expect(() => schema.parse({})).toThrow(z.ZodError);
  });

  it("should generate schema for string fields with minLength and maxLength", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "message",
          type: "textarea",
          label: "Message",
          name: "message",
          width: "full",
          rows: 4,
          errors: [
            { rule: { type: "minLength", value: 5 }, message: "Too short" },
            { rule: { type: "maxLength", value: 100 }, message: "Too long" },
          ],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ message: "Hello world" })).toEqual({ message: "Hello world" });
    expect(() => schema.parse({ message: "Hi" })).toThrow(z.ZodError);
    expect(() => schema.parse({ message: "a".repeat(101) })).toThrow(z.ZodError);
  });

  it("should generate schema for email field with email rule", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "email",
          type: "email",
          width: "full",
          name: "email",
          label: "Email",
          errors: [{ rule: { type: "email" }, message: "Invalid email" }],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ email: "test@example.com" })).toEqual({
      email: "test@example.com",
    });
    expect(() => schema.parse({ email: "invalid" })).toThrow(z.ZodError);
  });

  it("should generate schema for url field with url rule", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "website",
          type: "url",
          label: "Website",
          width: "full",
          errors: [{ rule: { type: "url" }, message: "Invalid URL" }],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ website: "https://example.com" })).toEqual({
      website: "https://example.com",
    });
    expect(() => schema.parse({ website: "not-a-url" })).toThrow(z.ZodError);
  });

  it("should generate schema for number field with minValue and maxValue", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "age",
          name: "age",
          label: "Age",
          width: "full",
          type: "number",
          errors: [
            { rule: { type: "minValue", value: 18 }, message: "Too young" },
            { rule: { type: "maxValue", value: 100 }, message: "Too old" },
          ],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ age: 25 })).toEqual({ age: 25 });
    expect(() => schema.parse({ age: 17 })).toThrow(z.ZodError);
    expect(() => schema.parse({ age: 101 })).toThrow(z.ZodError);
  });

  it("should generate schema for checkbox field", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "agree",
          label: "I agree to the terms",
          name: "agree",
          width: "full",
          type: "checkbox",
          errors: [{ rule: { type: "required" }, message: "Must agree" }],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ agree: true })).toEqual({ agree: true });
    expect(() => schema.parse({ agree: undefined })).toThrow(z.ZodError);
  });

  it("should make field optional if no required rule", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "optionalField",
          name: "optionalField",
          label: "Optional Field",
          width: "full",
          type: "text",
          errors: [],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({})).toEqual({ optionalField: undefined });
    expect(schema.parse({ optionalField: "value" })).toEqual({ optionalField: "value" });
  });

  it("should make field optional if has showWhen", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "conditionalField",
          name: "conditionalField",
          label: "Conditional Field",
          width: "full",
          type: "text",
          showWhen: { mode: "and", conditions: [] },
          errors: [{ rule: { type: "required" }, message: "Required" }],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({})).toEqual({ conditionalField: undefined });
  });

  it("should ignore custom rules", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "customField",
          name: "customField",
          label: "Custom Field",
          width: "full",
          type: "text",
          errors: [
            {
              rule: { type: "custom", functionName: "someFunc" },
              message: "Custom error",
            },
          ],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    // Custom rules are not enforced, so schema should be optional string
    expect(schema.parse({})).toEqual({ customField: undefined });
    expect(schema.parse({ customField: "value" })).toEqual({ customField: "value" });
  });

  it("should handle pattern rule for string fields", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "code",
          name: "code",
          label: "Code",
          width: "full",
          type: "text",
          errors: [
            {
              rule: { type: "pattern", regex: "^[A-Z]{3}$", flags: "" },
              message: "Invalid code",
            },
          ],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ code: "ABC" })).toEqual({ code: "ABC" });
    expect(() => schema.parse({ code: "abc" })).toThrow(z.ZodError);
  });

  it("should use field.name as key if present, otherwise field.id", () => {
    const dict: FormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "idField",
          label: "namedField",
          name: "namedField",
          width: "full",
          type: "text",
          errors: [],
        },
        {
          id: "onlyId",
          name: "onlyId",
          label: "onlyId",
          width: "full",
          type: "text",
          errors: [],
        },
      ],
    };
    const schema = generateSchemaFromDict(dict);
    expect(schema.parse({ namedField: "value1", onlyId: "value2" })).toEqual({
      namedField: "value1",
      onlyId: "value2",
    });
  });
});
