// src/features/inventory-management.ts
import { getShapeXpContract } from '../contracts/contract-instances';
import { getCurrentAddress } from '../utils/provider';

interface InventorySlot {
    nftContract: string;
    tokenId: string;
    isEmpty: boolean;
}

interface InventoryData {
    slots: InventorySlot[];
    totalSlots: number;
}

export async function fetchInventory(): Promise<InventoryData> {
    try {
        console.log('1. --- Starting inventory fetch ---');
        const contract = await getShapeXpContract();
        const userAddress = await getCurrentAddress();

        console.log('2. --- Calling viewInventory for address:', userAddress);
        const [nftContracts, tokenIds] = await contract.viewInventory(userAddress);

        console.log('3. --- Raw inventory data ---', {
            nftContracts,
            tokenIds
        });

        const slots: InventorySlot[] = nftContracts.map((contract: string, index: number) => ({
            nftContract: contract,
            tokenId: tokenIds[index].toString(),
            isEmpty: contract === '0x0000000000000000000000000000000000000000'
        }));

        console.log('4. --- Processed inventory slots ---', slots);

        return {
            slots,
            totalSlots: 3
        };

    } catch (error: any) {
        console.error('Error fetching inventory:', error);
        throw new Error(`Failed to fetch inventory: ${error.message}`);
    }
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
                    ${inventory.slots.map((slot, index) => `
                        <div class="inventory-slot ${slot.isEmpty ? 'empty' : 'occupied'}">
                            ${slot.isEmpty
                                ? '<div class="empty-slot">Empty Slot</div>'
                                : `
                                    <div class="slot-content">
                                        <p>NFT Contract: ${shortenAddress(slot.nftContract)}</p>
                                        <p>Token ID: ${slot.tokenId}</p>
                                    </div>
                                `
                            }
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = inventoryHTML;

    } catch (error: any) {
        container.innerHTML = `
            <div class="error">
                Failed to load inventory: ${error.message}
            </div>
        `;
    }
}

function shortenAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
