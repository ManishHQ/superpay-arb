// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Mock USDC (mUSDC)
 * @dev Mock USDC token contract for testing and development purposes
 * @notice This contract is NOT currently implemented in the main application
 * @notice Use Supabase-based poxqts system for production use
 * @notice This is a test token - NOT real USDC
 */
contract MockUSDC is ERC20, Ownable, Pausable {
    // USDC has 6 decimals (like the real USDC token)
    uint8 private constant DECIMALS = 6;
    
    // Maximum supply (1 billion USDC)
    uint256 private constant MAX_SUPPLY = 1_000_000_000 * 10**6;
    
    // Events
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event EmergencyPause(address indexed by);
    event EmergencyUnpause(address indexed by);
    
    /**
     * @dev Constructor sets up the mock USDC token
     * @param initialSupply Initial token supply to mint to deployer
     */
    constructor(uint256 initialSupply) ERC20("Mock USDC", "mUSDC") {
        require(initialSupply <= MAX_SUPPLY, "Initial supply exceeds maximum");
        
        // Mint initial supply to deployer
        _mint(msg.sender, initialSupply);
        
        // Transfer ownership to deployer
        _transferOwnership(msg.sender);
    }
    
    /**
     * @dev Returns the number of decimals used for token amounts
     * @return Number of decimals (6 for USDC)
     */
    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
    
    /**
     * @dev Mint new tokens (owner only)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "Minting would exceed maximum supply"
        );
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Burn tokens from a specific address (with allowance)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address from, uint256 amount) external whenNotPaused {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "Burn amount exceeds allowance");
        
        // Decrease allowance
        _approve(from, msg.sender, currentAllowance - amount);
        
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Pause all token transfers (owner only)
     */
    function pause() external onlyOwner {
        _pause();
        emit EmergencyPause(msg.sender);
    }
    
    /**
     * @dev Unpause all token transfers (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit EmergencyUnpause(msg.sender);
    }
    
    /**
     * @dev Override transfer function to add pause check
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return True if transfer successful
     */
    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom function to add pause check
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return True if transfer successful
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev Override approve function to add pause check
     * @param spender Spender address
     * @param amount Amount to approve
     * @return True if approval successful
     */
    function approve(address spender, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.approve(spender, amount);
    }
    
    /**
     * @dev Increase allowance (owner only)
     * @param spender Spender address
     * @param addedValue Amount to increase allowance by
     * @return True if increase successful
     */
    function increaseAllowance(address spender, uint256 addedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.increaseAllowance(spender, addedValue);
    }
    
    /**
     * @dev Decrease allowance (owner only)
     * @param spender Spender address
     * @param subtractedValue Amount to decrease allowance by
     * @return True if decrease successful
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
    
    /**
     * @dev Get maximum supply of tokens
     * @return Maximum supply in wei (6 decimals)
     */
    function getMaxSupply() external pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @dev Get remaining mintable supply
     * @return Remaining tokens that can be minted
     */
    function getRemainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
    
    /**
     * @dev Check if address is contract
     * @param addr Address to check
     * @return True if address is a contract
     */
    function isContract(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        return size > 0;
    }
    
    /**
     * @dev Emergency function to recover stuck tokens (owner only)
     * @param tokenAddress Address of token to recover
     * @param to Address to send recovered tokens to
     * @param amount Amount of tokens to recover
     */
    function recoverStuckTokens(
        address tokenAddress,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(tokenAddress != address(this), "Cannot recover mUSDC tokens");
        require(to != address(0), "Cannot send to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Check if it's a contract
        require(isContract(tokenAddress), "Token address is not a contract");
        
        // Try to transfer tokens
        (bool success, bytes memory data) = tokenAddress.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Token transfer failed");
    }
    
    /**
     * @dev Emergency function to recover stuck ETH (owner only)
     * @param to Address to send recovered ETH to
     * @param amount Amount of ETH to recover
     */
    function recoverStuckETH(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot send to zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient ETH balance");
        
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Override _beforeTokenTransfer to add custom logic
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
        
        // Add custom validation logic here if needed
        require(from != address(0) || to != address(0), "Invalid transfer");
    }
    
    /**
     * @dev Override _afterTokenTransfer to add custom logic
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._afterTokenTransfer(from, to, amount);
        
        // Add custom post-transfer logic here if needed
        // For example, emit custom events, update external contracts, etc.
    }
}
