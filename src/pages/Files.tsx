import { useState, useEffect } from "react";
import { FolderOpen, Download, Eye, Trash2, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { InvoiceData } from "@/types/invoice";
import { invoiceStorage } from "@/utils/localStorage";
import { googleDriveService } from "@/utils/googleDrive";

export default function Files() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [groupedInvoices, setGroupedInvoices] = useState<Record<string, InvoiceData[]>>({});
  const [isConnectedToDrive, setIsConnectedToDrive] = useState(false);

  useEffect(() => {
    loadInvoices();
    checkGoogleDriveConnection();
  }, []);

  const loadInvoices = () => {
    const allInvoices = invoiceStorage.getAll();
    setInvoices(allInvoices);
    
    // Group invoices by customer name
    const grouped = allInvoices.reduce((acc, invoice) => {
      const customerName = invoice.customer.name;
      if (!acc[customerName]) {
        acc[customerName] = [];
      }
      acc[customerName].push(invoice);
      return acc;
    }, {} as Record<string, InvoiceData[]>);
    
    setGroupedInvoices(grouped);
  };

  const checkGoogleDriveConnection = async () => {
    const connected = await googleDriveService.initialize();
    setIsConnectedToDrive(connected);
  };

  const connectToGoogleDrive = async () => {
    try {
      const authenticated = await googleDriveService.authenticate();
      if (authenticated) {
        setIsConnectedToDrive(true);
        toast({
          title: "Connected",
          description: "Successfully connected to Google Drive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Drive",
        variant: "destructive"
      });
    }
  };

  const downloadAllCustomerInvoices = (customerName: string) => {
    const customerInvoices = groupedInvoices[customerName];
    
    // This would typically create a zip file with all invoices
    // For now, we'll show a message about the feature
    toast({
      title: "Download Feature",
      description: `Would download ${customerInvoices.length} invoices for ${customerName}`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">File Browser</h1>
        <div className="text-sm text-muted-foreground">
          {Object.keys(groupedInvoices).length} customer folders • {invoices.length} total files
        </div>
      </div>

      {/* Customer Folders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedInvoices).map(([customerName, customerInvoices]) => {
          const totalAmount = customerInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
          const latestInvoice = customerInvoices.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];

          return (
            <Card key={customerName} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{customerName}</CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadAllCustomerInvoices(customerName)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Files:</span>
                  <Badge variant="secondary">{customerInvoices.length}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Value:</span>
                  <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Latest:</span>
                  <span className="text-sm">{formatDate(latestInvoice.date)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">GSTIN:</span>
                  <span className="text-xs font-mono">{latestInvoice.customer.gstin}</span>
                </div>

                {/* Recent Files Preview */}
                <div className="mt-4 space-y-2">
                  <div className="text-sm font-medium">Recent Files:</div>
                  {customerInvoices.slice(0, 3).map((invoice) => (
                    <div key={invoice.id} className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1">
                        {invoice.invoiceNumber} - {formatDate(invoice.date)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  ))}
                  {customerInvoices.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{customerInvoices.length - 3} more files
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {Object.keys(groupedInvoices).length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No customer folders found</h3>
          <p className="text-muted-foreground">
            Create invoices to automatically organize files by customer
          </p>
        </div>
      )}

      {/* Cloud Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Storage Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Local Storage:</span>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Google Drive:</span>
              <div className="flex items-center gap-2">
                <Badge variant={isConnectedToDrive ? "default" : "destructive"}>
                  {isConnectedToDrive ? "Connected" : "Not Connected"}
                </Badge>
                {!isConnectedToDrive && (
                  <Button 
                    onClick={connectToGoogleDrive} 
                    size="sm" 
                    variant="outline"
                    className="gap-2"
                  >
                    <Cloud className="h-4 w-4" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {isConnectedToDrive 
                ? "Invoices can be automatically saved to Google Drive organized by customer folders."
                : "Connect Google Drive for cloud backup and automatic file organization by customer."
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}