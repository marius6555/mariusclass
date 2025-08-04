
'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import type { Student } from '@/types';

type Message = {
    id: string;
    name: string;
    email: string;
    message: string;
    createdAt: Timestamp;
    read: boolean;
};

const ADMIN_EMAIL = "tingiya730@gmail.com";

export default function AdminPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

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

        const fetchData = async () => {
            try {
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

            } catch (e) {
                console.error("Error fetching admin data: ", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

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
                        <CardTitle>Recent Messages</CardTitle>
                        <CardDescription>Messages from the contact form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>From</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Message</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map(msg => (
                                    <TableRow key={msg.id}>
                                        <TableCell>{msg.name}</TableCell>
                                        <TableCell>{msg.email}</TableCell>
                                        <TableCell className="max-w-xs truncate">{msg.message}</TableCell>
                                        <TableCell>{msg.createdAt.toDate().toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant={msg.read ? "secondary" : "default"}>{msg.read ? "Read" : "Unread"}</Badge></TableCell>
                                    </TableRow>
                                ))}
                                {messages.length === 0 && <TableRow><TableCell colSpan={5} className="text-center">No messages yet.</TableCell></TableRow>}
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
