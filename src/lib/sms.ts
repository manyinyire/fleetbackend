import AT from 'africastalking-ts';

// Initialize Africa's Talking
const at = new (AT as any)({
  apiKey: process.env.AFRICAS_TALKING_API_KEY || '',
  username: process.env.AFRICAS_TALKING_USERNAME || '',
});

export interface SMSMessage {
  to: string;
  message: string;
  from?: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS({ to, message, from = 'Azaire' }: SMSMessage): Promise<SMSResponse> {
  try {
    // Validate phone number (Zimbabwe format)
    const cleanNumber = to.replace(/\D/g, '');
    if (!cleanNumber.startsWith('263') && !cleanNumber.startsWith('+263')) {
      return {
        success: false,
        error: 'Invalid Zimbabwe phone number format'
      };
    }

    // Format phone number for Africa's Talking
    const formattedNumber = cleanNumber.startsWith('263') ? `+${cleanNumber}` : `+${cleanNumber}`;

    const result = await at.sms.send({
      to: [formattedNumber],
      message,
      from
    });

    if (result.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      return {
        success: true,
        messageId: result.SMSMessageData.Recipients[0].messageId
      };
    } else {
      return {
        success: false,
        error: result.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error'
      };
    }
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS'
    };
  }
}

export async function sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
  const results: SMSResponse[] = [];
  
  for (const message of messages) {
    const result = await sendSMS(message);
    results.push(result);
    
    // Add delay between messages to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// SMS Templates
export const SMSTemplates = {
  welcome: (driverName: string, companyName: string) => 
    `Welcome to ${companyName}! Your driver account has been created. You can now start managing your fleet.`,
  
  remittanceReceived: (driverName: string, amount: number, vehicle: string) =>
    `Hi ${driverName}, your remittance of $${amount} for ${vehicle} has been received and is being processed.`,
  
  maintenanceReminder: (driverName: string, vehicle: string, serviceType: string) =>
    `Hi ${driverName}, ${vehicle} is due for ${serviceType}. Please schedule maintenance soon.`,
  
  paymentReminder: (driverName: string, amount: number, dueDate: string) =>
    `Hi ${driverName}, you have a payment of $${amount} due on ${dueDate}. Please make payment to avoid late fees.`,
  
  contractExpiry: (driverName: string, expiryDate: string) =>
    `Hi ${driverName}, your contract expires on ${expiryDate}. Please contact us to renew.`,
  
  systemAlert: (message: string) =>
    `Azaire Alert: ${message}`,
  
  custom: (message: string) => message
};