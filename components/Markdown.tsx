"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content: string;
};

const markdownComponents: Components = {
  h1: ({ node, ...props }) => (
    <h1 className="text-4xl font-bold my-4" {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h2 className="text-3xl font-bold my-4" {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h3 className="text-2xl font-bold my-4" {...props} />
  ),
  h4: ({ node, ...props }) => (
    <h4 className="text-xl font-bold my-4" {...props} />
  ),
  h5: ({ node, ...props }) => (
    <h5 className="text-lg font-bold my-4" {...props} />
  ),
  h6: ({ node, ...props }) => (
    <h6 className="text-base font-bold my-4" {...props} />
  ),
  p: ({ node, ...props }) => <p className="my-2 leading-7" {...props} />,
  a: ({ node, ...props }) => <a className=" underline" {...props} />,
  ul: ({ node, ...props }) => (
    <ul className="list-disc list-inside my-2" {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol className="list-decimal list-inside my-2" {...props} />
  ),
  li: ({ node, ...props }) => <li className="my-1" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-4 border-gray-300 pl-4 italic my-4"
      {...props}
    />
  ),
  code: ({ node, ...props }) => (
    <code className="rounded px-1 py-0.5 text-sm" {...props} />
  ),
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
