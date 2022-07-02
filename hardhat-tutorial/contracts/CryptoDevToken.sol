//SPDX-License-Identifier:MIT

pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable {
    uint256 public constant tokenPrice = 0.001 ether;

    uint256 public constant tokensPerNFT = 10 * 10**18;

    uint256 public constant maxTotalSupply = 10000 * 10**18;

    ICryptoDevs CryptoDevsNFT;

    mapping(uint256 => bool) public tokenIdsClaimed;

    constructor(address _cryptoDevsNFTContract)
        ERC20("Crypto Dev Token", "CD")
    {
        CryptoDevsNFT = ICryptoDevs(_cryptoDevsNFTContract);
    }

    //mint token
    // ether sent must be enough

    function mint(uint256 tokenAmount) public payable {
        uint256 _requiredEtherAmount = tokenAmount * tokenPrice;
        require(msg.value >= _requiredEtherAmount, "Ether sent is incorrect");

        uint256 amountWithDecimals = tokenAmount * 10**18;
        require(
            (totalSupply() + amountWithDecimals) <= maxTotalSupply,
            "Exceeds the max total supply available"
        );

        //call internal function from ERC20
        _mint(msg.sender, amountWithDecimals);
    }

    // tokens can be minted based on the number of NFT's held by the sender
    // in order to claim the token, nft's owned should be more than 0
    // tokens should not yet been claimed by the owner
    function claim() public {
        address sender = msg.sender;
        uint256 balance = CryptoDevsNFT.balanceOf(sender);
        require(balance > 0, "You dont own any Crypto Dev NFT's");

        uint256 amount = 0;
        //loop over the balance to get the tokenId
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = CryptoDevsNFT.tokenOfOwnerByIndex(sender, i);

            if (!tokenIdsClaimed[tokenId]) {
                amount += 1;
                tokenIdsClaimed[tokenId] = true;
            }
        }

        require(amount > 0, "You have already claimed all tokens");
        _mint(sender, amount * tokensPerNFT);
    }

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to sent Ether");
    }

    // called if msg.data must be empty
    receive() external payable {}

    // called if msg.data is not empty
    fallback() external payable {}
}
