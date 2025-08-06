
'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GraduationCap, ExternalLink, PlusCircle, Mail, Briefcase, Trash2, Edit, Camera, Eye, Github, Linkedin, Instagram, Facebook, Download, Link as LinkIcon, Bell, Calendar, Milestone } from "lucide-react";
import { db, storage, auth } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy, Timestamp, updateDoc, setDoc, addDoc, where, deleteDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { PageHeader } from '@/components/page-header';
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
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serverTimestamp } from 'firebase/firestore';


// Common types
type Project = {
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

type Event = {
  id: string;
  date: string;
  title: string;
  type: "event" | "deadline" | "announcement";
  description: string;
};

type Resource = {
  id: string;
  title: string;
  category: string;
  type: "link" | "file";
  href: string;
};

type GroupedResources = {
  [category: string]: Resource[];
};


// Main Home Page Component
export default function Home() {

  return (
    <main>
        <div id="home" className="flex flex-col justify-center items-center text-center p-8 h-screen pt-[60px] bg-background">
            <div className="relative z-10">
              <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Welcome to</h1>
              <div className="bg-primary p-4 rounded-lg my-6 inline-block">
                <GraduationCap className="text-primary-foreground h-16 w-16" />
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight">ClassHub Central</h2>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">Your central hub for class activities, resources, and collaboration.</p>
            </div>
        </div>
        
        <div id="students" className="py-16 lg:py-24 bg-background">
          <StudentsSection />
        </div>
        
        <div id="projects" className="py-16 lg:py-24 bg-card">
          <ProjectsSection />
        </div>

        <div id="events" className="py-16 lg:py-24 bg-background">
          <EventsSection />
        </div>

        <div id="resources" className="py-16 lg:py-24 bg-card">
          <ResourcesSection />
        </div>
        
        <div id="contact" className="py-16 lg:py-24 bg-background">
          <ContactSection />
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
  whatsapp: z.string().min(10, "Please enter a valid WhatsApp number.").optional().or(z.literal('')),
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
            <FormControl><Input placeholder="Your WhatsApp number" {...field} /></FormControl>
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
  
    const studentData = {
      ...data,
      uid: currentUser.uid,
      email: currentUser.email,
      initials: data.name.split(" ").map((n:string) => n[0]).join(""),
    };
  
    try {
      let updatedStudentDoc: Omit<Student, 'id'>;
      if (isNew) {
        const docRef = await addDoc(collection(db, "students"), studentData);
        updatedStudentDoc = { ...studentData };
        toast({ title: "Profile Created!", description: "Your student profile is now live." });
      } else if(studentToUpdate?.id) {
        const studentRef = doc(db, "students", studentToUpdate.id);
        await updateDoc(studentRef, { ...studentData });
        updatedStudentDoc = { ...studentToUpdate, ...studentData };
        toast({ title: "Profile Updated!", description: "Your changes have been saved." });
      } else {
        throw new Error("Could not find student profile to update.");
      }

      const updatedStudent: Student = { ...currentUser, ...updatedStudentDoc };

      setCurrentUser(updatedStudent);
      localStorage.setItem("currentUser", JSON.stringify(updatedStudent));
      
      await fetchStudents(); 
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

  const handleViewProfile = async (student: Student) => {
    setViewingStudent(student);
    try {
      const q = query(collection(db, "projects"), where("author", "==", student.name));
      const querySnapshot = await getDocs(q);
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setStudentProjects(projectsList);
    } catch (error) {
      console.error("Error fetching student projects:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch student projects." });
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
                                            <Link href={project.link} target="_blank" className="text-primary hover:underline flex items-center gap-2">
                                                 {project.title} <ExternalLink className="w-4 h-4"/>
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


// Projects Section
const projectFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(2, "Category must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  link: z.string().url("Please enter a valid URL."),
  image: z.any().optional(),
  tags: z.string().min(2, "Please list at least one tag."),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const projectCategories = ["All", "AI", "Web Dev", "Mobile", "Data Science", "Cybersecurity"];

function ProjectForm({ onSave, onOpenChange, author }: { onSave: (data: any) => void, onOpenChange: (open: boolean) => void, author: string }) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
      link: "",
      image: null,
      tags: "",
    },
  });
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        form.setValue("image", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (values: ProjectFormValues) => {
    const projectData = {
      title: values.title,
      category: values.category,
      description: values.description,
      link: values.link,
      image: values.image,
      tags: values.tags.split(",").map(t => t.trim()),
      hint: 'abstract',
      author: author,
    };
    onSave(projectData);
    onOpenChange(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Project Title</FormLabel><FormControl><Input placeholder="AI-Powered Chatbot" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="AI" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A chatbot using NLP..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="link" render={({ field }) => (
          <FormItem><FormLabel>Project URL</FormLabel><FormControl><Input placeholder="https://github.com/user/project" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormItem>
            <FormLabel>Project Image</FormLabel>
            <FormControl>
              <Input type="file" accept="image/*" onChange={handleImageChange} />
            </FormControl>
            {preview && <img src={preview} alt="Project preview" className="mt-4 rounded-md object-cover w-full h-auto" />}
            <FormMessage />
        </FormItem>
        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input placeholder="Python, NLTK, Flask" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">Add Project</Button>
      </form>
    </Form>
  );
}

function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(query(collection(db, "projects")));
      const projectsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projectsList);
    } catch (e) {
      console.error("Error fetching projects: ", e);
    }
  };

  useEffect(() => {
    fetchProjects();
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const onSave = async (data: any) => {
    try {
        let imageUrl = "https://placehold.co/600x400.png";
        let projectDocRefForId = doc(collection(db, "projects")); // Create a ref to get an ID first

        if (data.image && data.image.startsWith('data:image')) {
            const storageRef = ref(storage, `projects/${projectDocRefForId.id}`);
            await uploadString(storageRef, data.image, 'data_url');
            imageUrl = await getDownloadURL(storageRef);
        }
        
        const finalProjectData = { ...data, image: imageUrl, id: projectDocRefForId.id };
        await setDoc(projectDocRefForId, finalProjectData);
      
        await addDoc(collection(db, "notifications"), {
            message: `New project added: "${data.title}" by ${data.author}`,
            type: 'new_project',
            link: `/projects#${projectDocRefForId.id}`,
            createdAt: serverTimestamp(),
            read: false,
        });

        toast({ title: "Project Added!", description: "Your project has been added to the hub." });
        fetchProjects();
        setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving project:", error);
      toast({ variant: "destructive", title: "Save failed", description: "There was an issue saving your project."});
    }
  };
  
  const handleAddClick = () => {
      setIsDialogOpen(true);
  };

  return (
      <div className="container mx-auto p-6 lg:p-8">
        <PageHeader
          title="Project Hub"
          description="Discover innovative projects by students."
        />
        <div className="flex justify-end my-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                 <Button onClick={handleAddClick} disabled={!currentUser}>
                    <PlusCircle className="mr-2"/> Add Project
                 </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Your Project</DialogTitle>
                </DialogHeader>
                {currentUser ? (
                    <ProjectForm 
                        onSave={onSave} 
                        onOpenChange={setIsDialogOpen} 
                        author={currentUser.name} 
                    />
                ) : (
                    <div className="text-center text-muted-foreground py-4">
                        <p>Please log in to add a project.</p>
                        <Link href="/auth" className="mt-2 inline-block">
                            <Button>Login</Button>
                        </Link>
                    </div>
                )}
              </DialogContent>
            </Dialog>
        </div>
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
            {projectCategories.map((category) => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          {projectCategories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects
                  .filter((p) => category === "All" || p.category === category)
                  .map((project) => (
                    <Card key={project.id} id={project.id} className="flex flex-col overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="aspect-video relative">
                        <img 
                          src={project.image || 'https://placehold.co/600x400.png'} 
                          alt={project.title} 
                          className="object-cover w-full h-full" 
                          data-ai-hint={project.hint} 
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="font-headline">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                         <p className="text-xs text-muted-foreground mt-4">By: {project.author}</p>
                      </CardContent>
                      <CardFooter className="flex items-center gap-2">
                        <Link href={project.link} target="_blank" className="w-full">
                          <Button className="w-full bg-primary hover:bg-primary/90">
                            View Project <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
  );
}


// Events Section
const eventFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date." }),
  type: z.enum(["event", "deadline", "announcement"]),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const eventConfig: { [key: string]: { icon: React.ReactNode; variant: BadgeProps['variant'] } } = {
  event: { icon: <Calendar className="h-4 w-4" />, variant: 'default' },
  deadline: { icon: <Bell className="h-4 w-4" />, variant: 'destructive' },
  announcement: { icon: <Milestone className="h-4 w-4" />, variant: 'secondary' },
};

const ADMIN_EMAIL_EVENTS = "tingiya730@gmail.com";

function EventForm({ onSave, onOpenChange }: { onSave: () => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { title: "", description: "", date: "", type: "event" },
  });

  const handleSubmit = async (values: EventFormValues) => {
    try {
      const eventDocRef = await addDoc(collection(db, "events"), values);
      await addDoc(collection(db, "notifications"), {
        message: `New ${values.type}: ${values.title}`,
        type: 'new_event',
        link: `/events#${eventDocRef.id}`,
        createdAt: serverTimestamp(),
        read: false,
      });
      onSave();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving event: ", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="Final Project Presentations" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="date" render={({ field }) => (
          <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select an event type" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Showcase your hard work..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">Add Event</Button>
      </form>
    </Form>
  );
}

function EventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, "events"), orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(eventsList);
    } catch (e) {
      console.error("Error fetching events: ", e);
    }
  };

  useEffect(() => {
    fetchEvents();
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);

  const onSave = () => {
    fetchEvents();
    setIsDialogOpen(false);
    toast({ title: "Event Added!", description: "The new event has been added." });
  };
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL_EVENTS;

  return (
      <div className="container mx-auto p-6 lg:p-8">
        <PageHeader
          title="Events & Updates"
          description="Stay informed about important dates, announcements, and deadlines."
        />
        {isAdmin && (
          <div className="flex justify-end my-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2"/> Add Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a New Event</DialogTitle>
                  </DialogHeader>
                  <EventForm onSave={onSave} onOpenChange={setIsDialogOpen} />
                </DialogContent>
              </Dialog>
          </div>
        )}
        <div className="relative pl-6 mt-6">
          <div className="absolute left-3 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
          {events.length === 0 && !isAdmin && <p>No events posted yet. Check back soon!</p>}
          {events.length === 0 && isAdmin && (
            <div className="text-center text-muted-foreground py-4">
              <p>There are no events. As an admin, you can add one.</p>
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} id={event.id} className="relative mb-8 flex items-start gap-6">
              <div className="absolute left-3 top-1.5 flex -translate-x-1/2 items-center justify-center rounded-full bg-background p-0.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${event.type === 'deadline' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                  {eventConfig[event.type]?.icon || <Calendar className="h-4 w-4" />}
                </div>
              </div>
              <div className="ml-10 w-full">
                <div className="flex items-center gap-4 mb-1">
                  <h3 className="font-headline text-lg font-semibold">{event.title}</h3>
                  <Badge variant={eventConfig[event.type]?.variant || 'default'} className="capitalize">{event.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {new Date(event.date).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                </p>
                <p className="text-foreground">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}


// Resources Section
const resourceFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(2, "Please select a category."),
  type: z.enum(["link", "file"]),
  href: z.string().min(1, "Please enter a URL or file path."),
});

type ResourceFormValues = z.infer<typeof resourceFormSchema>;

const resourceCategories = [
  "Learning Platform",
  "Tools You Must Try",
  "Project Ideas",
  "Upcoming Tech Challenges",
];

const ADMIN_EMAIL_RESOURCES = "tingiya730@gmail.com";

function ResourceForm({ onSave, onOpenChange }: { onSave: () => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: { title: "", category: "", type: "link", href: "" },
  });

  const handleSubmit = async (values: ResourceFormValues) => {
    try {
      const resourceDocRef = await addDoc(collection(db, "resources"), values);
      await addDoc(collection(db, "notifications"), {
        message: `New resource added in ${values.category}: ${values.title}`,
        type: 'new_resource',
        link: `/resources#${resourceDocRef.id}`,
        createdAt: serverTimestamp(),
        read: false,
      });
      onSave();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error saving resource: ", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
              <SelectContent>
                {resourceCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Resource Title</FormLabel><FormControl><Input placeholder="e.g., Interactive Coding Platform" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem><FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select resource type" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="file">File</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="href" render={({ field }) => (
          <FormItem><FormLabel>URL / Path</FormLabel><FormControl><Input placeholder="https://example.com" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full">Add Resource</Button>
      </form>
    </Form>
  );
}

function ResourcesSection() {
  const [resources, setResources] = useState<GroupedResources>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();

  const fetchResources = async () => {
    try {
      const q = query(collection(db, "resources"), orderBy("category"));
      const querySnapshot = await getDocs(q);
      const resourcesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      
      const grouped = resourcesList.reduce((acc, resource) => {
        const { category } = resource;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(resource);
        return acc;
      }, {} as GroupedResources);

      setResources(grouped);
    } catch (e) {
      console.error("Error fetching resources: ", e);
    }
  };

  useEffect(() => {
    fetchResources();
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);
  
  const onSave = () => {
    fetchResources();
    setIsDialogOpen(false);
    toast({ title: "Resource Added!", description: "The new resource has been added." });
  };
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL_RESOURCES;
  
  return (
      <div className="container mx-auto p-6 lg:p-8">
        <PageHeader
          title="Resources"
          description="A curated collection of study materials and helpful links."
        />
        {isAdmin && (
          <div className="flex justify-end my-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button><PlusCircle className="mr-2"/> Add Resource</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a New Resource</DialogTitle>
                  </DialogHeader>
                  <ResourceForm onSave={onSave} onOpenChange={setIsDialogOpen} />
                </DialogContent>
              </Dialog>
          </div>
        )}
        <Accordion type="single" collapsible defaultValue={Object.keys(resources)[0]} className="w-full space-y-4 mt-6">
          {Object.entries(resources).map(([category, items]) => (
            <AccordionItem value={category} key={category} id={items[0].id} className="border-none">
              <Card>
                <AccordionTrigger className="p-6 font-headline text-xl hover:no-underline">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6">
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-background">
                          <span className="font-medium">{item.title}</span>
                           <Link href={item.href} target="_blank">
                             <Button variant="ghost" size="icon">
                                   {item.type === 'file' ? <Download /> : <LinkIcon />}
                                   <span className="sr-only">{item.type === 'file' ? 'Download' : 'Open link'}</span>
                             </Button>
                           </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
        {Object.keys(resources).length === 0 && !isAdmin && <p>No resources posted yet. Check back soon!</p>}
        {Object.keys(resources).length === 0 && isAdmin && (
            <div className="text-center text-muted-foreground py-4">
              <p>There are no resources. As an admin, you can add one.</p>
            </div>
        )}
      </div>
  );
}


// Contact Section
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  whatsapp: z.string().optional(),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }).max(500),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const ADMIN_EMAIL_CONTACT = "tingiya730@gmail.com";

function ContactSection() {
  const { toast } = useToast();
  const [admin, setAdmin] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const q = query(collection(db, "students"), where("email", "==", ADMIN_EMAIL_CONTACT));
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
      <div className="container mx-auto p-6 lg:p-8">
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
      </div>
  );
}
