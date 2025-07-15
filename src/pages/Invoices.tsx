// ===============================
// File: src/pages/Invoices.tsx
// ===============================

import { useState } from "react";
import { Search, Eye, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { InvoiceData } from "@/types/invoice";
import { InvoicePDF } from "@/components/InvoicePDF";
import { useFirestoreCollection } from "@/hooks/useFirestore";

export default function Invoices() {
  const {
    items: invoices,
    deleteItem,
    loading,
  } = useFirestoreCollection<InvoiceData>("invoices");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [showPDF, setShowPDF] = useState(false);

  const filteredInvoices = invoices
    .filter(
      (invoice) =>
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.gstin?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const viewInvoice = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setShowPDF(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
        <div className="text-sm text-muted-foreground">
          Total Invoices: {invoices.length}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => (
            <Card
              key={invoice.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {invoice.invoiceNumber}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      {formatDate(invoice.date)} • Bill No: {invoice.billNo}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewInvoice(invoice)}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteItem(invoice.id);
                        toast({
                          title: "Deleted",
                          description: "Invoice deleted successfully",
                        });
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Customer</div>
                    <div className="font-medium">{invoice.customer?.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.customer?.gstin}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Items</div>
                    <div className="font-medium">
                      {invoice.items?.length} item(s)
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {invoice.items?.[0]?.description}
                      {invoice.items?.length > 1 &&
                        ` +${invoice.items.length - 1} more`}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Amount</div>
                    <div className="font-bold text-lg">
                      {formatCurrency(invoice.totalAmount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Taxable: {formatCurrency(invoice.totalTaxableValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Tax Details</div>
                    <div className="flex gap-1 flex-wrap">
                      {invoice.cgst > 0 && (
                        <>
                          <Badge variant="secondary" className="text-xs">
                            CGST: ₹{invoice.cgst.toFixed(2)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            SGST: ₹{invoice.sgst.toFixed(2)}
                          </Badge>
                        </>
                      )}
                      {invoice.igst > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          IGST: ₹{invoice.igst.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                    {invoice.truckNo && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Truck: {invoice.truckNo}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredInvoices.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            No invoices found
          </h3>
          <p className="text-muted-foreground">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Start by creating your first invoice"}
          </p>
        </div>
      )}

      {/* PDF Modal */}
      {showPDF && selectedInvoice && (
        <InvoicePDF
          invoice={selectedInvoice}
          onClose={() => {
            setShowPDF(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}
