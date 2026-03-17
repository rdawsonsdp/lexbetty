import { qbApiCall } from './client';
import { QBCustomer } from './types';

/**
 * Find an existing QB customer by email, or create a new one.
 */
export async function findOrCreateCustomer(info: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}): Promise<string> {
  // Search for existing customer by email
  const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${info.email.replace(/'/g, "\\'")}'`;
  const searchResult = await qbApiCall('GET', `query?query=${encodeURIComponent(query)}`) as {
    QueryResponse: { Customer?: QBCustomer[] };
  };

  if (searchResult.QueryResponse.Customer && searchResult.QueryResponse.Customer.length > 0) {
    return searchResult.QueryResponse.Customer[0].Id;
  }

  // Create new customer
  const customerData: Record<string, unknown> = {
    DisplayName: info.company
      ? `${info.name} (${info.company})`
      : `${info.name} - ${info.email}`,
    PrimaryEmailAddr: { Address: info.email },
    GivenName: info.name.split(' ')[0],
    FamilyName: info.name.split(' ').slice(1).join(' ') || info.name.split(' ')[0],
  };

  if (info.phone) {
    customerData.PrimaryPhone = { FreeFormNumber: info.phone };
  }
  if (info.company) {
    customerData.CompanyName = info.company;
  }

  const result = await qbApiCall('POST', 'customer', customerData) as {
    Customer: QBCustomer;
  };

  return result.Customer.Id;
}
