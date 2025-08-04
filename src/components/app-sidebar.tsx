
'use client'

import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
} from "@/components/ui/sidebar"
import {
  Home,
  FolderKanban,
  CalendarClock,
  BookCopy,
  Mail,
  GraduationCap,
  LogIn,
  Users,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState, useEffect } from 'react';
import type { Student } from '@/types';


const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/students", label: "Student Profiles", icon: Users },
  { href: "/projects", label: "Project Hub", icon: FolderKanban },
  { href: "/events", label: "Events/Updates", icon: CalendarClock },
  { href: "/resources", label: "Resources", icon: BookCopy },
  { href: "/contact", label: "Contact/Join Us", icon: Mail },
];

const adminLink = { href: "/admin", label: "Admin", icon: Shield };
const authLink = { href: "/auth", label: "Login/Sign Up", icon: LogIn };

const ADMIN_EMAIL = "tingiya730@gmail.com";

export function AppSidebar() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Student | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse from localStorage", error);
    }
  }, []);
  
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  
  const navLinks = [...links];
  if(isAdmin) {
    navLinks.push(adminLink);
  }
  navLinks.push(authLink);


  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <GraduationCap className="text-primary-foreground" />
            </div>
            <h1 className="font-headline text-xl font-semibold">ClassHub</h1>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href}>
                <SidebarMenuButton
                  isActive={pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))}
                  tooltip={link.label}
                >
                  <link.icon />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  )
}
