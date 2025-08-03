
'use client'

import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusCircle, Pencil, LogIn, LogOut, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major is required."),
  interests: z.string().min(2, "Please list at least one interest."),
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsCollection = collection(db, "students");
      const studentSnapshot = await getDocs(studentsCollection);
      if (studentSnapshot.empty) {
        // Seed database with default students if collection is empty
        for (const stud of defaultStudents) {
          await addDoc(studentsCollection, {
            name: stud.name,
            major: stud.major,
            interests: stud.interests,
          });
        }
        // Fetch again after seeding
        const newSnapshot = await getDocs(studentsCollection);
        const studentsList = newSnapshot.docs.map(doc => {
            const data = doc.data();
            const name = data.name || '';
            const initials = name.split(' ').map((n:string) => n[0]).join('');
            return {
                id: doc.id,
                name,
                major: data.major || '',
                interests: data.interests || [],
                avatar: `https://placehold.co/100x100.png`,
                initials: initials.toUpperCase(),
                hint: "person portrait",
            } as Student;
        });
        setStudents(studentsList);
      } else {
        const studentsList = studentSnapshot.docs.map(doc => {
            const data = doc.data();
            const name = data.name || '';
            const initials = name.split(' ').map((n:string) => n[0]).join('');
            return {
                id: doc.id,
                name,
                major: data.major || '',
                interests: data.interests || [],
                avatar: `https://placehold.co/100x100.png`,
                initials: initials.toUpperCase(),
                hint: "person portrait",
            } as Student;
        });
        setStudents(studentsList);
      }
    } catch (error) {
      console.error("Error fetching students: ", error);
      toast({
        title: "Error",
        description: "Could not fetch student profiles.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    setIsMounted(true);
     try {
      const storedUser = localStorage.getItem("currentUser");
      if(storedUser) {
        setCurrentUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      if(currentUser) {
        localStorage.setItem("currentUser", currentUser);
      } else {
        localStorage.removeItem("currentUser");
      }
    }
  }, [currentUser, isMounted]);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      major: "",
      interests: "",
    },
  });

  useEffect(() => {
    if (editingStudent) {
      form.reset({
        name: editingStudent.name,
        major: editingStudent.major,
        interests: editingStudent.interests.join(', '),
      });
    } else {
      form.reset({
        name: "",
        major: "",
        interests: "",
      });
    }
  }, [editingStudent, form]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    const interestsArray = values.interests.split(',').map(interest => interest.trim());
    const studentData = { ...values, interests: interestsArray };

    try {
        if (editingStudent) {
          const studentDoc = doc(db, "students", editingStudent.id);
          await updateDoc(studentDoc, studentData);
          toast({
            title: "Profile Updated!",
            description: "Your student profile has been successfully updated.",
            className: "bg-accent text-accent-foreground border-green-300",
          });
        } else {
          const q = query(collection(db, "students"), where("name", "==", values.name));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            form.setError("name", { type: "manual", message: "A student with this name already exists." });
            return;
          }

          const docRef = await addDoc(collection(db, "students"), studentData);
          setCurrentUser(values.name);
          toast({
            title: "Profile Created!",
            description: "Your student profile has been added and you are now logged in.",
            className: "bg-accent text-accent-foreground border-green-300",
          });
        }
        fetchStudents(); // Refresh data
        form.reset();
        setEditingStudent(null);
        setOpen(false);
    } catch (error) {
        console.error("Error saving student data: ", error);
        toast({
            title: "Save Error",
            description: "Could not save your profile. Please try again.",
            variant: "destructive"
        });
    }
  }
  
  const handleOpenDialog = (student: Student | null) => {
    setEditingStudent(student);
    setOpen(true);
  }
  
  const handleLogin = (name: string) => {
    if (name === 'logout') {
        setCurrentUser(null);
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } else {
        setCurrentUser(name);
        toast({ title: "Logged In!", description: `You are now logged in as ${name}.`});
    }
  };

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
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setEditingStudent(null); }}>
            <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
            {currentUser ? (
                <Alert className="max-w-md">
                    <LogIn className="h-4 w-4" />
                    <AlertTitle>You are logged in as {currentUser}</AlertTitle>
                    <AlertDescription>
                        You can now edit your profile. To switch profiles, please log out first.
                    </AlertDescription>
                </Alert>
            ) : (
                <Alert className="max-w-md">
                    <AlertTitle>You are not logged in</AlertTitle>
                    <AlertDescription>
                        Select your profile from the dropdown to log in and manage your profile.
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex gap-2 items-center">
                <Select onValueChange={handleLogin} value={currentUser || ''}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Profile..." />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                        {currentUser && <SelectItem value="logout">Log Out</SelectItem>}
                    </SelectContent>
                </Select>
                <Button onClick={() => handleOpenDialog(null)}>
                    <PlusCircle className="mr-2" />
                    Add Your Profile
                </Button>
            </div>
            </div>
            <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Your Profile" : "Create Your Profile"}</DialogTitle>
                <DialogDescription>
                {editingStudent ? "Update your details below." : "Add your details to be displayed on the student profiles page."} Click save when you're done.
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
                        <Input placeholder="e.g. Ada Lovelace" {...field} disabled={!!editingStudent}/>
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
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : (
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
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(student)} disabled={currentUser !== student.name}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Profile
                    </Button>
                </CardFooter>
                </Card>
            ))}
            </div>
        )}
      </main>
    </SidebarInset>
  );
}
