
'use client'

import React, { useState, useEffect } from 'react';
import { Mail, Briefcase } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, addDoc, where } from "firebase/firestore";
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import Link from 'next/link';
import { serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

const ADMIN_EMAIL = "tingiya730@gmail.com";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  whatsapp: z.string().regex(/^\+\d+$/, "Number must start with a country code (e.g., +1234567890).").optional().or(z.literal('')),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

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
        const permissionError = new FirestorePermissionError({ path: 'students', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
      } finally {
        setLoading(false);
      }
    };
    fetchAdmin();
  }, []);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      whatsapp: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    try {
      const messageDocRef = await addDoc(collection(db, "messages"), {
        ...values,
        createdAt: serverTimestamp(),
        read: false,
      }).catch(serverError => {
        const permissionError = new FirestorePermissionError({ path: 'messages', operation: 'create', requestResourceData: values });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
      });

      const notificationData = {
          message: `New message from ${values.name}`,
          type: 'new_message',
          link: '/admin',
          createdAt: serverTimestamp(),
          read: false,
      };
      addDoc(collection(db, "notifications"), notificationData).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'notifications', operation: 'create', requestResourceData: notificationData });
          errorEmitter.emit('permission-error', permissionError);
      });

      toast({
        title: "Message Sent!",
        description: "Thanks for reaching out. We'll get back to you soon.",
      });
      form.reset();
    } catch (error) {
       if (!(error instanceof FirestorePermissionError)) {
          toast({
            variant: "destructive",
            title: "Sending Failed",
            description: "There was a problem sending your message. Please try again.",
          });
       }
    }
  }

  return (
      <main className="container mx-auto p-6 lg:p-8 pt-24">
        <PageHeader
          title="Contact Us"
          description="Get in touch with the administrator."
        />
        <div className="grid gap-12 md:grid-cols-2 items-start mt-6">
          <section>
            <h2 className="font-headline text-2xl font-bold mb-4">Contact Admin</h2>
            {loading ? (
              <p>Loading admin details...</p>
            ) : admin ? (
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="w-16 h-16">
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
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp Number (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
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
        </div>
      </main>
  );
}
