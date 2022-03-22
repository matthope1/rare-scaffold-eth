//SPDX-License-Identifier: Unlicense
// contracts/GameItem.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract YourContract is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  // string notSupported = "NotSupported";

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    // TODO: how to send not supported? Test this
    // super._burn(tokenId);
    // return notSupported;
  }

  function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
    return super.tokenURI(tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function safeMint(address to, string memory collectibleURI) public returns (uint256) {
    _tokenIds.increment();

    uint256 newItemId = _tokenIds.current();
    _safeMint(to, newItemId);
    // This is an API endpoint to collectible information
    _setTokenURI(newItemId, collectibleURI);
    return newItemId;
  }

  constructor() ERC721("YourContract", "RS") {
    console.log("Deploying a Store ");
  }
}
