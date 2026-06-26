import { useEffect, useState } from "react";

// The user's chosen city, used in the home header. Persisted on device so it
// stops claiming everyone is in Mumbai.

const KEY = "pranam-city";

export const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Kolkata",
  "Ahmedabad", "Jaipur", "Lucknow", "Varanasi", "Bhopal", "Patna", "Chandigarh", "Other",
];

export function useCity() {
  const [city, setCityState] = useState<string | null>(null);
  useEffect(() => {
    setCityState(localStorage.getItem(KEY));
  }, []);
  const setCity = (c: string) => {
    localStorage.setItem(KEY, c);
    setCityState(c);
  };
  return { city, setCity };
}
