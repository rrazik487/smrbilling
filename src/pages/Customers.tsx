import { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CustomerDetails } from "@/types/invoice";
import { customerStorage } from "@/utils/localStorage";

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<CustomerDetails | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    setCustomers(customerStorage.getAll());
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.gstin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const saveCustomer = () => {
    if (!editingCustomer || !editingCustomer.name || !editingCustomer.gstin) {
      toast({
        title: "Validation Error",
        description: "Name and GSTIN are required",
        variant: "destructive"
      });
      return;
    }

    customerStorage.save(editingCustomer);
    loadCustomers();
    setIsDialogOpen(false);
    setEditingCustomer(null);
    
    toast({
      title: "Success",
      description: "Customer saved successfully",
    });
  };

  const deleteCustomer = (gstin: string) => {
    customerStorage.delete(gstin);
    loadCustomers();
    toast({
      title: "Success",
      description: "Customer deleted successfully",
    });
  };

  const openEditDialog = (customer?: CustomerDetails) => {
    setEditingCustomer(customer || {
      gstin: "",
      name: "",
      address: "",
      state: "",
      stateCode: "",
      phone: "",
      email: ""
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer?.gstin ? 'Edit Customer' : 'Add New Customer'}
              </DialogTitle>
            </DialogHeader>
            
            {editingCustomer && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstin">GSTIN *</Label>
                    <Input
                      id="gstin"
                      value={editingCustomer.gstin}
                      onChange={(e) => setEditingCustomer(prev => 
                        prev ? { ...prev, gstin: e.target.value.toUpperCase() } : null
                      )}
                      placeholder="33AEIPA9533Q1Z5"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={editingCustomer.name}
                      onChange={(e) => setEditingCustomer(prev => 
                        prev ? { ...prev, name: e.target.value } : null
                      )}
                      placeholder="Customer Name"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={editingCustomer.address}
                    onChange={(e) => setEditingCustomer(prev => 
                      prev ? { ...prev, address: e.target.value } : null
                    )}
                    placeholder="Full Address"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={editingCustomer.state}
                      onChange={(e) => setEditingCustomer(prev => 
                        prev ? { ...prev, state: e.target.value } : null
                      )}
                      placeholder="TAMIL NADU"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stateCode">State Code</Label>
                    <Input
                      id="stateCode"
                      value={editingCustomer.stateCode}
                      onChange={(e) => setEditingCustomer(prev => 
                        prev ? { ...prev, stateCode: e.target.value } : null
                      )}
                      placeholder="33"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editingCustomer.phone}
                      onChange={(e) => setEditingCustomer(prev => 
                        prev ? { ...prev, phone: e.target.value } : null
                      )}
                      placeholder="Mobile Number"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer(prev => 
                      prev ? { ...prev, email: e.target.value } : null
                    )}
                    placeholder="email@example.com"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveCustomer}>
                    Save Customer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer) => (
          <Card key={customer.gstin} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(customer)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteCustomer(customer.gstin)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="text-sm text-muted-foreground">GSTIN:</span>
                <div className="font-mono text-sm">{customer.gstin}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Address:</span>
                <div className="text-sm">{customer.address}</div>
              </div>
              {customer.state && (
                <div>
                  <span className="text-sm text-muted-foreground">State:</span>
                  <div className="text-sm">{customer.state}</div>
                </div>
              )}
              {customer.phone && (
                <div>
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <div className="text-sm">{customer.phone}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No customers found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms" : "Start by adding your first customer"}
          </p>
        </div>
      )}
    </div>
  );
}