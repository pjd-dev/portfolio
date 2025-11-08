export const contactDict = {
  en: {
    title: "Contact Me",
    description: "Have a project in mind?",
    fields: {
      name: {
        label: "Name",
        placeholder: "Your name",
        error: "Name is required",
      },
      email: {
        label: "Email",
        placeholder: "your.email@example.com",
        error: "Valid email is required",
      },
      subject: {
        label: "Subject",
        placeholder: "Select a subject",
        options: [
          { value: "recruitment", label: "Job Opportunity" },
          { value: "freelance", label: "Freelance Project" },
          { value: "collab", label: "Collaboration" },
          { value: "other", label: "Other" },
        ],
        error: "Please select a subject",
      },
      company: {
        label: "Company",
        placeholder: "Your company name",
        error: "Company name is required",
      },
      budget: {
        label: "Budget",
        placeholder: "e.g., $5,000",
        error: "Budget is required",
      },
      deadline: {
        label: "Deadline",
        placeholder: "e.g., 2 weeks",
        error: "Deadline is required",
      },
      projectLink: {
        label: "Project Link",
        placeholder: "https://your-project.com",
        error: "Valid URL is required",
      },
      goal: {
        label: "Project Goal",
        placeholder: "Describe your goal",
        error: "Project goal is required",
      },
      message: {
        label: "Message",
        placeholder: "Your message...",
        error: "Message is required",
      },
    },
    submit: {
      idle: "Send Message",
      sending: "Sending...",
      success: "Message sent successfully!",
      error: "Failed to send message.",
    },
  },
};
