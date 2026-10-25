import { describe, expect, it } from "vitest";
import {
  getDeployedContractAddress,
  isSuccessfulDeploymentReceipt,
} from "../../deploy/deployScript";

describe("deployment receipt success", () => {
  it("does not treat UNDETERMINED as a successful deployment", () => {
    expect(
      isSuccessfulDeploymentReceipt({
        status: 6,
        statusName: "UNDETERMINED",
      }),
    ).toBe(false);
  });

  it("accepts only accepted or finalized decisions", () => {
    expect(isSuccessfulDeploymentReceipt({ status: 5 })).toBe(true);
    expect(isSuccessfulDeploymentReceipt({ statusName: "FINALIZED" })).toBe(
      true,
    );
    expect(
      isSuccessfulDeploymentReceipt({ statusName: "LEADER_TIMEOUT" }),
    ).toBe(false);
  });
});

describe("deployed contract address", () => {
  const address = "0xC5b170df0BF24F656e97163FF9082166c4EdDE0F";

  it("reads receipt.data.contract_address (localnet / Studionet)", () => {
    expect(
      getDeployedContractAddress({ data: { contract_address: address } }),
    ).toBe(address);
  });

  it("falls back to receipt.data when decoded deploy data has no address", () => {
    expect(
      getDeployedContractAddress({
        data: { contract_address: address },
        txDataDecoded: {},
      }),
    ).toBe(address);
  });

  it("reads the decoded deploy data address", () => {
    expect(
      getDeployedContractAddress({ txDataDecoded: { contractAddress: address } }),
    ).toBe(address);
  });

  it("returns undefined when no address is present", () => {
    expect(getDeployedContractAddress({})).toBeUndefined();
    expect(getDeployedContractAddress({ data: null })).toBeUndefined();
  });
});
