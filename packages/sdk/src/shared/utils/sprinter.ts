// import useStore from "./store"

// // Subscribe to the store to listen for changes
// let currentSprinterTestnet = useStore.getState().sprinterTestnet;
// useStore.subscribe((state) => {
//   currentSprinterTestnet = state.sprinterTestnet;
// });

let currentSprinterTestnet = false;

export const getSprinterBaseUrl = (test?: boolean) => {
  const isTestnet = test || currentSprinterTestnet;
  return `https://api.${isTestnet ? "test." : ""}sprinter.buildwithsygma.com`;
};
