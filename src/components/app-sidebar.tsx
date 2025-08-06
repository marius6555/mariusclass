
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
import { Link as ScrollLink } from "react-scroll";
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState, useEffect } from 'react';
import type { Student } from '@/types';
import { ThemeToggle } from "./theme-toggle"


const baseLinks = [
  { to: "home", label: "Home", icon: Home },
  { href: "/auth", label: "Login/Sign Up", icon: LogIn, isExternal: true },
  { to: "students", label: "Student Profiles", icon: Users },
  { to: "projects", label: "Project Hub", icon: FolderKanban },
  { to: "events", label: "Events/Updates", icon: CalendarClock },
  { to: "resources", label: "Resources", icon: BookCopy },
  { to: "contact", label: "Contact/Join Us", icon: Mail },
];

const adminLink = { href: "/admin", label: "Admin", icon: Shield, isExternal: true };

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
  
  const navLinks = [...baseLinks];
  if(isAdmin) {
    const contactIndex = navLinks.findIndex(link => link.to === 'contact');
    if (contactIndex !== -1) {
        navLinks.splice(contactIndex + 1, 0, adminLink);
    } else {
        navLinks.push(adminLink);
    }
  }


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
            <SidebarMenuItem key={link.to || link.href}>
              {link.isExternal ? (
                 <Link href={link.href!}>
                    <SidebarMenuButton
                      isActive={pathname === link.href}
                      tooltip={link.label}
                    >
                      <link.icon />
                      <span>{link.label}</span>
                    </SidebarMenuButton>
                 </Link>
              ) : (
                <ScrollLink
                  to={link.to!}
                  smooth={true}
                  duration={500}
                  spy={true}
                  offset={-70}
                  activeClass="bg-sidebar-accent text-sidebar-accent-foreground"
                  className="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 cursor-pointer"
                >
                  <link.icon />
                  <span>{link.label}</span>
                </ScrollLink>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  )
}
