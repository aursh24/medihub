"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { GlowingStarsBackground } from "@/components/ui/glowing-stars";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [role, setRole] = useState("citizen");
  const [email, setEmail] = useState("");

  return (
    <main className="min-h-screen relative overflow-hidden">
      <GlowingStarsBackground />
      
      {/* Split Layout Container */}
      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Side - Login Card */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border border-white/20 bg-white/95 backdrop-blur-md p-8 shadow-2xl space-y-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome Back!
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  Sign in to your profile
                </p>
              </div>

              <div className="space-y-5 pt-2">
                {/* Role Selector */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-bold text-gray-700">
                    Select Your Role
                  </Label>
                  <Select onValueChange={setRole} defaultValue={role}>
                    <SelectTrigger 
                      id="role" 
                      className="w-full h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="asha">Asha Worker</SelectItem>
                      <SelectItem value="admin">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Continue button */}
                <div className="pt-2">
                  <SignInButton
                    mode="redirect"
                    forceRedirectUrl={`/after-signin?role=${role}`}
                  >
                    <Button 
                      className="w-full h-11 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Continue to Sign In
                    </Button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Website Branding */}
        <div className="flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 backdrop-blur-sm border-l border-white/10">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="max-w-lg space-y-6 text-center lg:text-left"
          >
            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-5xl lg:text-6xl font-extrabold leading-tight"
              >
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  MediHub 🩺
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-xl lg:text-2xl font-medium text-gray-300 leading-relaxed"
              >
                Your Comprehensive Healthcare
                <br />
                <span className="text-white font-semibold">Management Platform</span>
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-3 pt-4"
            >
              <p className="text-base lg:text-lg text-gray-400 leading-relaxed">
                Empowering healthcare delivery through seamless coordination
                between <b>Doctors</b>, <b>Asha Workers</b> and <b>Citizens</b>.
              </p>
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/30">
                  Secure Access
                </span>
                <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium border border-purple-500/30">
                  Real-time Updates
                </span>
                <span className="px-4 py-2 rounded-full bg-pink-500/20 text-pink-300 text-sm font-medium border border-pink-500/30">
                  Easy Management
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
