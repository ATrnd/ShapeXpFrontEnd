import { getShapeXpContract } from '../contracts/contract-instances';
import { getCurrentAddress } from '../utils/provider';

export async function getGlobalExperience(): Promise<{ experience: bigint, formattedExperience: string }> {
    try {
        console.log('1. Fetching global experience...');
        const contract = await getShapeXpContract();
        const userAddress = await getCurrentAddress();

        console.log('2. Contract address:', contract.target);
        console.log('3. User address:', userAddress);

        // Check if function exists
        if (typeof contract.getGlobalExperience !== 'function') {
            throw new Error('getGlobalExperience function not found in contract ABI');
        }

        // Call the contract function
        const experience = await contract.getGlobalExperience(userAddress);
        console.log('5. Raw experience value:', experience.toString());

        // Format the experience for display
        const formattedExperience = experience.toString();

        return {
            experience,
            formattedExperience
        };
    } catch (error: any) {
        console.error('Error fetching global experience:', {
            message: error.message,
            code: error.code,
            details: error
        });
        throw error;
    }
}
