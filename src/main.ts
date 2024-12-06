import './style.css'
import { getProvider, getCurrentAddress } from './utils/provider';
import { checkShapeXpNFTOwnership } from './features/nft-validation';
import { mintShapeXpNFT } from './features/nft-minting';
import { getGlobalExperience } from './features/experience-tracking';
import { ExperienceAmount } from './contracts/abis.ts';
import { addGlobalExperience } from './features/add-experience.ts';


declare global {
    interface Window {
        ethereum?: any;
    }
}

class ConnectionManager {
    private connectButton: HTMLButtonElement;
    private mintButton: HTMLButtonElement;
    private refreshExpButton: HTMLButtonElement;
    private expLowButton: HTMLButtonElement;
    private expMidButton: HTMLButtonElement;
    private expHighButton: HTMLButtonElement;
    private statusDisplay: HTMLElement;
    private nftStatusDisplay: HTMLElement;
    private mintStatusDisplay: HTMLElement;
    private experienceDisplay: HTMLElement;
    private addExpStatus: HTMLElement;

    constructor() {

        console.log('1. --- Initializing ConnectionManager --- ');
        this.connectButton = document.getElementById('connect-wallet') as HTMLButtonElement;
        this.mintButton = document.getElementById('mint-button') as HTMLButtonElement;
        this.refreshExpButton = document.getElementById('refresh-exp') as HTMLButtonElement;
        this.expLowButton = document.getElementById('add-exp-low') as HTMLButtonElement;
        this.expMidButton = document.getElementById('add-exp-mid') as HTMLButtonElement;
        this.expHighButton = document.getElementById('add-exp-high') as HTMLButtonElement;
        this.statusDisplay = document.getElementById('wallet-status') as HTMLElement;
        this.nftStatusDisplay = document.getElementById('nft-status') as HTMLElement;
        this.mintStatusDisplay = document.getElementById('mint-status') as HTMLElement;
        this.experienceDisplay = document.getElementById('experience-display') as HTMLElement;
        this.addExpStatus = document.getElementById('add-exp-status') as HTMLElement;

        this.setupEventListeners();
        this.checkInitialConnection();
    }

    private setupEventListeners() {

        console.log('2. --- Setting up Event listeners ---');

        this.connectButton.addEventListener('click', async () => {
            console.log('Connect button clicked');
            await this.connectWallet();
        });

        this.mintButton.addEventListener('click', async () => {
            console.log('Mint button clicked');
            await this.mintNFT();
        });

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => {
                console.log('Account changed');
                this.handleAccountChange();
            });
        }

        window.ethereum.on('chainChanged', () => {
            console.log('Network changed, reloading...');
            window.location.reload();
        });

        this.refreshExpButton.addEventListener('click', async () => {
            console.log('Refreshing experience...');
            await this.updateExperienceDisplay();
        });

        this.expLowButton.addEventListener('click', () => this.addExperience(ExperienceAmount.LOW));
        this.expMidButton.addEventListener('click', () => this.addExperience(ExperienceAmount.MID));
        this.expHighButton.addEventListener('click', () => this.addExperience(ExperienceAmount.HIGH));

    }

    private async checkInitialConnection() {
        console.log('3. --- Checking initial connection ---');
        if (window.ethereum) {
            const provider = await getProvider();
            try {
                const accounts = await provider.listAccounts();
                console.log('Initial accounts:', accounts);

                if (accounts.length > 0) {
                    this.updateUI(accounts[0].address);
                    await this.checkNFTOwnership();
                }

            } catch (error) {
                console.log('No initial connection');
            }
        }
    }

    private async connectWallet() {
        try {
            console.log('4. --- Connecting wallet ---');
            const address = await getCurrentAddress();

            console.log('Got address:', address);
            this.updateUI(address);

            await this.checkNFTOwnership();

        } catch (error) {
            console.error('Connection error:', error);
            this.statusDisplay.textContent = 'Error connecting wallet';
            this.statusDisplay.className = 'warning';
        }
    }

    private async checkNFTOwnership() {
        try {
            const hasNFT = await checkShapeXpNFTOwnership();
            this.nftStatusDisplay.textContent = hasNFT
                ? '✅ ShapeXp NFT: Found'
                : '❌ ShapeXp NFT: Not Found';
            this.nftStatusDisplay.className = hasNFT ? 'success' : 'warning';

            // Enable/disable mint button based on NFT ownership
            this.mintButton.disabled = hasNFT;
            this.mintStatusDisplay.textContent = hasNFT
                ? 'You already own a ShapeXp NFT'
                : 'Mint your ShapeXp NFT to get started!';

            // If user has NFT, fetch and display experience
            if (hasNFT) {
                await this.updateExperienceDisplay();
            } else {
                this.experienceDisplay.textContent = 'Mint NFT to view experience';
                this.experienceDisplay.className = 'warning';
            }

            // Optional: Disable/enable features based on NFT ownership
            if (!hasNFT) {
                console.log('8. --- User does not own ShapeXp NFT - some features will be disabled ---');
                // Here you could disable certain UI elements or show a message
            }

            this.expLowButton.disabled = !hasNFT;
            this.expMidButton.disabled = !hasNFT;
            this.expHighButton.disabled = !hasNFT;

        } catch (error) {
            console.error('Error checking NFT:', error);
            this.nftStatusDisplay.textContent = '⚠️ Error checking NFT status';
            this.nftStatusDisplay.className = 'warning';
            this.mintButton.disabled = true;
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
            this.experienceDisplay.textContent = 'Fetching...';
            this.refreshExpButton.disabled = true;

            const { formattedExperience } = await getGlobalExperience();

            this.experienceDisplay.textContent = `Global XP: ${formattedExperience}`;
            this.refreshExpButton.disabled = false;
        } catch (error) {
            console.error('Error updating experience display:', error);
            this.experienceDisplay.textContent = 'Error fetching experience';
            this.refreshExpButton.disabled = false;
        }
    }

    private updateUI(address: string) {
        console.log('Updating UI with address:', address);
        this.statusDisplay.textContent = `Connected: ${this.shortenAddress(address)}`;
        this.statusDisplay.className = 'success';
        this.connectButton.disabled = true;
        console.log('5. --- UI updated ---');
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
            this.setExperienceButtonsState(false);
        }
    }

    private setExperienceButtonsState(disabled: boolean) {
        this.expLowButton.disabled = disabled;
        this.expMidButton.disabled = disabled;
        this.expHighButton.disabled = disabled;
    }

    private handleAccountChange() {
        window.location.reload();
    }

    private shortenAddress(address: string): string {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ConnectionManager();
});
