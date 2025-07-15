import { useState } from "react";
import { Save, RefreshCw, Upload, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { COMPANY_DETAILS } from "@/utils/companyData";

export default function Settings() {
  const [companyDetails, setCompanyDetails] = useState(COMPANY_DETAILS);
  const [autoSave, setAutoSave] = useState(true);
  const [cloudBackup, setCloudBackup] = useState(false);

  const saveSettings = () => {
    // Save settings logic here
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully",
    });
  };

  const exportData = () => {
    const data = {
      customers: JSON.parse(localStorage.getItem("smr_customers") || "[]"),
      invoices: JSON.parse(localStorage.getItem("smr_invoices") || "[]"),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smr-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Your data has been exported successfully",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.customers) {
          localStorage.setItem("smr_customers", JSON.stringify(data.customers));
        }
        if (data.invoices) {
          localStorage.setItem("smr_invoices", JSON.stringify(data.invoices));
        }
        
        toast({
          title: "Data Imported",
          description: "Your data has been imported successfully. Refresh to see changes.",
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      localStorage.removeItem("smr_customers");
      localStorage.removeItem("smr_invoices");
      
      toast({
        title: "Data Cleared",
        description: "All data has been cleared. Refresh to see changes.",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Settings</h1>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyDetails.name}
              onChange={(e) => setCompanyDetails(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="companyAddress">Address</Label>
            <Textarea
              id="companyAddress"
              value={companyDetails.address}
              onChange={(e) => setCompanyDetails(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={companyDetails.gstin}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, gstin: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                value={companyDetails.mobile}
                onChange={(e) => setCompanyDetails(prev => ({ ...prev, mobile: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={companyDetails.email}
              onChange={(e) => setCompanyDetails(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              value={companyDetails.bankDetails.name}
              onChange={(e) => setCompanyDetails(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, name: e.target.value }
              }))}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={companyDetails.bankDetails.accountNumber}
                onChange={(e) => setCompanyDetails(prev => ({
                  ...prev,
                  bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={companyDetails.bankDetails.ifscCode}
                onChange={(e) => setCompanyDetails(prev => ({
                  ...prev,
                  bankDetails: { ...prev.bankDetails, ifscCode: e.target.value }
                }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              value={companyDetails.bankDetails.branch}
              onChange={(e) => setCompanyDetails(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, branch: e.target.value }
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoSave">Auto-save invoices</Label>
              <p className="text-sm text-muted-foreground">Automatically save invoices when created</p>
            </div>
            <Switch
              id="autoSave"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="cloudBackup">Cloud Backup</Label>
              <p className="text-sm text-muted-foreground">Backup data to Google Drive</p>
            </div>
            <Switch
              id="cloudBackup"
              checked={cloudBackup}
              onCheckedChange={setCloudBackup}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportData} className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            
            <div>
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
                id="import-data"
              />
              <Button asChild variant="outline" className="gap-2">
                <label htmlFor="import-data" className="cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Import Data
                </label>
              </Button>
            </div>
            
            <Button onClick={clearAllData} variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Export your data for backup or import previously exported data. 
            Clear all data will remove all customers and invoices permanently.
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="gap-2">
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}