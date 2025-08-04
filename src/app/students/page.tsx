
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
import { Mail, Briefcase, PlusCircle, Trash2, Edit, Camera, Eye, ExternalLink, Github, Linkedin, Instagram, Facebook } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  major: z.string().min(2, "Major must be at least 2 characters."),
  interests: z.string().min(2, "Please list at least one interest."),
  bio: z.string().min(10, "Bio must be at least 10 characters.").optional(),
  hobbies: z.string().min(2, "Please list at least one hobby.").optional(),
  avatar: z.any().optional(),
  github: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  linkedin: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  instagram: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  facebook: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  whatsapp: z.string().min(10, "Please enter a valid WhatsApp number.").optional().or(z.literal('')),
});

type Project = {
  id: string;
  title: string;
  link: string;
  author: string;
};

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
      github: student?.github || "",
      linkedin: student?.linkedin || "",
      instagram: student?.instagram || "",
      facebook: student?.facebook || "",
      whatsapp: student?.whatsapp || "",
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
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
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>
  ),
};

export default function StudentsPage() {
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

    let avatarUrl = studentToUpdate?.avatar;

    if (data.avatar && data.avatar.startsWith('data:image')) {
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      if (avatarUrl && avatarUrl.includes('firebasestorage')) {
          try {
            await deleteObject(ref(storage, avatarUrl));
          } catch(e:any) {
              if (e.code !== 'storage/object-not-found') {
                  console.error("Could not delete old avatar", e);
              }
          }
      }
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
    delete studentData.avatar; // this is the base64 string, not the URL
  
    try {
      let updatedStudentDoc: Student;
      if (isNew) {
        const docRef = await addDoc(collection(db, "students"), studentData);
        updatedStudentDoc = { id: docRef.id, ...studentData };
        toast({ title: "Profile Created!", description: "Your student profile is now live." });
      } else if(studentToUpdate?.id) {
        const studentRef = doc(db, "students", studentToUpdate.id);
        await updateDoc(studentRef, studentData);
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
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Your Profile" : "Create Your Profile"}</DialogTitle>
                </DialogHeader>
                <StudentForm student={editingStudent} onSave={onSave} onOpenChange={setIsFormOpen}/>
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
                                    <AvatarImage src={viewingStudent.avatar} alt={viewingStudent.name} />
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
      </main>
    </SidebarInset>
  );
}
