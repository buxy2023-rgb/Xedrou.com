const COMPANY_TEMPLATE_VERSION = '1.0.0';

export function buildCompanySpecification({ name, industry, description, domain, features = [] }) {
  const slug = String(name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  if (!slug) throw new Error('Company name is required');
  return {
    templateVersion: COMPANY_TEMPLATE_VERSION,
    company: { name: String(name).trim(), slug, industry: String(industry || '').trim(), description: String(description || '').trim(), domain: String(domain || `${slug}.com`).trim() },
    modules: {
      publicWebsite: true,
      customerPortal: true,
      staffPortal: true,
      customerService: true,
      accounting: true,
      developerWorkspace: true,
      companyAI: true,
    },
    requestedFeatures: features.map(String),
    lifecycle: 'draft',
  };
}

export function buildInitialSitePages(spec) {
  const title = spec.company.name;
  return [
    { slug: 'home', title, pageType: 'landing', status: 'draft' },
    { slug: 'about', title: `About ${title}`, pageType: 'content', status: 'draft' },
    { slug: 'contact', title: `Contact ${title}`, pageType: 'contact', status: 'draft' },
  ];
}

export function buildInitialRoles() {
  return ['developer', 'accountant', 'customer_service', 'staff'];
}
