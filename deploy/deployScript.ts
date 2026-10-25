import { readFileSync } from "fs";
import path from "path";
import {
  TransactionHash,
  GenLayerClient,
  DecodedDeployData,
} from "genlayer-js/types";

export const isSuccessfulDeploymentReceipt = (receipt: {
  status?: number | string;
  statusName?: string;
}): boolean => {
  const numericStatus = Number(receipt.status);
  return (
    numericStatus === 5 ||
    numericStatus === 7 ||
    receipt.statusName === "ACCEPTED" ||
    receipt.statusName === "FINALIZED"
  );
};

type DeploymentReceiptLike = {
  data?: { contract_address?: string | null } | null;
  txDataDecoded?: unknown;
};

/**
 * Extract the deployed contract address from a deploy receipt.
 *
 * Different GenLayer networks populate different receipt fields: localnet and
 * hosted Studio (studionet) return it in `receipt.data.contract_address`,
 * while other chains expose it via the decoded deploy data. Checking only one
 * field based on the chain id made `genlayer deploy` report an `undefined`
 * address on Studionet (issue #104), so try both.
 */
export const getDeployedContractAddress = (
  receipt: DeploymentReceiptLike,
): string | undefined => {
  const decoded = (receipt.txDataDecoded as DecodedDeployData | undefined)
    ?.contractAddress;
  const fromData = receipt.data?.contract_address ?? undefined;
  return decoded || fromData || undefined;
};

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/football_bets.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      waitUntil: "decided",
      retries: 200,
    });

    if (!isSuccessfulDeploymentReceipt(receipt)) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const deployedContractAddress = getDeployedContractAddress(receipt);

    if (!deployedContractAddress) {
      throw new Error("Deployment receipt did not contain a contract address");
    }

    console.log(`Contract deployed at address: ${deployedContractAddress}`);
  } catch (error) {
    throw new Error(`Error during deployment:, ${error}`);
  }
}
