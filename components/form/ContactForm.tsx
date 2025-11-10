"use client";

import React, { useState } from "react";
import { styled } from "@/stitches.config";
import { TextField, SelectField, TextAreaField } from "./FormFields";
import type { ContactFormData } from "@/lib/schemas/contact";

const Form = styled("form", {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
});

const SubmitButton = styled("button", {
  padding: "1rem 2rem",
  fontSize: "1rem",
  fontWeight: "600",
  color: "white",
  backgroundColor: "#000",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.2s",
  marginTop: "1rem",

  "&:hover": {
    backgroundColor: "#333",
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  },

  "&:active": {
    transform: "translateY(0)",
  },

  "&:disabled": {
    backgroundColor: "#999",
    cursor: "not-allowed",
    transform: "none",
  },
});

const StatusMessage = styled("div", {
  padding: "1rem",
  borderRadius: "8px",
  fontSize: "0.875rem",
  fontWeight: "500",
  marginTop: "1rem",

  variants: {
    type: {
      success: {
        backgroundColor: "#dcfce7",
        color: "#166534",
      },
      error: {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
      },
    },
  },
});

interface ContactFormProps {
  dictionary: {
    fields: Record<
      string,
      {
        label: string;
        placeholder: string;
        error?: string;
        options?: Array<{ value: string; label: string }>;
      }
    >;
    submit: {
      idle: string;
      sending: string;
      success: string;
      error: string;
    };
  };
}

type FormState = "idle" | "sending" | "success" | "error";

export default function ContactForm({ dictionary }: ContactFormProps) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    company: "",
    budget: "",
    deadline: "",
    projectLink: "",
    goal: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    setErrors({});

    try {
      // Prepare data based on subject
      const submitData: Partial<ContactFormData> = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject as ContactFormData["subject"],
        message: formData.message,
      };

      // Add conditional fields
      if (formData.subject === "freelance") {
        Object.assign(submitData, {
          company: formData.company,
          budget: formData.budget,
          deadline: formData.deadline,
        });
      } else if (formData.subject === "collab") {
        Object.assign(submitData, {
          projectLink: formData.projectLink,
          goal: formData.goal,
        });
      }

      const response = await fetch("/api/form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.ok) {
        setFormState("success");
        // Reset form after 3 seconds
        setTimeout(() => {
          setFormData({
            name: "",
            email: "",
            subject: "",
            company: "",
            budget: "",
            deadline: "",
            projectLink: "",
            goal: "",
            message: "",
          });
          setFormState("idle");
        }, 3000);
      } else {
        setFormState("error");
        // Handle validation errors
        if (result.issues) {
          const newErrors: Record<string, string> = {};
          result.issues.forEach((issue: { path: string; message: string }) => {
            newErrors[issue.path] = issue.message;
          });
          setErrors(newErrors);
        }
        setTimeout(() => setFormState("idle"), 3000);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setFormState("error");
      setTimeout(() => setFormState("idle"), 3000);
    }
  };

  const showFreelanceFields = formData.subject === "freelance";
  const showCollabFields = formData.subject === "collab";

  return (
    <>
      <Form onSubmit={handleSubmit}>
        <TextField
          name="name"
          value={formData.name}
          onChange={handleChange}
          config={dictionary.fields.name}
          error={errors.name}
        />

        <TextField
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          config={dictionary.fields.email}
          error={errors.email}
        />

        <SelectField
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          config={dictionary.fields.subject}
          error={errors.subject}
        />

        {showFreelanceFields && (
          <>
            <TextField
              name="company"
              value={formData.company}
              onChange={handleChange}
              config={dictionary.fields.company}
              error={errors.company}
            />
            <TextField
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              config={dictionary.fields.budget}
              error={errors.budget}
            />
            <TextField
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              config={dictionary.fields.deadline}
              error={errors.deadline}
            />
          </>
        )}

        {showCollabFields && (
          <>
            <TextField
              name="projectLink"
              type="url"
              value={formData.projectLink}
              onChange={handleChange}
              config={dictionary.fields.projectLink}
              error={errors.projectLink}
            />
            <TextAreaField
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              config={dictionary.fields.goal}
              error={errors.goal}
            />
          </>
        )}

        <TextAreaField
          name="message"
          value={formData.message}
          onChange={handleChange}
          config={dictionary.fields.message}
          error={errors.message}
        />

        <SubmitButton type="submit" disabled={formState === "sending"}>
          {formState === "sending" ? dictionary.submit.sending : dictionary.submit.idle}
        </SubmitButton>
      </Form>

      {formState === "success" && (
        <StatusMessage type="success">{dictionary.submit.success}</StatusMessage>
      )}

      {formState === "error" && (
        <StatusMessage type="error">{dictionary.submit.error}</StatusMessage>
      )}
    </>
  );
}
