// This file is auto-generated by @hey-api/openapi-ts

import type { Client, Options as ClientOptions, TDataShape } from '@hey-api/client-fetch';
import { client as _heyApiClient } from './client.gen';
import type { DeleteV1WebhooksByWebhookIdData, DeleteV1WebhooksByWebhookIdError, DeleteV1WebhooksByWebhookIdResponse, GetV1BlocksData, GetV1BlocksError, GetV1BlocksResponse, GetV1ContractsAbiByContractAddressData, GetV1ContractsAbiByContractAddressError, GetV1ContractsAbiByContractAddressResponse, GetV1ContractsMetadataByContractAddressData, GetV1ContractsMetadataByContractAddressError, GetV1ContractsMetadataByContractAddressResponse, GetV1EventsByContractAddressBySignatureData, GetV1EventsByContractAddressBySignatureError, GetV1EventsByContractAddressBySignatureResponse, GetV1EventsByContractAddressData, GetV1EventsByContractAddressError, GetV1EventsByContractAddressResponse, GetV1EventsData, GetV1EventsError, GetV1EventsResponse, GetV1NftsBalanceByOwnerAddressData, GetV1NftsBalanceByOwnerAddressResponse, GetV1NftsByContractAddressByTokenIdData, GetV1NftsByContractAddressByTokenIdError, GetV1NftsByContractAddressByTokenIdResponse, GetV1NftsByContractAddressData, GetV1NftsByContractAddressError, GetV1NftsByContractAddressResponse, GetV1NftsCollectionsByContractAddressData, GetV1NftsCollectionsByContractAddressError, GetV1NftsCollectionsByContractAddressResponse, GetV1NftsData, GetV1NftsError, GetV1NftsMetadataRefreshByContractAddressByTokenIdData, GetV1NftsMetadataRefreshByContractAddressByTokenIdError, GetV1NftsMetadataRefreshByContractAddressByTokenIdResponse, GetV1NftsMetadataRefreshByContractAddressData, GetV1NftsMetadataRefreshByContractAddressError, GetV1NftsMetadataRefreshByContractAddressResponse, GetV1NftsOwnersByContractAddressByTokenIdData, GetV1NftsOwnersByContractAddressByTokenIdError, GetV1NftsOwnersByContractAddressByTokenIdResponse, GetV1NftsOwnersByContractAddressData, GetV1NftsOwnersByContractAddressError, GetV1NftsOwnersByContractAddressResponse, GetV1NftsResponse, GetV1NftsTransfersByContractAddressByTokenIdData, GetV1NftsTransfersByContractAddressByTokenIdError, GetV1NftsTransfersByContractAddressByTokenIdResponse, GetV1NftsTransfersByContractAddressData, GetV1NftsTransfersByContractAddressError, GetV1NftsTransfersByContractAddressResponse, GetV1NftsTransfersData, GetV1NftsTransfersError, GetV1NftsTransfersResponse, GetV1NftsTransfersTransactionByTransactionHashData, GetV1NftsTransfersTransactionByTransactionHashError, GetV1NftsTransfersTransactionByTransactionHashResponse, GetV1ResolveByInputData, GetV1ResolveByInputError, GetV1ResolveByInputResponse, GetV1TokensErc1155ByOwnerAddressData, GetV1TokensErc1155ByOwnerAddressResponse, GetV1TokensErc20ByOwnerAddressData, GetV1TokensErc20ByOwnerAddressResponse, GetV1TokensErc721ByOwnerAddressData, GetV1TokensErc721ByOwnerAddressResponse, GetV1TokensLookupData, GetV1TokensLookupResponse, GetV1TokensPriceData, GetV1TokensPriceResponse, GetV1TokensPriceSupportedData, GetV1TokensPriceSupportedResponse, GetV1TokensTransfersByContractAddressData, GetV1TokensTransfersByContractAddressError, GetV1TokensTransfersByContractAddressResponse, GetV1TokensTransfersData, GetV1TokensTransfersError, GetV1TokensTransfersResponse, GetV1TokensTransfersTransactionByTransactionHashData, GetV1TokensTransfersTransactionByTransactionHashError, GetV1TokensTransfersTransactionByTransactionHashResponse, GetV1TransactionsByContractAddressBySignatureData, GetV1TransactionsByContractAddressBySignatureError, GetV1TransactionsByContractAddressBySignatureResponse, GetV1TransactionsByContractAddressData, GetV1TransactionsByContractAddressError, GetV1TransactionsByContractAddressResponse, GetV1TransactionsData, GetV1TransactionsError, GetV1TransactionsResponse, GetV1WalletsByWalletAddressTransactionsData, GetV1WalletsByWalletAddressTransactionsError, GetV1WalletsByWalletAddressTransactionsResponse, GetV1WebhooksData, GetV1WebhooksError, GetV1WebhooksResponse, PatchV1WebhooksByWebhookIdData, PatchV1WebhooksByWebhookIdError, PatchV1WebhooksByWebhookIdResponse, PostV1DecodeByContractAddressData, PostV1DecodeByContractAddressError, PostV1DecodeByContractAddressResponse, PostV1WebhooksData, PostV1WebhooksError, PostV1WebhooksResponse, PostV1WebhooksTestData, PostV1WebhooksTestError, PostV1WebhooksTestResponse } from './types.gen';

export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = ClientOptions<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};

/**
 * Get webhooks
 * Get a list of webhooks or a single webhook by ID
 */
export const getV1Webhooks = <ThrowOnError extends boolean = false>(options?: Options<GetV1WebhooksData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1WebhooksResponse, GetV1WebhooksError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/webhooks',
        ...options
    });
};

/**
 * Create webhook
 * Create a new webhook. In order to receive decoded data, specify a partial ABI in the filters.
 */
export const postV1Webhooks = <ThrowOnError extends boolean = false>(options?: Options<PostV1WebhooksData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<PostV1WebhooksResponse, PostV1WebhooksError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/webhooks',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Delete webhook
 * Delete a webhook. This action cannot be undone.
 */
export const deleteV1WebhooksByWebhookId = <ThrowOnError extends boolean = false>(options: Options<DeleteV1WebhooksByWebhookIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).delete<DeleteV1WebhooksByWebhookIdResponse, DeleteV1WebhooksByWebhookIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/webhooks/{webhook_id}',
        ...options
    });
};

/**
 * Update webhook
 * Update a webhook.
 */
export const patchV1WebhooksByWebhookId = <ThrowOnError extends boolean = false>(options: Options<PatchV1WebhooksByWebhookIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).patch<PatchV1WebhooksByWebhookIdResponse, PatchV1WebhooksByWebhookIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/webhooks/{webhook_id}',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Test webhook
 * Test your webhook URL. This will send a test event to the webhook URL signed with an example secret 'test123'. NB! The payload does not necessarily match your webhook filters. You can however use it to test signature verification and payload format handling.
 */
export const postV1WebhooksTest = <ThrowOnError extends boolean = false>(options?: Options<PostV1WebhooksTestData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).post<PostV1WebhooksTestResponse, PostV1WebhooksTestError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/webhooks/test',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get events
 * Get events
 */
export const getV1Events = <ThrowOnError extends boolean = false>(options?: Options<GetV1EventsData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1EventsResponse, GetV1EventsError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/events',
        ...options
    });
};

/**
 * Get contract events
 * Get contract events
 */
export const getV1EventsByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1EventsByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1EventsByContractAddressResponse, GetV1EventsByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/events/{contractAddress}',
        ...options
    });
};

/**
 * Get contract events with specific signature
 * Get specific contract events
 */
export const getV1EventsByContractAddressBySignature = <ThrowOnError extends boolean = false>(options: Options<GetV1EventsByContractAddressBySignatureData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1EventsByContractAddressBySignatureResponse, GetV1EventsByContractAddressBySignatureError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/events/{contractAddress}/{signature}',
        ...options
    });
};

/**
 * Get transactions
 * Get transactions
 */
export const getV1Transactions = <ThrowOnError extends boolean = false>(options?: Options<GetV1TransactionsData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1TransactionsResponse, GetV1TransactionsError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/transactions',
        ...options
    });
};

/**
 * Get contract transactions
 * Get contract transactions
 */
export const getV1TransactionsByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1TransactionsByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TransactionsByContractAddressResponse, GetV1TransactionsByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/transactions/{contractAddress}',
        ...options
    });
};

/**
 * Get contract transactions with specific signature
 * Get specific contract transactions
 */
export const getV1TransactionsByContractAddressBySignature = <ThrowOnError extends boolean = false>(options: Options<GetV1TransactionsByContractAddressBySignatureData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TransactionsByContractAddressBySignatureResponse, GetV1TransactionsByContractAddressBySignatureError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/transactions/{contractAddress}/{signature}',
        ...options
    });
};

/**
 * Get token transfers by transaction
 * Get token transfers by transaction
 */
export const getV1TokensTransfersTransactionByTransactionHash = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensTransfersTransactionByTransactionHashData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensTransfersTransactionByTransactionHashResponse, GetV1TokensTransfersTransactionByTransactionHashError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/transfers/transaction/{transaction_hash}',
        ...options
    });
};

/**
 * Get token transfers by contract
 * Get token transfers by contract
 */
export const getV1TokensTransfersByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensTransfersByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensTransfersByContractAddressResponse, GetV1TokensTransfersByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/transfers/{contract_address}',
        ...options
    });
};

/**
 * Get token transfers
 * Get token transfers
 */
export const getV1TokensTransfers = <ThrowOnError extends boolean = false>(options?: Options<GetV1TokensTransfersData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1TokensTransfersResponse, GetV1TokensTransfersError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/transfers',
        ...options
    });
};

/**
 * Get ERC-20 balances by address
 * Get ERC-20 balances for a given address
 */
export const getV1TokensErc20ByOwnerAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensErc20ByOwnerAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensErc20ByOwnerAddressResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/erc20/{ownerAddress}',
        ...options
    });
};

/**
 * @deprecated
 * Get ERC-721 balances by address
 * Get ERC-721 (NFT) balances for a given address [BEING DEPRECATED IN FAVOR OF /nfts/balance]
 */
export const getV1TokensErc721ByOwnerAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensErc721ByOwnerAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensErc721ByOwnerAddressResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/erc721/{ownerAddress}',
        ...options
    });
};

/**
 * @deprecated
 * Get ERC-1155 balances by address
 * Get ERC-1155 (Multi Token) balances for a given address [BEING DEPRECATED IN FAVOR OF /nfts/balance]
 */
export const getV1TokensErc1155ByOwnerAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensErc1155ByOwnerAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensErc1155ByOwnerAddressResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/erc1155/{ownerAddress}',
        ...options
    });
};

/**
 * Get supported tokens for price data
 * Get supported tokens for price data
 */
export const getV1TokensPriceSupported = <ThrowOnError extends boolean = false>(options?: Options<GetV1TokensPriceSupportedData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1TokensPriceSupportedResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/price/supported',
        ...options
    });
};

/**
 * Get token price
 * Get price in USD for given token(s)
 */
export const getV1TokensPrice = <ThrowOnError extends boolean = false>(options?: Options<GetV1TokensPriceData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1TokensPriceResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/price',
        ...options
    });
};

/**
 * Token lookup
 * Look up a fungible token by symbol
 */
export const getV1TokensLookup = <ThrowOnError extends boolean = false>(options: Options<GetV1TokensLookupData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1TokensLookupResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/tokens/lookup',
        ...options
    });
};

/**
 * Resolve
 * Resolve
 */
export const getV1ResolveByInput = <ThrowOnError extends boolean = false>(options: Options<GetV1ResolveByInputData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1ResolveByInputResponse, GetV1ResolveByInputError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/resolve/{input}',
        ...options
    });
};

/**
 * Get blocks
 * Get blocks
 */
export const getV1Blocks = <ThrowOnError extends boolean = false>(options?: Options<GetV1BlocksData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1BlocksResponse, GetV1BlocksError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/blocks',
        ...options
    });
};

/**
 * Get contract ABI​
 * Get contract ABI​
 */
export const getV1ContractsAbiByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1ContractsAbiByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1ContractsAbiByContractAddressResponse, GetV1ContractsAbiByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/contracts/abi/{contractAddress}',
        ...options
    });
};

/**
 * Get contract metadata​
 * Get contract metadata​
 */
export const getV1ContractsMetadataByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1ContractsMetadataByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1ContractsMetadataByContractAddressResponse, GetV1ContractsMetadataByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/contracts/metadata/{contractAddress}',
        ...options
    });
};

/**
 * Decode logs and transactions​
 * Decode logs and transactions​
 */
export const postV1DecodeByContractAddress = <ThrowOnError extends boolean = false>(options: Options<PostV1DecodeByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).post<PostV1DecodeByContractAddressResponse, PostV1DecodeByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/decode/{contractAddress}',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers
        }
    });
};

/**
 * Get NFT balances by address
 * Get NFT balances for a given address
 */
export const getV1NftsBalanceByOwnerAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsBalanceByOwnerAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsBalanceByOwnerAddressResponse, unknown, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/balance/{ownerAddress}',
        ...options
    });
};

/**
 * Get collection
 * Retrieve metadata about a collection
 */
export const getV1NftsCollectionsByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsCollectionsByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsCollectionsByContractAddressResponse, GetV1NftsCollectionsByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/collections/{contract_address}',
        ...options
    });
};

/**
 * Get NFTs by owner
 * Get NFTs by owner
 */
export const getV1Nfts = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsResponse, GetV1NftsError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts',
        ...options
    });
};

/**
 * Get NFT owners by contract
 * Get NFT owners by contract
 */
export const getV1NftsOwnersByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsOwnersByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsOwnersByContractAddressResponse, GetV1NftsOwnersByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/owners/{contract_address}',
        ...options
    });
};

/**
 * Get NFT owners by token
 * Get NFT owners by token
 */
export const getV1NftsOwnersByContractAddressByTokenId = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsOwnersByContractAddressByTokenIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsOwnersByContractAddressByTokenIdResponse, GetV1NftsOwnersByContractAddressByTokenIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/owners/{contract_address}/{token_id}',
        ...options
    });
};

/**
 * Get NFT transfers
 * Get NFT transfers
 */
export const getV1NftsTransfers = <ThrowOnError extends boolean = false>(options?: Options<GetV1NftsTransfersData, ThrowOnError>) => {
    return (options?.client ?? _heyApiClient).get<GetV1NftsTransfersResponse, GetV1NftsTransfersError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/transfers',
        ...options
    });
};

/**
 * Get NFT transfers by transaction
 * Get NFT transfers by transaction
 */
export const getV1NftsTransfersTransactionByTransactionHash = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsTransfersTransactionByTransactionHashData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsTransfersTransactionByTransactionHashResponse, GetV1NftsTransfersTransactionByTransactionHashError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/transfers/transaction/{transaction_hash}',
        ...options
    });
};

/**
 * Get NFT transfers by contract
 * Get NFT transfers by contract
 */
export const getV1NftsTransfersByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsTransfersByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsTransfersByContractAddressResponse, GetV1NftsTransfersByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/transfers/{contract_address}',
        ...options
    });
};

/**
 * Get NFTs by contract
 * Get NFTs by contract
 */
export const getV1NftsByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsByContractAddressResponse, GetV1NftsByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/{contract_address}',
        ...options
    });
};

/**
 * Get NFT transfers by token
 * Get NFT transfers by token
 */
export const getV1NftsTransfersByContractAddressByTokenId = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsTransfersByContractAddressByTokenIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsTransfersByContractAddressByTokenIdResponse, GetV1NftsTransfersByContractAddressByTokenIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/transfers/{contract_address}/{token_id}',
        ...options
    });
};

/**
 * Get NFT by token ID
 * Get NFT by token ID
 */
export const getV1NftsByContractAddressByTokenId = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsByContractAddressByTokenIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsByContractAddressByTokenIdResponse, GetV1NftsByContractAddressByTokenIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/{contract_address}/{token_id}',
        ...options
    });
};

/**
 * Force refresh collection metadata
 * Force refresh collection metadata for the specified contract (across multiple chains if provided)
 */
export const getV1NftsMetadataRefreshByContractAddress = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsMetadataRefreshByContractAddressData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsMetadataRefreshByContractAddressResponse, GetV1NftsMetadataRefreshByContractAddressError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/metadata/refresh/{contract_address}',
        ...options
    });
};

/**
 * Force refresh token metadata
 * Force refresh token metadata for the specified contract and token ID (across multiple chains if provided)
 */
export const getV1NftsMetadataRefreshByContractAddressByTokenId = <ThrowOnError extends boolean = false>(options: Options<GetV1NftsMetadataRefreshByContractAddressByTokenIdData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1NftsMetadataRefreshByContractAddressByTokenIdResponse, GetV1NftsMetadataRefreshByContractAddressByTokenIdError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/nfts/metadata/refresh/{contract_address}/{token_id}',
        ...options
    });
};

/**
 * Get wallet transactions
 * Get incoming and outgoing transactions for a wallet
 */
export const getV1WalletsByWalletAddressTransactions = <ThrowOnError extends boolean = false>(options: Options<GetV1WalletsByWalletAddressTransactionsData, ThrowOnError>) => {
    return (options.client ?? _heyApiClient).get<GetV1WalletsByWalletAddressTransactionsResponse, GetV1WalletsByWalletAddressTransactionsError, ThrowOnError>({
        security: [
            {
                name: 'x-client-id',
                type: 'apiKey'
            },
            {
                scheme: 'bearer',
                type: 'http'
            },
            {
                in: 'query',
                name: 'clientId',
                type: 'apiKey'
            }
        ],
        url: '/v1/wallets/{wallet_address}/transactions',
        ...options
    });
};