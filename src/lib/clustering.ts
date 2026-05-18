import { kmeans } from 'ml-kmeans';
import * as ss from 'simple-statistics';

export const normalizeData = (data: number[][], method: 'standard' | 'minmax' = 'standard'): number[][] => {
  if (data.length === 0) return [];
  const numCols = data[0].length;
  const numRows = data.length;

  const result: number[][] = Array.from({ length: numRows }, () => []);

  for (let c = 0; c < numCols; c++) {
    const colData = data.map(row => row[c]);
    
    if (method === 'standard') {
      const mean = ss.mean(colData);
      const std = ss.standardDeviation(colData) || 1;
      for (let r = 0; r < numRows; r++) {
        result[r][c] = (data[r][c] - mean) / std;
      }
    } else {
      const min = Math.min(...colData);
      const max = Math.max(...colData);
      const range = (max - min) || 1;
      for (let r = 0; r < numRows; r++) {
        result[r][c] = (data[r][c] - min) / range;
      }
    }
  }

  return result;
};

export const calculateInertia = (data: number[][], labels: number[], centroids: number[][]): number => {
  let inertia = 0;
  for (let i = 0; i < data.length; i++) {
    const clusterIdx = labels[i];
    const centroid = centroids[clusterIdx];
    let distSq = 0;
    for (let j = 0; j < data[i].length; j++) {
      distSq += Math.pow(data[i][j] - centroid[j], 2);
    }
    inertia += distSq;
  }
  return inertia;
};

export const getElbowData = (data: number[][], maxK: number = 10) => {
  const result = [];
  for (let k = 1; k <= maxK; k++) {
    if (k > data.length) break;
    const { clusters, centroids } = kmeans(data, k, {});
    const inertia = calculateInertia(data, clusters, (centroids as any[]).map(c => c.centroid || c));
    result.push({ k, inertia });
  }
  return result;
};

export const calculateSilhouetteScore = (data: number[][], labels: number[]): number => {
  const n = data.length;
  if (n < 2) return 0;
  
  let totalSilhouette = 0;
  const uniqueLabels = Array.from(new Set(labels));
  if (uniqueLabels.length < 2) return 0;

  for (let i = 0; i < n; i++) {
    const labelI = labels[i];
    const aI = calculateAverageDistance(data[i], data.filter((_, idx) => labels[idx] === labelI && idx !== i));
    
    let bI = Infinity;
    for (const label of uniqueLabels) {
      if (label === labelI) continue;
      const dist = calculateAverageDistance(data[i], data.filter((_, idx) => labels[idx] === label));
      if (dist < bI) bI = dist;
    }
    
    const sI = (bI - aI) / Math.max(aI, bI);
    totalSilhouette += isNaN(sI) ? 0 : sI;
  }
  
  return totalSilhouette / n;
};

const calculateAverageDistance = (point: number[], others: number[][]): number => {
  if (others.length === 0) return 0;
  let sum = 0;
  for (const other of others) {
    let distSq = 0;
    for (let j = 0; j < point.length; j++) {
      distSq += Math.pow(point[j] - other[j], 2);
    }
    sum += Math.sqrt(distSq);
  }
  return sum / others.length;
};
