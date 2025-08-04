
'use client'

import React, { useState, useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  avatar: z.string().url("Please enter a valid image URL.").optional().or(z.literal('')),
});

type Student = {
  id: string;
  name: string;
  major: string;
  interests: string[];
  avatar: string;
  initials: string;
  hint: string;
};

const defaultStudents: Omit<Student, 'id'>[] = [
    { name: "Alice Johnson", major: "Computer Science", interests: ["AI", "Web Dev", "UX Design"], avatar: "https://placehold.co/100x100.png", initials: "AJ", hint: "woman face" },
    { name: "Bob Williams", major: "Data Science", interests: ["Machine Learning", "Statistics"], avatar: "https://placehold.co/100x100.png", initials: "BW", hint: "man portrait" },
    { name: "Charlie Brown", major: "Software Engineering", interests: ["Mobile Apps", "Game Dev"], avatar: "https://placehold.co/100x100.png", initials: "CB", hint: "person smiling" },
];

function StudentForm({ student, onSave, onOpenChange }: { student?: Student | null, onSave: () => void, onOpenChange: (open:boolean) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      major: student?.major || "",
      interests: student?.interests.join(", ") || "",
      avatar: student?.avatar || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const studentData = {
        name: values.name,
        major: values.major,
        interests: values.interests.split(",").map(i => i.trim()),
        avatar: values.avatar || `https://placehold.co/100x100.png`,
        initials: values.name.split(" ").map(n => n[0]).join(""),
        hint: 'person',
      };

      if (student) {
        // Update existing student
        const studentDocRef = doc(db, "students", student.id);
        await updateDoc(studentDocRef, studentData);
      } else {
        // Add new student
        await addDoc(collection(db, "students"), studentData);
      }
      onSave();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving student: ", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Full Name</FormLabel>
            <FormControl><Input placeholder="Alice Johnson" {...field} disabled={!!student} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="major" render={({ field }) => (
          <FormItem>
            <FormLabel>Major</FormLabel>
            <FormControl><Input placeholder="Computer Science" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="interests" render={({ field }) => (
          <FormItem>
            <FormLabel>Interests (comma-separated)</FormLabel>
            <FormControl><Input placeholder="AI, Web Dev, UX Design" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="avatar" render={({ field }) => (
          <FormItem>
            <FormLabel>Avatar URL</FormLabel>
            <FormControl><Input placeholder="https://placehold.co/100x100.png" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </Form>
  );
}


export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchStudents = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        if (querySnapshot.empty) {
            // If no students in firestore, add the default ones
            for (const stud of defaultStudents) {
                await addDoc(collection(db, "students"), stud);
            }
            fetchStudents(); // re-fetch to display
        } else {
            const studentsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Student));
            setStudents(studentsList);
        }
    } catch(e) {
        console.error("Error fetching students, maybe firebase config is not set?", e);
    }
  };

  useEffect(() => {
    fetchStudents();

    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setCurrentUser(null);
    }
  }, []);

  const handleLogin = (student: Student) => {
    setCurrentUser(student);
    localStorage.setItem("currentUser", JSON.stringify(student));
    setPopoverOpen(false);
  }

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  }

  const handleAdd = () => {
    setEditingStudent(null);
    setIsDialogOpen(true);
  }
  
  const onSave = () => {
    fetchStudents();
    setIsDialogOpen(false);
    setEditingStudent(null);
  }

  return (
    <SidebarInset>
      <PageHeader
        title="Student Profiles"
        description="Get to know your fellow classmates and their interests."
      />
      <main className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {currentUser ? (
                  <>
                      <p>Welcome, <span className="font-bold">{currentUser.name}</span>!</p>
                      <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
                  </>
              ) : (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="w-[200px] justify-between"
                    >
                      Select profile to login...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search student..." />
                      <CommandEmpty>No student found.</CommandEmpty>
                      <CommandGroup>
                        {students.map((student) => (
                          <CommandItem
                            key={student.id}
                            value={student.name}
                            onSelect={() => handleLogin(student)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentUser?.id === student.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {student.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAdd}><PlusCircle className="mr-2"/> Add Your Profile</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingStudent ? "Edit Your Profile" : "Add Your Profile"}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editingStudent} onSave={onSave} onOpenChange={setIsDialogOpen} />
              </DialogContent>
            </Dialog>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {students.map((student) => (
            <Card key={student.id} className="flex flex-col text-center hover:shadow-lg transition-shadow">
            <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <p className="text-muted-foreground">{student.major}</p>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="font-semibold mb-2 text-sm text-foreground">Interests</p>
                <div className="flex flex-wrap justify-center gap-2">
                {student.interests.map((interest) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
                </div>
            </CardContent>
            <CardFooter className="justify-center">
                 <Button variant="outline" size="sm" onClick={() => handleEdit(student)} disabled={!currentUser || currentUser.id !== student.id}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
            </CardFooter>
            </Card>
        ))}
        </div>
      </main>
    </SidebarInset>
  );
}
