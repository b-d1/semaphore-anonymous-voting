// Single user vote

import {register, vote, getCampaigns} from './api'
import {ZkIdentity} from "@libsem/identity"


const main = async () => {

    const identity: ZkIdentity = new ZkIdentity();
    const identityCommitment: BigInt = identity.genIdentityCommitment();

    // Register to the voting app
    const leafIndex = await register(identityCommitment);

    // Vote
    await vote(identity, leafIndex, 'campaign1', 'yes');

    console.log("Voting successful!");

    // Get campaign results
    const campaigns = await getCampaigns();
    console.log("Voting stats:");

    console.log(campaigns);

};

main().then(() => {
    process.exit(0);
});