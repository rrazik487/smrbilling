const ones = [
  '', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
  'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN',
  'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'
];

const tens = [
  '', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'
];

function convertHundreds(num: number): string {
  let result = '';
  
  if (num > 99) {
    result += ones[Math.floor(num / 100)] + ' HUNDRED ';
    num %= 100;
  }
  
  if (num > 19) {
    result += tens[Math.floor(num / 10)] + ' ';
    num %= 10;
  }
  
  if (num > 0) {
    result += ones[num] + ' ';
  }
  
  return result;
}

export function numberToWords(amount: number): string {
  if (amount === 0) return 'ZERO ONLY';
  
  const crores = Math.floor(amount / 10000000);
  const lakhs = Math.floor((amount % 10000000) / 100000);
  const thousands = Math.floor((amount % 100000) / 1000);
  const hundreds = amount % 1000;
  
  let result = '';
  
  if (crores > 0) {
    result += convertHundreds(crores) + 'CRORE ';
  }
  
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'LAKH ';
  }
  
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'THOUSAND ';
  }
  
  if (hundreds > 0) {
    result += convertHundreds(hundreds);
  }
  
  return result.trim() + ' ONLY';
}