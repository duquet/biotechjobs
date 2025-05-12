export interface Company {
  id?: number;
  companyName: string;
  website: string;
  jobDescriptionUrl: string;
  jobDescriptionText: string;
  contactDate: string;
  city: string;
  state: string;
  zip: string;
  companyProducts: string;
  companyDescription: string;
  companySize: string;
  companyType: string;
  industry: string;
  foundedYear: string;
  headquarters: string;
  contactEmail: string;
  contactPhone: string;
  applicationStatus: string;
  notes: string;
  [key: string]: string | number | undefined;
}
