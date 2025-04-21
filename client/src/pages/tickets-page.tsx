import { useState } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketIcon, MessageSquare, AlertCircle, Loader2 } from "lucide-react";

type TicketFormData = {
  title: string;
  category: string;
  priority: string;
  message: string;
};

export default function TicketsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Query tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ["/api/tickets"],
    enabled: !!user,
  });

  // Query specific ticket with replies
  const { data: activeTicket, isLoading: isLoadingTicketDetails } = useQuery({
    queryKey: ["/api/tickets", activeTicketId],
    enabled: !!activeTicketId,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const res = await apiRequest("POST", "/api/tickets", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setIsDialogOpen(false);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reply to ticket mutation
  const replyToTicketMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/replies`, { message });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", activeTicketId] });
      replyForm.reset({ message: "" });
      toast({
        title: "Reply sent",
        description: "Your reply has been sent successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send reply",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Close ticket mutation
  const closeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}`, { status: "closed" });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", activeTicketId] });
      toast({
        title: "Ticket closed",
        description: "The ticket has been closed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to close ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create ticket form
  const ticketForm = useForm<TicketFormData>({
    resolver: zodResolver(insertTicketSchema.extend({
      message: insertTicketSchema.shape.title.min(10, "Please provide more details about your issue"),
    })),
    defaultValues: {
      title: "",
      category: "",
      priority: "medium",
      message: "",
    },
  });

  // Reply form
  const replyForm = useForm({
    defaultValues: {
      message: "",
    },
  });

  const onSubmitTicket = (data: TicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const onSubmitReply = (data: { message: string }) => {
    if (activeTicketId) {
      replyToTicketMutation.mutate({ ticketId: activeTicketId, message: data.message });
    }
  };

  // Filter tickets
  const filteredTickets = tickets?.filter(ticket => {
    if (activeFilter === "all") return true;
    return ticket.status.toLowerCase() === activeFilter.toLowerCase();
  });

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-danger/10 text-danger";
      case "medium":
        return "bg-warning/10 text-warning";
      case "low":
        return "bg-success/10 text-success";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-primary/10 text-primary";
      case "in progress":
        return "bg-warning/10 text-warning";
      case "closed":
        return "bg-gray-500/10 text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <MainLayout title="Support Tickets">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-3 md:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-white">Support Tickets</h1>
            <p className="text-gray-400">
              Need help? Create a ticket and our support team will assist you.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="px-4 py-2">
                <TicketIcon className="mr-2 h-4 w-4" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-dark-card border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new support ticket.
                </DialogDescription>
              </DialogHeader>
              <Form {...ticketForm}>
                <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="space-y-4">
                  <FormField
                    control={ticketForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description of the issue" 
                            className="bg-dark-surface border-gray-700" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={ticketForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-dark-surface border-gray-700">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-surface border-gray-700">
                              <SelectItem value="billing">Billing</SelectItem>
                              <SelectItem value="technical">Technical Support</SelectItem>
                              <SelectItem value="account">Account Issues</SelectItem>
                              <SelectItem value="server">Server Problems</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={ticketForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-dark-surface border-gray-700">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-surface border-gray-700">
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={ticketForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your issue in detail" 
                            className="min-h-[120px] bg-dark-surface border-gray-700" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Ticket
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ticket List */}
          <div className="md:col-span-1">
            <Card className="bg-dark-card border-gray-800 h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-white">Your Tickets</CardTitle>
                <div className="flex mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={activeFilter === "all" 
                      ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" 
                      : "bg-dark-surface border-gray-700 hover:bg-gray-800"
                    }
                    onClick={() => setActiveFilter("all")}
                  >
                    All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={activeFilter === "open" 
                      ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" 
                      : "bg-dark-surface border-gray-700 hover:bg-gray-800"
                    }
                    onClick={() => setActiveFilter("open")}
                  >
                    Open
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={activeFilter === "closed" 
                      ? "bg-primary/20 text-primary border-primary/20 hover:bg-primary/30" 
                      : "bg-dark-surface border-gray-700 hover:bg-gray-800"
                    }
                    onClick={() => setActiveFilter("closed")}
                  >
                    Closed
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100vh-320px)] overflow-y-auto pt-2">
                {isLoadingTickets ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                    <Skeleton className="h-16 w-full bg-dark-surface/50" />
                  </div>
                ) : filteredTickets && filteredTickets.length > 0 ? (
                  <ul className="space-y-2">
                    {filteredTickets.map((ticket) => (
                      <li 
                        key={ticket.id}
                        className={`p-3 rounded-lg border ${activeTicketId === ticket.id 
                          ? "border-primary bg-primary/10" 
                          : "border-gray-700 bg-dark-surface hover:bg-dark-surface/80"} 
                          cursor-pointer transition-colors`}
                        onClick={() => setActiveTicketId(ticket.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium text-white">{ticket.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>#{ticket.id} • {ticket.category}</span>
                          <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                          </span>
                          <span className="text-xs flex items-center text-gray-400">
                            <MessageSquare className="h-3 w-3 mr-1" /> 
                            {activeTicket?.replies?.length || 0} replies
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10">
                    <AlertCircle className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
                    <p className="text-gray-400 mb-4">
                      {activeFilter === "all" 
                        ? "You haven't created any support tickets yet." 
                        : `You don't have any ${activeFilter} tickets.`
                      }
                    </p>
                    <Button 
                      onClick={() => setIsDialogOpen(true)} 
                      variant="outline" 
                      className="border-gray-700"
                    >
                      Create Your First Ticket
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details */}
          <div className="md:col-span-2">
            <Card className="bg-dark-card border-gray-800 h-full">
              {!activeTicketId ? (
                <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-320px)] p-6">
                  <TicketIcon className="h-16 w-16 text-gray-500 mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Select a ticket to view details</h2>
                  <p className="text-gray-400 max-w-md mb-6">
                    Choose a ticket from the list on the left to view its details and conversation history.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Create New Ticket
                  </Button>
                </div>
              ) : isLoadingTicketDetails ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-2/3 bg-dark-surface/50" />
                  <Skeleton className="h-6 w-1/3 bg-dark-surface/50" />
                  <Skeleton className="h-24 w-full bg-dark-surface/50 mt-6" />
                  <Skeleton className="h-24 w-full bg-dark-surface/50" />
                  <Skeleton className="h-24 w-full bg-dark-surface/50" />
                </div>
              ) : activeTicket ? (
                <>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white text-xl">{activeTicket.title}</CardTitle>
                        <CardDescription>
                          Ticket #{activeTicket.id} • Created on {new Date(activeTicket.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(activeTicket.status)}`}>
                          {activeTicket.status.charAt(0).toUpperCase() + activeTicket.status.slice(1)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(activeTicket.priority)}`}>
                          {activeTicket.priority.charAt(0).toUpperCase() + activeTicket.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100vh-460px)] overflow-y-auto">
                    <div className="space-y-4">
                      {activeTicket.replies && activeTicket.replies.map((reply, index) => (
                        <div 
                          key={reply.id} 
                          className={`p-4 rounded-lg ${reply.isStaff 
                            ? "bg-primary/10 border border-primary/20" 
                            : "bg-dark-surface border border-gray-700"}`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${reply.isStaff 
                                ? "bg-primary/20 text-primary" 
                                : "bg-gray-700 text-white"}`}>
                                {reply.isStaff ? "S" : "U"}
                              </div>
                              <div className="ml-2">
                                <p className="font-medium text-white">{reply.isStaff ? "Support Team" : "You"}</p>
                                <p className="text-xs text-gray-400">{new Date(reply.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                          <div className="whitespace-pre-line text-gray-300">
                            {reply.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col border-t border-gray-700 pt-4">
                    {activeTicket.status.toLowerCase() === "closed" ? (
                      <div className="w-full p-4 rounded-lg bg-gray-800/50 text-center">
                        <p className="text-gray-400">This ticket is closed. If you need further assistance, please create a new ticket.</p>
                      </div>
                    ) : (
                      <form 
                        className="w-full space-y-4" 
                        onSubmit={replyForm.handleSubmit(onSubmitReply)}
                      >
                        <Textarea 
                          placeholder="Type your reply here..." 
                          className="w-full bg-dark-surface border-gray-700 min-h-[100px]"
                          {...replyForm.register("message", { required: true })}
                        />
                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="border-gray-700"
                            onClick={() => closeTicketMutation.mutate(activeTicket.id)}
                            disabled={closeTicketMutation.isPending}
                          >
                            {closeTicketMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Close Ticket
                          </Button>
                          <Button 
                            type="submit"
                            disabled={replyToTicketMutation.isPending}
                          >
                            {replyToTicketMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Send Reply
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardFooter>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-320px)] p-6">
                  <AlertCircle className="h-16 w-16 text-danger mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">Ticket not found</h2>
                  <p className="text-gray-400 max-w-md mb-6">
                    The ticket you're looking for could not be found. It may have been deleted.
                  </p>
                  <Button onClick={() => setActiveTicketId(null)}>
                    Back to Tickets
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
