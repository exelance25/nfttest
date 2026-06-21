// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TestNetworkNFT
/// @notice ERC-721 — mint payment in native ETH or ERC20 (e.g. WETH on Monad).
contract TestNetworkNFT is ERC721, Ownable, ReentrancyGuard {
    uint256 public immutable maxSupply;
    uint256 public immutable mintPrice;
    address payable public immutable treasury;
    /// @dev address(0) = native ETH; otherwise ERC20 (WETH on Monad testnet).
    address public immutable paymentToken;
    string private _fixedTokenURI;
    uint256 private _nextTokenId;

    error MaxSupplyReached();
    error InsufficientPayment(uint256 sent, uint256 required);
    error TransferFailed();
    error ZeroTreasury();
    error NativeValueNotAllowed();
    error NativePaymentRequired();

    constructor(
        string memory name_,
        string memory symbol_,
        string memory fixedTokenURI_,
        uint256 maxSupply_,
        uint256 mintPriceWei_,
        address treasury_,
        address paymentToken_
    ) ERC721(name_, symbol_) Ownable(treasury_ == address(0) ? msg.sender : treasury_) {
        require(maxSupply_ > 0, "TestNetworkNFT: zero supply");
        require(bytes(fixedTokenURI_).length > 0, "TestNetworkNFT: empty URI");
        if (treasury_ == address(0)) revert ZeroTreasury();
        treasury = payable(treasury_);
        _fixedTokenURI = fixedTokenURI_;
        maxSupply = maxSupply_;
        mintPrice = mintPriceWei_;
        paymentToken = paymentToken_;
    }

    /// @notice Mint NFT; pay with native ETH or approve ERC20 first.
    function mint() external payable nonReentrant returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        if (tokenId >= maxSupply) revert MaxSupplyReached();

        if (paymentToken == address(0)) {
            if (msg.value < mintPrice) revert InsufficientPayment(msg.value, mintPrice);
            (bool paid,) = treasury.call{value: mintPrice}("");
            if (!paid) revert TransferFailed();
            uint256 refund = msg.value - mintPrice;
            if (refund > 0) {
                (bool refunded,) = msg.sender.call{value: refund}("");
                if (!refunded) revert TransferFailed();
            }
        } else {
            if (msg.value != 0) revert NativeValueNotAllowed();
            bool ok = IERC20(paymentToken).transferFrom(msg.sender, treasury, mintPrice);
            if (!ok) revert TransferFailed();
        }

        unchecked {
            ++_nextTokenId;
        }

        _safeMint(msg.sender, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _fixedTokenURI;
    }

    function withdraw() external onlyOwner nonReentrant {
        if (paymentToken != address(0)) revert NativePaymentRequired();
        (bool ok,) = treasury.call{value: address(this).balance}("");
        if (!ok) revert TransferFailed();
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }

    function remainingSupply() external view returns (uint256) {
        uint256 minted = _nextTokenId;
        return minted >= maxSupply ? 0 : maxSupply - minted;
    }
}
