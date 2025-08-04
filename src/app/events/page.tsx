
'use client'

import React, { useState, useEffect } from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Bell, Calendar, Milestone, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Please enter a valid date." }),
  type: z.enum(["event", "deadline", "announcement"]),
});

type Event = {
  id: string;
  date: string;
  title: string;
  type: "event" | "deadline" | "announcement";
  description: string;
};

const eventConfig: { [key: string]: { icon: React.ReactNode; variant: BadgeProps['variant'] } } = {
  event: { icon: <Calendar className="h-4 w-4" />, variant: 'default' },
  deadline: { icon: <Bell className="h-4 w-4" />, variant: 'destructive' },
  announcement: { icon: <Milestone className="h-4 w-4" />, variant: 'secondary' },
};

const ADMIN_EMAIL = "tingiya730@gmail.com";

function EventForm({ onSave, onOpenChange }: { onSave: () => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", description: "", date: "", type: "event" },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addDoc(collection(db, "events"), values);
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

export default function EventsPage() {
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
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  return (
    <SidebarInset>
      <PageHeader
        title="Events & Updates"
        description="Stay informed about important dates, announcements, and deadlines."
      />
      <main className="p-6 lg:p-8">
        {isAdmin && (
          <div className="flex justify-end mb-6">
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
        <div className="relative pl-6">
          <div className="absolute left-3 top-0 h-full w-0.5 bg-border -translate-x-1/2" />
          {events.length === 0 && !isAdmin && <p>No events posted yet. Check back soon!</p>}
          {events.length === 0 && isAdmin && (
            <div className="text-center text-muted-foreground py-4">
              <p>There are no events. As an admin, you can add one.</p>
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} className="relative mb-8 flex items-start gap-6">
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
      </main>
    </SidebarInset>
  );
}
