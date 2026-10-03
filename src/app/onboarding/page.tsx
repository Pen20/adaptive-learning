
"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function OnboardingPage() {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const router = useRouter();
  
  const updateUser = useMutation(api.users.updateUser);
  
  // We need to fetch the existing convex user to avoid overwriting or to pre-fill
  // But strictly speaking, we can just rely on state if we want to force them to strict input.
  // For simplicity, let's just manage local state.
  
  const [formData, setFormData] = useState({
    firstName: "",
    surname: "",
    institutionName: "",
    birthDay: "",
  });

  // Prefill the name fields from the Clerk profile as soon as it loads, without
  // an effect: adjusting state during render is React's documented pattern for
  // seeding state from data that arrives asynchronously.
  const [seededUserId, setSeededUserId] = useState<string | null>(null);
  if (user && user.id !== seededUserId) {
    setSeededUserId(user.id);
    setFormData(prev => ({
      ...prev,
      firstName: user.firstName || "",
      surname: user.lastName || "",
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateUser({
        userId: user.id,
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: formData.firstName,
        surname: formData.surname,
        institutionName: formData.institutionName,
        birthDay: formData.birthDay,
      });
      router.push("/"); // Redirect to home/dashboard
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  if (!isClerkLoaded) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            To ensure the best learning experience, we need a few details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                        id="firstName" 
                        value={formData.firstName} 
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="surname">Last Name</Label>
                    <Input 
                        id="surname" 
                        value={formData.surname} 
                        onChange={(e) => setFormData({...formData, surname: e.target.value})}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="birthDay">Date of Birth</Label>
                <Input 
                    id="birthDay" 
                    type="date"
                    value={formData.birthDay} 
                    onChange={(e) => setFormData({...formData, birthDay: e.target.value})}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="institution">Institution / University</Label>
                <Input 
                    id="institution" 
                    placeholder="e.g. MIT, Stanford, Self-Taught"
                    value={formData.institutionName} 
                    onChange={(e) => setFormData({...formData, institutionName: e.target.value})}
                    required
                />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Start Learning
            </Button>
            
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
