"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FeedbackForm() {
  const submitFeedback = useMutation(api.feedback.submitFeedback);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "Feedback",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

    setIsSubmitting(true);
    try {
      await submitFeedback({
        name: formData.name || undefined,
        email: formData.email || undefined,
        type: formData.type,
        message: formData.message,
      });
      setSubmitted(true);
      setFormData({ name: "", email: "", type: "Feedback", message: "" });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-lg shadow-lg mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">Thank You!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Your feedback has been received. We appreciate your input.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          <Button onClick={() => setSubmitted(false)}>Send Another</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-8 px-4">
        <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl mb-4 text-slate-900 dark:text-slate-100">
          Get in Touch
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Have a question, feedback, or found a bug? We'd love to hear from you.
        </p>
      </div>

      <Card className="shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-xl">Contact & Feedback</CardTitle>
          <CardDescription>Help us improve or just say hello.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feedback">Feedback</SelectItem>
                    <SelectItem value="Bug">Bug Report</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Tell us what you think..."
                className="min-h-[120px] resize-y"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
