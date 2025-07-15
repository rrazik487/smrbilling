export interface CustomerDetails {
  gstin: string;
  name: string;
  address: string;
  state: string;
  stateCode: string;
  phone?: string;
  email?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  billNo: string;
  truckNo: string;
  placeOfSupply: string;
  reverseCharge: boolean;
  customer: CustomerDetails;
  items: InvoiceItem[];
  cgst: number;
  sgst: number;
  igst: number;
  totalTaxableValue: number;
  totalAmount: number;
  amountInWords: string;
  supplier: {
    gstin: string;
    name: string;
    address: string;
  };
  recipient: {
    gstin: string;
    name: string;
    address: string;
    placeOfSupply: string;
  };
  dispatchFrom: {
    address: string;
  };
  shipTo: {
    gstin: string;
    address: string;
  };
}

export interface CompanyDetails {
  name: string;
  address: string;
  gstin: string;
  mobile: string;
  email: string;
  bankDetails: {
    name: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}