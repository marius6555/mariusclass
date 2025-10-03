
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = getAuth();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const studentData = {
        uid: user.uid,
        email: values.email.toLowerCase(),
        name: values.name,
        major: "",
        interests: [],
        initials: values.name.split(" ").map(n => n[0]).join(""),
        bio: "",
        hobbies: [],
      };
      
      const docRef = await addDoc(collection(db, "students"), studentData);

      const currentUser = { id: docRef.id, ...studentData };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      toast({ title: "Account Created!", description: "You have been successfully signed up." });
      router.push('/');

    } catch (error: any) {
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use. Please try logging in.";
      } else {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Sign Up Failed", description: errorMessage });
      console.error("Sign up error:", error);
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);

      const q = query(collection(db, "students"), where("email", "==", values.email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Allow admin login without student profile
        if (values.email.toLowerCase() === "tingiya730@gmail.com") {
           const adminUser = {
              email: values.email.toLowerCase(),
              name: 'Admin',
           }
           localStorage.setItem("currentUser", JSON.stringify(adminUser));
           toast({ title: "Admin Login Successful!", description: "Welcome back!" });
           router.push('/admin');
           return;
        }
        throw new Error("No student profile found for this user.");
      }
      
      const studentDoc = querySnapshot.docs[0];
      const currentUser = { id: studentDoc.id, ...studentDoc.data() };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      
      toast({ title: "Login Successful!", description: "Welcome back!" });
      router.push('/');

    } catch (error: any) {
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
      console.error("Login error:", error);
    }
  };


  return (
    <main className="container mx-auto flex flex-col items-center justify-center p-6 lg:p-8 min-h-screen">
      <div className="w-full max-w-[400px]">
        <Button variant="outline" onClick={() => router.push('/')} className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
        </Button>
        <PageHeader
            title="Join or Login"
            description="Create an account or sign in to manage your profile and projects."
        />
        <Tabs defaultValue="login" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Access your account to continue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full">Login</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create an account to get started.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...signUpForm}>
                  <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                    <FormField control={signUpForm.control} name="name" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Ada Lovelace" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={signUpForm.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full">Create Account</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
