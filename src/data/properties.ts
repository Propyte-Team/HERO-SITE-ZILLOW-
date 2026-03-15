import { Property } from '@/types/property';

const IMG = {
  house1: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop',
  house2: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=450&fit=crop',
  luxury1: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=450&fit=crop',
  modern1: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=450&fit=crop',
  interior1: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=450&fit=crop',
  interior2: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=450&fit=crop',
  aerial1: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=450&fit=crop',
  resort1: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=450&fit=crop',
  resort2: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=450&fit=crop',
  bedroom1: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=450&fit=crop',
};

export const properties: Property[] = [
  // 1. Nativa Tulum — Departamento Tipo A
  {
    id: 'prop-001',
    slug: 'nativa-tulum-tipo-a',
    name: 'Nativa Tulum — Departamento Tipo A',
    developer: 'Grupo Nativa',
    location: {
      city: 'Tulum',
      zone: 'Centro',
      state: 'Quintana Roo',
      lat: 20.2114,
      lng: -87.4654,
      address: 'Tulum Centro, Quintana Roo',
    },
    price: { mxn: 2_800_000, currency: 'MXN' },
    specs: { bedrooms: 1, bathrooms: 1, area: 45, type: 'departamento' },
    stage: 'preventa',
    usage: ['vacacional', 'renta'],
    amenities: ['Alberca', 'Rooftop', 'Yoga Deck', 'Bicicletas', 'Seguridad 24/7'],
    images: [IMG.house1, IMG.interior1, IMG.resort2, IMG.aerial1],
    roi: { projected: 12, rentalMonthly: 18_000, appreciation: 10 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24], interestRate: 0 },
    description: {
      es: 'Departamento de 45 m² en el corazón de Tulum con acabados premium y acceso a amenidades de primer nivel. Ideal para inversión vacacional con un retorno proyectado del 12% anual y renta mensual estimada de $18,000 MXN.',
      en: 'A 45 sqm apartment in the heart of Tulum featuring premium finishes and access to top-tier amenities. Ideal for vacation investment with a projected 12% annual return and an estimated monthly rental of $18,000 MXN.',
    },
    badge: 'preventa',
    featured: true,
    createdAt: '2025-06-15T10:00:00Z',
  },

  // 2. Nativa Tulum — Departamento Tipo B
  {
    id: 'prop-002',
    slug: 'nativa-tulum-tipo-b',
    name: 'Nativa Tulum — Departamento Tipo B',
    developer: 'Grupo Nativa',
    location: {
      city: 'Tulum',
      zone: 'Centro',
      state: 'Quintana Roo',
      lat: 20.2130,
      lng: -87.4640,
      address: 'Tulum Centro, Quintana Roo',
    },
    price: { mxn: 4_130_844, currency: 'MXN' },
    specs: { bedrooms: 2, bathrooms: 2, area: 85, type: 'departamento' },
    stage: 'preventa',
    usage: ['residencial', 'vacacional', 'renta'],
    amenities: ['Alberca', 'Rooftop', 'Gym', 'Coworking', 'Seguridad 24/7'],
    images: [IMG.house2, IMG.interior2, IMG.resort1, IMG.bedroom1, IMG.aerial1],
    roi: { projected: 11, rentalMonthly: 28_000, appreciation: 9 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24, 36], interestRate: 0 },
    description: {
      es: 'Departamento de 85 m² con 2 recámaras en desarrollo Nativa Tulum, diseñado para uso residencial y vacacional. Ofrece un ROI proyectado del 11% anual con financiamiento a 0% de interés y renta mensual estimada de $28,000 MXN.',
      en: 'An 85 sqm two-bedroom apartment in the Nativa Tulum development, designed for residential and vacation use. Offers a projected 11% annual ROI with 0% interest financing and an estimated monthly rental of $28,000 MXN.',
    },
    badge: 'preventa',
    featured: true,
    createdAt: '2025-06-20T12:00:00Z',
  },

  // 3. Nativa Tulum — Penthouse
  {
    id: 'prop-003',
    slug: 'nativa-tulum-penthouse',
    name: 'Nativa Tulum — Penthouse',
    developer: 'Grupo Nativa',
    location: {
      city: 'Tulum',
      zone: 'Centro',
      state: 'Quintana Roo',
      lat: 20.2120,
      lng: -87.4648,
      address: 'Tulum Centro, Quintana Roo',
    },
    price: { mxn: 6_500_000, currency: 'MXN' },
    specs: { bedrooms: 2, bathrooms: 2, area: 120, type: 'penthouse' },
    stage: 'preventa',
    usage: ['residencial', 'vacacional', 'renta'],
    amenities: ['Alberca privada', 'Rooftop', 'Gym', 'Coworking', 'Concierge', 'Seguridad 24/7'],
    images: [IMG.luxury1, IMG.modern1, IMG.interior1, IMG.resort2, IMG.aerial1],
    roi: { projected: 13, rentalMonthly: 45_000, appreciation: 11 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24, 36], interestRate: 0 },
    description: {
      es: 'Penthouse de 120 m² con alberca privada en el exclusivo desarrollo Nativa Tulum. Con un ROI proyectado del 13% y una apreciación del 11% anual, representa una de las oportunidades de inversión más sólidas en la Riviera Maya.',
      en: 'A 120 sqm penthouse with a private pool in the exclusive Nativa Tulum development. With a projected 13% ROI and 11% annual appreciation, it represents one of the strongest investment opportunities in the Riviera Maya.',
    },
    badge: 'preventa',
    featured: true,
    createdAt: '2025-07-01T09:00:00Z',
  },

  // 4. Macrolote Tulum Norte
  {
    id: 'prop-004',
    slug: 'macrolote-tulum-norte',
    name: 'Macrolote Tulum Norte',
    developer: 'Tierras del Mayab',
    location: {
      city: 'Tulum',
      zone: 'Norte',
      state: 'Quintana Roo',
      lat: 20.2280,
      lng: -87.4410,
      address: 'Tulum Norte, Quintana Roo',
    },
    price: { mxn: 3_750_000, currency: 'MXN' },
    specs: { bedrooms: 0, bathrooms: 0, area: 500, type: 'terreno' },
    stage: 'entrega_inmediata',
    usage: ['residencial', 'mixto'],
    amenities: ['Acceso pavimentado', 'Electricidad', 'Agua'],
    images: [IMG.aerial1, IMG.resort2, IMG.house1, IMG.resort1],
    roi: { projected: 0, rentalMonthly: 0, appreciation: 15 },
    financing: { downPaymentMin: 50, months: [6, 12], interestRate: 0 },
    description: {
      es: 'Macrolote de 500 m² con servicios básicos instalados en la zona norte de Tulum, con entrega inmediata. Apreciación proyectada del 15% anual en una de las zonas de mayor crecimiento de la Riviera Maya.',
      en: 'A 500 sqm land plot with basic utilities installed in the northern zone of Tulum, available for immediate delivery. Projected 15% annual appreciation in one of the fastest-growing areas of the Riviera Maya.',
    },
    badge: 'entrega_inmediata',
    featured: false,
    createdAt: '2025-08-10T14:00:00Z',
  },

  // 5. Macrolote Tulum Sur
  {
    id: 'prop-005',
    slug: 'macrolote-tulum-sur',
    name: 'Macrolote Tulum Sur',
    developer: 'Tierras del Mayab',
    location: {
      city: 'Tulum',
      zone: 'Sur',
      state: 'Quintana Roo',
      lat: 20.1990,
      lng: -87.4700,
      address: 'Tulum Sur, Quintana Roo',
    },
    price: { mxn: 8_400_000, currency: 'MXN' },
    specs: { bedrooms: 0, bathrooms: 0, area: 1200, type: 'terreno' },
    stage: 'entrega_inmediata',
    usage: ['residencial', 'mixto'],
    amenities: ['Acceso pavimentado', 'Electricidad', 'Cenote cercano'],
    images: [IMG.resort2, IMG.aerial1, IMG.resort1, IMG.house2],
    roi: { projected: 0, rentalMonthly: 0, appreciation: 14 },
    financing: { downPaymentMin: 50, months: [6, 12], interestRate: 0 },
    description: {
      es: 'Macrolote de 1,200 m² en la zona sur de Tulum con cenote cercano y servicios instalados. Con una apreciación proyectada del 14% anual, es una oportunidad ideal para desarrollo residencial o de uso mixto.',
      en: 'A 1,200 sqm land plot in southern Tulum near a cenote with utilities installed. With a projected 14% annual appreciation, it is an ideal opportunity for residential or mixed-use development.',
    },
    badge: 'entrega_inmediata',
    featured: false,
    createdAt: '2025-08-15T11:00:00Z',
  },

  // 6. Desarrollo Corazón PDC — Studio
  {
    id: 'prop-006',
    slug: 'corazon-pdc-studio',
    name: 'Desarrollo Corazón PDC — Studio',
    developer: 'Inmobiliaria Corazón',
    location: {
      city: 'Playa del Carmen',
      zone: '5ta Avenida',
      state: 'Quintana Roo',
      lat: 20.6296,
      lng: -87.0739,
      address: '5ta Avenida, Playa del Carmen, Quintana Roo',
    },
    price: { mxn: 2_200_000, currency: 'MXN' },
    specs: { bedrooms: 1, bathrooms: 1, area: 38, type: 'departamento' },
    stage: 'construccion',
    usage: ['vacacional', 'renta'],
    amenities: ['Alberca', 'Rooftop Bar', 'Gym', 'Lobby', 'Seguridad 24/7'],
    images: [IMG.modern1, IMG.interior2, IMG.resort1, IMG.bedroom1, IMG.house1],
    roi: { projected: 10, rentalMonthly: 15_000, appreciation: 8 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24], interestRate: 0 },
    description: {
      es: 'Studio de 38 m² sobre la 5ta Avenida de Playa del Carmen con rooftop bar y amenidades de hospitalidad. Ofrece un ROI proyectado del 10% y una ubicación privilegiada para renta vacacional de corto plazo.',
      en: 'A 38 sqm studio on Playa del Carmen\'s 5th Avenue with a rooftop bar and hospitality-grade amenities. Offers a projected 10% ROI and a prime location for short-term vacation rental.',
    },
    badge: 'nuevo',
    featured: true,
    createdAt: '2025-09-01T08:00:00Z',
  },

  // 7. Desarrollo Corazón PDC — 2BR
  {
    id: 'prop-007',
    slug: 'corazon-pdc-2br',
    name: 'Desarrollo Corazón PDC — 2BR',
    developer: 'Inmobiliaria Corazón',
    location: {
      city: 'Playa del Carmen',
      zone: 'Centro',
      state: 'Quintana Roo',
      lat: 20.6310,
      lng: -87.0745,
      address: 'Centro, Playa del Carmen, Quintana Roo',
    },
    price: { mxn: 3_950_000, currency: 'MXN' },
    specs: { bedrooms: 2, bathrooms: 2, area: 75, type: 'departamento' },
    stage: 'construccion',
    usage: ['residencial', 'vacacional', 'renta'],
    amenities: ['Alberca', 'Rooftop Bar', 'Gym', 'Pet-friendly', 'Seguridad 24/7'],
    images: [IMG.house2, IMG.interior1, IMG.bedroom1, IMG.resort2, IMG.modern1],
    roi: { projected: 9, rentalMonthly: 25_000, appreciation: 8 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24, 36], interestRate: 0 },
    description: {
      es: 'Departamento de 75 m² con 2 recámaras en el centro de Playa del Carmen, en etapa de construcción. Con política pet-friendly y un ROI proyectado del 9%, es ideal para residencia permanente o inversión en renta.',
      en: 'A 75 sqm two-bedroom apartment in downtown Playa del Carmen, currently under construction. With a pet-friendly policy and a projected 9% ROI, it is ideal for permanent residence or rental investment.',
    },
    badge: 'nuevo',
    featured: false,
    createdAt: '2025-09-10T15:00:00Z',
  },

  // 8. Aldea Zamá — Departamento
  {
    id: 'prop-008',
    slug: 'aldea-zama-depto',
    name: 'Aldea Zamá — Departamento',
    developer: 'Desarrollos Zamá',
    location: {
      city: 'Tulum',
      zone: 'Zamá',
      state: 'Quintana Roo',
      lat: 20.2150,
      lng: -87.4620,
      address: 'Zamá, Tulum, Quintana Roo',
    },
    price: { mxn: 5_200_000, currency: 'MXN' },
    specs: { bedrooms: 2, bathrooms: 2, area: 90, type: 'departamento' },
    stage: 'preventa',
    usage: ['residencial', 'vacacional', 'renta'],
    amenities: ['Alberca', 'Palapa comunitaria', 'Jardín tropical', 'Bicicletas', 'Seguridad 24/7'],
    images: [IMG.resort1, IMG.house1, IMG.interior2, IMG.aerial1, IMG.bedroom1],
    roi: { projected: 12, rentalMonthly: 35_000, appreciation: 10 },
    financing: { downPaymentMin: 30, months: [6, 12, 18, 24, 36], interestRate: 0 },
    description: {
      es: 'Departamento de 90 m² en la exclusiva zona de Zamá, Tulum, rodeado de jardín tropical y amenidades comunitarias. Con un ROI proyectado del 12% y renta mensual estimada de $35,000 MXN, combina estilo de vida y retorno de inversión.',
      en: 'A 90 sqm apartment in the exclusive Zamá area of Tulum, surrounded by tropical gardens and community amenities. With a projected 12% ROI and an estimated monthly rental of $35,000 MXN, it combines lifestyle and investment returns.',
    },
    badge: 'preventa',
    featured: false,
    createdAt: '2025-10-05T10:00:00Z',
  },

  // 9. Selvática Residences — Casa
  {
    id: 'prop-009',
    slug: 'selvatica-residences-casa',
    name: 'Selvática Residences — Casa',
    developer: 'Selvática Group',
    location: {
      city: 'Playa del Carmen',
      zone: 'Playacar',
      state: 'Quintana Roo',
      lat: 20.6100,
      lng: -87.0800,
      address: 'Playacar, Playa del Carmen, Quintana Roo',
    },
    price: { mxn: 7_800_000, currency: 'MXN' },
    specs: { bedrooms: 3, bathrooms: 3, area: 150, type: 'casa' },
    stage: 'construccion',
    usage: ['residencial', 'vacacional'],
    amenities: ['Alberca privada', 'Jardín', 'Terraza', 'Pet-friendly', 'Club de playa', 'Seguridad 24/7'],
    images: [IMG.luxury1, IMG.house2, IMG.interior1, IMG.resort2, IMG.bedroom1, IMG.aerial1],
    roi: { projected: 8, rentalMonthly: 40_000, appreciation: 7 },
    financing: { downPaymentMin: 30, months: [12, 18, 24, 36], interestRate: 2 },
    description: {
      es: 'Casa de 150 m² con 3 recámaras y alberca privada en Playacar, una de las comunidades más exclusivas de Playa del Carmen. Incluye acceso a club de playa y financiamiento con tasa del 2%, ideal para familias que buscan residencia vacacional.',
      en: 'A 150 sqm three-bedroom home with a private pool in Playacar, one of the most exclusive communities in Playa del Carmen. Includes beach club access and 2% interest financing, ideal for families seeking a vacation residence.',
    },
    badge: null,
    featured: true,
    createdAt: '2025-11-20T13:00:00Z',
  },

  // 10. Arrecifes Luxury — Penthouse
  {
    id: 'prop-010',
    slug: 'arrecifes-luxury-penthouse',
    name: 'Arrecifes Luxury — Penthouse',
    developer: 'Arrecifes Development',
    location: {
      city: 'Playa del Carmen',
      zone: 'Centro',
      state: 'Quintana Roo',
      lat: 20.6250,
      lng: -87.0720,
      address: 'Centro, Playa del Carmen, Quintana Roo',
    },
    price: { mxn: 12_500_000, currency: 'MXN' },
    specs: { bedrooms: 3, bathrooms: 3, area: 180, type: 'penthouse' },
    stage: 'preventa',
    usage: ['residencial', 'vacacional', 'renta'],
    amenities: ['Alberca infinity', 'Rooftop', 'Gym', 'Spa', 'Concierge', 'Vista al mar', 'Seguridad 24/7'],
    images: [IMG.luxury1, IMG.modern1, IMG.interior2, IMG.resort1, IMG.aerial1, IMG.bedroom1],
    roi: { projected: 10, rentalMonthly: 65_000, appreciation: 9 },
    financing: { downPaymentMin: 30, months: [12, 18, 24, 36], interestRate: 0 },
    description: {
      es: 'Penthouse de lujo de 180 m² con vista al mar, alberca infinity y servicio de concierge en el centro de Playa del Carmen. Renta mensual estimada de $65,000 MXN y apreciación proyectada del 9% anual lo posicionan como una inversión premium.',
      en: 'A luxury 180 sqm penthouse with ocean views, an infinity pool, and concierge service in downtown Playa del Carmen. An estimated monthly rental of $65,000 MXN and a projected 9% annual appreciation position it as a premium investment.',
    },
    badge: 'preventa',
    featured: true,
    createdAt: '2026-01-10T09:00:00Z',
  },
];

export function getAllProperties(): Property[] {
  return properties;
}

export function getFeaturedProperties(): Property[] {
  return properties.filter(p => p.featured);
}

export function getPropertyBySlug(slug: string): Property | undefined {
  return properties.find(p => p.slug === slug);
}

export function getPropertiesByCity(city: string): Property[] {
  return properties.filter(p => p.location.city === city);
}

export function getSimilarProperties(property: Property, limit: number = 4): Property[] {
  return properties
    .filter(p => p.id !== property.id && (p.location.city === property.location.city || p.specs.type === property.specs.type))
    .slice(0, limit);
}
