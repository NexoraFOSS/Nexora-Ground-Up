import { useState, useEffect, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PterodactylProvider } from "@/hooks/use-pterodactyl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export function MainLayout({ children, title = "Dashboard" }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Close sidebar when changing routes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("sidebarToggle");
      
      if (isMobile && 
          sidebar && 
          !sidebar.contains(event.target as Node) && 
          sidebarToggle && 
          !sidebarToggle.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile]);
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    if (user.fullName) {
      return user.fullName.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  // Navigation links
  const navLinks = [
    { name: "Dashboard", path: "/", icon: "ri-dashboard-line" },
    { name: "Servers", path: "/servers", icon: "ri-server-line" },
    { name: "Backups", path: "/backups", icon: "ri-database-2-line" },
    { name: "Billing", path: "/billing", icon: "ri-money-dollar-circle-line" },
    { name: "Support", path: "/tickets", icon: "ri-customer-service-line", badge: 2 }
  ];

  const accountLinks = [
    { name: "Profile", path: "/settings?tab=profile", icon: "ri-user-settings-line" },
    { name: "Security", path: "/settings?tab=security", icon: "ri-shield-keyhole-line" },
    { name: "Settings", path: "/settings", icon: "ri-settings-4-line" }
  ];

  return (
    <PterodactylProvider>
      <div className="flex h-screen overflow-hidden bg-dark-bg text-gray-200">
        {/* Mobile Menu Toggle */}
        <div className="fixed top-4 left-4 z-40 md:hidden">
          <button 
            id="sidebarToggle" 
            className="text-gray-200 hover:text-white focus:outline-none"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="ri-menu-line text-2xl"></i>
          </button>
        </div>

        {/* Sidebar */}
        <aside 
          id="sidebar" 
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-dark-card shadow-lg transform transition-transform duration-300 ease-in-out md:relative ${sidebarOpen || !isMobile ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-4 flex items-center justify-center border-b border-gray-700">
              <span className="text-2xl font-bold text-white tracking-tight">
                <span className="text-primary">Nex</span><span className="text-accent">ora</span>
              </span>
            </div>
            
            {/* Navigation */}
            <nav className="p-4 flex-grow overflow-y-auto">
              <ul className="space-y-1">
                {navLinks.map((link) => {
                  const isActive = location === link.path;
                  return (
                    <li key={link.path}>
                      <Link href={link.path}>
                        <a 
                          className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                            isActive 
                              ? "bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 text-white font-medium" 
                              : "text-gray-300 hover:bg-dark-surface hover:text-white"
                          }`}
                        >
                          <i className={`${link.icon} mr-3 text-lg`}></i>
                          <span>{link.name}</span>
                          {link.badge && (
                            <span className="ml-auto bg-primary text-white text-xs font-medium px-2 py-0.5 rounded-full">{link.badge}</span>
                          )}
                        </a>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              <div className="pt-4">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Account
                </div>
                <ul className="space-y-1">
                  {accountLinks.map((link) => (
                    <li key={link.path}>
                      <Link href={link.path}>
                        <a className="flex items-center px-4 py-3 text-sm rounded-lg text-gray-300 hover:bg-dark-surface hover:text-white">
                          <i className={`${link.icon} mr-3 text-lg`}></i>
                          <span>{link.name}</span>
                        </a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
            
            {/* User Menu */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center">
                <Avatar>
                  <AvatarFallback className="bg-gray-500 text-white">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className="ml-auto text-gray-400 hover:text-white"
                        onClick={() => logoutMutation.mutate()}
                      >
                        <i className="ri-logout-box-r-line text-lg"></i>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Logout</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-dark-card shadow-md z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-white ml-8 md:ml-0">{title}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-dark-surface">
                  <i className="ri-notification-3-line text-xl"></i>
                </button>
                <button className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-dark-surface">
                  <i className="ri-moon-line text-xl"></i>
                </button>
                <div className="hidden sm:block">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="rounded-lg py-2 pl-4 pr-10 w-48 bg-dark-surface border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm" 
                    />
                    <button className="absolute right-0 top-0 h-full px-3 text-gray-400">
                      <i className="ri-search-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </PterodactylProvider>
  );
}
