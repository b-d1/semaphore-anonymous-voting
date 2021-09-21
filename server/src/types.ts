
type UserNullifier = BigInt | string;

interface VotingCampaign {
    name: string;
    options: string[];
    stats: object;
}

interface VotingInputs {
    proof: string;
    nullifier: UserNullifier;
    vote: string;
    campaignName: string;
}

export {
    UserNullifier,
    VotingCampaign,
    VotingInputs
}