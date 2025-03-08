'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContractCreate } from "@/types/contract";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Form validation schema
const contractSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().optional(),
  amount: z.coerce.number().positive({ message: "Amount must be positive" }),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date",
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date",
  }),
});

type ContractFormValues = z.infer<typeof contractSchema>;

export function ContractForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });
  
  const onSubmit = async (data: ContractFormValues) => {
    setIsLoading(true);
    
    try {
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Convert to proper contract data
      const contractData: ContractCreate = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        userId: userId, // This will be overridden by the API
      };
      
      // Submit to API
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create contract');
      }
      
      // Get the created contract
      const contract = await response.json();
      
      // Reset form
      reset();
      
      // Redirect to the dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating contract:', error);
      // Handle error (could add toast notification here)
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create a Commitment</CardTitle>
        <CardDescription>
          Set a goal for yourself and back it with a financial stake.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          id="contract-form" 
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-4"
          role="form"
        >
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What do you want to achieve?"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your commitment in detail..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="How much will you stake?"
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">{errors.endDate.message}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          type="submit" 
          form="contract-form" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Commitment"}
        </Button>
      </CardFooter>
    </Card>
  );
}