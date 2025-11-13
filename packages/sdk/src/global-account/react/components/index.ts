// TODO woj: Barrel file for all components, this might be reason of bundle size issues
// Core Components
export { B3DynamicModal } from "./B3DynamicModal";
export { B3Provider, InnerProvider } from "./B3Provider/B3Provider";
export { RelayKitProviderWrapper } from "./B3Provider/RelayKitProviderWrapper";
export { B3Context, type B3ContextType } from "./B3Provider/types";
export { useB3 } from "./B3Provider/useB3";
export { StyleRoot } from "./StyleRoot";

// SignInWithB3 Components
export { AuthButton } from "./SignInWithB3/components/AuthButton";
export { PermissionItem } from "./SignInWithB3/components/PermissionItem";
export { WalletRow } from "./SignInWithB3/components/WalletRow";
export { SignInWithB3 } from "./SignInWithB3/SignInWithB3";
export { SignInWithB3Flow } from "./SignInWithB3/SignInWithB3Flow";
export { SignInWithB3Privy } from "./SignInWithB3/SignInWithB3Privy";
export { LoginStepContainer } from "./SignInWithB3/steps/LoginStep";
export { getConnectOptionsFromStrategy, isWalletType, type AllowedStrategy } from "./SignInWithB3/utils/signInUtils";

// ManageAccount Components
export { ManageAccount } from "./ManageAccount/ManageAccount";

// Deposit Components
export { Deposit } from "./Deposit/Deposit";

// Send Components
export { Send } from "./Send/Send";

// B3 Global Branding Wrapper
// Profile Components
export { AvatarEditor } from "./AvatarEditor/AvatarEditor";
export { ProfileEditor } from "./ProfileEditor/ProfileEditor";

// Media Components
export { IPFSMediaRenderer } from "./IPFSMediaRenderer/IPFSMediaRenderer";

// RequestPermissions Components
export { RequestPermissions } from "./RequestPermissions/RequestPermissions";
export { RequestPermissionsButton } from "./RequestPermissions/RequestPermissionsButton";

// AccountAssets Components
export { AccountAssets } from "./AccountAssets/AccountAssets";

// MintButton Components
export { MintButton } from "./MintButton/MintButton";

// SendETHButton Components
export { SendETHButton } from "./SendETHButton/SendETHButton";

// SendERC20Button Components
export { SendERC20Button } from "./SendERC20Button/SendERC20Button";

// Custom Components
export { Button as CustomButton, buttonVariants as customButtonVariants } from "./custom/Button";
export { ClientOnly } from "./custom/ClientOnly";
export { CopyToClipboard } from "./custom/CopyToClipboard";
export { StaggeredFadeLoader } from "./custom/StaggeredFadeLoader";
export { WalletConnectorIcon } from "./custom/WalletConnectorIcon";

// UI Components
export { Badge, badgeVariants } from "./ui/badge";
export { Button, buttonVariants } from "./ui/button";
export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
export { GlareCard } from "./ui/glare-card";
export { GlareCardRounded } from "./ui/glare-card-rounded";
export { Input } from "./ui/input";
export { Loading } from "./ui/Loading";
export { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
export { ScrollArea, ScrollBar } from "./ui/scroll-area";
export { ShinyButton } from "./ui/ShinyButton";
export { Skeleton } from "./ui/skeleton";
export {
  TabsContent as TabsContentPrimitive,
  TabsList as TabsListPrimitive,
  Tabs as TabsPrimitive,
  TabTrigger as TabTriggerPrimitive,
} from "./ui/Tabs";
export { Tabs, TabsContent, TabsList, TabsTransitionWrapper, TabTrigger } from "./ui/TabSystem";
export { TextLoop } from "./ui/text-loop";
export { TextShimmer } from "./ui/text-shimmer";
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
export { TransitionPanel } from "./ui/transition-panel";

// Magic UI Components
export { AnimatedLottie } from "./magicui/AnimatedLottie";
