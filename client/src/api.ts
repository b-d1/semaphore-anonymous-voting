import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

import {ZkIdentity} from "@libsem/identity"
import { MerkleProof, FullProof, genSignalHash, genExternalNullifier, Semaphore } from "@libsem/protocols"

const PROVER_KEY_PATH: string = path.join('./circuitFiles', 'semaphore_final.zkey');
const CIRCUIT_PATH: string = path.join('./circuitFiles', 'semaphore.wasm');

const API_BASE_URL = 'http://localhost:8080'




const register = async (identityCommitment: BigInt) => {
    const result = await axios.post(`${API_BASE_URL}/register`, {'identity': identityCommitment.toString()})
    return result.data.index;
};


const getCampaigns = async (): Promise<object> => {
    const result = await axios.get(`${API_BASE_URL}/campaigns`);
    return result.data;
};

const vote = async (identity: ZkIdentity, leafIndex: number, campaignName: string, voteOption: string) => {

    const merkleProof = await getWitness(leafIndex);
    const externalNullifier = genExternalNullifier(campaignName);
    const witness: FullProof = await Semaphore.genWitness(identity.getIdentity(), merkleProof, externalNullifier , voteOption);
    const nullifierHash: BigInt = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier(), 20);

    const fullProof: FullProof = await Semaphore.genProof(witness, CIRCUIT_PATH, PROVER_KEY_PATH)

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

