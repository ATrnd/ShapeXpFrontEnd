import './style.css'
import { getProvider, getCurrentAddress } from './utils/provider';
import { checkShapeXpNFTOwnership } from './features/nft-validation';
import { mintShapeXpNFT } from './features/nft-minting';
import { getGlobalExperience } from './features/experience-tracking';
import { addGlobalExperience } from './features/add-experience.ts';
import { ExperienceAmount } from './contracts/abis.ts';
import { fetchUserNFTs, filterNFTs, SimpleNFT, createNFTElement } from './features/nft-fetching';
import { SHAPE_XP_NFT_ADDRESS } from './contracts/addresses';
import { renderInventory } from './features/inventory-management';
import { addNFTToInventory } from './features/inventory-actions';

declare global {
    interface Window {
        ethereum?: any;
    }
}

class ConnectionManager {

    // Essential UI elements for wallet connection
    private connectButton: HTMLButtonElement;
    private statusDisplay: HTMLElement;

    // NFT status
    private nftStatusDisplay: HTMLElement;
    private mintButton: HTMLButtonElement;
    private mintStatusDisplay: HTMLElement;

    // experience lookup elements
    private experienceDisplay: HTMLElement;
    private refreshExpButton: HTMLButtonElement;

    // experience addition elements
    private expLowButton: HTMLButtonElement;
    private expMidButton: HTMLButtonElement;
    private expHighButton: HTMLButtonElement;
    private addExpStatus: HTMLElement;

    // New NFT fetching elements
    private fetchNFTsButton: HTMLButtonElement;
    private nftList: HTMLElement;
    private nftFetchStatus: HTMLElement;

    // inventory element
    private inventoryContainer: HTMLElement;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkInitialConnection();
    }

    private initializeElements() {

        // Get required DOM elements
        this.connectButton = document.getElementById('connect-wallet') as HTMLButtonElement;
        this.statusDisplay = document.getElementById('wallet-status') as HTMLElement;

        // NFT status
        this.nftStatusDisplay = document.getElementById('nft-status') as HTMLElement;
        this.mintButton = document.getElementById('mint-button') as HTMLButtonElement;
        this.mintStatusDisplay = document.getElementById('mint-status') as HTMLElement;

        // experience elements
        this.experienceDisplay = document.getElementById('experience-display') as HTMLElement;
        this.refreshExpButton = document.getElementById('refresh-exp') as HTMLButtonElement;

        // experience addition buttons
        this.expLowButton = document.getElementById('add-exp-low') as HTMLButtonElement;
        this.expMidButton = document.getElementById('add-exp-mid') as HTMLButtonElement;
        this.expHighButton = document.getElementById('add-exp-high') as HTMLButtonElement;
        this.addExpStatus = document.getElementById('add-exp-status') as HTMLElement;

        // NFT fetching elements
        this.fetchNFTsButton = document.getElementById('fetch-nfts') as HTMLButtonElement;
        this.nftList = document.getElementById('nft-list') as HTMLElement;
        this.nftFetchStatus = document.getElementById('nft-fetch-status') as HTMLElement;

        // Inventory elements
        this.inventoryContainer = document.getElementById('inventory-container') as HTMLElement;

        // Connect btn & ShapeXp NFT elements
        if (!this.connectButton || !this.statusDisplay || !this.nftStatusDisplay) {
            throw new Error('Required [connectButton, statusDisplay, nftStatusDisplay] elements not found');
        }

        // Mint, MintStatus & XP elements
        if (!this.mintButton || !this.mintStatusDisplay || !this.experienceDisplay) {
            throw new Error('Required [mintButton, mintStatusDisplay, experienceDisplay] elements not found');
        }

        // Exp Refresh & Amount & status elements
        if (!this.refreshExpButton || !this.expLowButton || !this.expMidButton || !this.expHighButton || !this.addExpStatus) {
            throw new Error('Required [refreshExpButton, expLowButton, expMidButton, expHighButton, addExpStatus] elements not found');
        }

        // NFT fetching elements
        if (!this.fetchNFTsButton || !this.nftList || !this.nftFetchStatus) {
            throw new Error('Required [fetchNFTsButton, nftList, nftFetchStatus] elements not found');
        }

        if (!this.inventoryContainer) {
            throw new Error('Required [inventoryContainer] not found');
        }

    }

    private setupEventListeners() {

        // connection listener
        this.connectButton.addEventListener('click', () => this.connectWallet());

        // mint listener
        this.mintButton.addEventListener('click', () => this.mintNFT());

        // exp refresh listener
        this.refreshExpButton.addEventListener('click', () => this.updateExperienceDisplay());

        // exp addition listener
        this.expLowButton.addEventListener('click', () => this.addExperience(ExperienceAmount.LOW));
        this.expMidButton.addEventListener('click', () => this.addExperience(ExperienceAmount.MID));
        this.expHighButton.addEventListener('click', () => this.addExperience(ExperienceAmount.HIGH));

        // exp fetch listener
        this.fetchNFTsButton.addEventListener('click', () => this.handleFetchNFTs());

        // Setup MetaMask account change listener
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => window.location.reload());
            window.ethereum.on('chainChanged', () => window.location.reload());
        }
    }

    private async checkInitialConnection() {
        if (!window.ethereum) return;

        try {
            const provider = await getProvider();
            const accounts = await provider.listAccounts();

            if (accounts.length > 0) {
                this.updateUI(accounts[0].address);
                // Add NFT check after successful connection
                await this.checkNFTOwnership();
            }
        } catch (error) {
            console.log('No initial connection');
        }
    }

    private async connectWallet() {
        try {
            const address = await getCurrentAddress();
            this.updateUI(address);
            // Add NFT check after successful connection
            await this.checkNFTOwnership();
        } catch (error) {
            console.error('Connection error:', error);
            this.statusDisplay.textContent = 'Error connecting wallet';
            this.statusDisplay.className = 'warning';
        }
    }

    private async checkNFTOwnership() {
        try {
            // Call the NFT ownership check function
            const hasNFT = await checkShapeXpNFTOwnership();

            // Update NFT status display
            this.nftStatusDisplay.textContent = hasNFT
                ? '✅ ShapeXp NFT: Found'
                : '❌ ShapeXp NFT: Not Found';
                this.nftStatusDisplay.className = hasNFT ? 'success' : 'warning';

                // Update mint button state
                this.mintButton.disabled = hasNFT;
                this.mintStatusDisplay.textContent = hasNFT
                    ? 'You already own a ShapeXp NFT'
                    : 'Mint your ShapeXp NFT to get started!';

                    // Handle experience display based on NFT ownership
                    if (hasNFT) {
                        this.refreshExpButton.disabled = false;
                        this.setExperienceButtonsState(false);
                        this.fetchNFTsButton.disabled = false;

                        await Promise.all([
                            this.updateExperienceDisplay(),
                            this.handleFetchNFTs(),
                            this.updateInventoryDisplay() // New inventory update
                        ]);

                    } else {
                        this.experienceDisplay.textContent = 'Mint NFT to view experience';
                        this.experienceDisplay.className = 'warning';
                        this.nftFetchStatus.textContent = 'Mint ShapeXp NFT to view your NFTs';
                        this.inventoryContainer.innerHTML = 'Mint ShapeXp NFT to view inventory';
                        this.inventoryContainer.className = 'warning';
                        this.refreshExpButton.disabled = true;
                        this.setExperienceButtonsState(true);
                    }
                    return hasNFT;

        } catch (error) {
            console.error('Error checking NFT:', error);
            this.nftStatusDisplay.textContent = '? Error checking NFT status';
            this.nftStatusDisplay.className = 'warning';
            this.inventoryContainer.innerHTML = 'Error loading inventory';
            this.inventoryContainer.className = 'warning';
            this.mintButton.disabled = true;
            this.refreshExpButton.disabled = true;
            this.setExperienceButtonsState(true);
            this.fetchNFTsButton.disabled = true;
            return false;
        }
    }

    private async mintNFT() {
        try {
            // Update UI to show pending state
            this.mintButton.disabled = true;
            this.mintStatusDisplay.textContent = '? Minting in progress...';
            this.mintStatusDisplay.className = 'pending';

            // Call mint function
            const tx = await mintShapeXpNFT();

            // Update UI to show mining status
            this.mintStatusDisplay.textContent = '? Transaction mining...';

            // Wait for transaction to be mined
            await tx.wait();

            // Update UI for success
            this.mintStatusDisplay.textContent = '? NFT successfully minted!';
            this.mintStatusDisplay.className = 'success';

            // Recheck NFT ownership to update status
            await this.checkNFTOwnership();

        } catch (error: any) {
            console.error('Minting error:', error);
            this.mintButton.disabled = false;
            this.mintStatusDisplay.textContent = `? Minting failed: ${error.message}`;
            this.mintStatusDisplay.className = 'warning';
        }
    }

    private async updateExperienceDisplay() {
        try {
            // Show loading state
            this.experienceDisplay.textContent = 'Fetching...';
            this.refreshExpButton.disabled = true;

            // Get experience data
            const { formattedExperience } = await getGlobalExperience();

            // Update display
            this.experienceDisplay.textContent = `Global XP: ${formattedExperience}`;
            this.experienceDisplay.className = 'success';
            this.refreshExpButton.disabled = false;
        } catch (error) {
            console.error('Error updating experience display:', error);
            this.experienceDisplay.textContent = 'Error fetching experience';
            this.experienceDisplay.className = 'warning';
            this.refreshExpButton.disabled = false;
        }
    }

    private setExperienceButtonsState(disabled: boolean) {
        this.expLowButton.disabled = disabled;
        this.expMidButton.disabled = disabled;
        this.expHighButton.disabled = disabled;
    }

    private async addExperience(expType: ExperienceAmount) {
        try {
            // Disable buttons and show pending state
            this.setExperienceButtonsState(true);
            this.addExpStatus.textContent = 'Adding experience...';
            this.addExpStatus.className = 'pending';

            // Call contract function
            const tx = await addGlobalExperience(expType);
            this.addExpStatus.textContent = 'Transaction submitted...';

            // Wait for confirmation
            await tx.wait();

            // Update UI
            this.addExpStatus.textContent = 'Experience added successfully!';
            this.addExpStatus.className = 'success';

            // Refresh experience display
            await this.updateExperienceDisplay();

        } catch (error: any) {
            console.error('Add experience error:', error);
            this.addExpStatus.textContent = `Failed to add experience: ${error.message}`;
            this.addExpStatus.className = 'warning';
        } finally {
            // Re-enable buttons regardless of outcome
            this.setExperienceButtonsState(false);
        }
    }

    private async handleFetchNFTs() {
        try {
            // Update UI to show fetching state
            this.nftFetchStatus.textContent = 'Fetching NFTs...';
            this.fetchNFTsButton.disabled = true;
            this.nftList.innerHTML = '';

            // Fetch NFTs
            const allNFTs = await fetchUserNFTs();

            // Filter out ShapeXpNFT from the list
            const filteredNFTs = filterNFTs(allNFTs, [SHAPE_XP_NFT_ADDRESS.toLowerCase()]);

            // Display NFTs
            this.displayNFTs(filteredNFTs);

            // Update status
            this.nftFetchStatus.textContent = `Found ${filteredNFTs.length} NFTs`;
            this.nftFetchStatus.className = 'success';

        } catch (error: any) {
            console.error('NFT fetch error:', error);
            this.nftFetchStatus.textContent = error.message;
            this.nftFetchStatus.className = 'warning';
        } finally {
            this.fetchNFTsButton.disabled = false;
        }
    }

    private displayNFTs(nfts: SimpleNFT[]) {
        this.nftList.innerHTML = '';

        nfts.forEach(nft => {
            const nftElement = createNFTElement(nft);

            // Get the add to inventory button
            const addButton = nftElement.querySelector('.add-to-inventory-btn') as HTMLButtonElement;
            const statusElement = nftElement.querySelector('.add-status') as HTMLElement;

            if (addButton && statusElement) {
                addButton.addEventListener('click', async () => {
                    try {
                        // Disable button during transaction
                        addButton.disabled = true;
                        statusElement.textContent = 'Adding to inventory...';
                        statusElement.className = 'add-status pending';

                        const result = await addNFTToInventory(
                            nftElement.dataset.contractAddress!,
                            nftElement.dataset.convertedTokenId!
                        );

                        if (result.success) {
                            statusElement.textContent = 'Successfully added to inventory!';
                            statusElement.className = 'add-status success';
                            // Update inventory display
                            await this.updateInventoryDisplay();
                        } else {
                            statusElement.textContent = result.error || 'Unknown error occurred';
                            statusElement.className = 'add-status error';
                            addButton.disabled = false;
                        }

                    } catch (error: any) {
                        console.error('Add to inventory error:', error);
                        statusElement.textContent = error.message || 'Failed to add to inventory';
                        statusElement.className = 'add-status error';
                        addButton.disabled = false;
                    }
                });
            }

            this.nftList.appendChild(nftElement);
        });
    }

    private async updateInventoryDisplay() {
        try {
            this.inventoryContainer.innerHTML = '<div class="loading">Loading inventory...</div>';

            await renderInventory('inventory-container');

            // Add event listener for inventory updates
            document.addEventListener('inventory-updated', () => {
                // Refresh NFT list when inventory changes
                this.handleFetchNFTs();
            });

        } catch (error: any) {
            console.error('Error updating inventory:', error);
            this.inventoryContainer.innerHTML = `
                <div class="error">
                    Failed to load inventory: ${error.message}
                </div>
            `;
        }
    }

    private handleNFTSelection(nftData: {
        contractAddress: string,
        tokenId: string,
        convertedTokenId: string
    }) {
        console.log('Selected NFT:', nftData);
    }

    private updateUI(address: string) {

        // Update status display with shortened address
        this.statusDisplay.textContent = `Connected: ${this.shortenAddress(address)}`;
        this.statusDisplay.className = 'success';

        // Disable connect button since we're connected
        this.connectButton.disabled = true;
    }

    private shortenAddress(address: string): string {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConnectionManager();
});
