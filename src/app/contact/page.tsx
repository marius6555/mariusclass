
'use client'

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Briefcase } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import type { Student } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500),
});

const ADMIN_EMAIL = "tingiya730@gmail.com";

export default function ContactPage() {
  const { toast } = useToast();
  const [admin, setAdmin] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const q = query(collection(db, "students"), where("email", "==", ADMIN_EMAIL));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const adminDoc = querySnapshot.docs[0];
          setAdmin({ id: adminDoc.id, ...adminDoc.data() } as Student);
        }
      } catch (error) {
        console.error("Error fetching admin details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await addDoc(collection(db, "messages"), {
        ...values,
        createdAt: serverTimestamp(),
        read: false,
      });
      toast({
        title: "Message Sent!",
        description: "Thanks for reaching out. We'll get back to you soon.",
      });
      form.reset();
    } catch (error) {
       console.error("Error sending message:", error);
       toast({
        variant: "destructive",
        title: "Sending Failed",
        description: "There was a problem sending your message. Please try again.",
      });
    }
  }

  return (
    <SidebarInset>
      <PageHeader
        title="Contact Us"
        description="Get in touch with the administrator."
      />
      <main className="p-6 lg:p-8 grid gap-12 md:grid-cols-2 items-start">
        <section>
          <h2 className="font-headline text-2xl font-bold mb-4">Contact Admin</h2>
          {loading ? (
             <p>Loading admin details...</p>
          ) : admin ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={admin.avatar} alt={admin.name} data-ai-hint={admin.hint} />
                  <AvatarFallback>{admin.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="font-headline">{admin.name}</CardTitle>
                  <div className="text-muted-foreground space-y-1 mt-1">
                    <p className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> Administrator</p>
                    <Link href={`mailto:${admin.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <Mail className="w-4 h-4"/> {admin.email}
                    </Link>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ) : (
             <p>Admin details could not be loaded.</p>
          )}
        </section>
        <section>
          <h2 className="font-headline text-2xl font-bold mb-4">Send a Message</h2>
          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Ada Lovelace" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ada.l@university.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder="Ask a question or leave a comment..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Submit</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </main>
    </SidebarInset>
  );
}
