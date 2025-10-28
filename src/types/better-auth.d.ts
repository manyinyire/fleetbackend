import 'better-auth';

declare module 'better-auth' {
  interface User {
    role: string;
    tenantId: string | null;
  }
}