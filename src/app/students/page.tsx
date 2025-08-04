
'use client'

import React, { useState, useEffect, useRef } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db, storage, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  avatar: z.any(),
  bio: z.string().max(200, "Bio must be 200 characters or less.").optional(),
  hobbies: z.string().optional(),
});

export type Student = {
  id: string;
  name: string;
  major: string;
  interests: string[];
  avatar: string;
  initials: string;
  hint: string;
  email?: string;
  uid?: string;
  bio?: string;
  hobbies?: string[];
};

function StudentForm({ student, onSave, onOpenChange }: { student?: Student | null, onSave: (updatedStudent: Partial<Student>) => void, onOpenChange: (open:boolean) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      major: student?.major || "",
      interests: student?.interests?.join(", ") || "",
      avatar: student?.avatar || "",
      bio: student?.bio || "",
      hobbies: student?.hobbies?.join(", ") || "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!student) return;
    try {
      let avatarUrl = student.avatar;
      const avatarFile = values.avatar?.[0];

      if (avatarFile && student.uid) {
        const storageRef = ref(storage, `avatars/${student.uid}/${avatarFile.name}`);
        const snapshot = await uploadBytes(storageRef, avatarFile);
        avatarUrl = await getDownloadURL(snapshot.ref);
      }

      const studentData:Partial<Student> = {
        name: values.name,
        major: values.major,
        interests: values.interests.split(",").map(i => i.trim()),
        avatar: avatarUrl,
        bio: values.bio,
        hobbies: values.hobbies?.split(",").map(i => i.trim()) || [],
        initials: values.name.split(" ").map(n => n[0]).join(""),
      };

      const studentDocRef = doc(db, "students", student.id);
      await updateDoc(studentDocRef, studentData);
      
      onSave({...student, ...studentData});
      onOpenChange(false);
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
            <FormControl><Input placeholder="Alice Johnson" {...field} /></FormControl>
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
        <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl><Textarea placeholder="Tell us a little about yourself." {...field} /></FormControl>
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
        <FormField control={form.control} name="hobbies" render={({ field }) => (
            <FormItem>
                <FormLabel>Hobbies (comma-separated)</FormLabel>
                <FormControl><Input placeholder="Reading, hiking, coding" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />
         <FormField control={form.control} name="avatar" render={({ field: { onChange, value, ...rest } }) => (
          <FormItem>
            <FormLabel>Avatar</FormLabel>
            <FormControl>
                <Input type="file" accept="image/*" onChange={(e) => onChange(e.target.files)} {...rest} />
            </FormControl>
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
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        if (querySnapshot.empty) {
            // Firestore is empty, no need to add defaults anymore
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

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  }

  const onSave = (updatedStudent: Partial<Student>) => {
    const updatedUser = { ...currentUser, ...updatedStudent } as Student;
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
    fetchStudents();
    setIsDialogOpen(false);
    setEditingStudent(null);
    toast({
        title: "Profile Saved!",
        description: "Your profile has been successfully saved.",
    });
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
              {currentUser && (
                  <div className="flex items-center gap-4">
                      <p>Welcome, <span className="font-bold">{currentUser.name}</span>!</p>
                      <Button variant="outline" size="sm" onClick={handleLogout}>Log Out</Button>
                  </div>
              )}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
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
                <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint || 'person'} />
                <AvatarFallback>{student.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <p className="text-muted-foreground">{student.major}</p>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {student.bio && <p className="text-sm text-foreground/80 italic">"{student.bio}"</p>}
                
                {student.interests && student.interests.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2 text-sm text-foreground">Interests</p>
                    <div className="flex flex-wrap justify-center gap-2">
                    {student.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                    </div>
                  </div>
                )}

                {student.hobbies && student.hobbies.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2 text-sm text-foreground">Hobbies</p>
                    <div className="flex flex-wrap justify-center gap-2">
                    {student.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="outline">{hobby}</Badge>
                    ))}
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter className="justify-center">
                <Button variant="outline" size="sm" onClick={() => handleEdit(student)} disabled={!currentUser || currentUser.uid !== student.uid}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </CardFooter>
            </Card>
        ))}
        </div>
      </main>
    </SidebarInset>
  );
}
