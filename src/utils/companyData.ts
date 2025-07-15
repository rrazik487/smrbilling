import { CompanyDetails } from "@/types/invoice";

export const COMPANY_DETAILS: CompanyDetails = {
  name: "SMR AGRO DERIVATIVES",
  address: "31/1B, VANCHIODAIPATTY\nOLD KARUR ROAD\nDINDIGUL.624005",
  gstin: "33DNKP57481H1ZF",
  mobile: "7010583881, 9842190216 ",
  email: "smragro2020@gmail.com",
  bankDetails: {
    name: "SMR AGRO DERIVATIVES",
    accountNumber: "125002893716",
    ifscCode: "CNRB0001006",
    branch: "CANARA BANK DINDIGUL"
  }
};

export const TAX_RATES = {
  CGST: 2.5,
  SGST: 2.5,
  IGST: 5.0
};