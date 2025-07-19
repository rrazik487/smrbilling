import { useState, useEffect } from "react";
import { Plus, Minus, Search, Save, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CustomerDetails, InvoiceData, InvoiceItem } from "@/types/invoice";
import { customerStorage, invoiceStorage } from "@/utils/localStorage";
import { numberToWords } from "@/utils/numberToWords";
import { TAX_RATES } from "@/utils/companyData";
import { InvoicePDF } from "./InvoicePDF";

export function InvoiceForm() {
  const [customer, setCustomer] = useState<CustomerDetails>({
    gstin: "",
    name: "",
    address: "",
    state: "",
    stateCode: "",
    phone: "",
    email: ""
  });

  const [invoiceData, setInvoiceData] = useState<Partial<InvoiceData>>({
    invoiceNumber: invoiceStorage.generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    billNo: "",
    truckNo: "",
    placeOfSupply: "",
    reverseCharge: false,
    items: [{
      id: "1",
      description: "COIR PITH",
      hsnCode: "53050040",
      quantity: 0,
      unit: "PCS",
      rate: 0,
      amount: 0
    }],
    // Initialize supplier, recipient, dispatchFrom, and shipTo to prevent undefined issues
    supplier: {
      gstin: "",
      name: "",
      address: ""
    },
    recipient: {
      gstin: "",
      name: "",
      address: "",
      placeOfSupply: ""
    },
    dispatchFrom: {
      address: ""
    },
    shipTo: {
      gstin: "",
      address: ""
    }
  });

  const [showPDF, setShowPDF] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceData | null>(null);

  // Auto-search customer by GSTIN and populate recipient details
  useEffect(() => {
    if (customer.gstin.length >= 15) {
      const foundCustomer = customerStorage.findByGstin(customer.gstin);
      if (foundCustomer) {
        setCustomer(foundCustomer);
        // Auto-populate recipient details
        setInvoiceData(prev => ({
          ...prev,
          recipient: {
            gstin: foundCustomer.gstin,
            name: foundCustomer.name,
            address: foundCustomer.address,
            placeOfSupply: foundCustomer.state
          },
          // IMPORTANT CHANGE: Do NOT auto-populate shipTo.address here.
          // This allows for a different ship-to address than the customer's main address.
          // shipTo: {
          //   gstin: foundCustomer.gstin,
          //   address: foundCustomer.address
          // }
        }));
        toast({
          title: "Customer Found",
          description: `Loaded details for ${foundCustomer.name}`,
        });
      }
    }
  }, [customer.gstin]);

  // Calculate taxes and totals
  const calculateTotals = () => {
    const totalTaxableValue = invoiceData.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    
    // Check if inter-state (IGST) or intra-state (CGST + SGST)
    const isInterState = customer.state !== "TAMIL NADU";
    
    const cgst = isInterState ? 0 : (totalTaxableValue * TAX_RATES.CGST) / 100;
    const sgst = isInterState ? 0 : (totalTaxableValue * TAX_RATES.SGST) / 100;
    const igst = isInterState ? (totalTaxableValue * TAX_RATES.IGST) / 100 : 0;
    
    const totalAmount = totalTaxableValue + cgst + sgst + igst;
    
    return {
      totalTaxableValue,
      cgst,
      sgst,
      igst,
      totalAmount,
      amountInWords: numberToWords(Math.round(totalAmount))
    };
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      hsnCode: "",
      quantity: 0,
      unit: "PCS",
      rate: 0,
      amount: 0
    };
    
    setInvoiceData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const removeItem = (id: string) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items?.filter(item => item.id !== id) || []
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items?.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'rate') {
            updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          }
          return updatedItem;
        }
        return item;
      }) || []
    }));
  };

  const generateInvoice = () => {
    if (!customer.name || !customer.gstin) {
      toast({
        title: "Missing Customer Details",
        description: "Please fill in customer information",
        variant: "destructive"
      });
      return;
    }

    if (!invoiceData.items?.length || invoiceData.items.every(item => item.amount === 0)) {
      toast({
        title: "Missing Items",
        description: "Please add at least one item with amount",
        variant: "destructive"
      });
      return;
    }

    const totals = calculateTotals();
    
    const completeInvoice: InvoiceData = {
      id: Date.now().toString(),
      invoiceNumber: invoiceData.invoiceNumber!,
      date: invoiceData.date!,
      billNo: invoiceData.billNo!,
      truckNo: invoiceData.truckNo!,
      placeOfSupply: invoiceData.placeOfSupply!,
      reverseCharge: invoiceData.reverseCharge!,
      customer, // Customer details remain as is
      items: invoiceData.items!,
      // IMPORTANT CHANGE: Use values from invoiceData state for supplier, recipient, dispatchFrom, and shipTo
      supplier: invoiceData.supplier!, 
      recipient: invoiceData.recipient!,
      dispatchFrom: invoiceData.dispatchFrom!,
      shipTo: invoiceData.shipTo!, // This will now use the value from the input field
      ...totals
    };

    // Save customer and invoice
    customerStorage.save(customer);
    invoiceStorage.save(completeInvoice);
    
    setGeneratedInvoice(completeInvoice);
    setShowPDF(true);

    toast({
      title: "Invoice Generated",
      description: `Invoice ${completeInvoice.invoiceNumber} created successfully`,
    });
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Create Invoice</h1>
        <div className="flex gap-2">
          <Button onClick={generateInvoice} className="gap-2">
            <FileText className="h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </div>

      {/* Customer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Customer Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gstin">Customer GSTIN *</Label>
              <Input
                id="gstin"
                value={customer.gstin}
                onChange={(e) => setCustomer(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                placeholder="33AEIPA9533Q1Z5"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={customer.name}
                onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer Name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="customerAddress">Customer Address *</Label>
            <Textarea
              id="customerAddress"
              value={customer.address}
              onChange={(e) => setCustomer(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Full Address"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={customer.state}
                onChange={(e) => setCustomer(prev => ({ ...prev, state: e.target.value }))}
                placeholder="TAMIL NADU"
              />
            </div>
            <div>
              <Label htmlFor="stateCode">State Code</Label>
              <Input
                id="stateCode"
                value={customer.stateCode}
                onChange={(e) => setCustomer(prev => ({ ...prev, stateCode: e.target.value }))}
                placeholder="33"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={customer.phone}
                onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Mobile Number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="INV001"
              />
            </div>
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={invoiceData.date}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="billNo">Bill No</Label>
              <Input
                id="billNo"
                value={invoiceData.billNo}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, billNo: e.target.value }))}
                placeholder="015/25-26"
              />
            </div>
            <div>
              <Label htmlFor="truckNo">Truck No</Label>
              <Input
                id="truckNo"
                value={invoiceData.truckNo}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, truckNo: e.target.value }))}
                placeholder="TN 57 BD 0240"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placeOfSupply">Place of Supply</Label>
              <Input
                id="placeOfSupply"
                value={invoiceData.placeOfSupply}
                onChange={(e) => setInvoiceData(prev => ({ ...prev, placeOfSupply: e.target.value }))}
                placeholder="DINDIGUL"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="reverseCharge"
                checked={invoiceData.reverseCharge}
                onCheckedChange={(checked) => setInvoiceData(prev => ({ ...prev, reverseCharge: checked }))}
              />
              <Label htmlFor="reverseCharge">Reverse Charge</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispatch and Shipping Details */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch & Shipping Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Supplier Details</h3>
              <div>
                <Label htmlFor="supplierGstin">Supplier GSTIN</Label>
                <Input
                  id="supplierGstin"
                  value={invoiceData.supplier?.gstin || ""}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier!, gstin: e.target.value }
                  }))}
                  placeholder="33DNKP57481H1ZF"
                />
              </div>
              <div>
                <Label htmlFor="supplierName">Supplier Name</Label>
                <Input
                  id="supplierName"
                  value={invoiceData.supplier?.name || ""}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier!, name: e.target.value }
                  }))}
                  placeholder="BARAGATH COIR"
                />
              </div>
              <div>
                <Label htmlFor="supplierAddress">Supplier Address</Label>
                <Textarea
                  id="supplierAddress"
                  value={invoiceData.supplier?.address || ""}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier!, address: e.target.value }
                  }))}
                  placeholder="baragath coir dindigul main road velliyangil, 639118, TAMIL NADU"
                  rows={3}
                />
              </div>
            </div>

            {/* Recipient Details */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Recipient Details</h3>
              <div>
                <Label htmlFor="recipientGstin">Recipient GSTIN</Label>
                <Input
                  id="recipientGstin"
                  value={invoiceData.recipient?.gstin || customer.gstin}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    recipient: { ...prev.recipient!, gstin: e.target.value }
                  }))}
                  placeholder="27KLMNO9012L3B7"
                />
              </div>
              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input
                  id="recipientName"
                  value={invoiceData.recipient?.name || customer.name}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    recipient: { ...prev.recipient!, name: e.target.value }
                  }))}
                  placeholder="S Razikur Rahman"
                />
              </div>
              <div>
                <Label htmlFor="recipientAddress">Recipient Address</Label>
                <Textarea
                  id="recipientAddress"
                  value={invoiceData.recipient?.address || customer.address}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    recipient: { ...prev.recipient!, address: e.target.value }
                  }))}
                  placeholder="85/60 Ram Nagar Round Road Dindigul"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="recipientPlaceOfSupply">Place of Supply</Label>
                <Input
                  id="recipientPlaceOfSupply"
                  value={invoiceData.recipient?.placeOfSupply || customer.state}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    recipient: { ...prev.recipient!, placeOfSupply: e.target.value }
                  }))}
                  placeholder="TAMIL NADU"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            {/* Dispatch From */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Dispatch From</h3>
              <div>
                <Label htmlFor="dispatchAddress">Dispatch Address</Label>
                <Textarea
                  id="dispatchAddress"
                  value={invoiceData.dispatchFrom?.address || ""}
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    dispatchFrom: { ...prev.dispatchFrom!, address: e.target.value }
                  }))}
                  placeholder="baragath coir dindigul main road velliyangil, 639118, TAMIL NADU"
                  rows={3}
                />
              </div>
            </div>

            {/* Ship To */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Ship To</h3>
              <div>
                <Label htmlFor="shipToGstin">Ship To GSTIN</Label>
                <Input
                  id="shipToGstin"
                  value={invoiceData.shipTo?.gstin || ""} // Changed default to empty string
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    shipTo: { ...prev.shipTo!, gstin: e.target.value }
                  }))}
                  placeholder="27KLMNO9012L3B7"
                />
              </div>
              <div>
                <Label htmlFor="shipToAddress">Ship To Address</Label>
                <Textarea
                  id="shipToAddress"
                  value={invoiceData.shipTo?.address || ""} // Changed default to empty string
                  onChange={(e) => setInvoiceData(prev => ({
                    ...prev,
                    shipTo: { ...prev.shipTo!, address: e.target.value }
                  }))}
                  placeholder="85/60 Ram Nagar Round Road Dindigul"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice Items</CardTitle>
            <Button onClick={addItem} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoiceData.items?.map((item, index) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {invoiceData.items!.length > 1 && (
                    <Button
                      onClick={() => removeItem(item.id)}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                    >
                      <Minus className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                  <div className="md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div>
                    <Label>HSN Code</Label>
                    <Input
                      value={item.hsnCode}
                      onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                      placeholder="53050040"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="w-full border border-input rounded-md px-3 py-2"
                    >
                      <option value="PCS">PCS</option>
                      <option value="KGS">KGS</option>
                      <option value="LTR">LTR</option>
                      </select>
                  </div>
                  <div>
                    <Label>Rate</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={item.amount}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Taxable Value:</span>
              <span className="font-medium">₹{totals.totalTaxableValue.toFixed(2)}</span>
            </div>
            {customer.state === "TAMIL NADU" ? (
              <>
                <div className="flex justify-between">
                  <span>CGST (2.5%):</span>
                  <span className="font-medium">₹{totals.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST (2.5%):</span>
                  <span className="font-medium">₹{totals.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>IGST (5%):</span>
                <span className="font-medium">₹{totals.igst.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>₹{totals.totalAmount.toFixed(2)}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                In Words: {totals.amountInWords}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Modal */}
      {showPDF && generatedInvoice && (
        <InvoicePDF
          invoice={generatedInvoice}
          onClose={() => setShowPDF(false)}
        />
      )}
    </div>
  );
}
