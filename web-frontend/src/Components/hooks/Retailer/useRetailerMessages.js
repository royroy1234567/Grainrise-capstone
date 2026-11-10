import useFarmerMessages from "../Farmer/useFarmerMessages";

export default function useRetailerMessages() {
  return useFarmerMessages({
    apiPrefix: "/retailer",
    cacheNamespace: "retailer",
    senderType: "retailer",
  });
}
