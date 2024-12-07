// src/features/inventory-management.ts
import { getShapeXpContract } from '../contracts/contract-instances';
import { getCurrentAddress } from '../utils/provider';
import { NETWORKS } from '../utils/network-config';
import { getNFTExperience } from './nft-experience';

// Define enhanced types for inventory
interface InventorySlot {
    nftContract: string;
    tokenId: string;
    isEmpty: boolean;
    metadata?: {
        name?: string;
        imageUrl?: string;
    };
    experience?: string;
}

interface InventoryData {
    slots: InventorySlot[];
    totalSlots: number;
}

async function fetchNFTMetadata(contractAddress: string, tokenId: string) {
    try {
        const baseURL = NETWORKS.SHAPE_SEPOLIA.rpcUrl + import.meta.env.VITE_ALCHEMY_API_KEY;
        const endpoint = `${baseURL}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tokenId}`;

        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch NFT metadata');
        }

        const data = await response.json();

        // Process IPFS URLs
        let imageUrl = data.metadata?.image || '';
        if (imageUrl.startsWith('ipfs://')) {
            imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
        }

        return {
            name: data.metadata?.name || data.title || 'Unnamed NFT',
            imageUrl: imageUrl
        };
    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return null;
    }
}

export async function fetchInventory(): Promise<InventoryData> {
    try {
        const contract = await getShapeXpContract();
        const userAddress = await getCurrentAddress();

        // Get inventory slots from contract
        const [nftContracts, tokenIds] = await contract.viewInventory(userAddress);

        // Process slots and fetch metadata for non-empty slots
        const slots: InventorySlot[] = await Promise.all(
            nftContracts.map(async (contract: string, index: number) => {
                const isEmpty = contract === '0x0000000000000000000000000000000000000000';

                if (isEmpty) {
                    return {
                        nftContract: contract,
                        tokenId: tokenIds[index].toString(),
                        isEmpty: true
                    };
                }

                // Fetch metadata for non-empty slots
                const metadata = await fetchNFTMetadata(
                    contract,
                    tokenIds[index].toString()
                );

                return {
                    nftContract: contract,
                    tokenId: tokenIds[index].toString(),
                    isEmpty: false,
                    metadata: metadata || undefined
                };
            })
        );

        return {
            slots,
            totalSlots: 3
        };

    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        throw new Error(`Failed to fetch inventory: ${error.message}`);
    }
}

async function fetchSlotData(slot: InventorySlot): Promise<InventorySlot> {
    if (slot.isEmpty) return slot;

    // Fetch metadata and experience in parallel
    const [metadataResult, experienceResult] = await Promise.all([
        fetchNFTMetadata(slot.nftContract, slot.tokenId),
        getNFTExperience(slot.nftContract, slot.tokenId)
    ]);

    return {
        ...slot,
        // Convert null to undefined, or keep the metadata object if it exists
        metadata: metadataResult || undefined,
        experience: experienceResult.experience
    };
}

export async function renderInventory(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error('Inventory container not found');
    }

    try {
        container.innerHTML = '<div class="loading">Loading inventory...</div>';
        const inventory = await fetchInventory();

        const inventoryHTML = `
            <div class="inventory-container">
                <h3>Inventory Slots (${inventory.slots.length}/${inventory.totalSlots})</h3>
                <div class="inventory-grid">
                    ${inventory.slots.map(slot => `
                        <div class="inventory-slot ${slot.isEmpty ? 'empty' : 'occupied'}"
                             ${!slot.isEmpty ? `
                                 data-contract-address="${slot.nftContract}"
                                 data-token-id="${slot.tokenId}"
                             ` : ''}>
                            ${slot.isEmpty ?
                                '<div class="empty-slot">Empty Slot</div>' :
                                `<div class="slot-content">
                                    ${slot.metadata?.imageUrl ?
                                        `<img src="${slot.metadata.imageUrl}"
                                              alt="${slot.metadata.name || 'NFT'}"
                                              class="nft-image"
                                              onerror="this.src='/placeholder-image.png'">` :
                                        '<div class="nft-image-placeholder"></div>'
                                    }
                                    <p class="nft-name">${slot.metadata?.name || 'Unnamed NFT'}</p>
                                    <div class="experience-display">
                                        <p class="experience-text">XP: ${slot.experience || '0'}</p>
                                        <div class="experience-bar"
                                             style="--percent: ${calculateExperiencePercentage(slot.experience)}%">
                                        </div>
                                    </div>
                                </div>`
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = inventoryHTML;

    } catch (error: any) {
        container.innerHTML = `
            <div class="error">Failed to load inventory: ${error.message}</div>
        `;
    }
}

function calculateExperiencePercentage(experience?: string): number {
    if (!experience) return 0;
    const MAX_EXPERIENCE = 100000; // Maximum experience from contract
    return Math.min((Number(experience) / MAX_EXPERIENCE) * 100, 100);
}

function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
