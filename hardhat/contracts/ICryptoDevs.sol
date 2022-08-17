//SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

interface ICryptoDevs {
    //return the tokenId owned by owner at a given index
    function tokenOfOwnerByIndex(address owner, uint256 index) external view returns(uint256 tokenId);

    //return the number of tokens in owner's account
    function balanceOf(address owner) external view returns(uint256 balance);
}