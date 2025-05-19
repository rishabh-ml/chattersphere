/**
 * Utility functions for optimizing MongoDB queries
 */

/**
 * Default projection for user documents to exclude sensitive fields
 */
export const defaultUserProjection = {
  password: 0,
  resetToken: 0,
  resetTokenExpiry: 0,
};

/**
 * Default options for read-only queries
 * - lean: true - Returns plain JavaScript objects instead of Mongoose documents
 * - timestamps: false - Excludes the __v field
 */
export const readOptions = {
  lean: true,
  timestamps: false,
};

/**
 * Default options for paginated queries
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @returns Object with skip and limit properties
 */
export function getPaginationOptions(page: number = 1, limit: number = 10) {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const skip = (validPage - 1) * validLimit;
  
  return {
    skip,
    limit: validLimit,
    page: validPage,
  };
}

/**
 * Formats pagination metadata for API responses
 * @param page Current page number
 * @param limit Items per page
 * @param totalItems Total number of items
 * @returns Pagination metadata object
 */
export function formatPaginationMetadata(page: number, limit: number, totalItems: number) {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
    hasMore: page * limit < totalItems,
  };
}

/**
 * Builds a MongoDB aggregation pipeline for paginated results
 * @param matchStage The $match stage for filtering documents
 * @param sortStage The $sort stage for ordering documents
 * @param page Page number (1-based)
 * @param limit Number of items per page
 * @param lookupStages Optional array of $lookup stages for populating references
 * @returns Aggregation pipeline array
 */
export function buildPaginatedAggregation(
  matchStage: Record<string, any>,
  sortStage: Record<string, any>,
  page: number,
  limit: number,
  lookupStages: Record<string, any>[] = []
) {
  const { skip, limit: validLimit } = getPaginationOptions(page, limit);
  
  return [
    { $match: matchStage },
    { $sort: sortStage },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: skip },
          { $limit: validLimit },
          ...lookupStages,
        ],
      },
    },
  ];
}
