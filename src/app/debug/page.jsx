// Add this to your app/debug/page.jsx for easy access
'use client';

import DebugRoleChecker from "../components/DebugRoleChecker";


export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <DebugRoleChecker />
    </div>
  );
}