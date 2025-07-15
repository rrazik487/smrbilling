import { CustomerDetails, InvoiceData } from "@/types/invoice";

const CUSTOMERS_KEY = "smr_customers";
const INVOICES_KEY = "smr_invoices";

export const customerStorage = {
  getAll(): CustomerDetails[] {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  },

  save(customer: CustomerDetails): void {
    const customers = this.getAll();
    const existingIndex = customers.findIndex(c => c.gstin === customer.gstin);
    
    if (existingIndex >= 0) {
      customers[existingIndex] = customer;
    } else {
      customers.push(customer);
    }
    
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  },

  findByGstin(gstin: string): CustomerDetails | null {
    const customers = this.getAll();
    return customers.find(c => c.gstin === gstin) || null;
  },

  delete(gstin: string): void {
    const customers = this.getAll().filter(c => c.gstin !== gstin);
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }
};

export const invoiceStorage = {
  getAll(): InvoiceData[] {
    const data = localStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : [];
  },

  save(invoice: InvoiceData): void {
    const invoices = this.getAll();
    const existingIndex = invoices.findIndex(i => i.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = invoice;
    } else {
      invoices.push(invoice);
    }
    
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  },

  findById(id: string): InvoiceData | null {
    const invoices = this.getAll();
    return invoices.find(i => i.id === id) || null;
  },

  delete(id: string): void {
    const invoices = this.getAll().filter(i => i.id !== id);
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  },

  generateInvoiceNumber(): string {
    const invoices = this.getAll();
    const lastInvoice = invoices[invoices.length - 1];
    
    if (!lastInvoice) return "INV001";
    
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace("INV", ""));
    return `INV${String(lastNumber + 1).padStart(3, "0")}`;
  }
};