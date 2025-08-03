
'use client'

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major is required."),
  interests: z.string().min(2, "Please list at least one interest."),
});

type Student = {
  name: string;
  major: string;
  interests: string[];
  avatar: string;
  initials: string;
  hint: string;
};

const initialStudents: Student[] = [
  { name: "Alice Johnson", major: "Computer Science", interests: ["AI", "Web Dev", "UX Design"], avatar: "https://placehold.co/100x100.png", initials: "AJ", hint: "woman face" },
  { name: "Bob Williams", major: "Data Science", interests: ["Machine Learning", "Statistics"], avatar: "https://placehold.co/100x100.png", initials: "BW", hint: "man portrait" },
  { name: "Charlie Brown", major: "Software Engineering", interests: ["Mobile Apps", "Game Dev"], avatar: "https://placehold.co/100x100.png", initials: "CB", hint: "person smiling" },
  { name: "Diana Miller", major: "Cybersecurity", interests: ["Networking", "Ethical Hacking"], avatar: "https://placehold.co/100x100.png", initials: "DM", hint: "woman smiling" },
  { name: "Ethan Davis", major: "Computer Science", interests: ["Cloud Computing", "DevOps"], avatar: "https://placehold.co/100x100.png", initials: "ED", hint: "man face" },
  { name: "Fiona Garcia", major: "Information Systems", interests: ["Project Management", "UI/UX"], avatar: "https://placehold.co/100x100.png", initials: "FG", hint: "person portrait" },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    try {
      const storedStudents = localStorage.getItem("students");
      if (storedStudents) {
        setStudents(JSON.parse(storedStudents));
      } else {
        setStudents(initialStudents);
      }
    } catch (error) {
      console.error("Failed to parse students from localStorage", error);
      setStudents(initialStudents);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("students", JSON.stringify(students));
    }
  }, [students, isMounted]);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      major: "",
      interests: "",
    },
  });

  function onSubmit(values: z.infer<typeof studentSchema>) {
    const initials = values.name.split(' ').map(n => n[0]).join('');
    const newStudent: Student = {
      ...values,
      interests: values.interests.split(',').map(interest => interest.trim()),
      avatar: `https://placehold.co/100x100.png`,
      initials: initials.toUpperCase(),
      hint: "person portrait",
    };
    setStudents(prev => [...prev, newStudent]);
    toast({
      title: "Profile Created!",
      description: "Your student profile has been added.",
      className: "bg-accent text-accent-foreground border-green-300",
    });
    form.reset();
    setOpen(false);
  }

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <SidebarInset>
      <PageHeader
        title="Student Profiles"
        description="Get to know your fellow classmates and their interests."
      />
      <main className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div/>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2" />
                Add Your Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Your Profile</DialogTitle>
                <DialogDescription>
                  Add your details to be displayed on the student profiles page. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Ada Lovelace" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="major"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Major</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interests</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. AI, Web Dev, UX Design" {...field} />
                        </FormControl>
                         <p className="text-sm text-muted-foreground">Please separate interests with a comma.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Save changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => (
            <Card key={student.name} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                  <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                  <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <p className="text-muted-foreground">{student.major}</p>
              </CardHeader>
              <CardContent>
                <p className="font-semibold mb-2 text-sm text-foreground">Interests</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {student.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}
