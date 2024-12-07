import { getCurrentAddress } from '../utils/provider';
import { NETWORKS } from '../utils/network-config';

/**
 * Interface for simplified NFT data
 */
export interface SimpleNFT {
    contractAddress: string;
    tokenId: string;
    name?: string;
    symbol?: string;
    imageUrl?: string;
    tokenUri?: string;
}

/**
 * Fetches all NFTs owned by the connected wallet
 * @returns Promise<SimpleNFT[]> Array of NFT data
 */
export async function fetchUserNFTs(): Promise<SimpleNFT[]> {
    try {
        console.log('1. --- Starting NFT fetch process ---');

        const userAddress = await getCurrentAddress();
        console.log('2. Fetching NFTs for address:', userAddress);

        // Use baseURL for the request
        const baseURL = NETWORKS.SHAPE_SEPOLIA.rpcUrl + import.meta.env.VITE_ALCHEMY_API_KEY;

        // Construct the API endpoint
        const endpoint = `${baseURL}/getNFTs/?owner=${userAddress}`;

        // Make the request
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('3. Raw API Response:', data);


        // Process NFTs with metadata
        const processedNFTs: SimpleNFT[] = await Promise.all(
            (data.ownedNfts || []).map(async (nft: any) => {
                let imageUrl = nft.metadata?.image || '';

                // If image is IPFS URL, convert to HTTP gateway URL
                if (imageUrl.startsWith('ipfs://')) {
                    imageUrl = imageUrl.replace(
                        'ipfs://',
                        'https://ipfs.io/ipfs/'
                    );
                }

                return {
                    contractAddress: nft.contract?.address || '',
                    tokenId: nft.id?.tokenId || '',
                    name: nft.metadata?.name || nft.contract?.name || undefined,
                    symbol: nft.contract?.symbol || undefined,
                    imageUrl: imageUrl,
                    tokenUri: nft.tokenUri?.raw || undefined
                };
            })
        );

        console.log('4. Processed NFTs with metadata:', processedNFTs);
        return processedNFTs;

    } catch (error) {
        console.error('Error fetching NFTs:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        if (error instanceof Error) {
            throw new Error(`Failed to fetch NFTs: ${error.message}`);
        }
        throw new Error('Failed to fetch NFTs. Please try again.');
    }
}

/**
 * Filters out specific NFTs by contract address
 * @param nfts Array of NFTs to filter
 * @param excludeAddresses Array of contract addresses to exclude
 * @returns Filtered array of NFTs
 */
export function filterNFTs(nfts: SimpleNFT[], excludeAddresses: string[]): SimpleNFT[] {
    return nfts.filter(nft =>
        !excludeAddresses.includes(nft.contractAddress.toLowerCase())
    );
}
