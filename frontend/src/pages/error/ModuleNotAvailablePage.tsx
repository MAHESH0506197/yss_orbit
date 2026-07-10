import React from 'react';
import { Link } from 'react-router-dom';

export default function ModuleNotAvailablePage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-red-600 dark:text-red-500"
        >
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Module Not Subscribed
        </h1>
        <p className="text-muted-foreground max-w-[500px] text-lg">
          Your Business Unit has not subscribed to this module. Please contact your organization administrator to upgrade your subscription if you need access.
        </p>
      </div>

      <Link
        to="/home"
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
