'use client'

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Briefcase } from "lucide-react";
import Link from "next/link";

const contacts = [
  { name: "Dr. Alan Turing", role: "Professor", email: "alan.t@university.edu", avatar: "https://placehold.co/100x100.png", initials: "AT", hint: "man portrait" },
  { name: "Ada Lovelace", role: "Teaching Assistant", email: "ada.l@university.edu", avatar: "https://placehold.co/100x100.png", initials: "AL", hint: "woman portrait" },
];

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500),
});

export default function ContactPage() {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Message Sent!",
      description: "Thanks for reaching out. We'll get back to you soon.",
      className: "bg-accent text-accent-foreground border-green-300",
    });
    form.reset();
  }

  return (
    <SidebarInset>
      <PageHeader
        title="Contact & Join Us"
        description="Get in touch with instructors or sign up for more information."
      />
      <main className="p-6 lg:p-8 grid gap-12 md:grid-cols-2 items-start">
        <section>
          <h2 className="font-headline text-2xl font-bold mb-4">Teaching Staff</h2>
          <div className="space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.name}>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={contact.avatar} alt={contact.name} data-ai-hint={contact.hint} />
                    <AvatarFallback>{contact.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="font-headline">{contact.name}</CardTitle>
                    <div className="text-muted-foreground space-y-1 mt-1">
                      <p className="flex items-center gap-2"><Briefcase className="w-4 h-4"/> {contact.role}</p>
                      <Link href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Mail className="w-4 h-4"/> {contact.email}
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-headline text-2xl font-bold mb-4">Join Us / Ask a Question</h2>
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
                          <Textarea rows={5} placeholder="Tell us more about your interests or ask a question..." {...field} />
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
