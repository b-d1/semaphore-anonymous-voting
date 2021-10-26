import * as path from 'path';
import * as fs from 'fs';

import {ZkIdentity} from "@libsem/identity"
import { MerkleProof, FullProof, genSignalHash, genExternalNullifier, Semaphore } from "@libsem/protocols"
import poseidonHash from './hasher';
const Tree = require("incrementalquintree/build/IncrementalQuinTree")

import {
    VotingInputs,
    UserNullifier
} from "./types";

const VERIFIER_KEY_PATH = path.join('./circuitFiles', 'verification_key.json');
const verifierKey = JSON.parse(fs.readFileSync(VERIFIER_KEY_PATH, 'utf-8'));

let tree: any = null;

// Array that keeps the nullifier of users that voted (to prevent double voting)
const votedUsers: UserNullifier[] = [];

const init = () => {
    const depth = 20;
    const leavesPerNode = 5;
    const zeroValue = 0;
    tree = new Tree.IncrementalQuinTree(depth, zeroValue, leavesPerNode, poseidonHash)

}

const register = (identityCommitment: BigInt): number => {
    if(tree.leaves.includes(identityCommitment)) throw new Error("User already registered");

    tree.insert(identityCommitment);
    return tree.nextIndex - 1;
}

const getWitness = (leafIndex: number) => {
    return tree.genMerklePath(leafIndex);
}

const verifyVote = async (votingInputs: VotingInputs): Promise<boolean> => {

    if(votedUsers.includes(votingInputs.nullifier)) throw new Error("Double vote");

    const proof: FullProof = {
        proof: votingInputs.proof,
        publicSignals: [tree.root, votingInputs.nullifier, genSignalHash(votingInputs.vote), genExternalNullifier(votingInputs.campaignName)]
    };

    const status = await Semaphore.verifyProof(verifierKey, proof);

    if(!status) {
        throw new Error("Invalid vote proof");
    }

    votedUsers.push(votingInputs.nullifier);
    return true;

}

export {
    init,
    register,
    getWitness,
    verifyVote
}