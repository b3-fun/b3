import { useQuery } from "@tanstack/react-query";

export interface GeoData {
  country: string;
  city: string;
  ip: string;
  continent: string;
  latitude: string;
  longitude: string;
  region: string;
  regionCode: string;
  timezone: string;
}

async function fetchGeoData(): Promise<GeoData> {
  const response = await fetch("https://geo.basement.fun/");
  if (!response.ok) {
    throw new Error("Failed to fetch geo data");
  }
  return response.json();
}

export function useGetGeo() {
  const {
    data: geoData,
    isLoading: loading,
    error
  } = useQuery({ queryKey: ["useGetGeo"], queryFn: fetchGeoData, retry: 3 });

  return { geoData, loading, error };
}
