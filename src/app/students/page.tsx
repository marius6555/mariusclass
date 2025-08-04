
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db, storage, auth } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Mail, Briefcase, PlusCircle, Trash2, Edit, Camera } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").optional(),
  hobbies: z.string().min(2, "Please list at least one hobby.").optional(),
  avatar: z.any().optional(),
});

function StudentForm({ student, onSave, onOpenChange }: { student: Student | null, onSave: (data: any) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: student?.name || "",
      major: student?.major || "",
      interests: student?.interests?.join(", ") || "",
      bio: student?.bio || "",
      hobbies: student?.hobbies?.join(", ") || "",
      avatar: null,
    },
  });
  const [preview, setPreview] = useState<string | null>(student?.avatar || null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        form.setValue("avatar", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const studentData = {
      ...values,
      interests: values.interests.split(",").map(i => i.trim()),
      hobbies: values.hobbies?.split(",").map(i => i.trim()) || [],
    };
    if (preview && preview !== student?.avatar) {
      studentData.avatar = preview;
    } else {
      delete studentData.avatar;
    }
    onSave(studentData);
    onOpenChange(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormItem className="flex flex-col items-center">
            <FormLabel htmlFor="avatar-upload" className="cursor-pointer">
              <div className="relative group">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={preview || `https://placehold.co/100x100.png`} alt={form.getValues("name")} />
                  <AvatarFallback>{form.getValues("name")?.substring(0,2)}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white h-8 w-8" />
                </div>
              </div>
            </FormLabel>
            <FormControl>
              <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} ref={avatarInputRef} />
            </FormControl>
            <FormMessage />
        </FormItem>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Ada Lovelace" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="major" render={({ field }) => (
          <FormItem><FormLabel>Major</FormLabel><FormControl><Input placeholder="Computer Science" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="interests" render={({ field }) => (
          <FormItem><FormLabel>Interests (comma-separated)</FormLabel><FormControl><Input placeholder="AI, Web Development" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="bio" render={({ field }) => (
          <FormItem><FormLabel>Bio</FormLabel><FormControl><Textarea placeholder="Tell us about yourself..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="hobbies" render={({ field }) => (
          <FormItem><FormLabel>Hobbies (comma-separated)</FormLabel><FormControl><Input placeholder="Reading, Hiking" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </Form>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsList);
    } catch (e) {
      console.error("Error fetching students: ", e);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch student profiles." });
    }
  };
  
  useEffect(() => {
    fetchStudents();
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const onSave = async (data: any) => {
    if (!currentUser?.uid) return;
    
    let studentToUpdate = students.find(s => s.uid === currentUser.uid);
    const isNew = !studentToUpdate;

    let avatarUrl = studentToUpdate?.avatar;

    if (data.avatar && data.avatar.startsWith('data:image')) {
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadString(storageRef, data.avatar, 'data_url');
      avatarUrl = await getDownloadURL(storageRef);
    }
  
    const studentData = {
      ...data,
      uid: currentUser.uid,
      email: currentUser.email,
      avatar: avatarUrl,
      initials: data.name.split(" ").map((n:string) => n[0]).join(""),
      hint: 'person',
    };
    delete studentData.id;
  
    try {
      let updatedStudent: Student;
      if (isNew) {
        const docRef = await addDoc(collection(db, "students"), studentData);
        updatedStudent = { id: docRef.id, ...studentData };
        toast({ title: "Profile Created!", description: "Your student profile is now live." });
      } else if(studentToUpdate?.id) {
        const studentRef = doc(db, "students", studentToUpdate.id);
        await updateDoc(studentRef, studentData);
        updatedStudent = { ...studentToUpdate, ...studentData };
        toast({ title: "Profile Updated!", description: "Your changes have been saved." });
      } else {
        throw new Error("Could not find student profile to update.");
      }

      setCurrentUser(updatedStudent);
      localStorage.setItem("currentUser", JSON.stringify(updatedStudent));
      
      await fetchStudents(); // Refetch all students to update the list
      setIsFormOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
      console.error("Save error:", error);
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !auth.currentUser) {
      toast({ variant: "destructive", title: "Error", description: "You must be logged in to delete a profile." });
      return;
    }
    
    if (!password) {
        toast({ variant: 'destructive', title: 'Password Required', description: 'Please enter your password to proceed.' });
        return;
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      if (currentUser.avatar && currentUser.avatar.includes('firebasestorage')) {
        const avatarRef = ref(storage, currentUser.avatar);
        await deleteObject(avatarRef).catch(error => {
            if (error.code !== 'storage/object-not-found') {
                throw error;
            }
            console.log("Avatar not found, skipping delete.");
        });
      }

      await deleteDoc(doc(db, "students", currentUser.id));
      await deleteUser(auth.currentUser);

      localStorage.removeItem("currentUser");
      toast({ title: "Profile Deleted", description: "Your profile has been successfully deleted." });
      setCurrentUser(null);
      setStudents(students.filter(s => s.id !== currentUser.id));
      router.push('/');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      console.error("Deletion error:", error);
    }
  };


  const openFormForNew = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const openFormForEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };
  
  const userHasProfile = useMemo(() => students.some(s => s.uid === currentUser?.uid), [students, currentUser]);

  return (
    <SidebarInset>
      <PageHeader
        title="Student Profiles"
        description="Get to know your classmates."
      />
      <main className="p-6 lg:p-8">
        {currentUser && !userHasProfile && (
            <div className="flex justify-center mb-6">
                <Button onClick={openFormForNew}>
                    <PlusCircle className="mr-2"/> Create Your Profile
                </Button>
            </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Your Profile" : "Create Your Profile"}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editingStudent} onSave={onSave} onOpenChange={setIsFormOpen}/>
            </DialogContent>
        </Dialog>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => (
            <Card key={student.id} className="flex flex-col">
              <CardHeader className="items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarImage src={student.avatar} alt={student.name} data-ai-hint={student.hint} />
                  <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <CardDescription className="flex items-center gap-2"><Briefcase className="w-4 h-4"/>{student.major}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">About Me</h4>
                    <p className="text-sm text-muted-foreground">{student.bio}</p>
                  </div>
                  {student.interests && student.interests.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-2">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                            {student.interests.map(interest => <Badge key={interest} variant="secondary">{interest}</Badge>)}
                        </div>
                    </div>
                  )}
                   {student.hobbies && student.hobbies.length > 0 && (
                     <div>
                        <h4 className="font-semibold text-sm mb-2">Hobbies</h4>
                        <div className="flex flex-wrap gap-2">
                            {student.hobbies.map(hobby => <Badge key={hobby} variant="outline">{hobby}</Badge>)}
                        </div>
                    </div>
                   )}
              </CardContent>
              <CardFooter className="flex-col !items-start">
                 {student.email && <a href={`mailto:${student.email}`} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 mb-4"><Mail className="w-4 h-4"/>{student.email}</a>}
                 {currentUser?.uid === student.uid && (
                  <div className="flex w-full gap-2 mt-auto pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => openFormForEdit(student)} className="flex-1">
                          <Edit className="mr-2 h-4 w-4"/> Edit
                      </Button>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="flex-1">
                                  <Trash2 className="mr-2 h-4 w-4"/> Delete
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                                      Please enter your password to confirm.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <Input 
                                  type="password"
                                  placeholder="Enter your password"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                              />
                              <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setPassword('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </SidebarInset>
  );
}

    