// src/features/inventory-actions.ts

import { getShapeXpContract } from '../contracts/contract-instances';
import { ContractTransactionResponse, getAddress } from 'ethers';

interface AddToInventoryResult {
    success: boolean;
    error?: string;
}

export async function addNFTToInventory(
    contractAddress: string,
    tokenId: string
): Promise<AddToInventoryResult> {
    try {
        // Get contract instance
        const contract = await getShapeXpContract();

        // Format address
        const address = getAddress(contractAddress);

        // Send transaction
        const tx = await contract.addNFTToInventory(address, tokenId);
        await tx.wait();

        return { success: true };
    } catch (error: any) {
        // Handle user rejection
        if (error.code === 'ACTION_REJECTED') {
            return {
                success: false,
                error: 'Transaction rejected by user'
            };
        }

        // Handle other errors
        return {
            success: false,
            error: error.message || 'Failed to add NFT to inventory'
        };
    }
}
