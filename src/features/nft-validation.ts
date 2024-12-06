import { getShapeXpNFTContract } from '../contracts/contract-instances';
import { getCurrentAddress } from '../utils/provider';

export async function checkShapeXpNFTOwnership(): Promise<boolean> {
    try {
        const nftContract = await getShapeXpNFTContract();
        const userAddress = await getCurrentAddress();

        console.log('6. --- Checking NFT ownership for address: ---', userAddress);
        const hasMinted = await nftContract.hasMintedToken(userAddress);

        console.log('7. --- Has minted ShapeXpNFT: ---', hasMinted);
        return hasMinted;
    } catch (error: any) {
        console.error('Error checking NFT ownership:', error);
        throw error;
    }
}
