export interface Goal {
  _id: string;
  name: string;
  weight: number;
  icon: string;
  tags?: string[];
}

export interface Interest {
  _id: string;
  label: string;
  value: string;
  weight: number;
  icon: string;
  tags?: string[];
}

export interface City {
  _id: string;
  name: string;
  fullName?: string;
  countryCode?: string;
}

export interface LifestyleCategory {
  _id: string;
  name: string;
  description?: string;
}

export interface LifestyleOption {
  _id: string;
  label: string;
  value: string;
  category: LifestyleCategory | null;
}
