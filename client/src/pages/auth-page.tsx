import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser, loginSchema, LoginData } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2, ServerIcon } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [_, setLocation] = useLocation();

  // If user is logged in, redirect to dashboard
  if (user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-dark-bg">
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white">
              <span className="text-primary">Nex</span><span className="text-accent">ora</span>
            </h1>
            <p className="text-gray-400 mt-2">Game server management made simple</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-dark-card to-primary/20 justify-center items-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-6 flex justify-center">
            <ServerIcon className="h-20 w-20 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            Manage your game servers with ease
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Nexora provides a modern, streamlined interface for managing your Pterodactyl game servers.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-dark-card/50 p-4 rounded-lg border border-gray-700">
              <div className="bg-primary/20 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                <i className="ri-dashboard-line text-primary text-lg"></i>
              </div>
              <h3 className="font-medium text-white mb-1">Easy Dashboard</h3>
              <p className="text-sm text-gray-400">Monitor all your servers at a glance</p>
            </div>
            <div className="bg-dark-card/50 p-4 rounded-lg border border-gray-700">
              <div className="bg-accent/20 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                <i className="ri-terminal-box-line text-accent text-lg"></i>
              </div>
              <h3 className="font-medium text-white mb-1">Console Access</h3>
              <p className="text-sm text-gray-400">Full console access from anywhere</p>
            </div>
            <div className="bg-dark-card/50 p-4 rounded-lg border border-gray-700">
              <div className="bg-primary/20 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                <i className="ri-money-dollar-circle-line text-primary text-lg"></i>
              </div>
              <h3 className="font-medium text-white mb-1">Simple Billing</h3>
              <p className="text-sm text-gray-400">Pay only for what you need</p>
            </div>
            <div className="bg-dark-card/50 p-4 rounded-lg border border-gray-700">
              <div className="bg-accent/20 p-2 rounded-full w-10 h-10 flex items-center justify-center mb-3">
                <i className="ri-customer-service-line text-accent text-lg"></i>
              </div>
              <h3 className="font-medium text-white mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-400">Help when you need it most</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { loginMutation } = useAuth();
  
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });

  function onSubmit(data: LoginData) {
    loginMutation.mutate(data);
  }

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Login to your account</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Login
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-gray-400 text-center">
          <a href="#" className="text-primary hover:underline">Forgot your password?</a>
        </div>
      </CardFooter>
    </Card>
  );
}

function RegisterForm() {
  const { registerMutation } = useAuth();
  
  const form = useForm<InsertUser>({
    resolver: zodResolver(
      insertUserSchema.extend({
        password: insertUserSchema.shape.password.min(8, "Password must be at least 8 characters"),
        confirmPassword: insertUserSchema.shape.password.min(8, "Password must be at least 8 characters"),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      fullName: ""
    }
  });

  function onSubmit(data: InsertUser & { confirmPassword: string }) {
    const { confirmPassword, ...userData } = data;
    registerMutation.mutate(userData);
  }

  return (
    <Card className="bg-dark-card border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Create an account</CardTitle>
        <CardDescription>Sign up for Nexora to manage your game servers</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} className="bg-dark-surface border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-gray-400 text-center w-full">
          By registering, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
        </div>
      </CardFooter>
    </Card>
  );
}
