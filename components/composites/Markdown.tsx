"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownProps = {
  content: string;
};

const markdownComponents: Components = {
  h1: (props) => <h1 className="my-4 text-4xl font-bold" {...props} />,
  h2: (props) => <h2 className="my-4 text-3xl font-bold" {...props} />,
  h3: (props) => <h3 className="my-4 text-2xl font-bold" {...props} />,
  h4: (props) => <h4 className="my-4 text-xl font-bold" {...props} />,
  h5: (props) => <h5 className="my-4 text-lg font-bold" {...props} />,
  h6: (props) => <h6 className="my-4 text-base font-bold" {...props} />,
  p: (props) => <p className="my-2 leading-7" {...props} />,
  a: (props) => <a className="underline" {...props} />,
  ul: (props) => <ul className="my-2 list-inside list-disc" {...props} />,
  ol: (props) => <ol className="my-2 list-inside list-decimal" {...props} />,
  li: (props) => <li className="my-1" {...props} />,
  blockquote: (props) => (
    <blockquote className="my-4 border-l-4 border-gray-300 pl-4 italic" {...props} />
  ),
  code: (props) => <code className="rounded px-1 py-0.5 text-sm" {...props} />,
};

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
