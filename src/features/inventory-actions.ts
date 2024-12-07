// src/features/inventory-actions.ts

// import { getShapeXpContract } from '../contracts/contract-instances';
// import { ContractTransactionResponse, getAddress, Interface } from 'ethers';
//
// interface AddToInventoryResult {
//     success: boolean;
//     transaction?: ContractTransactionResponse;
//     error?: string;
// }
//
// // Define the error interface at the top level of the file
// const errorInterface = new Interface([
//     "error ShapeXpInvExp__InvalidERC721Contract()",
//     "error ShapeXpInvExp__InventoryFull()",
//     "error ShapeXpInvExp__NFTAlreadyInInventory()",
//     "error ShapeXpInvExp__NotNFTOwner()",
//     "error ShapeXpInvExp__NotShapeXpNFTOwner()"
// ]);
//
// export async function addNFTToInventory( contractAddress: string, tokenId: string): Promise<AddToInventoryResult> {
//     try {
//
//         // Remove '0x' prefix if present and get the decimal value
//         const cleanTokenId = tokenId.startsWith('0x') ? tokenId.slice(2) : tokenId;
//         const formattedTokenId = BigInt('0x' + cleanTokenId);
//
//         console.log('1. --- Processing NFT Data ---', {
//             originalTokenId: tokenId,
//             cleanTokenId,
//             formattedTokenId: formattedTokenId.toString()
//         });
//
//         // Format the address properly
//         const formattedAddress = getAddress(contractAddress);
//
//         // Get contract instance
//         const contract = await getShapeXpContract();
//
//         // Log what we're sending to the contract
//         console.log('2. --- Sending to contract ---', {
//             address: formattedAddress,
//             tokenId: formattedTokenId.toString()
//         });
//
//     //     // First, try to estimate gas to check if the transaction will fail
//     //     try {
//     //         await contract.addNFTToInventory.estimateGas(formattedAddress, formattedTokenId);
//     //     } catch (estimateError: any) {
//     //         console.error('Gas estimation failed:', estimateError);
//
//     //         // Try to parse the error
//     //         if (estimateError.data) {
//     //             try {
//     //                 const decodedError = errorInterface.parseError(estimateError.data);
//
//     //                 // Add null check for decodedError
//     //                 if (!decodedError) {
//     //                     return {
//     //                         success: false,
//     //                         error: 'Unknown contract error'
//     //                     };
//     //                 }
//
//     //                 switch(decodedError.name) {
//     //                     case 'ShapeXpInvExp__InvalidERC721Contract':
//     //                         return { success: false, error: 'Invalid NFT contract' };
//     //                     case 'ShapeXpInvExp__InventoryFull':
//     //                         return { success: false, error: 'Inventory is full' };
//     //                     case 'ShapeXpInvExp__NFTAlreadyInInventory':
//     //                         return { success: false, error: 'NFT is already in inventory' };
//     //                     case 'ShapeXpInvExp__NotNFTOwner':
//     //                         return { success: false, error: 'You do not own this NFT' };
//     //                     case 'ShapeXpInvExp__NotShapeXpNFTOwner':
//     //                         return { success: false, error: 'You need a ShapeXp NFT first' };
//     //                     default:
//     //                         return { success: false, error: `Contract error: ${decodedError.name}` };
//     //                 }
//     //             } catch (parseError) {
//     //                 console.error('Error parsing contract error:', parseError);
//     //                 return {
//     //                     success: false,
//     //                     error: 'Failed to parse contract error'
//     //                 };
//     //             }
//     //         }
//
//     //         return {
//     //             success: false,
//     //             error: 'Transaction would fail - check requirements'
//     //         };
//     //     }
//
//     //     // If gas estimation succeeds, proceed with the transaction
//     //     const tx = await contract.addNFTToInventory(formattedAddress, formattedTokenId);
//
//     //     console.log('3. --- Transaction sent:', tx.hash);
//
//     //     // Wait for transaction confirmation
//     //     console.log('4. --- Waiting for confirmation ---');
//     //     const receipt = await tx.wait();
//
//     //     console.log('5. --- Transaction confirmed ---', receipt);
//
//     //     return {
//     //         success: true,
//     //         transaction: tx
//     //     };
//
//     } catch (error: any) {
//         console.error('Error in addNFTToInventory:', error);
//
//         // Handle specific error cases
//         let errorMessage = 'Failed to add NFT to inventory';
//
//         if (error.code === 'ACTION_REJECTED') {
//             errorMessage = 'Transaction rejected by user';
//         } else if (error.code === 'INVALID_ARGUMENT') {
//             errorMessage = 'Invalid NFT address format';
//         } else if (error.data) {
//             try {
//                 const decodedError = errorInterface.parseError(error.data);
//                 // Add null check here too
//                 errorMessage = decodedError ? `Contract error: ${decodedError.name}` : 'Unknown contract error';
//             } catch {
//                 errorMessage = error.message || 'Unknown contract error';
//             }
//         }
//
//         return {
//             success: false,
//             error: errorMessage
//         };
//     }
// }
