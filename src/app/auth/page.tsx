
'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset } from "@/components/ui/sidebar";
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
        avatar: `https://placehold.co/100x100.png`,
        initials: values.name.split(" ").map(n => n[0]).join(""),
        hint: 'person',
        bio: "",
        hobbies: [],
      };
      
      const docRef = await addDoc(collection(db, "students"), studentData);

      const currentUser = { id: docRef.id, ...studentData };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));

      toast({ title: "Account Created!", description: "You have been successfully signed up." });
      router.push('/');

    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message });
      console.error("Sign up error:", error);
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);

      const q = query(collection(db, "students"), where("email", "==", values.email.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No student profile found for this user.");
      }
      
      const studentDoc = querySnapshot.docs[0];
      const currentUser = { id: studentDoc.id, ...studentDoc.data() };
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      
      toast({ title: "Login Successful!", description: "Welcome back!" });
      router.push('/');

    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
      console.error("Login error:", error);
    }
  };


  return (
    <SidebarInset>
      <PageHeader
        title="Join or Login"
        description="Create an account or sign in to manage your profile and projects."
      />
      <main className="p-6 lg:p-8 flex justify-center">
        <Tabs defaultValue="login" className="w-[400px]">
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
      </main>
    </SidebarInset>
  );
}
