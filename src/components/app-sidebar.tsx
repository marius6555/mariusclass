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
  Users,
  FolderKanban,
  CalendarClock,
  BookCopy,
  Mail,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/students", label: "Student Profiles", icon: Users },
  { href: "/projects", label: "Project Hub", icon: FolderKanban },
  { href: "/events", label: "Events/Updates", icon: CalendarClock },
  { href: "/resources", label: "Resources", icon: BookCopy },
  { href: "/contact", label: "Contact/Join Us", icon: Mail },
]

export function AppSidebar() {
  const pathname = usePathname()

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
          {links.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} passHref legacyBehavior>
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
