
'use client'

import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Download, Link as LinkIcon } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, collection, getDocs, query, orderBy, updateDoc, addDoc, deleteDoc } from "firebase/firestore";
import { PageHeader } from '@/components/page-header';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';

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

const ADMIN_EMAIL = "tingiya730@gmail.com";

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

function ResourceForm({ resource, onSave, onOpenChange }: { resource?: Resource | null, onSave: (values: ResourceFormValues, resourceId?: string) => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: { 
        title: resource?.title || "", 
        category: resource?.category || "", 
        type: resource?.type || "link", 
        href: resource?.href || "" 
    },
  });

  const handleSubmit = async (values: ResourceFormValues) => {
    onSave(values, resource?.id);
    onOpenChange(false);
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
        <Button type="submit" className="w-full">{resource ? 'Save Changes' : 'Add Resource'}</Button>
      </form>
    </Form>
  );
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<GroupedResources>({});
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
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
      const permissionError = new FirestorePermissionError({ path: 'resources', operation: 'list' });
      errorEmitter.emit('permission-error', permissionError);
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
  
  const onSave = async (values: ResourceFormValues, resourceId?: string) => {
    const isEditing = !!resourceId;
    try {
      if (isEditing) {
        const resourceRef = doc(db, "resources", resourceId!);
        await updateDoc(resourceRef, values).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: resourceRef.path, operation: 'update', requestResourceData: values });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        toast({ title: "Resource Updated", description: "The resource has been successfully updated." });
      } else {
        const resourceDocRef = await addDoc(collection(db, "resources"), values).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'resources', operation: 'create', requestResourceData: values });
          errorEmitter.emit('permission-error', permissionError);
          throw permissionError;
        });
        
        const notificationData = {
          message: `New resource added in ${values.category}: ${values.title}`,
          type: 'new_resource',
          link: `/resources#${resourceDocRef.id}`,
          createdAt: serverTimestamp(),
          read: false,
        };
        addDoc(collection(db, "notifications"), notificationData).catch(serverError => {
          const permissionError = new FirestorePermissionError({ path: 'notifications', operation: 'create', requestResourceData: notificationData });
          errorEmitter.emit('permission-error', permissionError);
        });

        toast({ title: "Resource Added!", description: "The new resource has been added." });
      }

      fetchResources();
      handleCloseDialog();
    } catch (error) {
      if (!(error instanceof FirestorePermissionError)) {
        console.error("Error saving resource: ", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an issue saving the resource.'});
      }
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    try {
        const resourceRef = doc(db, "resources", resourceId);
        await deleteDoc(resourceRef).catch(serverError => {
            const permissionError = new FirestorePermissionError({ path: resourceRef.path, operation: 'delete' });
            errorEmitter.emit('permission-error', permissionError);
            throw permissionError;
        });
        toast({ title: "Resource Deleted", description: "The resource has been removed." });
        fetchResources();
    } catch(error) {
        if (!(error instanceof FirestorePermissionError)) {
            toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the resource." });
        }
    }
  };
  
  const handleAddClick = () => {
    setEditingResource(null);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (resource: Resource) => {
    setEditingResource(resource);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingResource(null);
    setIsDialogOpen(false);
  };

  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  return (
      <main className="container mx-auto p-6 lg:p-8 pt-24">
        <PageHeader
          title="Resources"
          description="A curated collection of study materials and helpful links."
        />
        {isAdmin && (
          <div className="flex justify-end my-6">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddClick}><PlusCircle className="mr-2"/> Add Resource</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingResource ? 'Edit Resource' : 'Add a New Resource'}</DialogTitle>
                  </DialogHeader>
                  <ResourceForm resource={editingResource} onSave={onSave} onOpenChange={handleCloseDialog} />
                </DialogContent>
              </Dialog>
          </div>
        )}
        <Accordion type="single" collapsible defaultValue={Object.keys(resources)[0]} className="w-full space-y-4 mt-6">
          {Object.entries(resources).map(([category, items]) => (
            <AccordionItem value={category} key={category} id={items.length > 0 ? items[0].id : category} className="border-none">
              <Card>
                <AccordionTrigger className="p-6 font-headline text-xl hover:no-underline">
                  {category}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-6 pb-6">
                    <ul className="space-y-4">
                      {items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-4 rounded-lg border bg-background group">
                          <div className="flex items-center gap-4">
                            <span className="font-medium">{item.title}</span>
                            <Link href={item.href} target="_blank">
                              <Button variant="ghost" size="icon">
                                    {item.type === 'file' ? <Download /> : <LinkIcon />}
                                    <span className="sr-only">{item.type === 'file' ? 'Download' : 'Open link'}</span>
                              </Button>
                            </Link>
                          </div>
                          {isAdmin && (
                            <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => handleEditClick(item)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Resource?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action will permanently delete this resource.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteResource(item.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          )}
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
      </main>
  );
}
