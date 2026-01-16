declare module "paynow" {
  export class Paynow {
    constructor(integrationId: string, integrationKey: string);
    resultUrl: string;
    returnUrl: string;
    
    createPayment(reference: string, authEmail: string): Payment;
    send(payment: Payment): Promise<InitResponse>;
    sendMobile(payment: Payment, phone: string, method: string): Promise<InitResponse>;
    pollTransaction(pollUrl: string): Promise<StatusResponse>;
  }

  export class Payment {
    add(title: string, amount: number): void;
  }

  export interface InitResponse {
    success: boolean;
    pollUrl?: string;
    redirectUrl?: string;
    instructions?: string;
    hash?: string;
    error?: string;
    status?: string;
  }

  export interface StatusResponse {
    paid: boolean;
    status: string;
    amount: string;
    reference: string;
    paynowreference: string;
    pollurl: string;
    hash: string;
  }
}
