import { useState } from "react";
import { MainLayout } from "@/components/layouts/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("subscription");

  // Query subscription data
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  // Query invoices
  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["/api/invoices"],
    enabled: !!user,
  });

  // Query subscription plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/subscription-plans"],
    enabled: !!user,
  });

  return (
    <MainLayout title="Billing">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscription">
          <div className="space-y-6">
            {isLoadingSubscription ? (
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <Skeleton className="h-7 w-48 bg-dark-surface/50" />
                  <Skeleton className="h-5 w-64 bg-dark-surface/50" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-full bg-dark-surface/50" />
                    <Skeleton className="h-5 w-full bg-dark-surface/50" />
                    <Skeleton className="h-5 w-full bg-dark-surface/50" />
                    <Skeleton className="h-5 w-2/3 bg-dark-surface/50" />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CreditCard className="mr-2 h-5 w-5 text-primary" />
                    Current Subscription
                  </CardTitle>
                  <CardDescription>Manage your current subscription and payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg bg-dark-surface border border-gray-700 p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-white text-lg">{subscription?.name || "Premium Plan"}</h3>
                        <p className="text-gray-400 text-sm">${subscription?.price || "24.99"}/month</p>
                      </div>
                      <div className="px-3 py-1 bg-success/10 text-success text-sm rounded-full">
                        Active
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Next billing date:</span>
                        <span className="text-white">{subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "June 15, 2023"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Payment method:</span>
                        <span className="text-white">Visa •••• 4242</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-white">Plan Includes:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">{subscription?.serverLimit || 5} Game Servers</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">{subscription?.memoryLimit || 16} GB RAM</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">{subscription?.cpuLimit || 400}% CPU</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">{subscription?.diskLimit || 50} GB Disk Space</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">{subscription?.backupLimit || 10} Backups</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">Priority Support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    className="border-gray-700 hover:bg-gray-800 hover:text-white"
                    onClick={() => {
                      toast({
                        title: "Update payment method",
                        description: "This feature will be available soon.",
                      });
                    }}
                  >
                    Update Payment Method
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      toast({
                        title: "Cancel subscription",
                        description: "Your subscription will remain active until the end of your billing period.",
                      });
                    }}
                  >
                    Cancel Subscription
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Receipt className="mr-2 h-5 w-5 text-primary" />
                Billing History
              </CardTitle>
              <CardDescription>View your past invoices and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full bg-dark-surface/50" />
                  <Skeleton className="h-16 w-full bg-dark-surface/50" />
                  <Skeleton className="h-16 w-full bg-dark-surface/50" />
                </div>
              ) : invoices && invoices.length > 0 ? (
                <div className="relative overflow-x-auto rounded-lg border border-gray-700">
                  <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-400 uppercase bg-dark-surface border-b border-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3">Invoice</th>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="bg-dark-surface border-b border-gray-700 hover:bg-dark-surface/80">
                          <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap">
                            #{invoice.id}
                          </th>
                          <td className="px-6 py-4">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            ${invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              invoice.status === "paid" 
                                ? "bg-success/10 text-success" 
                                : invoice.status === "pending" 
                                ? "bg-warning/10 text-warning" 
                                : "bg-danger/10 text-danger"
                            }`}>
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-gray-700"
                              onClick={() => {
                                toast({
                                  title: "Download invoice",
                                  description: "Your invoice is being downloaded.",
                                });
                              }}
                            >
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <AlertCircle className="h-10 w-10 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-white mb-1">No invoices yet</h3>
                  <p className="text-gray-400">
                    You haven't been billed yet. Invoices will appear here after your first payment.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="upgrade">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-2">Choose Your Plan</h2>
              <p className="text-gray-400">
                Select the plan that best fits your needs. All plans include access to our game server management platform.
              </p>
            </div>
            
            {isLoadingPlans ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-96 w-full bg-dark-surface/50" />
                <Skeleton className="h-96 w-full bg-dark-surface/50" />
                <Skeleton className="h-96 w-full bg-dark-surface/50" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Plan */}
                <Card className="bg-dark-card border-gray-800 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-white">Basic</CardTitle>
                    <CardDescription>For small communities or testing</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">$9.99</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">2 Game Servers</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">4 GB RAM</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">100% CPU</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">20 GB Disk Space</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">3 Backups</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">Standard Support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Select Plan
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Premium Plan - Highlighted */}
                <Card className="bg-dark-card border-primary relative">
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 transform translate-y-0 rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                  <CardHeader>
                    <CardTitle className="text-white">Premium</CardTitle>
                    <CardDescription>For medium-sized communities</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">$24.99</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">5 Game Servers</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">16 GB RAM</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">400% CPU</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">50 GB Disk Space</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">10 Backups</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">Priority Support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full">
                      Current Plan
                    </Button>
                  </CardFooter>
                </Card>
                
                {/* Professional Plan */}
                <Card className="bg-dark-card border-gray-800 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <CardTitle className="text-white">Professional</CardTitle>
                    <CardDescription>For large communities</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-white">$49.99</span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">10 Game Servers</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">32 GB RAM</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">800% CPU</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">100 GB Disk Space</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">Unlimited Backups</span>
                      </li>
                      <li className="flex items-center text-sm">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-primary" />
                        <span className="text-gray-200">24/7 Priority Support</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      Upgrade Plan
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            
            <div className="bg-dark-card border border-gray-800 rounded-lg p-6">
              <div className="flex items-start">
                <div className="mr-4 mt-1">
                  <AlertCircle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Need a custom plan?</h3>
                  <p className="text-gray-400 mb-4">
                    If none of our standard plans fit your needs, we can create a custom plan tailored to your specific requirements.
                    Contact our sales team to discuss your needs.
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-gray-700 hover:bg-gray-800 hover:text-white"
                    onClick={() => {
                      toast({
                        title: "Contact sales",
                        description: "Our sales team will contact you shortly.",
                      });
                    }}
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
