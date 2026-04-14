export type AgencyService = {
  id: string
  title: string
  description: string
  requiredDocuments: string[]
}

export type AgencyData = {
  id: string
  short: string
  name: string
  logoUrl: string
  description: string
  email: string
  contact: string
  locationQuery: string
  services: AgencyService[]
}

export const AGENCIES_DATA: AgencyData[] = [
  {
    id: 'dmw',
    short: 'DMW',
    name: 'Department of Migrant Workers',
    logoUrl: 'https://dmw.gov.ph/images/dmw_logo.png',
    description:
      'The executive department of the Philippine government responsible for the protection of the rights and promote the welfare of Overseas Filipino Workers (OFWs) and their families.',
    email: 'info@dmw.gov.ph',
    contact: '1348 (Hotline)',
    locationQuery: 'Department of Migrant Workers Regional Office VII, Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'oec',
        title: 'Overseas Employment Certificate (OEC)',
        description:
          'A document required for all departing OFWs serving as proof that they were processed by the DMW.',
        requiredDocuments: ['Valid Passport', 'Valid Work Visa/Permit', 'Employment Contract', 'Sworn Statement'],
      },
      {
        id: 'repatriation',
        title: 'Repatriation Assistance',
        description: 'Help provided to distressed OFWs by bringing them back to the Philippines.',
        requiredDocuments: ['Passport / Travel Document', 'Request Form', 'Proof of Identity/Employment'],
      },
    ],
  },
  {
    id: 'owwa',
    short: 'OWWA',
    name: 'Overseas Workers Welfare Administration',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/c/c8/Overseas_Workers_Welfare_Administration_%28OWWA%29_-_Philippines.svg',
    description: 'An attached agency of the DMW that protects and promotes the welfare of OFWs and their dependents.',
    email: 'support@owwa.gov.ph',
    contact: '1348 (OpCen)',
    locationQuery: 'OWWA Regional Welfare Office VII, Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'edsp',
        title: 'Education for Development Scholarship Program (EDSP)',
        description: 'A scholarship grant offered to qualified dependents of active OWWA members.',
        requiredDocuments: ['Proof of OWWA Membership', 'Proof of Relationship to Member', 'School Registration', 'Grades/TOR'],
      },
      {
        id: 'calamity',
        title: 'Calamity Assistance',
        description: 'Financial assistance to OWWA members affected by natural/man-made disasters.',
        requiredDocuments: ['Valid ID', 'Proof of affected residence (Barangay Cert)', 'Claim application form'],
      },
      {
        id: 'repatriation-services',
        title: 'Repatriation Services',
        description:
          'Provides coordinated support for returning OFWs including case intake, referrals, and reintegration linkage.',
        requiredDocuments: ['Valid ID', 'Travel Document or Passport', 'Case Referral Form'],
      },
      {
        id: 'legal-assistance',
        title: 'Legal Assistance',
        description: 'Offers legal guidance and referral support for labor, employment, and welfare-related concerns of OFWs.',
        requiredDocuments: ['Valid ID', 'Complaint or Incident Narrative', 'Supporting Legal Documents'],
      },
      {
        id: 'medical-assistance',
        title: 'Medical Assistance',
        description: 'Extends medical aid support for qualified clients through referrals and documentary evaluation.',
        requiredDocuments: ['Medical Certificate', 'Valid ID', 'Billing or Cost Estimate'],
      },
      {
        id: 'financial-relief',
        title: 'Financial Relief',
        description: 'Provides emergency financial support for eligible OFWs and dependents facing urgent needs.',
        requiredDocuments: ['Valid ID', 'Proof of Need', 'Case Assessment Form'],
      },
      {
        id: 'livelihood-support',
        title: 'Livelihood Support',
        description:
          'Supports returning OFWs through livelihood assistance and program matching for sustainable income.',
        requiredDocuments: ['Valid ID', 'Livelihood Plan', 'Barangay Certification'],
      },
      {
        id: 'reintegration-seminar',
        title: 'Reintegration Seminar',
        description:
          'Provides orientation and post-arrival guidance for OFWs transitioning back to local communities.',
        requiredDocuments: ['Valid ID', 'Attendance Registration Form'],
      },
    ],
  },
  {
    id: 'doh',
    short: 'DOH',
    name: 'Department of Health',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/DOH_PH_new_logo.svg',
    description:
      'The principal health agency in the Philippines. It ensures access to basic public health services to all Filipinos.',
    email: 'callcenter@doh.gov.ph',
    contact: '(02) 8651-7800',
    locationQuery: 'Department of Health Center for Health Development Central Visayas, Cebu City, Philippines',
    services: [
      {
        id: 'medical',
        title: 'Medical Assistance Program',
        description: 'Provides health and medical assistance to indigent and financially incapacitated patients.',
        requiredDocuments: ['Medical Certificate/Abstract', 'Prescription', 'Barangay Indigency', 'Valid ID'],
      },
    ],
  },
  {
    id: 'dole',
    short: 'DOLE',
    name: 'Department of Labor and Employment',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Department_of_Labor_and_Employment_%28DOLE%29.svg',
    description:
      'The national government agency mandated to formulate policies, implement programs and serve as the policy-coordinating arm of the Executive Branch in the field of labor and employment.',
    email: 'hotline1349@dole.gov.ph',
    contact: '1349 (DOLE Hotline)',
    locationQuery: 'Department of Labor and Employment Regional Office VII, Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'tupad',
        title: 'TUPAD Program',
        description:
          'A community-based package of assistance that provides emergency employment for displaced workers, underemployed and seasonal workers.',
        requiredDocuments: ['Barangay Certificate of Indigency', "Valid ID/Voter's ID", '2x2 ID Picture'],
      },
    ],
  },
  {
    id: 'dswd',
    short: 'DSWD',
    name: 'Department of Social Welfare and Development',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Seal_of_the_Department_of_Social_Welfare_and_Development.svg/1280px-Seal_of_the_Department_of_Social_Welfare_and_Development.svg.png',
    description:
      'The primary government agency mandated to develop, implement and coordinate social protection and poverty-reduction solutions for and with the poor, vulnerable and disadvantaged.',
    email: 'inquiry@dswd.gov.ph',
    contact: '(02) 8931-8101',
    locationQuery: 'Department of Social Welfare and Development Field Office VII, Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'aics',
        title: 'Assistance to Individuals in Crisis Situation (AICS)',
        description:
          'Provision of medical, burial, transportation, education, food, or financial assistance to individuals in crisis.',
        requiredDocuments: [
          'Barangay Certificate of Indigency',
          'Valid ID',
          'Medical Certificate (for medical)',
          'Death Certificate (for burial)',
        ],
      },
    ],
  },
  {
    id: 'tesda',
    short: 'TESDA',
    name: 'Technical Education and Skills Development Authority',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm8B1p66Z7vHm5UGtzegHjnts2VStAt3Rb7A&s',
    description:
      'The government agency tasked to manage and supervise technical education and skills development in the Philippines.',
    email: 'contactcenter@tesda.gov.ph',
    contact: '(02) 8887-7777',
    locationQuery: 'TESDA Regional Office VII, Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'nc',
        title: 'National Certification (Assessment)',
        description:
          'Provides certification for individuals who have acquired technical skills through formal or informal learning.',
        requiredDocuments: [
          'Duly accomplished Application Form',
          'Passport size ID picture',
          'Certificate of Completion (if formal training)',
        ],
      },
      {
        id: 'training',
        title: 'Skills Training for Returning OFWs',
        description: 'Re-tooling and up-skilling programs for repatriated or returning overseas workers.',
        requiredDocuments: ['Proof of repatriation/return', 'Valid ID', 'Barangay Clearance'],
      },
    ],
  },
]
