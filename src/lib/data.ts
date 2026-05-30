import ganesh from "@/assets/pooja-ganesh.jpg";
import satya from "@/assets/pooja-satyanarayan.jpg";
import griha from "@/assets/pooja-griha.jpg";
import lakshmi from "@/assets/pooja-lakshmi.jpg";

export type Pooja = {
  slug: string;
  name: string;
  tagline: string;
  duration: string;
  priceFrom: number;
  samagriIncluded: boolean;
  image: string;
  popular?: boolean;
  season?: string;
  description: string;
  includes: string[];
};

export const poojas: Pooja[] = [
  {
    slug: "ganesh-pooja",
    name: "Ganesh Pooja",
    tagline: "Remover of obstacles, new beginnings",
    duration: "1.5 hrs",
    priceFrom: 1499,
    samagriIncluded: true,
    image: ganesh,
    popular: true,
    season: "Ganesh Chaturthi",
    description: "Invoke Lord Ganesha for auspicious beginnings — ideal before new ventures, exams, or any important event.",
    includes: ["Verified Pandit Ji", "Full samagri kit", "Sankalp & aarti", "Prasad blessing"],
  },
  {
    slug: "satyanarayan-katha",
    name: "Satyanarayan Katha",
    tagline: "Family prosperity & gratitude",
    duration: "2 hrs",
    priceFrom: 2199,
    samagriIncluded: true,
    image: satya,
    popular: true,
    description: "Traditional katha for family well-being, performed on Purnima or any auspicious day.",
    includes: ["Verified Pandit Ji", "Full samagri kit", "Katha recitation", "Prasad for 11 people"],
  },
  {
    slug: "griha-pravesh",
    name: "Griha Pravesh",
    tagline: "Sanctify your new home",
    duration: "3 hrs",
    priceFrom: 4999,
    samagriIncluded: true,
    image: griha,
    season: "Akshaya Tritiya",
    description: "Vaastu shanti and house-warming ceremony with kalash sthapana, navagraha shanti and havan.",
    includes: ["2 Verified Pandit Jis", "Premium samagri kit", "Vaastu shanti", "Havan & purnahuti"],
  },
  {
    slug: "lakshmi-pooja",
    name: "Lakshmi Pooja",
    tagline: "Wealth, abundance & light",
    duration: "1.5 hrs",
    priceFrom: 1799,
    samagriIncluded: true,
    image: lakshmi,
    popular: true,
    season: "Diwali",
    description: "Welcome Maa Lakshmi into your home with the traditional Diwali night ceremony.",
    includes: ["Verified Pandit Ji", "Diwali samagri kit", "Lakshmi aarti", "Silver coin blessing"],
  },
];

export type Pandit = {
  id: string;
  name: string;
  city: string;
  experience: number;
  rating: number;
  reviews: number;
  languages: string[];
  specialties: string[];
  verified: true;
  initials: string;
};

export const pandits: Pandit[] = [
  { id: "p1", name: "Acharya Ramesh Shastri", city: "Varanasi", experience: 22, rating: 4.9, reviews: 412, languages: ["Hindi", "Sanskrit", "English"], specialties: ["Griha Pravesh", "Vivah"], verified: true, initials: "RS" },
  { id: "p2", name: "Pandit Suresh Joshi", city: "Mumbai", experience: 15, rating: 4.8, reviews: 287, languages: ["Hindi", "Marathi", "Sanskrit"], specialties: ["Ganesh Pooja", "Satyanarayan"], verified: true, initials: "SJ" },
  { id: "p3", name: "Acharya Venkat Iyer", city: "Bengaluru", experience: 18, rating: 4.9, reviews: 356, languages: ["Tamil", "Kannada", "Sanskrit"], specialties: ["Navagraha", "Rudrabhishek"], verified: true, initials: "VI" },
  { id: "p4", name: "Pandit Arjun Mishra", city: "Delhi NCR", experience: 12, rating: 4.7, reviews: 198, languages: ["Hindi", "Sanskrit"], specialties: ["Lakshmi Pooja", "Havan"], verified: true, initials: "AM" },
];

export type Astrologer = {
  id: string;
  name: string;
  expertise: string;
  experience: number;
  rating: number;
  pricePerMin: number;
  languages: string[];
  online: boolean;
  initials: string;
};

export const astrologers: Astrologer[] = [
  { id: "a1", name: "Acharya Mohan Tripathi", expertise: "Vedic & Kundli", experience: 25, rating: 4.9, pricePerMin: 35, languages: ["Hindi", "English"], online: true, initials: "MT" },
  { id: "a2", name: "Smriti Sharma", expertise: "Tarot & Numerology", experience: 10, rating: 4.8, pricePerMin: 22, languages: ["Hindi", "English"], online: true, initials: "SS" },
  { id: "a3", name: "Pandit Rajesh Bhatt", expertise: "Vastu & Palmistry", experience: 18, rating: 4.7, pricePerMin: 28, languages: ["Hindi", "Gujarati"], online: false, initials: "RB" },
  { id: "a4", name: "Dr. Priya Nair", expertise: "Nadi & Prashna", experience: 14, rating: 4.9, pricePerMin: 40, languages: ["English", "Malayalam"], online: true, initials: "PN" },
];

export type Samagri = {
  id: string;
  name: string;
  desc: string;
  price: number;
  mrp: number;
  emoji: string;
};

export const samagri: Samagri[] = [
  { id: "s1", name: "Diwali Lakshmi Kit", desc: "Complete kit for Lakshmi pooja night", price: 899, mrp: 1199, emoji: "🪔" },
  { id: "s2", name: "Griha Pravesh Kit", desc: "Vaastu & havan ready samagri", price: 1499, mrp: 1899, emoji: "🏠" },
  { id: "s3", name: "Daily Pooja Essentials", desc: "Agarbatti, kumkum, rice, ghee", price: 349, mrp: 449, emoji: "🌼" },
  { id: "s4", name: "Havan Samagri (500g)", desc: "Pure ayurvedic blend, 9 herbs", price: 249, mrp: 299, emoji: "🔥" },
  { id: "s5", name: "Brass Diya Set (5 pcs)", desc: "Handcrafted, temple grade", price: 599, mrp: 799, emoji: "🪔" },
  { id: "s6", name: "Pooja Thali Premium", desc: "Engraved brass with bell", price: 1199, mrp: 1499, emoji: "🛕" },
];

export const festivals = [
  { name: "Diwali", date: "Nov 1", days: 12, color: "from-amber-400 to-rose-600" },
  { name: "Karwa Chauth", date: "Oct 20", days: 0, color: "from-rose-400 to-red-600" },
  { name: "Govardhan", date: "Nov 2", days: 13, color: "from-orange-400 to-amber-600" },
  { name: "Tulsi Vivah", date: "Nov 12", days: 23, color: "from-yellow-400 to-orange-600" },
];
