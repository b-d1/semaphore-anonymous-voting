import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import {
    FastSemaphore,
    IProof, Identity
} from "semaphore-lib";

const PROVER_KEY_PATH: string = path.join('./circuitFiles', 'semaphore_final.zkey');
const CIRCUIT_PATH: string = path.join('./circuitFiles', 'semaphore.wasm');

const API_BASE_URL = 'http://localhost:8080'


FastSemaphore.setHasher('poseidon');


const register = async (identityCommitment: BigInt) => {
    const result = await axios.post(`${API_BASE_URL}/register`, {'identity': identityCommitment.toString()})
    return result.data.index;
};


const getCampaigns = async (): Promise<object> => {
    const result = await axios.get(`${API_BASE_URL}/campaigns`);
    return result.data;
};

const vote = async (identity: Identity, leafIndex: number, campaignName: string, voteOption: string) => {

    const witness = await getWitness(leafIndex);
    const externalNullifier = FastSemaphore.genExternalNullifier(campaignName);
    const fullProof = await FastSemaphore.genProofFromBuiltTree(identity, witness, externalNullifier , voteOption, CIRCUIT_PATH, PROVER_KEY_PATH);
    const nullifierHash: BigInt = FastSemaphore.genNullifierHash(externalNullifier, identity.identityNullifier, 20);

    const voteParameters = {
        proof: fullProof.proof,
        nullifier: nullifierHash.toString(),
        vote: voteOption,
        campaignName
    }

    await axios.post(`${API_BASE_URL}/vote`, voteParameters)

};


const getWitness = async (leafIndex: number): Promise<object> => {
    const result = await axios.get(`${API_BASE_URL}/witness/${leafIndex}`);

    const witness = result.data;
    // deserialize witness
    const pathElements: [[]] = witness.pathElements;
    witness.pathElements = pathElements.map(pathElement => pathElement.map(num => BigInt(num)));
    witness.leaf = witness.leaf.toString();
    witness.root = witness.root.toString();
    return witness;
}

export {
    register,
    getCampaigns,
    vote,
    getWitness
}

