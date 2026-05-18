
export enum AppStep {
  BUSINESS_UNDERSTANDING = 0,
  DATA_UPLOAD = 1,
  VARIABLE_IDENTIFICATION = 2,
  EXPLORATORY_ANALYSIS = 3,
  CORRELATION_SCALING = 4,
  CLUSTER_SELECTION = 5,
  EXECUTION_CLUSTER = 6,
  INSIGHTS_PROFILES = 7
}

export interface BusinessContext {
  sector: string;
  context: string;
  problem: string;
  objective: string;
  summary?: string;
}

export type VariableType = 'quantitative' | 'categorical' | 'discrete' | 'continuous';

export interface VariableInfo {
  name: string;
  type: VariableType;
  isUsefulForClustering: boolean;
  recommendation: string;
  uniqueValues: number;
  missingValues: number;
  mean?: number;
  std?: number;
  min?: number;
  max?: number;
}

export interface ClusterProfile {
  id: number;
  name: string;
  size: number;
  percentage: number;
  characteristics: string[];
  insights: string[];
  strategies: string[];
  averages: Record<string, number>;
}

export interface ClusteringData {
  originalData: any[];
  cleanedData: any[];
  scaledData: number[][];
  variables: VariableInfo[];
  labels: number[];
  centroids: number[][];
  numClusters: number;
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  profiles?: ClusterProfile[];
  processedData?: any[];
}
