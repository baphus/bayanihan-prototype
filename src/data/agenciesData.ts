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
  {
    id: 'law-center-inc',
    short: 'LCI',
    name: 'Law Center Inc.',
    logoUrl:
      'https://scontent.fmnl17-3.fna.fbcdn.net/v/t39.30808-6/413828932_753218590185204_121817884749243877_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeG4d-FHCG5FkkFNaXkEbsCC2ylW9wL31hDbKVb3AvfWEN64cWvf_anFGC_Vox-GOeCQFyFvU1GKKTx8tewmdRaQ&_nc_ohc=wH77THYVjEAQ7kNvwEKnKsQ&_nc_oc=AdoIoxVXPxZR-iEBEuh5CcoEEJMeGoYpNFssYe6qlxxNBeZZJEgZmqN0uCavquH-6Ro&_nc_zt=23&_nc_ht=scontent.fmnl17-3.fna&_nc_gid=ystlRfRE6icx7c_mKish2A&_nc_ss=7a3a8&oh=00_Af33mETElhBpCTpeSWoqoajibD7eUsXm4q01AMitkb9kdQ&oe=69E5D45B',
    description:
      'A legal aid and advocacy partner that provides legal counseling, documentation support, and case referrals for vulnerable clients.',
    email: 'helpdesk@lawcenterinc.org',
    contact: '(032) 555-1020',
    locationQuery: 'Law Center Inc., Cebu City, Central Visayas, Philippines',
    services: [
      {
        id: 'legal-counseling',
        title: 'Legal Counseling and Case Intake',
        description:
          'Provides initial legal counseling, case assessment, and appropriate referral to partner agencies or legal practitioners.',
        requiredDocuments: ['Valid ID', 'Case Narrative or Incident Report', 'Supporting Documents/Evidence'],
      },
      {
        id: 'document-assistance',
        title: 'Affidavit and Document Assistance',
        description:
          'Assists clients in preparing affidavits, complaint letters, and other legal documents needed for filing or referrals.',
        requiredDocuments: ['Valid ID', 'Draft Statement or Incident Details', 'Related Certificates or Records'],
      },
    ],
  },
  {
    id: 'province-cebu',
    short: 'CEBU',
    name: 'Province of Cebu',
    logoUrl: 'https://cebuprovince.org/wp-content/uploads/2025/08/LOGO-13.png',
    description:
      'Provincial government unit providing social welfare, local referrals, and certification support for residents and returning OFWs.',
    email: 'socialservices@cebu.gov.ph',
    contact: '(032) 401-1000',
    locationQuery: 'Cebu Provincial Capitol, Cebu City, Cebu, Philippines',
    services: [
      {
        id: 'cebu-social-assistance',
        title: 'Provincial Social Assistance and Referral',
        description:
          'Coordinates social welfare assessment and referrals to national and regional partner agencies.',
        requiredDocuments: ['Valid ID', 'Barangay Certificate', 'Case Assessment Form'],
      },
      {
        id: 'cebu-local-certification',
        title: 'Provincial Certification and Endorsement',
        description:
          'Issues provincial endorsements and supporting documents for aid and case processing.',
        requiredDocuments: ['Proof of Residency', 'Valid ID', 'Barangay Clearance'],
      },
    ],
  },
  {
    id: 'province-siquijor',
    short: 'SIQ',
    name: 'Province of Siquijor',
    logoUrl: 'https://siquijorprovince.com/wp-content/uploads/2021/01/siquijor.png',
    description:
      'Provincial government partner delivering frontline social assistance and community-based case referrals.',
    email: 'socialservices@siquijor.gov.ph',
    contact: '(035) 480-9001',
    locationQuery: 'Siquijor Provincial Capitol, Siquijor, Philippines',
    services: [
      {
        id: 'siquijor-social-assistance',
        title: 'Provincial Social Assistance and Referral',
        description: 'Provides welfare intake, referral support, and coordination with relevant agencies.',
        requiredDocuments: ['Valid ID', 'Barangay Certificate', 'Referral Form'],
      },
      {
        id: 'siquijor-residency-certification',
        title: 'Residency and Indigency Certification Support',
        description: 'Supports residents with documentary requirements for public assistance applications.',
        requiredDocuments: ['Proof of Residency', 'Barangay Clearance', 'Valid ID'],
      },
    ],
  },
  {
    id: 'province-bohol',
    short: 'BOH',
    name: 'Province of Bohol',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Bohol_Seal_1.svg/500px-Bohol_Seal_1.svg.png?_=20180913124110',
    description:
      'Provincial government unit assisting clients through social welfare services, referrals, and documentation support.',
    email: 'socialservices@bohol.gov.ph',
    contact: '(038) 411-0000',
    locationQuery: 'Bohol Provincial Capitol, Tagbilaran City, Bohol, Philippines',
    services: [
      {
        id: 'bohol-social-assistance',
        title: 'Provincial Social Assistance and Referral',
        description: 'Facilitates social assistance intake and endorsement to relevant government services.',
        requiredDocuments: ['Valid ID', 'Barangay Certificate', 'Case Intake Form'],
      },
      {
        id: 'bohol-endorsement',
        title: 'Aid Endorsement and Certification',
        description: 'Issues provincial endorsements used for medical, legal, and livelihood aid requests.',
        requiredDocuments: ['Proof of Residency', 'Valid ID', 'Supporting Records'],
      },
    ],
  },
  {
    id: 'city-cebu',
    short: 'CCG',
    name: 'City of Cebu',
    logoUrl: 'https://www.cebucity.gov.ph/wp-content/uploads/2019/09/official_seal_of_cebu_city_small.png',
    description:
      'City government partner offering urban social welfare services, local referrals, and document issuance for residents.',
    email: 'citysocialwelfare@cebucity.gov.ph',
    contact: '(032) 255-0100',
    locationQuery: 'Cebu City Hall, Cebu City, Cebu, Philippines',
    services: [
      {
        id: 'cebu-city-social-assistance',
        title: 'City Social Assistance and Referral',
        description: 'Handles city-level social case intake and connects clients to partner programs.',
        requiredDocuments: ['Valid ID', 'Barangay Certificate', 'Case Assessment Form'],
      },
      {
        id: 'cebu-city-certification',
        title: 'City Certification and Endorsement',
        description: 'Provides local certifications and endorsements for aid and case processing requirements.',
        requiredDocuments: ['Proof of Residency', 'Barangay Clearance', 'Valid ID'],
      },
    ],
  },
  {
    id: 'lungsod-ng-mandaue',
    short: 'MND',
    name: 'Lungsod ng Mandaue',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSDsCJoKXvkkRN2Ib-AFeTtiGgG4hCEyEhjwA&s',
    description:
      'Mandaue city government partner providing frontline assistance, referrals, and local documentary support services.',
    email: 'cswdo@mandauecity.gov.ph',
    contact: '(032) 520-5000',
    locationQuery: 'Mandaue City Hall, Mandaue City, Cebu, Philippines',
    services: [
      {
        id: 'mandaue-social-assistance',
        title: 'City Social Assistance and Referral',
        description: 'Provides city-level social welfare assessment, intake, and referral coordination.',
        requiredDocuments: ['Valid ID', 'Barangay Certificate', 'Case Referral Form'],
      },
      {
        id: 'mandaue-certification',
        title: 'Residency and Indigency Documentation',
        description: 'Supports clients with residency and indigency documents required for government aid.',
        requiredDocuments: ['Proof of Residency', 'Barangay Clearance', 'Valid ID'],
      },
    ],
  },
]
