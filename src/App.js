import { useEffect, useState } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./utils/load-contract";

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  });

  const [balance, setBalance] = useState(null);
  const [account, setAccount] = useState(null);
  const [shouldReload, setReload] = useState(false);

  const canConnectToContract = account && web3Api.contract;

  const reloadEffect = () => setReload(!shouldReload);

  const setAccountListener = (provider) => {
    provider.on("accountsChanged", (_) => window.location.reload());
    provider.on("chainChanged", (_) => window.location.reload());
  };

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider();

      if (provider) {
        const contract = await loadContract("Faucet", provider);
        setAccountListener(provider);
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true,
        });
      } else {
        setWeb3Api((api) => ({ ...api, isProviderLoaded: true }));
        console.log("Please, install MetaMask");
      }
    };

    loadProvider();
  }, []);

  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api;
      const balance = contract
        ? await web3.eth.getBalance(contract.address)
        : "0";
      setBalance(web3.utils.fromWei(balance, "ether"));
    };

    web3Api.web3 && loadBalance();
  }, [web3Api.web3, shouldReload]);

  useEffect(() => {
    const getAccount = async () => {
      const accounts = await web3Api.web3.eth.getAccounts();
      setAccount(accounts[0]);
    };

    web3Api.web3 && getAccount();
  }, [web3Api.web3]);

  const addFunds = async () => {
    const { contract, web3 } = web3Api;
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });
    reloadEffect();
  };

  const withdrawFunds = async () => {
    const { contract, web3 } = web3Api;
    const withdrawAmount = web3.utils.toWei("0.1", "ether");
    await contract.withdraw(withdrawAmount, {
      from: account,
    });
    reloadEffect();
  };

  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
          {web3Api.isProviderLoaded ? (
            <div className="is-flex is-align-items-center">
              <span>
                <strong className="mr-2">Account: </strong>
              </span>
              <h1>
                {account ? (
                  <div>{account}</div>
                ) : !web3Api.provider ? (
                  <>
                    <div className="notification is-warning is-small is-rounded">
                      Wallet is not detected!{` `}
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://docs.metamask.io"
                      >
                        Install MetaMask
                      </a>
                    </div>
                  </>
                ) : (
                  <button
                    className="button is-small"
                    onClick={() => {
                      web3Api.provider.request({
                        method: "eth_requestAccounts",
                      });
                    }}
                  >
                    Connect MetaMask
                  </button>
                )}
              </h1>
            </div>
          ) : (
            <span>Looking for Web3...</span>
          )}
          <div className="balance-view is-size-2 my-4">
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          {!canConnectToContract && (
            <i className="is-block">Connect to Ganache</i>
          )}
          <button
            className="button is-link mr-2"
            onClick={addFunds}
            disabled={!canConnectToContract}
          >
            Donate 1 ETH
          </button>
          <button
            className="button is-primary"
            onClick={withdrawFunds}
            disabled={!canConnectToContract}
          >
            Withdraw 0.1 ETH
          </button>
        </div>
      </div>
    </>
  );
}

export default App;
