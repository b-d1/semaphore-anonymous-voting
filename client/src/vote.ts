// Single user vote

import {register, vote, getCampaigns} from './api'
import {
    FastSemaphore,
    Identity
} from "semaphore-lib";


const main = async () => {

    const identity: Identity = FastSemaphore.genIdentity();
    const identityCommitment: BigInt = FastSemaphore.genIdentityCommitment(identity);

    // Register to the voting app
    const leafIndex = await register(identityCommitment);

    // Vote
    await vote(identity, leafIndex, 'campaign1', 'yes');

    console.log("Voting successful!");

    // Get campaign results
    const campaigns = await getCampaigns();
    console.log("Voting stats:");

    console.log(campaigns);
    return;

};

main();