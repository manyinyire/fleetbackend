/**
 * Utility functions to serialize Prisma Decimal fields to numbers
 * for passing data from Server Components to Client Components
 */

/**
 * Check if a value is a Prisma Decimal object
 * Prisma Decimal objects come from @prisma/client/runtime/library and have specific characteristics
 */
function isDecimal(value: any): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  
  // Most reliable: Check constructor name
  if (value.constructor?.name === 'Decimal') {
    return true;
  }
  
  // Fallback: Check for Decimal-specific methods AND absence of common object properties
  // Decimal objects have toNumber, toFixed, toString but are NOT plain objects
  // They also don't have common database object properties
  const hasDecimalMethods = 
    typeof value.toNumber === 'function' &&
    typeof value.toFixed === 'function' &&
    typeof value.toString === 'function';
  
  if (!hasDecimalMethods) {
    return false;
  }
  
  // If it has Decimal methods, check if it's NOT a plain object with database properties
  // This prevents false positives on regular objects
  const hasObjectProperties = 
    'id' in value || 
    'email' in value || 
    'name' in value || 
    'createdAt' in value ||
    'updatedAt' in value ||
    'tenantId' in value ||
    'fullName' in value ||
    'registrationNumber' in value;
  
  if (hasObjectProperties) {
    return false; // It's a database object, not a Decimal
  }
  
  // Final check: Try converting - if it produces a valid number, it's likely a Decimal
  try {
    const num = value.toNumber();
    return typeof num === 'number' && !isNaN(num);
  } catch {
    return false;
  }
}

/**
 * Recursively converts all Decimal fields to numbers in an object
 */
function convertDecimalToNumber(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle Date objects (preserve them) - check before other object checks
  if (value instanceof Date) {
    return value;
  }

  // Handle arrays first
  if (Array.isArray(value)) {
    return value.map(convertDecimalToNumber);
  }

  // Handle Decimal objects from Prisma - must check this BEFORE plain objects
  if (isDecimal(value)) {
    try {
      const num = value.toNumber();
      return isNaN(num) ? 0 : num;
    } catch (error) {
      console.warn('Error converting Decimal to number:', error, value);
      return 0;
    }
  }

  // Handle plain objects (but skip special objects like Date, RegExp, etc.)
  if (typeof value === 'object' && value.constructor === Object) {
    const converted: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        try {
          converted[key] = convertDecimalToNumber(value[key]);
        } catch (error) {
          console.warn(`Error converting property ${key}:`, error, value[key]);
          converted[key] = value[key]; // Keep original value if conversion fails
        }
      }
    }
    return converted;
  }

  // Return primitive values as-is
  return value;
}

/**
 * Serializes a Prisma result (vehicle, driver, etc.) by converting Decimal fields to numbers
 */
export function serializePrismaData<T>(data: T): T {
  return convertDecimalToNumber(data) as T;
}

/**
 * Serializes an array of Prisma results
 */
export function serializePrismaArray<T>(data: T[]): T[] {
  if (!Array.isArray(data)) {
    console.warn('serializePrismaArray received non-array data:', data);
    return [];
  }
  return data.map(serializePrismaData);
}
