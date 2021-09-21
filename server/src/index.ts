import express from "express";
import { init, getWitness, register, verifyVote } from './semaphore'
import { VotingCampaign, VotingInputs } from './types'

// init express
const app = express();
const port = 8080;
app.use(express.json())

// init semaphore
init();

// init voting
const votingCampaigns: VotingCampaign[] = [];
const campaign1: VotingCampaign = {
    name: 'campaign1',
    options: ['yes', 'no'],
    stats: {
        'yes': 0,
        'no': 0
    }
}
votingCampaigns.push(campaign1);

app.get("/", (req, res) => {
    res.send("Welcome to Anon voting campaigns v1!");
});

app.get("/witness/:index", (req, res) => {
    try {
        const index = parseInt(req.params.index, 10);

        const witness = getWitness(index);
        // serialize witness (BigInts)
        const result = {
            ...witness,
            root: witness.root.toString(),
            leaf: witness.root.toString(),
            pathElements: witness.pathElements.map(pathElement => pathElement.map(bigInt => bigInt.toString()))
        }
        res.json(result);
    } catch (e: any) {
        res.status(500).json({'error': e.message})
    }
});

app.post("/register", (req, res, next) => {
    try {
        const identityCommitment = BigInt(req.body.identity);
        const index = register(identityCommitment);
        res.json({ 'index': index });
    } catch (e: any) {
        if (e.message === 'User already registered') {
            res.status(400)
        } else {
            res.status(500)
        }
        res.json({'error': e.message})
    }
});

app.post("/vote", async (req, res) => {
    try {
        const votingInputs: VotingInputs = req.body;
        const voteCampaign = votingCampaigns.find(campaign => campaign.name === votingInputs.campaignName);

        if (!voteCampaign) throw new Error("Invalid voting campaign");
        if (!voteCampaign.options.includes(votingInputs.vote)) throw new Error("Invalid vote");

        if (typeof votingInputs.nullifier === 'string') {
            votingInputs.nullifier = BigInt(votingInputs.nullifier);
        }

        await verifyVote(votingInputs);

        voteCampaign.stats[votingInputs.vote] += 1;
        res.json({ 'success': true });

    } catch (e: any) {
        if (['Invalid voting campaign', 'Invalid vote','Invalid vote proof','Double vote'].includes(e.message)) {
            res.status(400);
        } else {
            res.status(500);
        }
        res.json({ 'error': e.message });
    }
});


app.get("/campaigns", (req, res) => {
    res.json(votingCampaigns);
});


app.get("/campaign/:name", (req, res) => {
    try {
    const name = req.params.name;

    const votingCampaign = votingCampaigns.find(campaign => campaign.name === name);
    if (!votingCampaigns) throw new Error("Invalid voting campaign name");

    res.json(votingCampaign);

} catch (e: any) {
    if (e.message === "Invalid voting campaign name") {
        res.status(400);
    } else {
        res.status(500);
    }
    res.json({ 'error': e.message });
}

});


// start the Express server
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});