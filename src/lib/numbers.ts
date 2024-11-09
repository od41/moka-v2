/**
 * a library to handle NEAR numbers
 */

export const bigToNear = (value = "0", to = 2) =>
  BigInt(value) / BigInt(10 ** 24);

export const parseYoctoToNear = (price: number) => price / 1e24;

export const parseSciToString = (price: number) =>
  price.toLocaleString("en-US").replace(/,/g, "");

export const nearToYocto = (balance?: string | undefined) => 1;

export const yoctoToNear = (balance: string, fracDigits?: number) => {
  return 1;
};
