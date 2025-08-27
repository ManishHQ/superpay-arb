// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title SavingsPots
 * @dev Smart contract for managing savings pots on Ethereum blockchain
 * @notice This contract is NOT currently implemented in the main application
 * @notice Use Supabase-based pots system for production use
 */
contract SavingsPots is ReentrancyGuard, Pausable, AccessControl {
    using Counters for Counters.Counter;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    
    // USDC token interface
    IERC20 public immutable usdcToken;
    
    // Pot counter
    Counters.Counter private _potIds;
    
    // Pot structure
    struct Pot {
        uint256 id;
        string name;
        string description;
        uint256 targetAmount;
        uint256 currentAmount;
        address creator;
        bool isStrict;
        uint256 strictDeadline;
        bool isJoint;
        address[] collaborators;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // User balance in each pot
    mapping(uint256 => mapping(address => uint256)) public userBalances;
    
    // Pot details
    mapping(uint256 => Pot) public pots;
    
    // Events
    event PotCreated(uint256 indexed potId, address indexed creator, string name, uint256 targetAmount);
    event FundsDeposited(uint256 indexed potId, address indexed user, uint256 amount);
    event FundsWithdrawn(uint256 indexed potId, address indexed user, uint256 amount);
    event CollaboratorAdded(uint256 indexed potId, address indexed user);
    event PotCompleted(uint256 indexed potId);
    event EmergencyWithdraw(uint256 indexed potId, address indexed user, uint256 amount);
    
    // Modifiers
    modifier onlyPotCreator(uint256 potId) {
        require(pots[potId].creator == msg.sender, "Only pot creator can perform this action");
        _;
    }
    
    modifier onlyPotMember(uint256 potId) {
        require(
            pots[potId].creator == msg.sender || 
            isCollaborator(potId, msg.sender),
            "Only pot members can perform this action"
        );
        _;
    }
    
    modifier potExists(uint256 potId) {
        require(pots[potId].id != 0, "Pot does not exist");
        _;
    }
    
    modifier potActive(uint256 potId) {
        require(pots[potId].isActive, "Pot is not active");
        _;
    }
    
    /**
     * @dev Constructor sets up the contract with USDC token and roles
     * @param _usdcToken Address of the USDC token contract
     */
    constructor(address _usdcToken) {
        require(_usdcToken != address(0), "Invalid USDC token address");
        
        usdcToken = IERC20(_usdcToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }
    
    /**
     * @dev Create a new savings pot
     * @param name Name of the savings pot
     * @param description Description of the savings goal
     * @param targetAmount Target amount in USDC (6 decimals)
     * @param isStrict Whether the pot has withdrawal restrictions
     * @param strictDeadline Deadline for strict pots (0 if not strict)
     * @param isJoint Whether multiple users can contribute
     * @param collaborators Array of collaborator addresses
     */
    function createPot(
        string memory name,
        string memory description,
        uint256 targetAmount,
        bool isStrict,
        uint256 strictDeadline,
        bool isJoint,
        address[] memory collaborators
    ) external whenNotPaused returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(targetAmount > 0, "Target amount must be greater than 0");
        
        if (isStrict) {
            require(strictDeadline > block.timestamp, "Deadline must be in the future");
        }
        
        _potIds.increment();
        uint256 potId = _potIds.current();
        
        Pot storage newPot = pots[potId];
        newPot.id = potId;
        newPot.name = name;
        newPot.description = description;
        newPot.targetAmount = targetAmount;
        newPot.currentAmount = 0;
        newPot.creator = msg.sender;
        newPot.isStrict = isStrict;
        newPot.strictDeadline = strictDeadline;
        newPot.isJoint = isJoint;
        newPot.isActive = true;
        newPot.createdAt = block.timestamp;
        newPot.updatedAt = block.timestamp;
        
        // Add collaborators if joint pot
        if (isJoint && collaborators.length > 0) {
            for (uint i = 0; i < collaborators.length; i++) {
                if (collaborators[i] != address(0) && collaborators[i] != msg.sender) {
                    newPot.collaborators.push(collaborators[i]);
                }
            }
        }
        
        emit PotCreated(potId, msg.sender, name, targetAmount);
        return potId;
    }
    
    /**
     * @dev Deposit funds into a savings pot
     * @param potId ID of the pot to deposit into
     * @param amount Amount to deposit in USDC (6 decimals)
     */
    function deposit(uint256 potId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        potExists(potId) 
        potActive(potId) 
        onlyPotMember(potId) 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );
        
        pots[potId].currentAmount += amount;
        userBalances[potId][msg.sender] += amount;
        pots[potId].updatedAt = block.timestamp;
        
        emit FundsDeposited(potId, msg.sender, amount);
        
        // Check if pot target is reached
        if (pots[potId].currentAmount >= pots[potId].targetAmount) {
            emit PotCompleted(potId);
        }
    }
    
    /**
     * @dev Withdraw funds from a savings pot
     * @param potId ID of the pot to withdraw from
     * @param amount Amount to withdraw in USDC (6 decimals)
     */
    function withdraw(uint256 potId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        potExists(potId) 
        potActive(potId) 
        onlyPotMember(potId) 
    {
        require(amount > 0, "Amount must be greater than 0");
        require(userBalances[potId][msg.sender] >= amount, "Insufficient balance");
        
        // Check strict pot restrictions
        if (pots[potId].isStrict && pots[potId].strictDeadline > block.timestamp) {
            revert("Cannot withdraw from strict pot before deadline");
        }
        
        pots[potId].currentAmount -= amount;
        userBalances[potId][msg.sender] -= amount;
        pots[potId].updatedAt = block.timestamp;
        
        require(
            usdcToken.transfer(msg.sender, amount),
            "USDC transfer failed"
        );
        
        emit FundsWithdrawn(potId, msg.sender, amount);
    }
    
    /**
     * @dev Add a collaborator to a joint pot
     * @param potId ID of the pot
     * @param user Address of the user to add
     */
    function addCollaborator(uint256 potId, address user) 
        external 
        whenNotPaused 
        potExists(potId) 
        potActive(potId) 
        onlyPotCreator(potId) 
    {
        require(user != address(0), "Invalid user address");
        require(user != msg.sender, "Cannot add yourself as collaborator");
        require(pots[potId].isJoint, "Pot is not joint");
        require(!isCollaborator(potId, user), "User is already a collaborator");
        
        pots[potId].collaborators.push(user);
        emit CollaboratorAdded(potId, user);
    }
    
    /**
     * @dev Emergency withdrawal for pot creator
     * @param potId ID of the pot
     */
    function emergencyWithdraw(uint256 potId) 
        external 
        nonReentrant 
        whenNotPaused 
        potExists(potId) 
        potActive(potId) 
        onlyPotCreator(potId) 
    {
        uint256 amount = userBalances[potId][msg.sender];
        require(amount > 0, "No funds to withdraw");
        
        pots[potId].currentAmount -= amount;
        userBalances[potId][msg.sender] = 0;
        pots[potId].isActive = false;
        pots[potId].updatedAt = block.timestamp;
        
        require(
            usdcToken.transfer(msg.sender, amount),
            "USDC transfer failed"
        );
        
        emit EmergencyWithdraw(potId, msg.sender, amount);
    }
    
    /**
     * @dev Get pot information
     * @param potId ID of the pot
     * @return Pot information
     */
    function getPot(uint256 potId) external view returns (Pot memory) {
        return pots[potId];
    }
    
    /**
     * @dev Get user balance in a specific pot
     * @param potId ID of the pot
     * @param user Address of the user
     * @return User's balance in the pot
     */
    function getUserBalance(uint256 potId, address user) external view returns (uint256) {
        return userBalances[potId][user];
    }
    
    /**
     * @dev Check if user is a collaborator in a pot
     * @param potId ID of the pot
     * @param user Address of the user
     * @return True if user is a collaborator
     */
    function isCollaborator(uint256 potId, address user) public view returns (bool) {
        Pot storage pot = pots[potId];
        for (uint i = 0; i < pot.collaborators.length; i++) {
            if (pot.collaborators[i] == user) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Get total number of pots
     * @return Total number of pots created
     */
    function getTotalPots() external view returns (uint256) {
        return _potIds.current();
    }
    
    /**
     * @dev Pause the contract (admin only)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract (admin only)
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Withdraw any stuck USDC tokens (admin only)
     * @param amount Amount to withdraw
     */
    function withdrawStuckUSDC(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Amount must be greater than 0");
        require(
            usdcToken.transfer(msg.sender, amount),
            "USDC transfer failed"
        );
    }
    
    /**
     * @dev Get pot collaborators
     * @param potId ID of the pot
     * @return Array of collaborator addresses
     */
    function getPotCollaborators(uint256 potId) external view returns (address[] memory) {
        return pots[potId].collaborators;
    }
    
    /**
     * @dev Check if pot target is reached
     * @param potId ID of the pot
     * @return True if target is reached
     */
    function isTargetReached(uint256 potId) external view returns (bool) {
        return pots[potId].currentAmount >= pots[potId].targetAmount;
    }
    
    /**
     * @dev Get pot progress percentage
     * @param potId ID of the pot
     * @return Progress percentage (0-100)
     */
    function getPotProgress(uint256 potId) external view returns (uint256) {
        Pot storage pot = pots[potId];
        if (pot.targetAmount == 0) return 0;
        
        uint256 progress = (pot.currentAmount * 100) / pot.targetAmount;
        return progress > 100 ? 100 : progress;
    }
}
