
'use client'

import React, { useState, useEffect } from 'react';
import { PlusCircle, Bell, Calendar, Milestone, Trash2, Edit } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, collection, getDocs, query, orderBy, updateDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { PageHeader } from '@/components/page-header';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

type Event = {
  id: string;
  date: string;
  title: string;
  type: "event" | "deadline" | "announcement";
  description: string;
};

const ADMIN_EMAIL = "tingiya730@gmail.com";

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

function EventForm({ event, onSave, onOpenChange }: { event: Event | null, onSave: (values: EventFormValues, eventId?: string) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { 
        title: event?.title || "", 
        description: event?.description || "", 
        date: event?.date || "", 
        type: event?.type || "event" 
    },
  });

  const handleSubmit = async (values: EventFormValues) => {
    onSave(values, event?.id);
    onOpenChange(false);
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
        <Button type="submit" className="w-full">{event ? 'Save Changes' : 'Add Event'}</Button>
      </form>
    </Form>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
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
      const permissionError = new FirestorePermissionError({ path: 'events', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
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

  const onSave = async (values: EventFormValues, eventId?: string) => {
    const isEditing = !!eventId;
    try {
        if (isEditing) {
            const eventDocRef = doc(db, "events", eventId!);
            await updateDoc(eventDocRef, values).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: eventDocRef.path, operation: 'update', requestResourceData: values });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            toast({ title: "Event Updated", description: "The event has been successfully updated." });
        } else {
            const eventDocRef = doc(collection(db, "events"));
            await setDoc(eventDocRef, values).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: eventDocRef.path, operation: 'create', requestResourceData: values });
                errorEmitter.emit('permission-error', permissionError);
                throw permissionError;
            });
            const notificationData = {
                message: `New ${values.type}: ${values.title}`,
                type: 'new_event',
                link: `/events#${eventDocRef.id}`,
                createdAt: serverTimestamp(),
                read: false,
            };
            addDoc(collection(db, "notifications"), notificationData).catch(serverError => {
                const permissionError = new FirestorePermissionError({ path: 'notifications', operation: 'create', requestResourceData: notificationData });
                errorEmitter.emit('permission-error', permissionError);
            });
            toast({ title: "Event Added!", description: "The new event has been added." });
        }
        fetchEvents();
        handleCloseDialog();
    } catch (error) {
       if (!(error instanceof FirestorePermissionError)) {
          console.error("Error saving event: ", error);
          toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an issue saving the event.'});
       }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
        const eventRef = doc(db, "events", eventId);
        await deleteDoc(eventRef).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: eventRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        toast({ title: "Event Deleted", description: "The event has been removed." });
        fetchEvents();
    } catch(error) {
        if (!(error instanceof FirestorePermissionError)) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the event." });
        }
    }
  };

  const handleAddClick = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingEvent(null);
    setIsDialogOpen(false);
  };
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  return (
      <main className="container mx-auto p-6 lg:p-8 pt-24">
        <PageHeader
          title="Events & Updates"
          description="Stay informed about important dates, announcements, and deadlines."
        />
        {isAdmin && (
          <div className="flex justify-end my-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddClick}><PlusCircle className="mr-2"/> Add Event</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? 'Edit Event' : 'Add a New Event'}</DialogTitle>
                  </DialogHeader>
                  <EventForm event={editingEvent} onSave={onSave} onOpenChange={setIsDialogOpen} />
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
                {isAdmin && (
                    <div className="mt-2 flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditClick(event)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete the event. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteEvent(event.id)}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
  );
}
