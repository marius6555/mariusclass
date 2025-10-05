
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GraduationCap, Briefcase, Trash2, Edit, Eye, Github, Linkedin, Instagram, Facebook, Mail, PlusCircle } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, updateDoc, addDoc, where, deleteDoc } from "firebase/firestore";
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';


// Common types
export type Project = {
  id: string;
  title: string;
  category: string;
  description: string;
  link: string;
  image: string;
  tags: string[];
  hint: string;
  author: string;
};

const backgroundImage = 'https://picsum.photos/seed/students-coding/1920/1080';

// Main Home Page Component
export default function Home() {
  return (
    <main>
        <div 
            id="home" 
            className="relative flex flex-col justify-center items-center text-center p-8 h-screen pt-[60px] bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImage})` }}
            data-ai-hint="african students coding"
        >
            <div className="absolute inset-0 bg-black/50 z-0" />
            <div className="relative z-10 text-white">
              <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Welcome to</h1>
              <div className="bg-primary/80 p-4 rounded-lg my-6 inline-block backdrop-blur-sm">
                <GraduationCap className="text-primary-foreground h-16 w-16" />
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight">ClassHub Central</h2>
              <p className="mt-4 text-lg md:text-xl text-gray-200 max-w-2xl">Your central hub for class activities, resources, and collaboration.</p>
            </div>
        </div>
        
        <div id="students" className="py-16 lg:py-24 bg-background">
          <StudentsSection />
        </div>
    </main>
  );
}


// Students Section
const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").optional(),
  hobbies: z.string().min(2, "Please list at least one hobby.").optional(),
  github: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  instagram: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  facebook: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  whatsapp: z.string().regex(/^\+\d+$/, "Number must start with a country code (e.g., +1234567890).").optional().or(z.literal('')),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

function StudentForm({ student, onSave, onOpenChange }: { student: Student | null, onSave: (data: any) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: student?.name || "",
      major: student?.major || "",
      interests: student?.interests?.join(", ") || "",
      bio: student?.bio || "",
      hobbies: student?.hobbies?.join(", ") || "",
      github: student?.github || "",
      linkedin: student?.linkedin || "",
      instagram: student?.instagram || "",
      facebook: student?.facebook || "",
      whatsapp: student?.whatsapp || "",
    },
  });

  const handleSubmit = async (values: StudentFormValues) => {
    const studentData = {
      ...values,
      interests: values.interests.split(",").map(i => i.trim()),
      hobbies: values.hobbies?.split(",").map(i => i.trim()) || [],
    };
    onSave(studentData);
    onOpenChange(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
        
        <Separator/>
        <h3 className="font-semibold text-center">Social Links</h3>

        <FormField control={form.control} name="github" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Github className="w-4 h-4"/> GitHub</FormLabel><FormControl><Input placeholder="https://github.com/your-username" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
         <FormField control={form.control} name="linkedin" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Linkedin className="w-4 h-4"/> LinkedIn</FormLabel><FormControl><Input placeholder="https://linkedin.com/in/your-profile" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="instagram" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Instagram className="w-4 h-4"/> Instagram</FormLabel><FormControl><Input placeholder="https://instagram.com/your-username" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="facebook" render={({ field }) => (
          <FormItem><FormLabel className="flex items-center gap-2"><Facebook className="w-4 h-4"/> Facebook</FormLabel><FormControl><Input placeholder="https://facebook.com/your-profile" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="whatsapp" render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                </svg>
                WhatsApp
            </FormLabel>
            <FormControl><Input placeholder="+1234567890" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />


        <Button type="submit" className="w-full">Save Profile</Button>
      </form>
    </Form>
  );
}

const socialIconMap: { [key: string]: React.ReactNode } = {
  github: <Github className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  whatsapp: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
    </svg>
  ),
};

function StudentsSection() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [studentProjects, setStudentProjects] = useState<Project[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const studentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(studentsList);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not fetch student profiles." });
      const permissionError = new FirestorePermissionError({ path: 'students', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
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
  
    const studentData = {
      ...data,
      uid: currentUser.uid,
      email: currentUser.email,
      initials: data.name.split(" ").map((n: string) => n[0]).join(""),
    };
  
    if (isNew) {
        const docRef = collection(db, "students");
        addDoc(docRef, studentData).then(() => {
            const updatedStudent: Student = { ...currentUser, ...studentData, id: docRef.id };
            setCurrentUser(updatedStudent);
            localStorage.setItem("currentUser", JSON.stringify(updatedStudent));
            toast({ title: "Profile Created!", description: "Your student profile is now live." });
            fetchStudents();
            setIsFormOpen(false);
            setEditingStudent(null);
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: 'students', operation: 'create', requestResourceData: studentData });
            errorEmitter.emit('permission-error', permissionError);
        });
    } else if (studentToUpdate?.id) {
        const studentRef = doc(db, "students", studentToUpdate.id);
        updateDoc(studentRef, studentData).then(() => {
            const updatedStudent: Student = { ...currentUser, ...studentData };
            setCurrentUser(updatedStudent);
            localStorage.setItem("currentUser", JSON.stringify(updatedStudent));
            toast({ title: "Profile Updated!", description: "Your changes have been saved." });
            fetchStudents();
            setIsFormOpen(false);
            setEditingStudent(null);
        }).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: studentRef.path, operation: 'update', requestResourceData: studentData });
            errorEmitter.emit('permission-error', permissionError);
        });
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

      const studentRef = doc(db, "students", currentUser.id);
      deleteDoc(studentRef).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: studentRef.path, operation: 'delete' });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError; // Re-throw to stop execution flow
      });

      await deleteUser(auth.currentUser);

      localStorage.removeItem("currentUser");
      toast({ title: "Profile Deleted", description: "Your profile has been successfully deleted." });
      setCurrentUser(null);
      setStudents(students.filter(s => s.id !== currentUser.id));
      router.push('/');
    } catch (error: any) {
      if (!(error instanceof FirestorePermissionError)) {
          toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
      }
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

  const handleViewProfile = async (student: Student) => {
    setViewingStudent(student);
    try {
      const q = query(collection(db, "projects"), where("author", "==", student.name));
      const querySnapshot = await getDocs(q);
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setStudentProjects(projectsList);
    } catch (error) {
        const permissionError = new FirestorePermissionError({ path: 'projects', operation: 'list' });
        errorEmitter.emit('permission-error', permissionError);
    }
  };
  
  const userHasProfile = useMemo(() => students.some(s => s.uid === currentUser?.uid), [students, currentUser]);

  return (
      <div className="container mx-auto p-6 lg:p-8">
        <PageHeader
          title="Student Profiles"
          description="Get to know your classmates."
        />
        {currentUser && !userHasProfile && (
            <div className="flex justify-center my-6">
                <Button onClick={openFormForNew}>
                    <PlusCircle className="mr-2"/> Create Your Profile
                </Button>
            </div>
        )}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Your Profile" : "Create Your Profile"}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editingStudent || currentUser} onSave={onSave} onOpenChange={setIsFormOpen}/>
            </DialogContent>
        </Dialog>
        
        <Dialog open={!!viewingStudent} onOpenChange={(open) => !open && setViewingStudent(null)}>
            <DialogContent className="max-w-2xl">
                {viewingStudent && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-center text-2xl font-headline mb-4">{viewingStudent.name}'s Profile</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                             <div className="flex-shrink-0 text-center">
                                <Avatar className="w-32 h-32 mb-4 mx-auto">
                                    <AvatarFallback>{viewingStudent.initials}</AvatarFallback>
                                </Avatar>
                                <h3 className="font-bold text-lg">{viewingStudent.name}</h3>
                                <p className="text-muted-foreground">{viewingStudent.major}</p>
                                <div className="flex justify-center gap-3 mt-4">
                                  {viewingStudent.github && <a href={viewingStudent.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">{socialIconMap.github}</a>}
                                  {viewingStudent.linkedin && <a href={viewingStudent.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">{socialIconMap.linkedin}</a>}
                                  {viewingStudent.instagram && <a href={viewingStudent.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">{socialIconMap.instagram}</a>}
                                  {viewingStudent.facebook && <a href={viewingStudent.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">{socialIconMap.facebook}</a>}
                                  {viewingStudent.whatsapp && <a href={`https://wa.me/${viewingStudent.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">{socialIconMap.whatsapp}</a>}
                                </div>
                                {viewingStudent.email && (
                                     <a href={`mailto:${viewingStudent.email}`} className="text-sm text-primary hover:underline flex items-center justify-center gap-2 mt-2">
                                        <Mail className="w-4 h-4"/>{viewingStudent.email}
                                    </a>
                                )}
                            </div>
                             <div className="w-full space-y-6">
                                {viewingStudent.bio && (
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">About Me</h4>
                                    <p className="text-muted-foreground">{viewingStudent.bio}</p>
                                </div>
                                )}
                                {viewingStudent.interests && viewingStudent.interests.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">Interests</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingStudent.interests.map(interest => <Badge key={interest} variant="secondary">{interest}</Badge>)}
                                    </div>
                                </div>
                                )}
                                {viewingStudent.hobbies && viewingStudent.hobbies.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">Hobbies</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {viewingStudent.hobbies.map(hobby => <Badge key={hobby} variant="outline">{hobby}</Badge>)}
                                    </div>
                                </div>
                                )}
                                {studentProjects && studentProjects.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-lg mb-2 border-b pb-1">Projects</h4>
                                    <ul className="space-y-2">
                                    {studentProjects.map(project => (
                                        <li key={project.id}>
                                            <Link href={`/projects#${project.id}`} className="text-primary hover:underline flex items-center gap-2">
                                                 {project.title}
                                            </Link>
                                        </li>
                                    ))}
                                    </ul>
                                </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
          {students.map((student) => (
            <Card key={student.id} className="flex flex-col">
              <CardHeader className="items-center text-center">
                <Avatar className="w-24 h-24 mb-4">
                  <AvatarFallback>{student.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="font-headline">{student.name}</CardTitle>
                <CardDescription className="flex items-center gap-2"><Briefcase className="w-4 h-4"/>{student.major}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                        {student.interests.slice(0, 3).map(interest => <Badge key={interest} variant="secondary">{interest}</Badge>)}
                        {student.interests.length > 3 && <Badge variant="outline">+{student.interests.length - 3}</Badge>}
                    </div>
                  </div>
              </CardContent>
              <CardFooter className="flex-col !items-stretch gap-2 pt-4 border-t">
                 <Button variant="outline" size="sm" onClick={() => handleViewProfile(student)}>
                    <Eye className="mr-2 h-4 w-4"/> View Profile
                 </Button>
                 {currentUser?.uid === student.uid && (
                  <div className="flex w-full gap-2">
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
      </div>
  );
}
