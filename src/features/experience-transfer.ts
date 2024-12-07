// src/features/experience-transfer.ts

// Constants
export const TRANSFER_EXPERIENCE_AMOUNT = 500;

// Types for managing experience state
export interface ExperienceState {
    globalExperience: number;
    slotExperiences: Map<string, number>;
}

// Helper function to get unique slot identifier
export function getSlotId(contractAddress: string, tokenId: string): string {
    return `${contractAddress}-${tokenId}`;
}

// Main experience manager class
export class ExperienceManager {
    private state: ExperienceState;

    constructor(initialGlobalExp: number) {
        this.state = {
            globalExperience: initialGlobalExp,
            slotExperiences: new Map()
        };
    }

    // Initialize slot experience
    public initializeSlot(contractAddress: string, tokenId: string, initialExp: number = 0) {
        const slotId = getSlotId(contractAddress, tokenId);
        this.state.slotExperiences.set(slotId, initialExp);
    }

    // Add experience to slot
    public addExperienceToSlot(contractAddress: string, tokenId: string): boolean {
        if (this.state.globalExperience < TRANSFER_EXPERIENCE_AMOUNT) {
            return false;
        }

        const slotId = getSlotId(contractAddress, tokenId);
        const currentExp = this.state.slotExperiences.get(slotId) || 0;

        // Update state
        this.state.globalExperience -= TRANSFER_EXPERIENCE_AMOUNT;
        this.state.slotExperiences.set(slotId, currentExp + TRANSFER_EXPERIENCE_AMOUNT);

        return true;
    }

    // Subtract experience from slot
    public subtractExperienceFromSlot(contractAddress: string, tokenId: string): boolean {
        const slotId = getSlotId(contractAddress, tokenId);
        const currentExp = this.state.slotExperiences.get(slotId) || 0;

        if (currentExp < TRANSFER_EXPERIENCE_AMOUNT) {
            return false;
        }

        // Update state
        this.state.globalExperience += TRANSFER_EXPERIENCE_AMOUNT;
        this.state.slotExperiences.set(slotId, currentExp - TRANSFER_EXPERIENCE_AMOUNT);

        return true;
    }

    // Getters
    public getGlobalExperience(): number {
        return this.state.globalExperience;
    }

    public getSlotExperience(contractAddress: string, tokenId: string): number {
        const slotId = getSlotId(contractAddress, tokenId);
        return this.state.slotExperiences.get(slotId) || 0;
    }
}
