
'use client'

import React, { useState, useEffect } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Download, Link as LinkIcon, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, query, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import type { Student } from '../students/page';

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  category: z.string().min(2, "Please select a category."),
  type: z.enum(["link", "file"]),
  href: z.string().min(1, "Please enter a URL or file path."),
});

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

const resourceCategories = [
  "Learning Platform",
  "Tools You Must Try",
  "Project Ideas",
  "Upcoming Tech Challenges",
];

const ADMIN_EMAIL = "tingiya730@gmail.com";

function ResourceForm({ onSave, onOpenChange }: { onSave: () => void, onOpenChange: (open: boolean) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", category: "", type: "link", href: "" },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addDoc(collection(db, "resources"), values);
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

export default function ResourcesPage() {
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
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  return (
    <SidebarInset>
      <PageHeader
        title="Resources"
        description="A curated collection of study materials and helpful links."
      />
      <main className="p-6 lg:p-8">
        {isAdmin && (
          <div className="flex justify-end mb-6">
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
        <Accordion type="single" collapsible defaultValue={Object.keys(resources)[0]} className="w-full space-y-4">
          {Object.entries(resources).map(([category, items]) => (
            <AccordionItem value={category} key={category} className="border-none">
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
                          <Link href={item.href} passHref legacyBehavior>
                             <Button variant="ghost" size="icon" asChild>
                                <a target="_blank">
                                  {item.type === 'file' ? <Download /> : <LinkIcon />}
                                  <span className="sr-only">{item.type === 'file' ? 'Download' : 'Open link'}</span>
                                </a>
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
      </main>
    </SidebarInset>
  );
}
