export type Site = {
  id: number;
  name: string;
  country: string;
  language: string | null;
  url: string;
  forCaller: boolean;
  forAccount: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PersonType = "CALLER" | "ACCOUNT" | "BOTH";

export type RealGuy = {
  id: number;
  name: string;
  country: string;
  language: string | null;
  address: string | null;
  type: PersonType;
  siteId: number;
  siteUrl: string;
  linkedin: string | null;
  phoneNumber: string | null;
  mails: string | null;
  myContactInfo: string | null;
  contactAt: string | null;
  status: number;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  site?: Site;
};

export type DashboardSummary = {
  totalSites: number;
  totalRealGuys: number;
  byType: { type: PersonType; count: number }[];
  byStatus: { status: number; count: number }[];
  byCountry: { country: string; count: number }[];
  planProgress: {
    date: string;
    english: number;
    spanish: number;
    japanese: number;
    completed: boolean;
  }[];
};

export type AuthUser = {
  id: number;
  name: string;
  username: string;
  role: number;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type ManagedUser = {
  id: number;
  name: string;
  username: string;
  role: number;
  createdAt: string;
  updatedAt: string;
};

export type Plan = {
  id: number;
  userId: number;
  date: string;
  english: number;
  spanish: number;
  japanese: number;
  completed: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    username: string;
    name: string;
  };
};
