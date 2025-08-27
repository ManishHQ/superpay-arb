// AI-Powered Auto-Invest Service for Savings Pots
// Automatically optimizes yield strategies and manages recurring investments

export interface AutoInvestStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  expectedAPY: number;
  protocols: string[]; // e.g., ['aave', 'compound', 'celo']
  minTimeHorizon: number; // months
  maxTimeHorizon: number; // months
}

export interface AutoInvestConfig {
  potId: string;
  isEnabled: boolean;
  strategy: AutoInvestStrategy;
  recurringAmount: number; // USD to invest weekly/monthly
  frequency: 'weekly' | 'monthly';
  sourceWallet: boolean; // auto-invest from wallet balance
  yieldReinvest: boolean; // reinvest earned yields
  lastInvestment: Date;
  totalInvested: number;
  totalYieldEarned: number;
}

export interface GoalProjection {
  potId: string;
  currentAmount: number;
  targetAmount: number;
  monthlyContribution: number;
  expectedAPY: number;
  projectedCompletionMonths: number;
  projectedFinalAmount: number;
  withoutAutoInvest: {
    completionMonths: number;
    finalAmount: number;
  };
  scenarios: {
    conservative: GoalScenario;
    moderate: GoalScenario;
    aggressive: GoalScenario;
  };
}

export interface GoalScenario {
  strategy: string;
  apy: number;
  completionMonths: number;
  finalAmount: number;
  riskLevel: string;
}

// AI-optimized investment strategies based on goal timeline and risk tolerance
const AUTO_INVEST_STRATEGIES: AutoInvestStrategy[] = [
  {
    id: 'conservative-short',
    name: 'Conservative (Short-term)',
    description: 'Low-risk stablecoins staking for goals within 1-2 years',
    riskLevel: 'conservative',
    expectedAPY: 4.8,
    protocols: ['coinbase-usdc', 'aave-usdc-v3'],
    minTimeHorizon: 1,
    maxTimeHorizon: 24,
  },
  {
    id: 'moderate-medium',
    name: 'Balanced Growth',
    description: 'Mix of staking and lending for 2-5 year goals',
    riskLevel: 'moderate',
    expectedAPY: 6.2,
    protocols: ['aave-usdc-v3', 'compound-v3-usdc', 'celo-stable'],
    minTimeHorizon: 12,
    maxTimeHorizon: 60,
  },
  {
    id: 'growth-long',
    name: 'Growth Focused',
    description: 'Higher yield strategies for long-term goals (5+ years)',
    riskLevel: 'aggressive',
    expectedAPY: 8.5,
    protocols: ['celo-stable', 'base-yield', 'compound-v3-usdc'],
    minTimeHorizon: 36,
    maxTimeHorizon: 120,
  },
];

export class AutoInvestService {
  private static configs = new Map<string, AutoInvestConfig>();
  private static projections = new Map<string, GoalProjection>();

  // Get available auto-invest strategies based on goal timeline
  static getStrategiesForGoal(timeHorizonMonths: number, riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'): AutoInvestStrategy[] {
    return AUTO_INVEST_STRATEGIES.filter(strategy => 
      timeHorizonMonths >= strategy.minTimeHorizon && 
      timeHorizonMonths <= strategy.maxTimeHorizon &&
      (riskTolerance === 'aggressive' || strategy.riskLevel !== 'aggressive')
    );
  }

  // AI recommends best strategy based on goal details
  static recommendStrategy(
    currentAmount: number,
    targetAmount: number,
    timeHorizonMonths: number,
    monthlyContribution: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): AutoInvestStrategy {
    const strategies = this.getStrategiesForGoal(timeHorizonMonths, riskTolerance);
    
    // AI logic: Choose based on goal urgency and amount needed
    const amountNeeded = targetAmount - currentAmount;
    const monthlyNeeded = amountNeeded / timeHorizonMonths;
    const contributionRatio = monthlyContribution / monthlyNeeded;

    if (contributionRatio >= 1.2) {
      // Ahead of schedule, can use conservative strategy
      return strategies.find(s => s.riskLevel === 'conservative') || strategies[0];
    } else if (contributionRatio >= 0.8) {
      // On track, use moderate strategy
      return strategies.find(s => s.riskLevel === 'moderate') || strategies[0];
    } else {
      // Behind schedule, need higher yields
      return strategies.find(s => s.riskLevel === 'aggressive') || 
             strategies.find(s => s.riskLevel === 'moderate') || 
             strategies[0];
    }
  }

  // Enable auto-invest for a pot
  static enableAutoInvest(
    potId: string,
    strategyId: string,
    recurringAmount: number,
    frequency: 'weekly' | 'monthly',
    sourceWallet: boolean = true,
    yieldReinvest: boolean = true
  ): AutoInvestConfig {
    const strategy = AUTO_INVEST_STRATEGIES.find(s => s.id === strategyId);
    if (!strategy) throw new Error('Invalid strategy');

    const config: AutoInvestConfig = {
      potId,
      isEnabled: true,
      strategy,
      recurringAmount,
      frequency,
      sourceWallet,
      yieldReinvest,
      lastInvestment: new Date(),
      totalInvested: 0,
      totalYieldEarned: 0,
    };

    this.configs.set(potId, config);
    console.log(`[AutoInvestService] Enabled auto-invest for pot ${potId}:`, strategy.name);
    return config;
  }

  // Disable auto-invest for a pot
  static disableAutoInvest(potId: string): void {
    const config = this.configs.get(potId);
    if (config) {
      config.isEnabled = false;
      console.log(`[AutoInvestService] Disabled auto-invest for pot ${potId}`);
    }
  }

  // Get auto-invest config for a pot
  static getConfig(potId: string): AutoInvestConfig | undefined {
    return this.configs.get(potId);
  }

  // Simulate investment execution (in real app, this would interact with DeFi protocols)
  static async executeAutoInvestment(potId: string): Promise<{
    amount: number;
    yieldEarned: number;
    newBalance: number;
    transactionHash: string;
  }> {
    const config = this.configs.get(potId);
    if (!config || !config.isEnabled) {
      throw new Error('Auto-invest not enabled for this pot');
    }

    // Simulate investment execution
    const investmentAmount = config.recurringAmount;
    const annualYield = config.strategy.expectedAPY / 100;
    const dailyYield = annualYield / 365;
    const yieldEarned = investmentAmount * dailyYield * 30; // 30 days of yield

    // Update config
    config.totalInvested += investmentAmount;
    config.totalYieldEarned += yieldEarned;
    config.lastInvestment = new Date();

    const result = {
      amount: investmentAmount,
      yieldEarned,
      newBalance: config.totalInvested + config.totalYieldEarned,
      transactionHash: `0x${Math.random().toString(16).slice(2, 16)}`,
    };

    console.log(`[AutoInvestService] Executed auto-investment for pot ${potId}:`, result);
    return result;
  }

  // Calculate goal projections with different scenarios
  static calculateGoalProjection(
    potId: string,
    currentAmount: number,
    targetAmount: number,
    monthlyContribution: number,
    timeHorizonMonths?: number
  ): GoalProjection {
    // Estimate time horizon if not provided
    if (!timeHorizonMonths) {
      const amountNeeded = Math.max(0, targetAmount - currentAmount);
      timeHorizonMonths = Math.ceil(amountNeeded / Math.max(monthlyContribution, 1));
    }

    const strategies = this.getStrategiesForGoal(timeHorizonMonths);
    const recommendedStrategy = this.recommendStrategy(
      currentAmount, targetAmount, timeHorizonMonths, monthlyContribution
    );

    // Calculate projections with compound interest
    const calculateCompoundGrowth = (principal: number, monthlyAdd: number, apy: number, months: number): number => {
      const monthlyRate = apy / 12 / 100;
      let balance = principal;
      
      for (let i = 0; i < months; i++) {
        balance = balance * (1 + monthlyRate) + monthlyAdd;
      }
      
      return balance;
    };

    // Calculate months needed to reach target with given APY
    const calculateMonthsToTarget = (principal: number, monthlyAdd: number, apy: number, target: number): number => {
      const monthlyRate = apy / 12 / 100;
      let balance = principal;
      let months = 0;
      
      while (balance < target && months < 300) { // Max 25 years
        balance = balance * (1 + monthlyRate) + monthlyAdd;
        months++;
      }
      
      return months;
    };

    // Main projection with recommended strategy
    const projectedMonths = calculateMonthsToTarget(
      currentAmount, monthlyContribution, recommendedStrategy.expectedAPY, targetAmount
    );
    const projectedFinalAmount = calculateCompoundGrowth(
      currentAmount, monthlyContribution, recommendedStrategy.expectedAPY, projectedMonths
    );

    // Without auto-invest (0% APY)
    const withoutAutoInvestMonths = Math.ceil((targetAmount - currentAmount) / Math.max(monthlyContribution, 1));
    const withoutAutoInvestFinal = currentAmount + (monthlyContribution * withoutAutoInvestMonths);

    // Scenario comparisons
    const scenarios = {
      conservative: {
        strategy: 'Conservative Staking',
        apy: 4.8,
        completionMonths: calculateMonthsToTarget(currentAmount, monthlyContribution, 4.8, targetAmount),
        finalAmount: 0,
        riskLevel: 'Low Risk',
      },
      moderate: {
        strategy: 'Balanced Growth',
        apy: 6.2,
        completionMonths: calculateMonthsToTarget(currentAmount, monthlyContribution, 6.2, targetAmount),
        finalAmount: 0,
        riskLevel: 'Medium Risk',
      },
      aggressive: {
        strategy: 'Growth Focused',
        apy: 8.5,
        completionMonths: calculateMonthsToTarget(currentAmount, monthlyContribution, 8.5, targetAmount),
        finalAmount: 0,
        riskLevel: 'Higher Risk',
      },
    };

    // Calculate final amounts for scenarios
    Object.keys(scenarios).forEach(key => {
      const scenario = scenarios[key as keyof typeof scenarios];
      scenario.finalAmount = calculateCompoundGrowth(
        currentAmount, monthlyContribution, scenario.apy, scenario.completionMonths
      );
    });

    const projection: GoalProjection = {
      potId,
      currentAmount,
      targetAmount,
      monthlyContribution,
      expectedAPY: recommendedStrategy.expectedAPY,
      projectedCompletionMonths: projectedMonths,
      projectedFinalAmount,
      withoutAutoInvest: {
        completionMonths: withoutAutoInvestMonths,
        finalAmount: withoutAutoInvestFinal,
      },
      scenarios,
    };

    this.projections.set(potId, projection);
    return projection;
  }

  // Get cached projection for a pot
  static getProjection(potId: string): GoalProjection | undefined {
    return this.projections.get(potId);
  }

  // Get summary of all auto-invest positions
  static getPortfolioSummary(): {
    totalInvested: number;
    totalYieldEarned: number;
    totalValue: number;
    activePots: number;
    averageAPY: number;
  } {
    const configs = Array.from(this.configs.values()).filter(c => c.isEnabled);
    
    const summary = configs.reduce((acc, config) => ({
      totalInvested: acc.totalInvested + config.totalInvested,
      totalYieldEarned: acc.totalYieldEarned + config.totalYieldEarned,
      totalValue: acc.totalValue + config.totalInvested + config.totalYieldEarned,
      activePots: acc.activePots + 1,
      totalAPY: acc.totalAPY + config.strategy.expectedAPY,
    }), {
      totalInvested: 0,
      totalYieldEarned: 0,
      totalValue: 0,
      activePots: 0,
      totalAPY: 0,
    });

    return {
      ...summary,
      averageAPY: summary.activePots > 0 ? summary.totalAPY / summary.activePots : 0,
    };
  }

  // Simulate running auto-investments (would be called by a cron job in production)
  static async processScheduledInvestments(): Promise<void> {
    const now = new Date();
    const configs = Array.from(this.configs.values()).filter(c => c.isEnabled);

    for (const config of configs) {
      const daysSinceLastInvestment = (now.getTime() - config.lastInvestment.getTime()) / (1000 * 60 * 60 * 24);
      const shouldInvest = 
        (config.frequency === 'weekly' && daysSinceLastInvestment >= 7) ||
        (config.frequency === 'monthly' && daysSinceLastInvestment >= 30);

      if (shouldInvest) {
        try {
          await this.executeAutoInvestment(config.potId);
          console.log(`[AutoInvestService] Processed scheduled investment for pot ${config.potId}`);
        } catch (error) {
          console.error(`[AutoInvestService] Failed to process investment for pot ${config.potId}:`, error);
        }
      }
    }
  }
}

// Start processing scheduled investments every hour in development
if (typeof window !== 'undefined') {
  setInterval(() => {
    AutoInvestService.processScheduledInvestments();
  }, 60 * 60 * 1000); // Every hour
}