"use client";

import { cn } from "@b3dotfun/sdk/shared/utils";
import { Search, User, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CombinedProfile, Profile } from "../../hooks/useProfile";
import { fetchProfile as fetchProfileApi } from "../../utils/profileApi";
import { Input } from "../ui/input";

/**
 * Profile type filter options for SingleUserSearchSelector
 * - b3-ens: B3 ENS profiles
 * - thirdweb-${string}: Thirdweb profiles (e.g., thirdweb-email, thirdweb-wallet)
 * - ens-data: ENS data profiles
 * - global-account: Global account profiles
 */
export type ProfileTypeFilter = "b3-ens" | `thirdweb-${string}` | "ens-data" | "global-account";

export interface SingleUserSearchSelectorProps {
  /**
   * Callback function when a user is selected
   * Returns the complete profile data including all profile types
   */
  onSelectUser: (profile: CombinedProfile) => void;

  /**
   * Optional: Filter results to only show profiles that include specific types
   * If provided, only profiles containing at least one of these types will be shown
   */
  profileTypeFilter?: ProfileTypeFilter[];

  /**
   * Optional: Custom placeholder text for the search input
   */
  placeholder?: string;

  /**
   * Optional: Custom class name for the container
   */
  className?: string;

  /**
   * Optional: Show clear button when there's input
   */
  showClearButton?: boolean;

  /**
   * Optional: Minimum characters before triggering search
   */
  minSearchLength?: number;
}

/**
 * SingleUserSearchSelector Component
 *
 * A specialized component for searching and selecting a single user profile.
 * This component is designed specifically for single-user selection scenarios,
 * not for multi-user or general profile browsing.
 *
 * Features:
 * - Search by address or name
 * - Filter results by profile type (b3-ens, thirdweb-*, ens-data, global-account)
 * - Shows a single result in a dropdown
 * - Callback with complete profile data on selection
 *
 * @example
 * ```tsx
 * <SingleUserSearchSelector
 *   onSelectUser={(profile) => console.log('Selected:', profile)}
 *   profileTypeFilter={['b3-ens', 'global-account']}
 *   placeholder="Search by address or name..."
 * />
 * ```
 */
export function SingleUserSearchSelector({
  onSelectUser,
  profileTypeFilter,
  placeholder = "Search by address, name, or ID...",
  className,
  showClearButton = true,
  minSearchLength = 3,
}: SingleUserSearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<CombinedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Fetch profile from API using shared utility
  const fetchProfile = useCallback(
    async (query: string): Promise<CombinedProfile | null> => {
      if (!query || query.length < minSearchLength) {
        return null;
      }

      try {
        // Determine if query is an address (starts with 0x) or a name
        const params = query.startsWith("0x") ? { address: query } : { name: query };

        const profile = await fetchProfileApi(params);
        return profile;
      } catch (err) {
        // Return null for 404s (user not found)
        if (err instanceof Error && err.message.includes("404")) {
          return null;
        }
        console.error("Error fetching profile:", err);
        throw err;
      }
    },
    [minSearchLength],
  );

  // Filter profile by type
  const filterProfileByType = useCallback(
    (profile: CombinedProfile): boolean => {
      if (!profileTypeFilter || profileTypeFilter.length === 0) {
        return true;
      }

      // Check if any of the profile's types match the filter
      return profile.profiles.some(p => {
        return profileTypeFilter.some(filter => {
          // Handle thirdweb-* wildcard matching
          if (filter.startsWith("thirdweb-")) {
            return p.type.startsWith("thirdweb-");
          }
          return p.type === filter;
        });
      });
    },
    [profileTypeFilter],
  );

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery || searchQuery.length < minSearchLength) {
      setSearchResult(null);
      setShowDropdown(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await fetchProfile(searchQuery);

        if (result) {
          // Apply profile type filter
          if (filterProfileByType(result)) {
            setSearchResult(result);
            setShowDropdown(true);
          } else {
            setSearchResult(null);
            setShowDropdown(false);
            setError("No matching profile types found");
          }
        } else {
          setSearchResult(null);
          setShowDropdown(false);
          setError("No user found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to search");
        setSearchResult(null);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchProfile, filterProfileByType, minSearchLength]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle user selection
  const handleSelectUser = useCallback(
    (profile: CombinedProfile) => {
      onSelectUser(profile);
      setShowDropdown(false);
      setSearchQuery("");
      setSearchResult(null);
    },
    [onSelectUser],
  );

  // Handle clear search
  const handleClear = useCallback(() => {
    setSearchQuery("");
    setSearchResult(null);
    setShowDropdown(false);
    setError(null);
    inputRef.current?.focus();
  }, []);

  // Get display name for profile
  const getDisplayName = (profile: CombinedProfile): string => {
    return profile.displayName || profile.name || profile.address || "Unknown";
  };

  // Get profile type badges
  const getProfileTypeBadges = (profiles: Profile[]): string[] => {
    return profiles.map(p => p.type);
  };

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className={cn("w-full pl-10 pr-10", "border-gray-300 focus:border-blue-500 focus:ring-blue-500")}
        />
        {showClearButton && searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Loading State */}
      {isSearching && <div className="mt-2 text-sm text-gray-500">Searching...</div>}

      {/* Error State */}
      {error && !isSearching && <div className="mt-2 text-sm text-red-500">{error}</div>}

      {/* Dropdown with Search Result */}
      {showDropdown && searchResult && !isSearching && (
        <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <button
            onClick={() => handleSelectUser(searchResult)}
            className="w-full p-4 text-left transition-colors hover:bg-gray-50"
            type="button"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="shrink-0">
                {searchResult.avatar ? (
                  <img
                    src={searchResult.avatar}
                    alt={getDisplayName(searchResult)}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900">{getDisplayName(searchResult)}</div>

                {searchResult.address && (
                  <div className="mt-1 font-mono text-xs text-gray-500">
                    {searchResult.address.slice(0, 6)}...{searchResult.address.slice(-4)}
                  </div>
                )}

                {searchResult.bio && <div className="mt-1 line-clamp-2 text-sm text-gray-600">{searchResult.bio}</div>}

                {/* Profile Type Badges */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {getProfileTypeBadges(searchResult.profiles).map((type, index) => (
                    <span
                      key={`${type}-${index}`}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
