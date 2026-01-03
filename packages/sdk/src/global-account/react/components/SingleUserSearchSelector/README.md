# SingleUserSearchSelector Component

A specialized React component for searching and selecting a single user profile. This component is designed specifically for single-user selection scenarios, not for multi-user or general profile browsing.

## Features

- 🔍 Search by address, name, or B3 Global ID
- 🎯 Filter results by profile type (b3-ens, thirdweb-*, ens-data, global-account)
- 📋 Shows a single result in a dropdown
- ⚡ Debounced search (500ms)
- 🎨 Styled consistently with B3 design system
- ♿ Accessible with proper keyboard navigation
- 📱 Responsive design

## Usage

### Basic Example

```tsx
import { SingleUserSearchSelector } from "@b3dotfun/sdk/global-account/react";

function MyComponent() {
  return (
    <SingleUserSearchSelector
      onSelectUser={(profile) => {
        console.log("Selected user:", profile);
        // Handle user selection
      }}
      placeholder="Search by address or name..."
    />
  );
}
```

### With Profile Type Filter

Filter results to only show specific profile types:

```tsx
<SingleUserSearchSelector
  onSelectUser={(profile) => {
    console.log("Selected user:", profile);
  }}
  profileTypeFilter={["b3-ens", "global-account"]}
  placeholder="Search B3 users..."
/>
```

### Available Profile Types

- `b3-ens` - B3 ENS profiles
- `thirdweb-${string}` - Thirdweb profiles (e.g., thirdweb-email, thirdweb-wallet)
- `ens-data` - ENS data profiles
- `global-account` - Global account profiles

### Custom Styling

```tsx
<SingleUserSearchSelector
  onSelectUser={(profile) => {
    console.log("Selected user:", profile);
  }}
  className="max-w-md mx-auto"
  placeholder="Find a user..."
  showClearButton={true}
  minSearchLength={3}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSelectUser` | `(profile: CombinedProfile) => void` | **Required** | Callback function when a user is selected. Returns the complete profile data. |
| `profileTypeFilter` | `ProfileTypeFilter[]` | `undefined` | Optional filter to only show profiles with specific types. |
| `placeholder` | `string` | `"Search by address, name, or ID..."` | Custom placeholder text for the search input. |
| `className` | `string` | `undefined` | Custom class name for the container. |
| `showClearButton` | `boolean` | `true` | Show clear button when there's input. |
| `minSearchLength` | `number` | `3` | Minimum characters before triggering search. |

## Profile Data Structure

The `onSelectUser` callback receives a `CombinedProfile` object:

```typescript
interface CombinedProfile {
  name: string | null;
  address: string | null;
  avatar: string | undefined;
  bio: string | null;
  displayName: string | null;
  profiles: Profile[];
}

interface Profile {
  type: string;
  address?: string;
  name?: string;
  avatar?: string | null;
  bio?: string | null;
  displayName?: string | null;
}
```

## Examples

### In a Modal

```tsx
import { SingleUserSearchSelector } from "@b3dotfun/sdk/global-account/react";
import { Dialog } from "@radix-ui/react-dialog";

function UserSearchModal({ isOpen, onClose }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <h2>Find User</h2>
        <SingleUserSearchSelector
          onSelectUser={(profile) => {
            console.log("Selected:", profile);
            onClose();
          }}
          profileTypeFilter={["b3-ens", "global-account"]}
        />
      </DialogContent>
    </Dialog>
  );
}
```

### With State Management

```tsx
import { SingleUserSearchSelector } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

function UserSelector() {
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div>
      <SingleUserSearchSelector
        onSelectUser={setSelectedUser}
        profileTypeFilter={["b3-ens"]}
      />
      
      {selectedUser && (
        <div className="mt-4">
          <h3>Selected User</h3>
          <p>Name: {selectedUser.displayName || selectedUser.name}</p>
          <p>Address: {selectedUser.address}</p>
        </div>
      )}
    </div>
  );
}
```

## Notes

- The component uses the B3 Profiles API (`https://profiles.b3.fun`)
- Search is debounced by 500ms to avoid excessive API calls
- Only one result is shown at a time (by design for single-user selection)
- The dropdown closes automatically when a user is selected
- Click outside the dropdown to close it
- The component handles loading and error states automatically

## Exporting

The component is exported from the SDK package:

```typescript
// From main export
import { SingleUserSearchSelector } from "@b3dotfun/sdk/global-account/react";

// From specific path
import { SingleUserSearchSelector } from "@b3dotfun/sdk/global-account/react/components/SingleUserSearchSelector";
```
