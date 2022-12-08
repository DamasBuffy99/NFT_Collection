// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";


contract CryptoDevs is ERC721Enumerable, Ownable {
    string _baseTokenURI;
    uint public _price = 0.01 ether; //price of one Crypto Dev NFT
    bool public _paused; //check if Whitelist is available
    uint8 public maxTokenIds = 20; //maximum number of NFT
    uint8 public tokenIds; //Number of NFT minted
    IWhitelist whitelist;
    bool public presaleStarted; // check if presale strted
    uint public presaleEnded; //timestamp for when presale would end

    modifier OnlyWhenNotPaused{
        require(!_paused,'Contract Currently Paused');
        _;
    }

    constructor(string memory baseURI, address whitelisteContractdAddress) ERC721("Crypto Devs","CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelisteContractdAddress);
    }

    function startPresaled() public onlyOwner{
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() payable public OnlyWhenNotPaused{
        require(presaleStarted && block.timestamp<presaleEnded,'Presale is not available by this time');
        require(whitelist.whitelistedAddresses(msg.sender),'You are not on the whitelist');
        require(msg.value >= _price,'Price send is not enought');
        require(tokenIds < maxTokenIds,'Maximum number of NFT hite');
        tokenIds++;
        _safeMint(msg.sender, tokenIds);   
    }

    function mint() payable public OnlyWhenNotPaused{
        require(presaleStarted && block.timestamp >= presaleEnded,'Presale is not over yet');
        require(msg.value >= _price,'Price send is not enought');
        require(tokenIds < maxTokenIds,'Maximum number of NFT hite');
        tokenIds++;
        _safeMint(msg.sender, tokenIds);   
    }

    function _baseURI() internal view virtual override returns(string memory){
        return _baseTokenURI;
    }

    function paused(bool val) public onlyOwner{
        _paused = val;
    }

    function withdraw() public onlyOwner{
        address _owner = owner();
        uint amount = address(this).balance;
        (bool sent,) = _owner.call{value:amount}("");
        require(sent,"Failed to send Ether");
    }

    receive() external payable{} //receive ether when msg.data is empty

    fallback() external payable{} //receive ether when msg.data is not empty
}
