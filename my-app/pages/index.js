import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import React,{useState,useEffect,useRef} from "react";
import {Contract, providers, utils} from "ethers";
import Web3Modal from "web3modal";
import {abi, NFT_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  const web3ModalRef = useRef();

  const presaleMint = async () =>{
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.presaleMint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      console.log("You succesfully mint a Crypto Dev");
    }catch(err){
      console.error(err);
    }
  }

  const publicMint = async () =>{
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.mint({
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      await tx.wait();
      setLoading(false);
      console.log("You succesfully mint a Crypto Dev");
    }catch(err){
      console.error(err);
    }
  }

  const connectWallet = async () =>{
    try{
      await getProviderOrSigner();
      setWalletConnected(true);
    }catch(err){
      console.error(err);
    }
  }

  const startPresale = async () =>{
    try{
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      const tx = await nftContract.startPresale();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      console.log("You succesfully launch the presale");
      await checkIfPresaleStarted();
    }catch(err){
      console.error(err);
    }
  }

  const checkIfPresaleStarted = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleStarted = await nftContract.presaleStarted();
      if(!_presaleStarted){
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    }catch(err){
      console.error(err);
      return false;
    }
  }

  const checkIfPresaleEnded = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _presaleEnded = await nftContract.presaleEnded();
      const hasEnded= _presaleEnded.lt(Math.floor(Date.now()/1000));
      if(hasEnded){
        setPresaleEnded(true);
      }else{
        setPresaleEnded(false);
      }
      return hasEnded;
    }catch(err){
      console.error(err);
      return false;
    }
  }

  const getOwner = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const _owner = await nftContract.owner();
      const signer = await getProviderOrSigner(true);
      const _address = signer.getAddress();
      if(_owner.toLowerCase() === _address.toLowerCase()){
        setIsOwner(true);
      }else{
        setIsOwner(false);
      }
    }catch(err){
      console.error(err);
    }
  }

  const getTokenIdsMinted = async () =>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      const tokenIds = await nftContract.tokenIds();
      setTokenIdsMinted(tokenIds.toString());
    }catch(err){
      console.error(err);
    }
  }

  const getProviderOrSigner = async (needSigner = false) =>{
    const provider = await web3ModalRef.current.connect();
    const web3Provider = await providers.Web3Provider(provider);

    const {chainId} = await web3Provider.getNetwork();
    if(chainId !==5){
      window.alert("Change the network to Goerli");
      throw new Error("Change networl to Goerli")
    }

    if(needSigner){
      const signer = await web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  useEffect(()=>{
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      const _presaleStarted = checkIfPresaleStarted();
      if(_presaleStarted){
        checkIfPresaleEnded();
      }
      getTokenIdsMinted();

      const presaleEndedInterval = setInterval(async function(){
        const _presaleStarted = await checkIfPresaleStarted();
        if(_presaleStarted){
          const _presaleEnded = await checkIfPresaleEnded();
          if(_presaleEnded){
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5*1000);

      setInterval(async function(){
        await getTokenIdsMinted();
      }, 5*1000);
    }
  },[walletConnected])

  const renderButton = () =>{
    if(!walletConnected){
      return(
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    if(loading){
      return(
        <button className={styles.button}>Loading...</button>
      );
    }

    if(isOwner && !presaleStarted){
      return(
        <button onClick={startPresale} className={styles.button}>
          Start the Presale
        </button>
      );
    }

    if(!presaleStarted){
      return(
        <div className={styles.description}>
          Preale has not started yet!
        </div>
      );
    }

    if(presaleStarted && !presaleEnded){
      return(
        <div>
          <div className={styles.description}>
            The presale minting have started. If your address is whitelisted, you can mint.
          </div>
          <button onClick ={presaleMint} className={styles.button}>
            Presale Mint
          </button>
        </div>
      );
    }

    if(presaleStarted && presaleEnded){
      return(
        <button onClick ={publicMint} className={styles.button}>
          Public Mint
        </button>
      );
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Dev</h1>
          <div className={styles.description}>
            It is a NFT Collection for developers in Crypto
          </div>
          <div className={styles.description}>
            There are {tokenIdsMinted}/20 which have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./"/>
        </div>
      </main>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Dev
      </footer>
    </div>
  )
}
