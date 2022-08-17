import Head from "next/head";
import styles from "../styles/Home.module.css";
import React, { useState, useEffect, useRef } from "react";
import Web3Modal from "web3modal";
import { BigNumber, Contract, providers, utils } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  NFT_CONTRACT_ABI,
  NFT_CONTRACT_ADDRESS,
} from "../constants";

export default function Home() {
  const zero = BigNumber.from(0);
  // keep tracks of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // create a reference to the Web3Modal
  const web3ModalRef = useRef();
  // tokens that have been minted till now out of 10000 max supply
  const [tokensMinted, setTokensMinted] = useState(zero);
  // number of Crypto Dev Tokens owned by the address
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] =
    useState(zero);
  // set loading to true when we are waiting for the transaction to be mined
  const [loading, setLoading] = useState(false);
  // tokens that havent been claimed based on the number of Crypto Dev NFT's owned by the user
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  // amount of the tokens that the user want to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  // check the user is the owner or not
  const [isOwner, setIsOwner] = useState(false);

  // mint tokens to a given address
  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const value = amount * 0.001;
      const tx = await tokenContract.mint(amount, {
        value: utils.parseEther(value.toString()),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);

      window.alert("Successfully minted Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  };

  const claimCryptoDevToken = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.claim();
      setLoading(true);
      await tx.wait();
      setLoading(false);

      window.alert("Successfully minted a Crypto Dev Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.error(error);
    }
  };

  // check the balance of tokens that can be claimed by the user
  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);
      // balance is a Big Number
      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        let amount = 0;
        for (let i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  };

  // check the balance of Crypto Dev Tokens held by an address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const signer = await getProviderOrSigner(true);
      const _address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(_address);

      setBalanceOfCryptoDevTokens(balance);
    } catch (error) {
      console.error(error);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  // get the total tokens have been minted till now out of the total supply
  const getTotalTokensMinted = async () => {
    try {
      // no need for signer as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // create an instance of token contract
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      // get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (error) {
      console.error(error);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        NFT_CONTRACT_ABI,
        provider
      );

      const _owner = await nftContract.owner();
      // we get the signer to extract the address of currently connected Metamask account
      const signer = await getProviderOrSigner(true);
      // get the address to signer which is connected to Metamask
      const address = await signer.getAddress();
      if (address.toLowerCase() == _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // withdraw ether by calling withdraw function in the contract
  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        signer
      );

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (error) {
      console.error(error);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    try {
      // connect to Metamask
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new Error("Change the network to Goerli");
      }

      if (needSigner) {
        const signer = await web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      // get the provider from web3modal
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (error) {
      console.error(error);
    }
  };

  // returns a button based on the state of the dapp
  const renderButton = () => {
    if (loading) {
      return (
        <div>
          <button className={styles.button}>Loading...</button>
        </div>
      );
    }

    // if owner is connected, withdrawCoins() is called
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }

    // return claim button if tokens to be claimed is greater than 0
    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed * 10} to be claimed!
          </div>
          <button className={styles.button} onClick={claimCryptoDevToken}>
            Claim Tokens
          </button>
        </div>
      );
    }

    // if user does not have any tokens to claim, show the mint button
    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button
          className={styles.button}
          disabled={!(tokenAmount > 0)}
          onClick={() => mintCryptoDevToken(tokenAmount)}
        >
          Mint Tokens
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (!walletConnected) {
      // if wallet is not connected, create a new instance of the web3 modal and connect to Metamask wallet
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      withdrawCoins();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Crypto Devs</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs</h1>
          <div className={styles.description}>
            You can mint or claim Crypto Dev Token here
          </div>
          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}{" "}
                Crypto Dev Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)}/10000 have been
                minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button className={styles.button} onClick={connectWallet}>
              Connect your wallet
            </button>
          )}
        </div>
        <div>
          <img className={styles.image} src="./0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
