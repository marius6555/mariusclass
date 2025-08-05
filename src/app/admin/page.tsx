
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db, storage } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp, doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import type { Student } from '@/types';
import { Button } from '@/components/ui/button';
import { Mail, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

type Message = {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
    whatsapp?: string;
};

const ADMIN_EMAIL = "tingiya730@gmail.com";

export default function AdminPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [backgroundUrl, setBackgroundUrl] = useState<string>('https://placehold.co/1200x800.png');
    const [newBgFile, setNewBgFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const fetchAdminData = async () => {
        // Fetch Messages
        const messagesQuery = query(collection(db, "messages"), orderBy("createdAt", "desc"));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesList = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt
        } as Message));
        setMessages(messagesList);

        // Fetch Students
        const studentsQuery = query(collection(db, "students"), orderBy("name"));
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsList = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(studentsList);
        
        // Fetch Background URL
        const settingsDoc = await getDoc(doc(db, "settings", "homePage"));
        if (settingsDoc.exists() && settingsDoc.data().backgroundUrl) {
            setBackgroundUrl(settingsDoc.data().backgroundUrl);
        }
    };
    
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("currentUser");
            if (storedUser) {
                const currentUser = JSON.parse(storedUser);
                if (currentUser.email !== ADMIN_EMAIL) {
                    router.push('/');
                }
            } else {
                router.push('/auth');
            }
        } catch (error) {
            console.error("Failed to parse from localStorage", error);
            router.push('/auth');
        }

        fetchAdminData().finally(() => setLoading(false));
    }, [router]);

    const handleToggleRead = async (message: Message) => {
        try {
            const messageRef = doc(db, "messages", message.id);
            await updateDoc(messageRef, { read: !message.read });
            await fetchAdminData(); // Re-fetch to update UI
            toast({
                title: "Status Updated",
                description: `Message marked as ${!message.read ? "read" : "unread"}.`
            });
        } catch (error) {
            console.error("Error updating message status:", error);
            toast({
                variant: "destructive",
                title: "Update Failed",
                description: "Could not update the message status.",
            });
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewBgFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBackgroundUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleBackgroundUpload = async () => {
      if (!newBgFile) {
        toast({
          variant: 'destructive',
          title: 'No File Selected',
          description: 'Please select an image file to upload.',
        });
        return;
      }

      setUploading(true);
      try {
        const storageRef = ref(storage, 'backgrounds/home-background');
        const reader = new FileReader();
        
        reader.readAsDataURL(newBgFile);
        reader.onload = async (event) => {
          try {
            const dataUrl = event.target?.result as string;
            await uploadString(storageRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(storageRef);

            await setDoc(doc(db, 'settings', 'homePage'), {
              backgroundUrl: downloadUrl,
            });

            setBackgroundUrl(downloadUrl);
            setNewBgFile(null);
            toast({
              title: 'Upload Successful',
              description: 'Home page background has been updated.',
            });
          } catch (error) {
             console.error('Error during upload/DB update:', error);
             toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not update the background image. Check console for details.',
             });
          } finally {
             setUploading(false);
          }
        };
        reader.onerror = (error) => {
            console.error("File reading error:", error);
            toast({
                variant: "destructive",
                title: "File Error",
                description: "Could not read the selected file.",
            });
            setUploading(false);
        };
      } catch (error) {
        console.error('Error setting up background upload:', error);
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: 'An unexpected error occurred before upload.',
        });
        setUploading(false);
      }
    };


    if (loading) {
        return (
            <SidebarInset>
                <PageHeader title="Admin Dashboard" description="Loading..." />
                <main className="p-6 lg:p-8"><p>Loading dashboard...</p></main>
            </SidebarInset>
        );
    }
    
    return (
        <SidebarInset>
            <PageHeader
                title="Admin Dashboard"
                description="View messages and manage student profiles."
            />
            <main className="p-6 lg:p-8 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Home Page Settings</CardTitle>
                        <CardDescription>Customize the appearance of the home page.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2">Current Background Image</h4>
                            <Image
                                src={backgroundUrl}
                                alt="Home page background"
                                width={400}
                                height={250}
                                className="object-cover rounded-md border"
                            />
                        </div>
                        <div className="space-y-2">
                             <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <Button onClick={() => fileInputRef.current?.click()}>
                                Choose New Image
                            </Button>
                            {newBgFile && (
                                <div className="flex items-center gap-4">
                                     <p className="text-sm text-muted-foreground">
                                        New file: {newBgFile.name}
                                    </p>
                                    <Button onClick={handleBackgroundUpload} disabled={uploading}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {uploading ? 'Uploading...' : 'Upload & Save'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Messages</CardTitle>
                        <CardDescription>Messages from the contact form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map(msg => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{msg.name}</TableCell>
                                        <TableCell>
                                            <div>{msg.email}</div>
                                            {msg.whatsapp && <div className="text-xs text-muted-foreground">{msg.whatsapp}</div>}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                                        <TableCell>{msg.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={msg.read ? "secondary" : "default"} 
                                                onClick={() => handleToggleRead(msg)}
                                                className="cursor-pointer"
                                            >
                                                {msg.read ? "Read" : "Unread"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={`mailto:${msg.email}?subject=Re: Your message to ClassHub Central`} passHref>
                                                <Button variant="outline" size="icon">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="sr-only">Reply via Email</span>
                                                </Button>
                                            </Link>
                                            {msg.whatsapp && (
                                                <Link href={`https://wa.me/${msg.whatsapp.replace(/\D/g, '')}`} target="_blank" passHref>
                                                    <Button variant="outline" size="icon" className="bg-green-500 hover:bg-green-600 text-white">
                                                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                                                        </svg>
                                                        <span className="sr-only">Reply via WhatsApp</span>
                                                    </Button>
                                                </Link>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {messages.length === 0 && <TableRow><TableCell colSpan={6} className="text-center">No messages yet.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Student Roster</CardTitle>
                        <CardDescription>A list of all student profiles.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Avatar</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Major</TableHead>
                                    <TableHead>Email</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map(student => (
                                    <TableRow key={student.id}>
                                        <TableCell>
                                            <Avatar>
                                                <AvatarImage src={student.avatar} alt={student.name} />
                                                <AvatarFallback>{student.initials}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>{student.name}</TableCell>
                                        <TableCell>{student.major}</TableCell>
                                        <TableCell>{student.email}</TableCell>
                                    </TableRow>
                                ))}
                                 {students.length === 0 && <TableRow><TableCell colSpan={4} className="text-center">No students have created profiles yet.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </SidebarInset>
    );
}

    

    