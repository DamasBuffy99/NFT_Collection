import Head from "next/head";
import Web3Modal from "web3modal";
import {useState, useEffect, useRef} from "react";
import {Contract,providers,utils} from "ethers";
import {NFT_CRYPTO_ADDRESS, abi} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home(){
    const [walletConnected,setWalletConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    //const [whitelisted,setWhitelisted] = useState(false);
    //const [getNFT,setGetNFT] = useState(false);
    const [tokenIdsMinted,setTokenIdsMinted] = useState("0"); //string
    const [presaleStarted,setPresaleStarted] = useState(false);
    const [presaleEnded,setPresaleEnded] = useState(false);
    const [isOwner,setIsOwner] = useState(false);
    const web3ModalRef = useRef();

    function getProviderOrSigner = async (needProvider = false) =>{
        const provider = await web3ModalRef.current.connect();
        const web3Provider = new providers.Web3Provider(provider);

        const {chainId} = await web3Provider.getNetwork();
        if(chainId!=5){
            window.alert("Change the network to Goerli");
            throw new Error("Change the network to Goerli");
        }
        if(needProvider){
            const signer = web3Provider.getSigner();
            return signer;
        }
        return web3Provider;
    };
    function privateMint = async () =>{
        try{
            const signer = await getProviderOrSigner(true);
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,signer);
            const tx = nft.privateMint({
                value:utils.parseEther("0.01");
            });
            setLoading(true);
            await tx.wait();
            setLoading(false);
            await checkTokenIds();
            window.alert("You susseccfully minted a crtpto dev");
        }catch(err){
            console.error(err);
        }
    };
    function publicMint = async () =>{
        try{
            const signer = await getProviderOrSigner(true);
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,signer);
            const tx = nft.publicMint({
                value:utils.parseEther("0.01");
            });
            setLoading(true);
            await tx.wait();
            setLoading(false);
            await checkTokenIds();
            window.alert("You susseccfully minted a crtpto dev");
        }catch(err){
            console.error(err);
        }
    };

    function startPresale = async () =>{
        try{
            const signer = await getProviderOrSigner(true);
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,signer);
            const tx = await nftContract.startPresale();
            setLoading(true);
            await tx.wait();
            setLoading(false);
            await checkIfPresaleStarted();
        }catch(err){
            console.error(err);
        }
    };

    function checkIfPresaleStarted = async () =>{
        try{
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,provider);
            const _presaleStarted = await nftContract.presaleStarted();
            if(!_presaleStarted){
                await getOwner();
            }
            setPresaleStarted(_presaleStarted);
            return _presaleStarted;
        }catch(err){
            console.error(err);
        }
    };

    function checkIfPresaleEnded = async () =>{
        try{
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,provider);
            const _presaleEnded = await nftContract.presaleEnded(); //Big number
            const hasEnded = _presaleEnded.lt(Date.floor(Date.now()/1000));
            setPresaleEnded(hasEnded);
            return hasEnded;
        }catch(err){
            console.error(err);
        }
    };

    function getOwner = async () =>{
        try{
            const signer = await getProviderOrSigner(true);
            const address = await signer.getAddress();
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,provider);
            const _owner = await nftContract.owner();
            if(address.toLowerCase() === _owner.toLowerCase()){
                setIsOwner(true);
            }
        }catch(err){
            console.error(err);
        }
    };

    function getTokenIdsMinted = async () =>{
        try{
            const provider = await getProviderOrSigner();
            const nftContract = new Contract(NFT_CRYPTO_ADDRESS,abi,provider);
            const tokenId = await nftContract.tokenIds();
            setTokenIdsMinted(tokenId.toString());
        }catch(err){
            console.error(err)
        }
    }; 

    const connectWallet = () =>{
        try{
            await getProviderOrSigner();
            setWalletConnected(true);
        }catch(err){
            console.error(err);
        }
    };

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
            },5*1000);

            setInterval(async function(){
                await getTokenIdsMinted();
            },5*1000);
        }
    },[walletConnected]);
    
    
    const renderButton = () =>{
        if(!walletConnected){
            return(
                <div className={styles.description}>
                    You wallet is not connect
                </div>
            );
        }
        if(isOwner && !presaleStarted){
            return(
                <button onClick={startPresale} className={styles.button}>
                    Start Presale
                </button>
            );
        }
        if(presaleStarted && !presaleEnded){
            return(
                <div>
                    <div className={styles.description}>
                        Join the private minting if your are whitelisted
                    </div>
                    <button onClick={privateMint} className={styles.button}>
                        Presale Mint
                    </button>
                </div>   
            );
        }
        if(presaleStarted && presaleEnded){
            return(
                <button onClick={publicMint} className={styles.button}>
                    Public Mint
                </button>
            );
        }
        if(loading){
            return <button className={styles.button}>Loading..</button>
        }
        if(!presaleStarted){
            return(
                <div className={styles.description}>
                    The Presale Has not stated yet.
                </div>
            );
        }
    }
    
    return(
        <div>
            <Head>
                <title>NFT Collection</title>
                <meta name="description" content="Whitelit-Dapp"/>
                <link rel="icon" href="./favicon.ico" />
            </Head>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.description}></h1>
                    <div className={styles.description}>
                        This is an NFT Collection for crypto devs
                    </div>
                    <div className={styles.description}>
                        {tokenIdsMinted}/20 tokens are already been minted
                    </div>
                    {renderButton()}
                </div>
                <div>
                    <img className={styles.image} src="./"/>
                </div>
            </div>
            <footer className={styles.footer}>
                Made with &#10084; by Crypto Devs
            </footer>
        </div>
    );

}
