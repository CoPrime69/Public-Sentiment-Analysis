'use client';

import { useState } from 'react';

interface CopyButtonProps {
  textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="ml-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-1 px-2 rounded text-xs cursor-pointer"
    >
      {copied ? 'Copied!' : 'Copy ID'}
    </button>
  );
}