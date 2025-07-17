import { providers, utils } from "ethers";
import { useEffect, useState } from "react";

// Check if MetaMask is installed
export const _isMetaMaskInstalled = () => {
  if (typeof window === "undefined") return false;
  const { ethereum } = window;
  return Boolean(ethereum && ethereum.isMetaMask);
};

// Get the provider
export const _getProvider = () => {
  if (!_isMetaMaskInstalled()) return null;
  return new providers.Web3Provider(window.ethereum);
};

// Get current chain ID
export const _getChain = async () => {
  const provider = _getProvider();
  if (!provider) return -1;
  return `${(await provider.getNetwork()).chainId}`;
};

// Listen to account change
const _onAccountsChanged = (callback) => {
  if (!_isMetaMaskInstalled()) return;
  window.ethereum.on("accountsChanged", callback);
};

// Listen to chain change
const _onChainChanged = (callback) => {
  if (!_isMetaMaskInstalled()) return;
  window.ethereum.on("chainChanged", callback);
};

// Get connected wallet address
export const _getAddress = async () => {
  const provider = _getProvider();
  if (!provider) return null;
  try {
    const accounts = await provider.listAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  } catch (e) {
    return null;
  }
};

// Custom hook to track wallet and chain state
export const WalletHook = () => {
  const [wallet, setWallet] = useState(null);
  const [chain, setChain] = useState(-1);

  useEffect(() => {
    const load = async () => {
      try {
        setWallet((await _getAddress())?.toLowerCase());
        setChain(await _getChain());
      } catch (error) {
        return error;
      }
    };

    _onAccountsChanged((_address) => {
      if (!_address[0]) return;
      setWallet(_address[0].toLowerCase());
    });

    _onChainChanged((_chain) => {
      if (!_chain) return;
      setChain(`${parseInt(_chain)}`);
    });

    load();
  }, []);

  return {
    wallet,
    chain,
  };
};

// Connect MetaMask wallet
export const connectMetamask = async () => {
  if (!_isMetaMaskInstalled()) return false;
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

// Switch to Avalanche Mainnet or add it if not found
export const switchToMainnet = async () => {
  if (!_isMetaMaskInstalled()) return false;

  const chainIdHex = `0x${parseInt(process.env.REACT_APP_CHAIN).toString(16)}`; // 43114 = 0xa86a

  try {
    // Try switching
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch (switchError) {
    // Chain not added yet, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: chainIdHex,
              chainName: "Avalanche Mainnet C-Chain",
              nativeCurrency: {
                name: "Avalanche",
                symbol: "AVAX",
                decimals: 18,
              },
              rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
              blockExplorerUrls: ["https://snowtrace.io"],
            },
          ],
        });

        // Switch again after adding
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainIdHex }],
        });

        return true;
      } catch (addError) {
        console.error("Failed to add Avalanche chain:", addError);
        return false;
      }
    } else {
      console.error("Switch chain error:", switchError);
      return false;
    }
  }
};

// Watch transaction completion
export const watchTransaction = (txHash, callback) => {
  const provider = _getProvider();
  if (!provider) return;
  provider.once(txHash, (transaction) => {
    callback(transaction, transaction.status === 1);
  });
};

// Parse BigNumber values with commas
export const parseBigNumber = (bn, decimals = 2) => {
  if (!bn) return 0;
  try {
    return numberWithCommas(
      parseFloat(utils.formatUnits(bn, "gwei")).toFixed(decimals)
    );
  } catch (e) {
    return bn;
  }
};

// Format number with commas
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
