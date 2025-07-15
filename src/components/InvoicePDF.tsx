import { useRef, useState } from "react";
import { X, Download, Share2, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { InvoiceData } from "@/types/invoice";
import { COMPANY_DETAILS } from "@/utils/companyData";
import { googleDriveService } from "@/utils/googleDrive";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import companyStamp from "@/assets/company-stamp.png";

interface InvoicePDFProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export function InvoicePDF({ invoice, onClose }: InvoicePDFProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const generatePDFBlob = async (): Promise<Blob | null> => {
    if (!invoiceRef.current) return null;

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (error) {
      console.error("Error generating PDF:", error);
      return null;
    }
  };

  const downloadPDF = async () => {
    const blob = await generatePDFBlob();
    if (!blob) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
      return;
    }

    const fileName = `${invoice.customer.name} - ${invoice.date} - ${invoice.invoiceNumber}.pdf`;
    saveAs(blob, fileName);
    
    toast({
      title: "PDF Downloaded",
      description: `Invoice saved as ${fileName}`,
    });
  };

  const uploadToGoogleDrive = async () => {
    setIsUploading(true);
    
    try {
      // Initialize Google Drive if not already done
      if (!googleDriveService.isConnected()) {
        const initialized = await googleDriveService.initialize();
        if (!initialized) {
          const authenticated = await googleDriveService.authenticate();
          if (!authenticated) {
            throw new Error("Failed to authenticate with Google Drive");
          }
        }
      }

      const blob = await generatePDFBlob();
      if (!blob) {
        throw new Error("Failed to generate PDF");
      }

      const fileName = `${invoice.customer.name} - ${invoice.date} - ${invoice.invoiceNumber}.pdf`;
      const uploaded = await googleDriveService.uploadFile(blob, fileName, invoice.customer.name);

      if (uploaded) {
        toast({
          title: "Success",
          description: `Invoice uploaded to Google Drive in folder "${invoice.customer.name}"`,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Google Drive upload failed:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload to Google Drive. Downloading locally instead.",
        variant: "destructive"
      });
      // Fallback to local download
      await downloadPDF();
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Preview - {invoice.invoiceNumber}</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={uploadToGoogleDrive} disabled={isUploading} className="gap-2">
                {isUploading ? (
                  <CloudOff className="h-4 w-4 animate-spin" />
                ) : (
                  <Cloud className="h-4 w-4" />
                )}
                {isUploading ? "Uploading..." : "Save to Drive"}
              </Button>
              <Button onClick={downloadPDF} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={onClose} variant="outline" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div ref={invoiceRef} className="bg-white p-6 text-black">
          {/* Header */}
          <div className="border-2 border-black">
            {/* Company Details Row */}
            <div className="flex border-b border-black">
              <div className="flex-1 p-3 border-r border-black">
                <div className="text-center">
                  <h1 className="text-xl font-bold">{COMPANY_DETAILS.name}</h1>
                  <div className="text-sm mt-1">
                    {COMPANY_DETAILS.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="text-sm mt-2">
                    <div><u>{COMPANY_DETAILS.email}</u></div>
                    <div>MOBILE: {COMPANY_DETAILS.mobile}</div>
                  </div>
                </div>
              </div>
              <div className="w-48 p-3">
                <div className="text-sm space-y-1">
                  <div><strong>GSTIN:</strong> {COMPANY_DETAILS.gstin}</div>
                  <div><strong>BILLNO:</strong> {invoice.billNo}</div>
                  <div><strong>DATE:</strong> {formatDate(invoice.date)}</div>
                  <div><strong>TRUCK NO:</strong> {invoice.truckNo}</div>
                  <div><strong>PLACE OF SUPPLY:</strong> {invoice.placeOfSupply}</div>
                  <div><strong>Reverse Charge:</strong> {invoice.reverseCharge ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Invoice Header */}
            <div className="text-center py-2 border-b border-black bg-gray-100">
              <h2 className="text-lg font-bold">INVOICE</h2>
            </div>

            {/* Dispatch and Shipping Details */}
            <div className="border-b border-black">
              <div className="grid grid-cols-2">
                {/* Supplier */}
                <div className="p-3 border-r border-black">
                  <div className="font-bold mb-2">Supplier:</div>
                  <div>GSTIN: {invoice.supplier.gstin}</div>
                  <div className="font-medium">{invoice.supplier.name}</div>
                  <div className="text-sm">
                    {invoice.supplier.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
                
                {/* Recipient */}
                <div className="p-3">
                  <div className="font-bold mb-2">Recipient:</div>
                  <div>GSTIN: {invoice.recipient.gstin}</div>
                  <div className="font-medium">{invoice.recipient.name}</div>
                  <div>Place of supply: {invoice.recipient.placeOfSupply}</div>
                  <div className="text-sm">
                    {invoice.recipient.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 border-t border-black">
                {/* Dispatch From */}
                <div className="p-3 border-r border-black">
                  <div className="font-bold mb-2">Dispatch From:</div>
                  <div className="text-sm">
                    {invoice.dispatchFrom.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
                
                {/* Ship To */}
                <div className="p-3">
                  <div className="font-bold mb-2">Ship To:</div>
                  <div>GSTIN: {invoice.shipTo.gstin}</div>
                  <div className="text-sm">
                    {invoice.shipTo.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer Details - Original TO section */}
            <div className="p-3 border-b border-black">
              <div className="flex">
                <div className="w-8 font-bold">TO</div>
                <div className="flex-1">
                  <div className="font-bold">{invoice.customer.name}</div>
                  <div className="text-sm">
                    <strong>GSTIN:</strong> {invoice.customer.gstin}
                  </div>
                  <div className="text-sm mt-1">
                    {invoice.customer.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-2 text-left text-sm">Sl.No</th>
                  <th className="border border-black p-2 text-left text-sm">Description of Goods / Services</th>
                  <th className="border border-black p-2 text-center text-sm">Quantity</th>
                  <th className="border border-black p-2 text-center text-sm">Unit</th>
                  <th className="border border-black p-2 text-center text-sm">RATE</th>
                  <th className="border border-black p-2 text-center text-sm">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-black p-2 text-sm">{index + 1}</td>
                    <td className="border border-black p-2 text-sm">
                      <div>{item.description}</div>
                      <div className="text-xs">HSN CODE: {item.hsnCode}</div>
                    </td>
                    <td className="border border-black p-2 text-center text-sm">{item.quantity}</td>
                    <td className="border border-black p-2 text-center text-sm">{item.unit}</td>
                    <td className="border border-black p-2 text-center text-sm">{item.rate.toFixed(2)}</td>
                    <td className="border border-black p-2 text-center text-sm">{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                
                {/* Empty rows for spacing */}
                {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                    <td className="border border-black p-2 text-sm">&nbsp;</td>
                  </tr>
                ))}

                {/* Totals */}
                <tr>
                  <td colSpan={5} className="border border-black p-2 text-right text-sm font-bold">
                    Total Taxable Value
                  </td>
                  <td className="border border-black p-2 text-center text-sm font-bold">
                    {invoice.totalTaxableValue.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Tax Details and Bank Details */}
            <div className="flex border-t border-black">
              <div className="flex-1 p-3 border-r border-black">
                <div className="text-sm">
                  <div className="font-bold mb-2">BANK DETAILS</div>
                  <div><strong>{COMPANY_DETAILS.bankDetails.name}</strong></div>
                  <div>A.C NO: {COMPANY_DETAILS.bankDetails.accountNumber}</div>
                  <div>IFSC CODE: {COMPANY_DETAILS.bankDetails.ifscCode}</div>
                  <div>{COMPANY_DETAILS.bankDetails.branch}</div>
                </div>
              </div>
              <div className="w-64 p-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Tax Rate</span>
                    <span>Tax Amount</span>
                  </div>
                  {invoice.cgst > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST 2.5%</span>
                        <span>{invoice.cgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST 2.5%</span>
                        <span>{invoice.sgst.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  {invoice.igst > 0 && (
                    <div className="flex justify-between">
                      <span>IGST 5%</span>
                      <span>{invoice.igst.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 font-bold">
                    <span>Total GST Amount</span>
                    <span>{(invoice.cgst + invoice.sgst + invoice.igst).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="p-3 border-t border-black">
              <div className="flex">
                <div className="flex-1">
                  <div className="text-sm">
                    <strong>TOTAL AMOUNT PAYABLE (IN WORDS):</strong>
                  </div>
                  <div className="font-bold">
                    RS. {invoice.amountInWords}
                  </div>
                </div>
                <div className="w-32 text-center">
                  <div className="text-sm font-bold">ROUND OFF / ON</div>
                  <div className="border-t border-black mt-8">
                    <div className="text-sm font-bold">TOTAL AMOUNT PAYABLE</div>
                    <div className="text-lg font-bold">{invoice.totalAmount.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-black">
              <div className="flex justify-between items-end">
                <div className="text-xs">
                  <div>Certified that the particulars given above are true &</div>
                  <div>correct and the amount indicated is actual</div>
                  <div className="mt-4">E & O E</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold mb-2">for {COMPANY_DETAILS.name}</div>
                  <div className="w-20 h-20 mx-auto mb-2">
                    <img src={companyStamp} alt="Company Stamp" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-sm">Proprietor</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}