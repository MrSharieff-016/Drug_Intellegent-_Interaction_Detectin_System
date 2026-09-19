export interface KnowledgeFeed {
  id: string;
  name: string;
  category: 'Space & Climate' | 'Global Health' | 'Cybersecurity' | 'Open Government Data' | 'Academic & Research' | 'Culture & Tech';
  description: string;
  url: string;
  status: 'online' | 'synced' | 'active';
  coverage: string;
  updateFrequency: string;
}

export const GLOBAL_KNOWLEDGE_FEEDS: KnowledgeFeed[] = [
  // 1-4: Space & Earth Sciences
  {
    id: 'nasa-rss',
    name: 'NASA RSS News Feed',
    category: 'Space & Climate',
    description: 'Aeronautics, space exploration, mission breakthroughs, and life science updates.',
    url: 'https://www.nasa.gov/rss-feeds/',
    status: 'online',
    coverage: 'Global Space Sciences',
    updateFrequency: 'Realtime'
  },
  {
    id: 'nasa-open-data',
    name: 'NASA Open Data Portal',
    category: 'Space & Climate',
    description: 'Space biological science, extreme environment physiology, and earth satellite datasets.',
    url: 'https://data.nasa.gov/',
    status: 'online',
    coverage: 'Planetary & Microgravity Datasets',
    updateFrequency: 'Daily'
  },
  {
    id: 'usgs-earthquake',
    name: 'USGS Real-time Feeds',
    category: 'Space & Climate',
    description: 'Seismic activity feeds and environmental disaster response telemetry.',
    url: 'https://earthquake.usgs.gov/earthquakes/feed/',
    status: 'online',
    coverage: 'Worldwide Seismology',
    updateFrequency: 'Continuous'
  },
  {
    id: 'noaa-data',
    name: 'NOAA Climate & Atmospheric Data',
    category: 'Space & Climate',
    description: 'Meteorological patterns, atmospheric pressure, and oceanic temperature models.',
    url: 'https://www.noaa.gov/data',
    status: 'online',
    coverage: 'Atmospheric Sciences',
    updateFrequency: 'Hourly'
  },

  // 5-8: Public Health & Vulnerability
  {
    id: 'un-news',
    name: 'UN News Global Feed',
    category: 'Global Health',
    description: 'United Nations humanitarian dispatches, global treaty updates, and relief operations.',
    url: 'https://news.un.org/en/rss',
    status: 'online',
    coverage: 'International Affairs',
    updateFrequency: 'Realtime'
  },
  {
    id: 'who-data',
    name: 'WHO Global Health Observatory',
    category: 'Global Health',
    description: 'World Health Organization disease surveillance, mortality metrics, and pandemic monitoring.',
    url: 'https://data.who.int/',
    status: 'online',
    coverage: 'Global Epidemiology',
    updateFrequency: 'Weekly'
  },
  {
    id: 'cisa-alerts',
    name: 'CISA Cybersecurity Advisories',
    category: 'Cybersecurity',
    description: 'Critical infrastructure vulnerabilities, medical device ICS advisories, and cyber defense.',
    url: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    status: 'online',
    coverage: 'Cyber Threat Intelligence',
    updateFrequency: 'Realtime'
  },
  {
    id: 'nvd-cve',
    name: 'NVD CVE Vulnerability Feeds',
    category: 'Cybersecurity',
    description: 'National Institute of Standards & Technology CVE database feeds and software exploits.',
    url: 'https://nvd.nist.gov/vuln/data-feeds',
    status: 'online',
    coverage: 'NIST Standards & CVEs',
    updateFrequency: 'Hourly'
  },

  // 9-14: Open Government & Economic Data
  {
    id: 'data-gov',
    name: 'Data.gov (United States)',
    category: 'Open Government Data',
    description: 'US Federal repository of over 300,000 public datasets across FDA, HHS, CDC, and EPA.',
    url: 'https://data.gov/',
    status: 'online',
    coverage: 'US Federal Data',
    updateFrequency: 'Daily'
  },
  {
    id: 'data-europa',
    name: 'data.europa.eu',
    category: 'Open Government Data',
    description: 'Official portal for European data from EU institutions, agencies, and member states.',
    url: 'https://data.europa.eu/',
    status: 'online',
    coverage: 'European Union Datasets',
    updateFrequency: 'Daily'
  },
  {
    id: 'world-bank',
    name: 'World Bank Open Data',
    category: 'Open Government Data',
    description: 'Global economic indicators, health expenditure, healthcare infrastructure metrics.',
    url: 'https://data.worldbank.org/',
    status: 'online',
    coverage: 'Global Macroeconomics & Health',
    updateFrequency: 'Monthly'
  },
  {
    id: 'eurostat',
    name: 'Eurostat Statistical Portal',
    category: 'Open Government Data',
    description: 'European Commission statistical office providing high-quality statistics for Europe.',
    url: 'https://ec.europa.eu/eurostat/',
    status: 'online',
    coverage: 'Pan-European Statistics',
    updateFrequency: 'Bi-weekly'
  },
  {
    id: 'india-ogd',
    name: 'India Open Government Data (data.gov.in)',
    category: 'Open Government Data',
    description: 'National portal facilitating access to government-owned shareable data across Indian ministries.',
    url: 'https://www.data.gov.in/',
    status: 'online',
    coverage: 'Government of India Ministries',
    updateFrequency: 'Weekly'
  },
  {
    id: 'our-world-in-data',
    name: 'Our World in Data',
    category: 'Open Government Data',
    description: 'Empirical research and data on global health challenges, disease burdens, and life expectancy.',
    url: 'https://ourworldindata.org/',
    status: 'online',
    coverage: 'Global Health Trends',
    updateFrequency: 'Continuous'
  },

  // 15-18: Environmental, Climate & Health Indices
  {
    id: 'openaq',
    name: 'OpenAQ Real-time Air Quality',
    category: 'Space & Climate',
    description: 'Universal platform aggregating global real-time PM2.5, NO2, SO2, and ozone sensor data.',
    url: 'https://openaq.org/',
    status: 'online',
    coverage: 'Global Air Quality Telemetry',
    updateFrequency: 'Realtime'
  },
  {
    id: 'open-meteo',
    name: 'Open-Meteo Weather API',
    category: 'Space & Climate',
    description: 'Open-source weather API providing high-resolution meteorological and solar data.',
    url: 'https://open-meteo.com/',
    status: 'online',
    coverage: 'Global Micro-forecasts',
    updateFrequency: 'Hourly'
  },
  {
    id: 'who-gho',
    name: 'WHO Global Health Observatory Data Repository',
    category: 'Global Health',
    description: 'Global health statistics, essential medicine accessibility indicators, and clinical guidelines.',
    url: 'https://www.who.int/data/gho',
    status: 'online',
    coverage: 'WHO Health Systems',
    updateFrequency: 'Monthly'
  },

  // 18-22: Biomedical & Academic Research
  {
    id: 'arxiv',
    name: 'arXiv Open Access Preprints',
    category: 'Academic & Research',
    description: 'Open archive of scholarly articles in computer science, quantitative biology, and AI.',
    url: 'https://arxiv.org/',
    status: 'online',
    coverage: 'Peer preprints in AI & Q-Bio',
    updateFrequency: 'Daily'
  },
  {
    id: 'pubmed',
    name: 'PubMed / PMC (National Library of Medicine)',
    category: 'Academic & Research',
    description: 'Biomedical and life sciences literature database indexed by MEDLINE with 36M+ citations.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/',
    status: 'online',
    coverage: 'Biomedical & Clinical Trials',
    updateFrequency: 'Continuous'
  },
  {
    id: 'crossref',
    name: 'Crossref Metadata API',
    category: 'Academic & Research',
    description: 'Digital Object Identifier (DOI) registration agency linking global academic publications.',
    url: 'https://www.crossref.org/',
    status: 'online',
    coverage: 'Scholarly Publication DOIs',
    updateFrequency: 'Continuous'
  },
  {
    id: 'openalex',
    name: 'OpenAlex Open Bibliographic Catalog',
    category: 'Academic & Research',
    description: 'Open index of 250M+ scientific works, authors, institutions, and clinical research citations.',
    url: 'https://openalex.org/',
    status: 'online',
    coverage: 'Global Scientific Knowledge Graph',
    updateFrequency: 'Daily'
  },

  // 22-26: Semantic Knowledge, Maps & Geospatial
  {
    id: 'osm',
    name: 'OpenStreetMap (OSM)',
    category: 'Culture & Tech',
    description: 'Crowdsourced global map database containing clinics, hospitals, pharmacies, and geographic data.',
    url: 'https://www.openstreetmap.org/',
    status: 'online',
    coverage: 'Global Healthcare POIs & Maps',
    updateFrequency: 'Continuous'
  },
  {
    id: 'wikidata',
    name: 'Wikidata Semantic Knowledge Base',
    category: 'Culture & Tech',
    description: 'Free and open linked database acting as central storage for structured knowledge (RxNorm, ChEBI, ATC).',
    url: 'https://www.wikidata.org/',
    status: 'online',
    coverage: 'Structured Pharmacological Ontology',
    updateFrequency: 'Continuous'
  },
  {
    id: 'wikimedia',
    name: 'Wikimedia Commons & REST APIs',
    category: 'Culture & Tech',
    description: 'Public domain educational media, chemical molecular diagrams, and biological infographics.',
    url: 'https://commons.wikimedia.org/',
    status: 'online',
    coverage: 'Open Educational Media',
    updateFrequency: 'Continuous'
  },
  {
    id: 'loc',
    name: 'Library of Congress Open Collections',
    category: 'Culture & Tech',
    description: 'Historical medical manuscripts, pharmacopeia archives, and national bibliographic records.',
    url: 'https://www.loc.gov/',
    status: 'online',
    coverage: 'Historical Pharmacopeias',
    updateFrequency: 'Weekly'
  },

  // 26-30: Cultural & Developer Intelligence
  {
    id: 'smithsonian',
    name: 'Smithsonian Open Access',
    category: 'Culture & Tech',
    description: 'Millions of 2D and 3D digital items from museums, research centers, and botanical archives.',
    url: 'https://www.si.edu/openaccess',
    status: 'online',
    coverage: 'Scientific Specimens & Botanical Collections',
    updateFrequency: 'Monthly'
  },
  {
    id: 'the-met',
    name: 'The Metropolitan Museum Open Access',
    category: 'Culture & Tech',
    description: 'Images and data of artworks in public domain, documenting historical medicine and apothecaries.',
    url: 'https://www.metmuseum.org/about-the-met/policies-and-documents/open-access',
    status: 'online',
    coverage: 'Apothecary Artifacts & Illustrations',
    updateFrequency: 'Monthly'
  },
  {
    id: 'hackernews-api',
    name: 'Hacker News Official Firebase API',
    category: 'Culture & Tech',
    description: 'Real-time discussions and developments in computational biology, medicine, and technology.',
    url: 'https://github.com/HackerNews/API',
    status: 'online',
    coverage: 'HealthTech & AI Innovations',
    updateFrequency: 'Realtime'
  },
  {
    id: 'github-events',
    name: 'GitHub Public Events Archive',
    category: 'Culture & Tech',
    description: 'Open source biomedical software, machine learning model releases, and algorithmic repos.',
    url: 'https://api.github.com/events',
    status: 'online',
    coverage: 'Open Source BioTech Repos',
    updateFrequency: 'Continuous'
  },
  {
    id: 'stackexchange-api',
    name: 'Stack Exchange / MedicalSciences API',
    category: 'Culture & Tech',
    description: 'Curated peer-reviewed Q&A on pharmacology, biochemistry, and physiological mechanisms.',
    url: 'https://api.stackexchange.com/',
    status: 'online',
    coverage: 'Biochemical & Pharmacology Discussions',
    updateFrequency: 'Daily'
  }
];
