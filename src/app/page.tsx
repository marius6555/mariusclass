
'use client'

import React from 'react';
import { SidebarInset } from "@/components/ui/sidebar";
import { PageHeader } from "@/components/page-header";
import Image from "next/image";
import { GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <SidebarInset>
      <PageHeader
        title="Welcome to ClassHub Central"
        description="Your central hub for class activities, resources, and collaboration."
      />
      <main className="flex-1">
        <div className="relative flex flex-col justify-center items-center text-center p-8 min-h-[calc(100vh-4.5rem)]">
            <div className="absolute inset-0 z-0">
                <Image 
                    src="https://placehold.co/1200x800.png" 
                    alt="Classroom background"
                    fill
                    className="object-cover"
                    data-ai-hint="classroom abstract"
                />
                <div className="absolute inset-0 bg-background/80" />
            </div>
            <div className="relative z-10">
              <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tight">Welcome to</h1>
              <div className="bg-primary p-4 rounded-lg my-6 inline-block">
                <GraduationCap className="text-primary-foreground h-16 w-16" />
              </div>
              <h2 className="font-headline text-3xl md:text-5xl font-bold tracking-tight">ClassHub Central</h2>
              <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">Your central hub for class activities, resources, and collaboration.</p>
            </div>
        </div>
      </main>
    </SidebarInset>
  );
}
