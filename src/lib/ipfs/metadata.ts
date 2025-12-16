/**
 * IPFS metadata parsing and validation utilities
 */

import type { ProjectNFTMetadata, VisitNFTMetadata, NFTAttribute, RawIPFSMetadata } from '../types';

/**
 * Parse project metadata from IPFS
 * @param data - Raw JSON data from IPFS (unknown structure)
 * @returns Parsed ProjectNFTMetadata or null if invalid
 */
export function parseProjectMetadata(data: unknown): ProjectNFTMetadata | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  try {
    const raw = data as RawIPFSMetadata;
    const metadata: ProjectNFTMetadata = {
      name: typeof raw.name === 'string' ? raw.name : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      image: typeof raw.image === 'string' ? raw.image : '',
      external_url: typeof raw.external_url === 'string' 
        ? raw.external_url 
        : typeof raw.externalUrl === 'string' 
        ? raw.externalUrl 
        : undefined,
      attributes: Array.isArray(raw.attributes) 
        ? raw.attributes.filter((attr): attr is NFTAttribute => 
            typeof attr === 'object' && 
            attr !== null && 
            'trait_type' in attr && 
            'value' in attr
          )
        : [],
      github_url: typeof raw.github_url === 'string' 
        ? raw.github_url 
        : typeof raw.githubUrl === 'string' 
        ? raw.githubUrl 
        : undefined,
      demo_url: typeof raw.demo_url === 'string' 
        ? raw.demo_url 
        : typeof raw.demoUrl === 'string' 
        ? raw.demoUrl 
        : undefined,
      documentation_url: typeof raw.documentation_url === 'string' 
        ? raw.documentation_url 
        : typeof raw.documentationUrl === 'string' 
        ? raw.documentationUrl 
        : undefined,
    };

    return metadata;
  } catch (error) {
    console.error('Error parsing project metadata:', error);
    return null;
  }
}

/**
 * Parse visit NFT metadata from IPFS
 * @param data - Raw JSON data from IPFS (unknown structure)
 * @returns Parsed VisitNFTMetadata or null if invalid
 */
export function parseVisitNFTMetadata(data: unknown): VisitNFTMetadata | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  try {
    const raw = data as RawIPFSMetadata;
    const metadata: VisitNFTMetadata = {
      name: typeof raw.name === 'string' ? raw.name : '',
      description: typeof raw.description === 'string' ? raw.description : '',
      image: typeof raw.image === 'string' ? raw.image : '',
      external_url: typeof raw.external_url === 'string' 
        ? raw.external_url 
        : typeof raw.externalUrl === 'string' 
        ? raw.externalUrl 
        : undefined,
      attributes: Array.isArray(raw.attributes) 
        ? raw.attributes.filter((attr): attr is NFTAttribute => 
            typeof attr === 'object' && 
            attr !== null && 
            'trait_type' in attr && 
            'value' in attr
          )
        : [],
      visit_number: typeof raw.visit_number === 'number' 
        ? raw.visit_number 
        : typeof raw.visitNumber === 'number' 
        ? raw.visitNumber 
        : undefined,
      minted_at: typeof raw.minted_at === 'string' 
        ? raw.minted_at 
        : typeof raw.mintedAt === 'string' 
        ? raw.mintedAt 
        : undefined,
    };

    return metadata;
  } catch (error) {
    console.error('Error parsing visit NFT metadata:', error);
    return null;
  }
}

/**
 * Extract tech stack from attributes
 */
export function extractTechStack(attributes?: NFTAttribute[]): string[] {
  if (!attributes) return [];

  const techStackAttr = attributes.find(
    (attr) => attr.trait_type.toLowerCase() === 'tech stack'
  );

  if (!techStackAttr) return [];

  const value = String(techStackAttr.value);
  return value.split(',').map((tech) => tech.trim()).filter(Boolean);
}

/**
 * Extract category from attributes
 */
export function extractCategory(attributes?: NFTAttribute[]): string | undefined {
  if (!attributes) return undefined;

  const categoryAttr = attributes.find(
    (attr) => attr.trait_type.toLowerCase() === 'category'
  );

  return categoryAttr ? String(categoryAttr.value) : undefined;
}

/**
 * Extract status from attributes
 */
export function extractStatus(attributes?: NFTAttribute[]): string | undefined {
  if (!attributes) return undefined;

  const statusAttr = attributes.find(
    (attr) => attr.trait_type.toLowerCase() === 'status'
  );

  return statusAttr ? String(statusAttr.value) : undefined;
}

/**
 * Extract year from attributes
 */
export function extractYear(attributes?: NFTAttribute[]): number | undefined {
  if (!attributes) return undefined;

  const yearAttr = attributes.find(
    (attr) => attr.trait_type.toLowerCase() === 'year'
  );

  if (!yearAttr) return undefined;

  const year = Number(yearAttr.value);
  return isNaN(year) ? undefined : year;
}

/**
 * Validate metadata completeness
 * @param metadata - Metadata object to validate
 * @returns Validation result with isValid flag and array of error messages
 */
export function validateMetadata(metadata: unknown): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata || typeof metadata !== 'object') {
    errors.push('Metadata is null, undefined, or not an object');
    return { isValid: false, errors };
  }

  const meta = metadata as Record<string, unknown>;

  if (!meta.name || typeof meta.name !== 'string') {
    errors.push('Missing or invalid name');
  }

  if (!meta.description || typeof meta.description !== 'string') {
    errors.push('Missing or invalid description');
  }

  if (!meta.image || typeof meta.image !== 'string') {
    errors.push('Missing or invalid image');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
