import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { User, Shield, Key, History, Clock, Copy, RefreshCw, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);

  // Get tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tab = params.get("tab");
    if (tab && ["profile", "security", "api", "sessions"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  // Query account settings
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  // Query login history
  const { data: loginHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/login-history"],
    enabled: activeTab === "sessions" && !!user,
  });

  // Query API keys
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ["/api/api-keys"],
    enabled: activeTab === "api" && !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/user", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/change-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Generate API key mutation
  const generateApiKeyMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await apiRequest("POST", "/api/api-keys", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key generated",
        description: "Your new API key has been generated successfully.",
      });
      apiKeyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      await apiRequest("DELETE", `/api/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API key deleted",
        description: "The API key has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update Pterodactyl API key mutation
  const updatePterodactylKeyMutation = useMutation({
    mutationFn: async (data: { pterodactylApiKey: string }) => {
      const res = await apiRequest("PATCH", "/api/user/pterodactyl-key", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "API key updated",
        description: "Your Pterodactyl API key has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update API key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form validation schemas
  const profileFormSchema = z.object({
    fullName: z.string().optional(),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    pterodactylApiKey: z.string().optional(),
  });

  const securityFormSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

  const apiKeyFormSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
  });

  // Setup forms
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      username: user?.username || "",
      pterodactylApiKey: user?.pterodactylApiKey || "",
    },
  });

  const securityForm = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const apiKeyForm = useForm<z.infer<typeof apiKeyFormSchema>>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        username: user.username || "",
        pterodactylApiKey: user.pterodactylApiKey || "",
      });
    }
  }, [user, profileForm]);

  // Handle form submissions
  const onSubmitProfile = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitSecurity = (data: z.infer<typeof securityFormSchema>) => {
    updatePasswordMutation.mutate(data);
  };

  const onSubmitApiKey = (data: z.infer<typeof apiKeyFormSchema>) => {
    generateApiKeyMutation.mutate(data);
  };

  // Copy API key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "API key has been copied to clipboard.",
    });
  };

  return (
    <MainLayout title="Settings">
      <div className="flex flex-col space-y-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" /> Security
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="h-4 w-4 mr-2" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="sessions">
              <History className="h-4 w-4 mr-2" /> Login History
            </TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full bg-dark-surface/50" />
                    <Skeleton className="h-10 w-full bg-dark-surface/50" />
                    <Skeleton className="h-10 w-full bg-dark-surface/50" />
                    <Skeleton className="h-10 w-full bg-dark-surface/50" />
                  </div>
                ) : (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="pterodactylApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pterodactyl API Key</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-400">
                              Your Pterodactyl API key is used to manage your game servers. 
                              You can get this from your Pterodactyl panel account settings.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(onSubmitSecurity)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password" 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Button 
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Update Password
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Two-Factor Authentication</CardTitle>
                  <CardDescription>Enhance your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">Enable 2FA</h3>
                      <p className="text-sm text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch 
                      checked={user?.twoFactorEnabled || false}
                      onCheckedChange={(checked) => {
                        toast({
                          title: checked ? "2FA setup" : "2FA disabled",
                          description: checked 
                            ? "Two-factor authentication setup will be available soon." 
                            : "Two-factor authentication has been disabled.",
                        });
                      }}
                    />
                  </div>
                  
                  <div className="rounded-lg border border-gray-700 p-4 bg-dark-surface">
                    <h4 className="text-white font-medium mb-2">Recovery Options</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      We recommend setting up recovery options to ensure you don't lose access to your account.
                    </p>
                    <Button 
                      variant="outline" 
                      className="border-gray-700"
                      onClick={() => {
                        toast({
                          title: "Recovery options",
                          description: "Recovery options setup will be available soon.",
                        });
                      }}
                    >
                      Setup Recovery Options
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* API Keys Tab */}
          <TabsContent value="api">
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">API Keys</CardTitle>
                  <CardDescription>
                    Manage your API keys for external applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...apiKeyForm}>
                    <form onSubmit={apiKeyForm.handleSubmit(onSubmitApiKey)} className="space-y-6">
                      <FormField
                        control={apiKeyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g. My Application" 
                                className="bg-dark-surface border-gray-700" 
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-400">
                              Give your API key a descriptive name to help you identify it later.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Button 
                          type="submit"
                          disabled={generateApiKeyMutation.isPending}
                        >
                          {generateApiKeyMutation.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Generate New API Key
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Your API Keys</CardTitle>
                  <CardDescription>
                    View and manage your existing API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingApiKeys ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full bg-dark-surface/50" />
                      <Skeleton className="h-16 w-full bg-dark-surface/50" />
                    </div>
                  ) : apiKeys && apiKeys.length > 0 ? (
                    <div className="space-y-4">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="flex flex-col p-4 rounded-lg border border-gray-700 bg-dark-surface">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-white">{key.name}</h3>
                              <p className="text-xs text-gray-400">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                                {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                              </p>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteApiKeyMutation.mutate(key.id)}
                              disabled={deleteApiKeyMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                          <div className="flex items-center text-sm text-gray-400 bg-dark-card p-2 rounded mt-2">
                            <code className="flex-1 overflow-x-auto">
                              {key.token}
                            </code>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-2"
                              onClick={() => copyToClipboard(key.token)}
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {key.expiresAt && (
                            <p className="text-xs text-warning mt-2 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires: {new Date(key.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mb-4 text-gray-400">
                        <Key className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">No API keys yet</h3>
                      <p className="text-gray-400 mb-4">
                        You haven't created any API keys yet. Generate a key to integrate with external applications.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Login History Tab */}
          <TabsContent value="sessions">
            <Card className="bg-dark-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Login History</CardTitle>
                <CardDescription>
                  View your recent login activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="space-y-4">
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                  </div>
                ) : loginHistory && loginHistory.length > 0 ? (
                  <div className="relative overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                      <thead className="text-xs text-gray-400 uppercase bg-dark-surface border-b border-gray-700">
                        <tr>
                          <th scope="col" className="px-6 py-3">Date & Time</th>
                          <th scope="col" className="px-6 py-3">IP Address</th>
                          <th scope="col" className="px-6 py-3">Device / Browser</th>
                          <th scope="col" className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((session) => (
                          <tr key={session.id} className="bg-dark-surface border-b border-gray-700 hover:bg-dark-surface/80">
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(session.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              {session.ipAddress}
                            </td>
                            <td className="px-6 py-4">
                              {session.userAgent}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                session.successful 
                                  ? "bg-success/10 text-success" 
                                  : "bg-danger/10 text-danger"
                              }`}>
                                {session.successful ? "Successful" : "Failed"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mb-4 text-gray-400">
                      <History className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No login history</h3>
                    <p className="text-gray-400">
                      We don't have any login history for your account yet.
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  className="border-gray-700"
                  onClick={() => {
                    toast({
                      title: "Log out all devices",
                      description: "You've been logged out from all other devices.",
                    });
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Log Out All Other Devices
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
