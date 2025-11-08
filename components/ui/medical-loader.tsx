"use client";

import { cn } from "@/lib/utils";

interface MedicalLoaderProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function MedicalLoader({ 
  message = "Loading...", 
  className,
  size = "md" 
}: MedicalLoaderProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[200px] space-y-6", className)}>
      {/* Medical Cross with Pulse Animation */}
      <div className="relative">
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-full border-4 border-red-500/20 animate-ping" />
        <div className="absolute inset-0 rounded-full border-4 border-red-500/30 animate-ping animation-delay-200" />
        
        {/* Medical Cross */}
        <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
          {/* Horizontal bar */}
          <div className="absolute w-full h-2 bg-red-500 rounded-full animate-pulse" />
          {/* Vertical bar */}
          <div className="absolute h-full w-2 bg-red-500 rounded-full animate-pulse animation-delay-100" />
        </div>
      </div>

      {/* Heartbeat Animation */}
      <div className="flex items-center space-x-3">
        <svg
          className="w-10 h-10 text-red-500 animate-heartbeat"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <div className="flex items-end space-x-1.5 h-10">
          <div className="w-1.5 h-6 bg-red-500 rounded-full animate-heartbeat-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-10 bg-red-500 rounded-full animate-heartbeat-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-1.5 h-5 bg-red-500 rounded-full animate-heartbeat-pulse" style={{ animationDelay: '400ms' }} />
          <div className="w-1.5 h-8 bg-red-500 rounded-full animate-heartbeat-pulse" style={{ animationDelay: '600ms' }} />
        </div>
      </div>

      {/* Loading Text */}
      <div className={cn("text-center space-y-2", textSizes[size])}>
        <p className="font-medium text-gray-700 animate-pulse">{message}</p>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Full page loader variant
export function MedicalPageLoader({ message = "Loading medical records..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-white z-50">
      <div className="text-center space-y-8">
        {/* Large Medical Cross */}
        <div className="relative mx-auto w-32 h-32">
          {/* Outer pulse rings */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />
          <div className="absolute inset-0 rounded-full border-4 border-blue-300 animate-ping" style={{ animationDelay: '500ms' }} />
          
          {/* Medical Cross Container */}
          <div className="absolute inset-4 flex items-center justify-center">
            {/* Horizontal bar */}
            <div className="absolute w-full h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse shadow-lg" />
            {/* Vertical bar */}
            <div className="absolute h-full w-4 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full animate-pulse shadow-lg" style={{ animationDelay: '250ms' }} />
          </div>
        </div>

        {/* Heartbeat Monitor Lines */}
        <div className="relative w-48 h-16 mx-auto">
          <svg
            className="w-full h-full text-blue-600"
            viewBox="0 0 200 60"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            {/* Heartbeat waveform - animated */}
            <path
              d="M0,30 L20,30 L25,10 L30,50 L35,20 L40,40 L45,25 L50,35 L200,35"
              className="animate-pulse"
              strokeLinecap="round"
              strokeDasharray="250"
            />
            {/* Animated pulse indicator */}
            <circle cx="25" cy="10" r="4" fill="currentColor" className="animate-ping opacity-75" />
            <circle cx="30" cy="50" r="4" fill="currentColor" className="animate-ping opacity-75 animation-delay-300" />
            {/* Heartbeat peaks */}
            <circle cx="40" cy="40" r="3" fill="currentColor" className="animate-ping opacity-60 animation-delay-150" />
          </svg>
        </div>

        {/* Loading Text with Animation */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
            {message}
          </h3>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
          </div>
        </div>

        {/* Subtle medical theme text */}
        <p className="text-sm text-gray-500 mt-8">
          Ensuring your health data is secure...
        </p>
      </div>
    </div>
  );
}

