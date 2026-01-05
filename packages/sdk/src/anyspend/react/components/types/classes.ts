/**
 * Classes prop types for AnySpend components customization.
 * Use these to override default styling of specific elements.
 */

/** Classes for AnySpendDeposit component */
export interface AnySpendDepositClasses {
  // Root containers
  root?: string;
  chainSelection?: string;
  form?: string;
  formContent?: string;

  // Close button
  closeButton?: string;

  // Balance header
  balanceContainer?: string;
  balanceLabel?: string;
  balanceValue?: string;

  // Options container
  optionsContainer?: string;

  // Loading skeleton
  chainsSkeleton?: string;
  skeletonItem?: string;

  // Chains list
  chainsContainer?: string;
  chainButton?: string;
  chainContent?: string;
  chainInfo?: string;
  chainName?: string;
  chainIcon?: string;
  chainBalance?: string;
  chainChevron?: string;

  // General options
  generalOptions?: string;
  optionButton?: string;
  cryptoButton?: string;
  qrButton?: string;
  fiatButton?: string;
  optionContent?: string;
  optionInfo?: string;
  optionTitle?: string;
  optionDescription?: string;
  optionIcon?: string;
  optionChevron?: string;

  // Divider
  divider?: string;
  dividerLine?: string;
  dividerText?: string;

  // Back button
  backButton?: string;
  backIcon?: string;
  backText?: string;

  // Header
  header?: string;
  title?: string;
}

/** Classes for AnySpend component */
export interface AnySpendClasses {
  // Root container
  root?: string;
  container?: string;

  // Header
  header?: string;
  headerLogo?: string;
  headerTitle?: string;

  // Tab section
  tabSection?: string;
  tabList?: string;
  tabTrigger?: string;
  tabTriggerActive?: string;

  // Main content area
  mainContent?: string;
  inputSection?: string;

  // Swap direction button
  swapDirectionButton?: string;

  // Main action button
  mainButton?: string;
  mainButtonDisabled?: string;
  mainButtonError?: string;

  // Transaction history button
  historyButton?: string;

  // Bottom navigation
  bottomNavigation?: string;

  // Gas indicator
  gasIndicator?: string;
}

/** Classes for AnySpendCustomExactIn component */
export interface AnySpendCustomExactInClasses {
  // Root container
  root?: string;
  container?: string;

  // Header
  header?: string;
  headerTitle?: string;
  headerDescription?: string;

  // Content area
  contentArea?: string;
  inputSection?: string;

  // Swap direction button
  swapDirectionButton?: string;

  // Main action button
  mainButton?: string;
  mainButtonDisabled?: string;
  mainButtonError?: string;

  // Footer
  footer?: string;

  // Gas indicator
  gasIndicator?: string;
}

/** Classes for CryptoPaySection component */
export interface CryptoPaySectionClasses {
  root?: string;
  container?: string;
  label?: string;
  inputContainer?: string;
  input?: string;
  tokenSelector?: string;
  tokenIcon?: string;
  tokenSymbol?: string;
  chainBadge?: string;
  balanceRow?: string;
  balanceLabel?: string;
  balanceValue?: string;
  maxButton?: string;
  paymentMethodButton?: string;
  feeRow?: string;
}

/** Classes for CryptoReceiveSection component */
export interface CryptoReceiveSectionClasses {
  root?: string;
  container?: string;
  label?: string;
  inputContainer?: string;
  input?: string;
  tokenSelector?: string;
  tokenIcon?: string;
  tokenSymbol?: string;
  chainBadge?: string;
  recipientRow?: string;
  recipientLabel?: string;
  recipientValue?: string;
  recipientButton?: string;
  pointsRow?: string;
  feeRow?: string;
}

/** Classes for PanelOnramp component */
export interface PanelOnrampClasses {
  root?: string;
  container?: string;
  amountInput?: string;
  presetButtons?: string;
  presetButton?: string;
  paymentMethodRow?: string;
  recipientRow?: string;
  destinationRow?: string;
  feeRow?: string;
  pointsRow?: string;
}

/** Classes for OrderDetails component */
export interface OrderDetailsClasses {
  root?: string;
  container?: string;
  header?: string;
  statusBadge?: string;
  statusPending?: string;
  statusSuccess?: string;
  statusFailed?: string;
  amountSection?: string;
  detailsSection?: string;
  detailRow?: string;
  detailLabel?: string;
  detailValue?: string;
  transactionLink?: string;
  actionButton?: string;
  backButton?: string;
  returnButton?: string;
}

/** Classes for RecipientSelection component */
export interface RecipientSelectionClasses {
  root?: string;
  container?: string;
  header?: string;
  searchInput?: string;
  recipientList?: string;
  recipientItem?: string;
  recipientItemActive?: string;
  recipientAvatar?: string;
  recipientName?: string;
  recipientAddress?: string;
  confirmButton?: string;
  backButton?: string;
}

/** Classes for CryptoPaymentMethod component */
export interface CryptoPaymentMethodClasses {
  root?: string;
  container?: string;
  header?: string;
  optionsList?: string;
  optionItem?: string;
  optionItemActive?: string;
  optionIcon?: string;
  optionLabel?: string;
  optionDescription?: string;
  backButton?: string;
}

/** Classes for FiatPaymentMethod component */
export interface FiatPaymentMethodClasses {
  root?: string;
  container?: string;
  header?: string;
  optionsList?: string;
  optionItem?: string;
  optionItemActive?: string;
  optionIcon?: string;
  optionLabel?: string;
  optionDescription?: string;
  backButton?: string;
}

/** Classes for WarningText component */
export interface WarningTextClasses {
  root?: string;
}

/** Classes for ChainWarningText component */
export interface ChainWarningTextClasses {
  root?: string;
}

/** Classes for QRDeposit component */
export interface QRDepositClasses {
  // Root containers
  root?: string;
  container?: string;
  content?: string;

  // Header
  header?: string;
  backButton?: string;
  title?: string;
  closeButton?: string;

  // Token selector
  tokenSelectorContainer?: string;
  tokenSelectorLabel?: string;
  tokenSelectorTrigger?: string;

  // QR Code area
  qrContent?: string;
  qrCodeContainer?: string;
  qrCode?: string;
  qrScanHint?: string;

  // Address area
  addressContainer?: string;
  addressLabel?: string;
  addressRow?: string;
  address?: string;
  addressCopyIcon?: string;

  // Watching indicator
  watchingIndicator?: string;

  // Copy button
  copyButton?: string;

  // Loading state
  loadingContainer?: string;
  loadingContent?: string;
  loadingSpinner?: string;
  loadingText?: string;

  // Order details wrapper
  orderDetailsContainer?: string;
  orderDetailsContent?: string;
}

/** Combined classes for all AnySpend-related components */
export interface AnySpendAllClasses {
  deposit?: AnySpendDepositClasses;
  anySpend?: AnySpendClasses;
  customExactIn?: AnySpendCustomExactInClasses;
  cryptoPaySection?: CryptoPaySectionClasses;
  cryptoReceiveSection?: CryptoReceiveSectionClasses;
  panelOnramp?: PanelOnrampClasses;
  orderDetails?: OrderDetailsClasses;
  recipientSelection?: RecipientSelectionClasses;
  cryptoPaymentMethod?: CryptoPaymentMethodClasses;
  fiatPaymentMethod?: FiatPaymentMethodClasses;
  qrDeposit?: QRDepositClasses;
  warningText?: WarningTextClasses;
  chainWarningText?: ChainWarningTextClasses;
}
