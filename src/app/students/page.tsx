
'use client'

import React, { useState, useEffect, useRef } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db, storage, auth } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, addDoc, query, where, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { onAuthStateChanged, deleteUser } from "firebase/auth";
import { useRouter } from 'next/navigation';

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
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const { toast } = useToast();
  const router = useRouter();


  const fetchStudents = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const studentsList = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Student));
        setStudents(studentsList);
        
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          const user: Student = JSON.parse(storedUser);
          const userProfile = studentsList.find(s => s.uid === user.uid);
          if (userProfile) {
            const fullCurrentUser = { ...user, ...userProfile };
            setCurrentUser(fullCurrentUser);
            localStorage.setItem('currentUser', JSON.stringify(fullCurrentUser));
          }
        }

    } catch(e) {
        console.error("Error fetching students:", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
          const studentData = JSON.parse(storedUser);
          if (studentData.uid === user.uid) {
            setCurrentUser(studentData);
          } else { // Different user logged in
            localStorage.removeItem("currentUser");
            // We'll fetch their full profile below
          }
        }
        // Always fetch fresh student data on auth change
        fetchStudents();
      } else {
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
        setStudents([]); // Clear students on logout
      }
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  }

  const handleDelete = (student: Student) => {
    setDeletingStudent(student);
    setIsAlertOpen(true);
  };
  
  const confirmDelete = async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !deletingStudent || firebaseUser.uid !== deletingStudent.uid) {
        toast({ variant: "destructive", title: "Error", description: "You can only delete your own profile." });
        return;
    }

    try {
        // 1. Delete avatar from Storage
        if (deletingStudent.avatar && !deletingStudent.avatar.includes('placehold.co')) {
            const avatarRef = ref(storage, deletingStudent.avatar);
            await deleteObject(avatarRef).catch(err => console.warn("Could not delete avatar, it might not exist.", err));
        }

        // 2. Delete student doc from Firestore
        await deleteDoc(doc(db, "students", deletingStudent.id));

        // 3. Delete user from Auth
        await deleteUser(firebaseUser);

        // 4. Cleanup UI
        toast({ title: "Profile Deleted", description: "Your profile has been permanently deleted." });
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
        setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
        router.push('/auth');
        
    } catch (error: any) {
        console.error("Error deleting profile:", error);
        toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
        if(error.code === 'auth/requires-recent-login'){
            toast({ variant: "destructive", title: "Please Login Again", description: "For security, you need to log in again to delete your account." });
            router.push('/auth');
        }
    } finally {
        setIsAlertOpen(false);
        setDeletingStudent(null);
    }
  };


  const handleAddProfile = () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser && !userHasProfile) {
      setEditingStudent({
        id: '', 
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || '',
        avatar: firebaseUser.photoURL || `https://placehold.co/100x100.png`,
        initials: firebaseUser.displayName?.split(" ").map(n => n[0]).join("") || '??',
        major: '',
        interests: [],
        hobbies: [],
        bio: '',
        hint: 'person'
      });
      setIsDialogOpen(true);
    }
  };

  const onSave = async (updatedStudent: Partial<Student>) => {
    const firebaseUser = auth.currentUser;
    if(!firebaseUser) return;

    if(!updatedStudent.id) { 
        const { id, ...newStudentData} = updatedStudent; 
        const studentData = {
          ...newStudentData,
          uid: firebaseUser.uid,
          email: firebaseUser.email?.toLowerCase(),
        };
        const docRef = await addDoc(collection(db, "students"), studentData);
        toast({ title: "Profile Created!", description: "Your profile has been created." });

    } else { 
        if(currentUser && currentUser.id === updatedStudent.id) {
            const updatedUser = { ...currentUser, ...updatedStudent } as Student;
            setCurrentUser(updatedUser);
            localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        }
        toast({ title: "Profile Saved!", description: "Your profile has been successfully saved." });
    }
    
    fetchStudents();
    setIsDialogOpen(false);
    setEditingStudent(null);
  }
  
  const userHasProfile = students.some(s => s.uid === currentUser?.uid);

  return (
    <SidebarInset>
      <PageHeader
        title="Student Profiles"
        description="Get to know your fellow classmates and their interests."
      />
      <main className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
            {!currentUser ? (
              <div className="flex items-center gap-4">
                  <p>Want to be listed here? </p>
                  <Link href="/auth">
                    <Button variant="outline" size="sm">Login or Sign Up</Button>
                  </Link>
              </div>
            ) : !userHasProfile && (
              <Button onClick={handleAddProfile}>
                <PlusCircle className="mr-2" />
                Create Your Profile
              </Button>
            )
          }
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { setIsDialogOpen(isOpen); if(!isOpen) setEditingStudent(null); }}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingStudent?.id ? 'Edit Profile' : 'Create Your Profile'}</DialogTitle>
            </DialogHeader>
            <StudentForm student={editingStudent} onSave={onSave} onOpenChange={setIsDialogOpen} />
            </DialogContent>
        </Dialog>

        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account, profile, and all associated data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingStudent(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
            {currentUser && currentUser.uid === student.uid && (
              <CardFooter className="justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                  </Button>
                   <Button variant="destructive" size="sm" onClick={() => handleDelete(student)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                  </Button>
              </CardFooter>
            )}
            </Card>
        ))}
        </div>
      </main>
    </SidebarInset>
  );
}
