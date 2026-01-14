# Notification Types and Future Opportunities

## Current Implementation

### Valid Notification Types

Currently, the B3 notification system supports **only one notification type**:

- **`general`** - The default and currently only valid notification type that users subscribe to

### Usage

All notifications sent through the system must use the `general` notification type:

```typescript
// Correct usage
await notificationsAPI.sendNotification({
  userId: "user-123",
  appId: "my-app",
  notificationType: "general", // ✅ Valid
  message: "Your transaction was successful!",
  title: "Transaction Complete",
});

// Incorrect usage - will fail
await notificationsAPI.sendNotification({
  userId: "user-123",
  appId: "my-app",
  notificationType: "organization_invite", // ❌ Invalid - not supported
  message: "You've been invited!",
});
```

### Why Only "general"?

Users currently subscribe to the `general` notification type when they:
- Connect notification channels (email, SMS, Telegram, etc.)
- Enable notifications for an app
- Send test notifications

The backend notification service is configured to route all notifications through the `general` type subscription.

## Future Opportunities

### Extending Notification Types

In the future, we plan to support multiple notification types to allow for more granular notification preferences. This will enable users to:

1. **Subscribe to specific notification categories**
   - `transaction` - Transaction-related notifications
   - `organization_invite` - Organization and team invitations
   - `security` - Security alerts and warnings
   - `marketing` - Promotional and marketing messages
   - `system` - System updates and maintenance notices

2. **Customize notification preferences per type**
   - Choose different channels for different notification types
   - Enable/disable specific notification categories
   - Set different notification frequencies per type

3. **App-specific notification types**
   - Allow apps to define custom notification types
   - Enable users to manage app-specific notification preferences

### Implementation Requirements

To support multiple notification types, the following changes will be needed:

1. **Backend Changes**
   - Update notification service to handle multiple notification types
   - Add migration to support existing users with new notification types
   - Update subscription logic to allow per-type subscriptions

2. **SDK Changes**
   - Update `NotificationPreferences` interface to support type-specific settings
   - Add UI components for managing notification type preferences
   - Update `ensureNotificationSettings` to handle multiple types

3. **Database Schema**
   - Extend `app_settings` table to support multiple notification types per app
   - Add default notification type preferences for new users

4. **Migration Strategy**
   - All existing users will automatically be subscribed to all new notification types
   - Apps can gradually adopt specific notification types
   - Maintain backward compatibility with `general` type

### Example Future API

```typescript
// Future API - not yet implemented
await notificationsAPI.savePreferences("my-app", {
  notificationType: "transaction",
  channels: ["email", "in_app"],
  enabled: true,
});

await notificationsAPI.savePreferences("my-app", {
  notificationType: "organization_invite",
  channels: ["email", "telegram"],
  enabled: true,
});

await notificationsAPI.savePreferences("my-app", {
  notificationType: "marketing",
  channels: [],
  enabled: false, // User opts out of marketing notifications
});
```

## Important Notes

⚠️ **Do not use notification types other than `general` in production code until the backend support is implemented.**

Using unsupported notification types will cause notifications to fail silently or throw errors, as users are not subscribed to those types.

## Timeline

The multi-type notification system is planned for a future release. Until then:
- Use only `general` for all notifications
- Design your notification messages to be general-purpose
- Plan for future migration to specific notification types

## Questions or Suggestions?

If you have ideas for notification types or features, please open an issue or discussion in the repository.
