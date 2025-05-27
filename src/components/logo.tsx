import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox='0 0 42 39' fill='none' xmlns='http://www.w3.org/2000/svg' className={className}>
      <path d='M2 37V2' stroke='currentColor' strokeWidth='4' strokeLinecap='round' />
      <path d='M39.5518 37V2' stroke='currentColor' strokeWidth='4' strokeLinecap='round' />
      <path d='M2 2L19.8621 16L39 2' stroke='currentColor' strokeWidth='4' strokeLinecap='round' />
    </svg>
  );
}
