
'use client'

import React, { useState, useEffect, useRef } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { db, storage } from "@/lib/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '../students/page';
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  avatar: z.any(),
  bio: z.string().max(200, "Bio must be 200 characters or less.").optional(),
  hobbies: z.string().optional(),
});

function StudentForm({ student, onSave, onOpenChange }: { student?: Student | null, onSave: (updatedStudent: Partial<Student>) => void, onOpenChange: (open:boolean) => void }) {
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

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        router.push('/auth');
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setCurrentUser(null);
      router.push('/auth');
    }
  }, [router]);

  const onSave = (updatedStudent: Partial<Student>) => {
    const updatedUser = { ...currentUser, ...updatedStudent } as Student;
    setCurrentUser(updatedUser);
    localStorage.setItem("currentUser", JSON.stringify(updatedUser));
    
    setIsDialogOpen(false);
    toast({
        title: "Profile Saved!",
        description: "Your profile has been successfully saved.",
    });
  }

  const handleEdit = () => {
    setIsDialogOpen(true);
  }
  
  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    router.push('/auth');
    toast({ title: "Logged Out", description: "You have been successfully logged out." });
  }

  if (!currentUser) {
    return (
        <SidebarInset>
            <PageHeader title="My Profile" description="View and manage your profile." />
            <main className="p-6 lg:p-8 flex flex-col items-center justify-center text-center">
                <p className="mb-4">You need to be logged in to see your profile.</p>
                <Link href="/auth">
                    <Button>Login/Sign Up</Button>
                </Link>
            </main>
        </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <PageHeader title="My Profile" description="View and manage your profile." />
      <main className="p-6 lg:p-8 flex justify-center">
        <Card className="w-full max-w-2xl text-center">
            <CardHeader className="items-center">
                <Avatar className="w-24 h-24 mb-4 ring-2 ring-primary ring-offset-2 ring-offset-background">
                    <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint={currentUser.hint || 'person'} />
                    <AvatarFallback>{currentUser.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{currentUser.name}</CardTitle>
                <CardDescription>{currentUser.major}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentUser.bio && (
                    <div>
                        <h3 className="font-semibold mb-2 text-lg text-foreground">Bio</h3>
                        <p className="text-foreground/80 italic">"{currentUser.bio}"</p>
                    </div>
                )}
                
                {currentUser.interests && currentUser.interests.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-lg text-foreground">Interests</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                    {currentUser.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                    </div>
                  </div>
                )}

                {currentUser.hobbies && currentUser.hobbies.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-lg text-foreground">Hobbies</h3>
                    <div className="flex flex-wrap justify-center gap-2">
                    {currentUser.hobbies.map((hobby) => (
                        <Badge key={hobby} variant="outline">{hobby}</Badge>
                    ))}
                    </div>
                  </div>
                )}
            </CardContent>
            <CardFooter className="justify-center gap-4">
                <Button onClick={handleEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Profile
                </Button>
                <Button variant="outline" onClick={handleLogout}>Log Out</Button>
            </CardFooter>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Your Profile</DialogTitle>
                </DialogHeader>
                <StudentForm student={currentUser} onSave={onSave} onOpenChange={setIsDialogOpen} />
              </DialogContent>
            </Dialog>
      </main>
    </SidebarInset>
  );
}

