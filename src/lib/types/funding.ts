export type FundingSourceType = 'investor' | 'client' | 'other';

export interface FundingSource {
    id: string;
    name: string;
    type: FundingSourceType;
    amount: number;
    notes?: string;
    committed_date: string;
    created_at: string;
    updated_at: string;
}
